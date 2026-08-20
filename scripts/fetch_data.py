#!/usr/bin/env python3
"""
Dựng bộ dữ liệu VNINDEX + P/E + P/B toàn thị trường (HOSE).

Nguồn — API công khai của Vietcap, không cần đăng nhập:
  1. Giá theo ngày (VNINDEX và từng mã)
     POST https://trading.vietcap.com.vn/api/chart/OHLCChart/gap
  2. Danh sách mã niêm yết
     GET  https://trading.vietcap.com.vn/api/price/symbols/getAll
  3. BCTC theo quý, có publicDate
     GET  https://iq.vietcap.com.vn/api/iq-insight-service/v1/company/{sym}
          /financial-statement?section=INCOME_STATEMENT | BALANCE_SHEET
  4. Số cổ phiếu đang lưu hành
     GET  https://iq.vietcap.com.vn/api/iq-insight-service/v1/company/{sym}/statistics-financial

Phương pháp tổng hợp (aggregate — cùng họ FiinTrade / Bloomberg):

    P/E(t) = Σ VonHoa_i(t) / Σ LoiNhuanTTM_i(t)
    P/B(t) = Σ VonHoa_i(t) / Σ VonChuSoHuu_i(t)

  · VonHoa_i(t)       = giá đóng cửa điều chỉnh(t) × số CP đang lưu hành
  · LoiNhuanTTM_i(t)  = tổng LNST cổ đông công ty mẹ (isa22) 4 quý gần nhất ĐÃ CÔNG BỐ
  · VonChuSoHuu_i(t)  = vốn chủ sở hữu công ty mẹ (bsa78 − bsa210) kỳ gần nhất ĐÃ CÔNG BỐ

Cả hai neo theo publicDate của TỪNG doanh nghiệp, nên chỉ số trượt dần suốt mùa
báo cáo thay vì nhảy bậc một lần — giống cách FiinTrade dựng biểu đồ định giá.
"""

import bisect
import concurrent.futures as cf
import datetime as dt
import gzip
import io
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "site", "data")
CACHE_DIR = os.path.join(ROOT, "data", "cache")

IQ = "https://iq.vietcap.com.vn/api/iq-insight-service"
TRADING = "https://trading.vietcap.com.vn/api"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# Giá VNINDEX lấy toàn bộ lịch sử (từ 2004). Giá từng mã chỉ cần từ 2017 vì
# BCTC của Vietcap bắt đầu ở quý 1/2018 — trước đó không tính được định giá.
INDEX_START = "2000-01-01"
STOCK_START = "2017-06-01"
CACHE_TTL = 12 * 3600
PRICE_BATCH = 20
WORKERS = 8
# Một phiên chỉ có P/E, P/B khi nhóm đã công bố BCTC chiếm đủ lớn trong tổng vốn
# hoá của rổ. Đếm theo vốn hoá chứ không theo số mã: vài chục mã nhỏ chưa nộp
# báo cáo gần như không ảnh hưởng, còn thiếu một mã đầu ngành thì lệch nhiều.
MIN_COVERAGE = 0.85
MIN_TICKERS = 100


def http_json(url, payload=None, tries=4, timeout=60):
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {"User-Agent": UA, "Accept": "application/json",
               "Accept-Encoding": "gzip", "Referer": "https://iq.vietcap.com.vn/"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
                return json.loads(raw.decode("utf-8"))
        except Exception as e:                       # noqa: BLE001
            last = e
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"{url} thất bại: {last}")


def cached(name, ttl=CACHE_TTL):
    """Cache kết quả theo mã ra file JSON."""
    def wrap(fn):
        def inner(key):
            path = os.path.join(CACHE_DIR, f"{name}_{key}.json")
            if os.path.exists(path) and time.time() - os.path.getmtime(path) < ttl:
                try:
                    with open(path) as f:
                        return key, json.load(f)
                except Exception:                    # noqa: BLE001
                    pass
            try:
                val = fn(key)
            except Exception:                        # noqa: BLE001
                val = None
            if val is not None:
                with open(path, "w") as f:
                    json.dump(val, f)
            return key, val
        return inner
    return wrap


# --------------------------------------------------------------- giá ---

def fetch_prices(symbols, start):
    """{sym: {ngày: giá đóng cửa điều chỉnh}}"""
    frm = int(dt.datetime.fromisoformat(start)
              .replace(tzinfo=dt.timezone.utc).timestamp())
    to = int(time.time()) + 86400
    result = {}
    for i in range(0, len(symbols), PRICE_BATCH):
        chunk = symbols[i:i + PRICE_BATCH]
        try:
            res = http_json(f"{TRADING}/chart/OHLCChart/gap",
                            {"timeFrame": "ONE_DAY", "symbols": chunk,
                             "from": frm, "to": to})
        except Exception:                            # noqa: BLE001
            continue
        for e in res or []:
            sym = e.get("symbol")
            if not sym or not e.get("t"):
                continue
            ser = {}
            for ts, c in zip(e["t"], e["c"]):
                day = dt.datetime.fromtimestamp(int(ts), dt.timezone.utc).date().isoformat()
                ser[day] = float(c)
            result[sym] = ser
    return result


def fetch_symbols():
    res = http_json(f"{TRADING}/price/symbols/getAll")
    items = res.get("data") if isinstance(res, dict) else res
    return sorted({
        (it.get("symbol") or "").strip().upper()
        for it in (items or [])
        if (it.get("board") or "").upper() in ("HSX", "HOSE")
        and (it.get("type") or "").upper() == "STOCK"
        and it.get("symbol")
    })


# ------------------------------------------------------------- BCTC ---

@cached("is")
def fetch_income(sym):
    """LNST cổ đông công ty mẹ (isa22) theo quý."""
    res = http_json(f"{IQ}/v1/company/{sym}/financial-statement?section=INCOME_STATEMENT")
    rows = []
    for r in ((res.get("data") or {}).get("quarters")) or []:
        y, q, val, pub = (r.get("yearReport"), r.get("lengthReport"),
                          r.get("isa22"), r.get("publicDate"))
        if not y or not q or val is None or not pub:
            continue
        rows.append({"y": int(y), "q": int(q), "v": float(val), "pub": pub[:10]})
    rows.sort(key=lambda r: (r["y"], r["q"]))
    return rows


@cached("bs")
def fetch_balance(sym):
    """Vốn chủ sở hữu của cổ đông công ty mẹ = bsa78 − bsa210, theo quý."""
    res = http_json(f"{IQ}/v1/company/{sym}/financial-statement?section=BALANCE_SHEET")
    rows = []
    for r in ((res.get("data") or {}).get("quarters")) or []:
        y, q, total, pub = (r.get("yearReport"), r.get("lengthReport"),
                            r.get("bsa78"), r.get("publicDate"))
        if not y or not q or total is None or not pub:
            continue
        rows.append({"y": int(y), "q": int(q),
                     "v": float(total) - float(r.get("bsa210") or 0),
                     "pub": pub[:10]})
    rows.sort(key=lambda r: (r["y"], r["q"]))
    return rows


@cached("sh")
def fetch_shares(sym):
    res = http_json(f"{IQ}/v1/company/{sym}/statistics-financial")
    rows = [r for r in (res.get("data") or []) if r.get("ratioType") == "RATIO_TTM"]
    rows.sort(key=lambda r: (r.get("yearReport") or 0, r.get("quarter") or 0))
    for r in reversed(rows):
        n = r.get("numberOfSharesMktCap")
        if n:
            return {"shares": float(n), "as_of": f"{r['yearReport']}-Q{r['quarter']}"}
    return None


def ttm_timeline(rows):
    """[(ngày công bố, tổng 4 quý gần nhất)] — cho chỉ tiêu luỹ kế như lợi nhuận.

    Neo vào publicDate của quý MỚI NHẤT trong cửa sổ, không phải max của cả bốn.
    Vietcap ghi lại publicDate khi nhập/điều chỉnh số cũ — ví dụ BID ghi quý
    1/2018 là 2019-08-21 — nên lấy max sẽ đẩy mốc TTM đầu tiên muộn hơn cả năm.
    Vẫn ép chuỗi không lùi để một ngày lệch không làm mốc sau sớm hơn mốc trước.
    """
    out, floor = [], ""
    for i in range(3, len(rows)):
        win = rows[i - 3:i + 1]
        seq = [w["y"] * 4 + (w["q"] - 1) for w in win]
        if seq != list(range(seq[0], seq[0] + 4)):   # phải là 4 quý liên tiếp
            continue
        floor = max(win[-1]["pub"], floor)
        out.append((floor, sum(w["v"] for w in win)))
    merged = {}
    for pub, v in out:
        merged[pub] = v                              # cùng ngày thì giữ bản mới nhất
    return sorted(merged.items())


def point_timeline(rows):
    """[(ngày công bố, giá trị kỳ gần nhất)] — cho chỉ tiêu thời điểm như vốn chủ sở hữu."""
    merged, floor = {}, ""
    for r in rows:
        floor = max(r["pub"], floor)                 # giữ chuỗi không lùi
        merged[floor] = r["v"]
    return sorted(merged.items())


# ------------------------------------------------------------- dựng ---

def build():
    os.makedirs(CACHE_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    t0 = time.time()

    print("· VNINDEX ...", flush=True)
    vni = fetch_prices(["VNINDEX"], INDEX_START)["VNINDEX"]
    trading_days = sorted(vni)
    print(f"  {len(trading_days)} phiên {trading_days[0]} → {trading_days[-1]}")

    syms = fetch_symbols()
    print(f"· {len(syms)} cổ phiếu HOSE")

    print("· Tải KQKD + CĐKT + số cổ phiếu ...", flush=True)
    income, balance, shares = {}, {}, {}
    jobs = ([("is", x) for x in syms] + [("bs", x) for x in syms]
            + [("sh", x) for x in syms])
    fns = {"is": fetch_income, "bs": fetch_balance, "sh": fetch_shares}
    bins = {"is": income, "bs": balance, "sh": shares}
    done = 0
    with cf.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(fns[kind], sym): kind for kind, sym in jobs}
        for fu in cf.as_completed(futs):
            kind = futs[fu]
            key, val = fu.result()
            done += 1
            if done % 200 == 0:
                print(f"  {done}/{len(jobs)}", flush=True)
            if val:
                bins[kind][key] = val
    print(f"  KQKD {len(income)} · CĐKT {len(balance)} · số CP {len(shares)}")

    print("· Tải giá từng mã ...", flush=True)
    prices = fetch_prices(syms, STOCK_START)
    print(f"  {len(prices)} mã có giá")

    comp = {}
    for sym in syms:
        if sym not in prices or sym not in shares:
            continue
        tl_e = ttm_timeline(income.get(sym) or [])
        tl_b = point_timeline(balance.get(sym) or [])
        if not tl_e:
            continue
        comp[sym] = {
            "sh": shares[sym]["shares"],
            "epub": [x[0] for x in tl_e], "eval": [x[1] for x in tl_e],
            "bpub": [x[0] for x in tl_b], "bval": [x[1] for x in tl_b],
            "pdays": sorted(prices[sym]), "pmap": prices[sym],
        }
    print(f"· Rổ tính toán: {len(comp)} mã")

    series, contrib = [], []
    first_val = None
    for day in trading_days:
        row = {"d": day, "i": round(vni[day], 2)}

        mc_all = mc_e = earn = mc_b = book = 0.0
        n = 0
        for c in comp.values():
            i = bisect.bisect_right(c["pdays"], day) - 1
            if i < 0:
                continue
            mc = c["pmap"][c["pdays"][i]] * c["sh"]
            mc_all += mc
            je = bisect.bisect_right(c["epub"], day) - 1
            if je >= 0:
                mc_e += mc
                earn += c["eval"][je]
                n += 1
            jb = bisect.bisect_right(c["bpub"], day) - 1
            if jb >= 0 and c["bval"][jb] > 0:
                mc_b += mc
                book += c["bval"][jb]

        covered = mc_all > 0 and n >= MIN_TICKERS
        if covered and earn > 0 and mc_e / mc_all >= MIN_COVERAGE:
            row["pe"] = round(mc_e / earn, 3)
            contrib.append(n)
            first_val = first_val or day
        if covered and book > 0 and mc_b / mc_all >= MIN_COVERAGE:
            row["pb"] = round(mc_b / book, 4)
        series.append(row)

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "method": ("P/E = sum(VonHoa)/sum(LNST TTM cong ty me da cong bo); "
                   "P/B = sum(VonHoa)/sum(Von chu so huu cong ty me da cong bo). "
                   "Von hoa = gia dieu chinh x so CP luu hanh; ca hai neo theo "
                   "publicDate cua tung doanh nghiep."),
        "sources": {
            "price": "trading.vietcap.com.vn/api/chart/OHLCChart/gap",
            "symbols": "trading.vietcap.com.vn/api/price/symbols/getAll",
            "income_statement": "iq.vietcap.com.vn/.../financial-statement?section=INCOME_STATEMENT",
            "balance_sheet": "iq.vietcap.com.vn/.../financial-statement?section=BALANCE_SHEET",
            "shares": "iq.vietcap.com.vn/.../statistics-financial",
        },
        "universe_size": len(comp),
        "avg_contributors": round(sum(contrib) / len(contrib)) if contrib else 0,
        "index_from": series[0]["d"] if series else None,
        "valuation_from": first_val,
        "series": series,
    }
    path = os.path.join(OUT_DIR, "vnindex_pe.json")
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, path)        # ghi nguyên tử, tránh trang đọc phải file dở
    print(f"· Ghi {path} ({os.path.getsize(path)/1024:.0f} KB, {len(series)} phiên, "
          f"{time.time()-t0:.0f}s)")
    print(f"  VNINDEX từ {series[0]['d']} · định giá từ {first_val}")
    for r in (series[0], series[-1]):
        print(f"  {r['d']}: VNINDEX={r['i']}  P/E={r.get('pe','—')}  P/B={r.get('pb','—')}")
    return out


if __name__ == "__main__":
    sys.exit(0 if build() else 1)
