#!/usr/bin/env python3
"""
Dựng bộ dữ liệu VNINDEX + P/E + P/B toàn thị trường HOSE.

    P/E(t) = Σ VonHoa_i(t) / Σ LoiNhuanTTM_i(t)
    P/B(t) = Σ VonHoa_i(t) / Σ VonChuSoHuu_i(t)

Nguồn:
  · VNINDEX theo ngày (từ 2004) — Vietcap
      POST trading.vietcap.com.vn/api/chart/OHLCChart/gap
  · Giá đóng cửa GỐC toàn sàn HOSE (từ 2013) — VNDirect finfo
      GET api-finfo.vndirect.com.vn/v4/stock_prices?q=floor:HOSE~date:...
  · BCTC quý toàn thị trường — VNDirect finfo
      GET api-finfo.vndirect.com.vn/v4/financial_statements?q=itemCode:...

Vì sao dùng VNDirect thay vì Vietcap cho phần định giá:

  1. BCTC của Vietcap chỉ lùi tới quý 1/2018; VNDirect có giá gốc từ 2013 nên
     chuỗi định giá dài thêm sáu năm.
  2. Vietcap chỉ có giá ĐÃ ĐIỀU CHỈNH, mà phép điều chỉnh trừ cả cổ tức tiền
     mặt — lấy "giá điều chỉnh × số cổ phiếu hiện tại" thì vốn hoá quá khứ
     THẤP hơn thực tế, càng lùi xa càng lệch. VNDirect trả cả giá gốc lẫn giá
     điều chỉnh, nên ghép được "giá gốc × số cổ phiếu tại thời điểm đó" — đúng
     định nghĩa vốn hoá.
  3. Truy vấn `floor:HOSE` trả về mọi mã ĐANG niêm yết tại ngày đó, kể cả mã
     về sau huỷ niêm yết. Rổ vì thế đúng thành phần từng thời kỳ, hết
     survivorship bias.

Vốn hoá chốt theo mốc mỗi năm phiên rồi nội suy theo ngày bằng chính VNINDEX:
chỉ số này là tổng vốn hoá chia cho một số chia chỉ đổi khi có niêm yết mới
hoặc phát hành thêm, nên giữa hai mốc thì tỉ lệ VNINDEX chính là tỉ lệ vốn hoá.
Lợi nhuận và vốn chủ sở hữu tính lại theo TỪNG NGÀY để mùa báo cáo không bị trễ.
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
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "site", "data")
CACHE_DIR = os.path.join(ROOT, "data", "cache")

VND = "https://api-finfo.vndirect.com.vn/v4"
TRADING = "https://trading.vietcap.com.vn/api"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

INDEX_START = "2000-01-01"      # VNINDEX: lấy hết những gì Vietcap có
PRICE_START = "2013-01-01"      # giá gốc của VNDirect bắt đầu từ đây
LEGACY_START = "2007-01-01"     # trước đó chỉ có giá điều chỉnh (xem legacy_factors)
ANCHOR_EVERY = 5                # mốc vốn hoá: mỗi 5 phiên (~1 tuần)
WORKERS = 6
# Số liệu đã cũ thì không đổi nữa nên giữ cache lâu; số liệu gần đây vẫn còn
# chạy — giá trong phiên chưa chốt, doanh nghiệp còn nộp báo cáo — nên phải
# hết hạn nhanh, nếu không lần chạy 16:15 sẽ dùng lại giá dở dang lúc trưa.
CACHE_TTL_SETTLED = 90 * 86400
CACHE_TTL_FRESH = 3 * 3600
PX_SETTLE_DAYS = 10             # phiên cũ hơn ngần này coi như đã chốt
FS_SETTLE_DAYS = 200            # quý chốt sổ lâu hơn ngần này coi như đã nộp xong
MIN_COVERAGE = 0.85             # tỉ lệ vốn hoá đã có BCTC, tối thiểu
MIN_TICKERS = 100

ITEMS = {
    "npat":     23000,          # Lợi nhuận sau thuế của Công ty mẹ
    "equity":   14000,          # Vốn chủ sở hữu
    "minority": 14240,          # Lợi ích cổ đông không kiểm soát
    "capital":  14110,          # Vốn góp -> số cổ phiếu = vốn góp / mệnh giá
    "treasury": 14140,          # Cổ phiếu quỹ
}
PAR_VALUE = 10_000              # mệnh giá cổ phiếu Việt Nam


def http_json(url, payload=None, tries=4, timeout=90):
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {"User-Agent": UA, "Accept": "application/json",
               "Accept-Encoding": "gzip", "Referer": "https://dstock.vndirect.com.vn/"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    last = None
    for k in range(tries):
        try:
            req = urllib.request.Request(url, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
                return json.loads(raw.decode("utf-8"))
        except Exception as e:                       # noqa: BLE001
            last = e
            time.sleep(0.6 * (k + 1))
    raise RuntimeError(f"{url} thất bại: {last}")


def cached(prefix, fn, key, ttl):
    path = os.path.join(CACHE_DIR, f"{prefix}_{key}.json")
    if os.path.exists(path) and time.time() - os.path.getmtime(path) < ttl:
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:                            # noqa: BLE001
            pass
    val = fn(key)
    with open(path, "w") as f:
        json.dump(val, f)
    return val


# ------------------------------------------------- giá điều chỉnh (cũ) ---

def fetch_adjusted(symbols):
    """{mã: {ngày: giá điều chỉnh}} từ Vietcap, gọi theo lô 20 mã."""
    frm = int(dt.datetime.fromisoformat(LEGACY_START)
              .replace(tzinfo=dt.timezone.utc).timestamp())
    to = int(time.time()) + 86400
    out = {}
    syms = sorted(symbols)
    for i in range(0, len(syms), 20):
        try:
            res = http_json(f"{TRADING}/chart/OHLCChart/gap",
                            {"timeFrame": "ONE_DAY", "symbols": syms[i:i + 20],
                             "from": frm, "to": to})
        except Exception:                            # noqa: BLE001
            continue
        for e in res or []:
            if not e.get("t"):
                continue
            out[e["symbol"]] = {
                dt.datetime.fromtimestamp(int(t), dt.timezone.utc).date().isoformat(): float(c)
                for t, c in zip(e["t"], e["c"]) if c is not None}
    return out


# --------------------------------------------------------------- VNINDEX ---

def fetch_vnindex():
    frm = int(dt.datetime.fromisoformat(INDEX_START)
              .replace(tzinfo=dt.timezone.utc).timestamp())
    d = http_json(f"{TRADING}/chart/OHLCChart/gap",
                  {"timeFrame": "ONE_DAY", "symbols": ["VNINDEX"],
                   "from": frm, "to": int(time.time()) + 86400})[0]
    result = {}
    for ts, c in zip(d["t"], d["c"]):
        if c is None:
            continue
        day = dt.datetime.fromtimestamp(int(ts), dt.timezone.utc).date()
        # HOSE không giao dịch cuối tuần. Dữ liệu Vietcap có đúng một bar hỏng
        # kiểu này — thứ Bảy 16/08/2008 ghi 900,26 trong khi phiên thứ Sáu liền
        # trước là 488,94 — và nó đủ để tạo ra một "đỉnh P/E" giả.
        if day.weekday() >= 5:
            continue
        result[day.isoformat()] = float(c)
    return result


# ------------------------------------------------------------------ giá ---

def _snapshot(day):
    """Giá đóng cửa gốc của mọi cổ phiếu đang niêm yết HOSE trong ngày."""
    q = urllib.parse.quote(f"floor:HOSE~date:{day}", safe=":~")
    res = http_json(f"{VND}/stock_prices?q={q}&size=5000")
    return {r["code"]: float(r["close"]) * 1000
            for r in (res.get("data") or [])
            if r.get("close") and r.get("type") == "STOCK"}


def settled_ttl(iso_date, settle_days):
    age = (dt.date.today() - dt.date.fromisoformat(iso_date)).days
    return CACHE_TTL_SETTLED if age >= settle_days else CACHE_TTL_FRESH


def fetch_snapshot(day):
    return cached("px", _snapshot, day, settled_ttl(day, PX_SETTLE_DAYS))


# ----------------------------------------------------------------- BCTC ---

def _item_quarter(key):
    """key = 'npat|2015-12-31' -> {mã: [giá trị, ngày ghi nhận]}"""
    name, fiscal = key.split("|")
    q = urllib.parse.quote(
        f"itemCode:{ITEMS[name]}~reportType:QUARTER~fiscalDate:{fiscal}", safe=":~")
    res = http_json(f"{VND}/financial_statements?q={q}&size=5000")
    result = {}
    for r in res.get("data") or []:
        v = r.get("numericValue")
        if v is not None:
            result[r["code"]] = [float(v), (r.get("createdDate") or "")[:10]]
    return result


def fetch_item_quarter(name, fiscal):
    return cached("fs", _item_quarter, f"{name}|{fiscal}",
                  settled_ttl(fiscal, FS_SETTLE_DAYS))


DEFAULT_LAG = {False: 45, True: 90}      # quý thường / quý 4


def trusted_lag(fiscal, created):
    """Số ngày từ ngày chốt sổ tới ngày ghi nhận, None nếu không đáng tin.

    VNDirect nạp gộp toàn bộ dữ liệu cũ vào tháng 12/2019 nên `createdDate` của
    mọi kỳ trước đó đều là 2019-12 chứ không phải ngày nộp thật.
    """
    if not created or created < fiscal:
        return None
    lag = (dt.date.fromisoformat(created) - dt.date.fromisoformat(fiscal)).days
    return lag if 3 <= lag <= 180 else None


def build_lag_model(fin):
    """{mã: {quý-4?: độ trễ nộp điển hình}} học từ giai đoạn createdDate đáng tin.

    Áp độ trễ riêng của từng doanh nghiệp cho các kỳ cũ tốt hơn nhiều so với
    gán chung một mốc: nếu cả thị trường "công bố" cùng ngày thì chuỗi P/E nhảy
    bậc 6–9% mỗi quý, trong khi thực tế các công ty nộp rải ra vài tuần.
    """
    per, glob = {}, {False: [], True: []}
    for fiscal, by_code in fin["npat"].items():
        q4 = fiscal.endswith("-12-31")
        for code, (_v, created) in by_code.items():
            lag = trusted_lag(fiscal, created)
            if lag is None:
                continue
            per.setdefault(code, {False: [], True: []})[q4].append(lag)
            glob[q4].append(lag)

    def med(xs, fallback):
        return sorted(xs)[len(xs) // 2] if xs else fallback

    gmed = {k: med(v, DEFAULT_LAG[k]) for k, v in glob.items()}
    model = {c: {k: med(v, gmed[k]) for k, v in d.items()} for c, d in per.items()}
    model["*"] = gmed
    return model


LAGS = {"*": DEFAULT_LAG}


def publish_date(fiscal, created, code):
    """Ngày số liệu của một quý coi như đã ra thị trường."""
    lag = trusted_lag(fiscal, created)
    if lag is None:
        q4 = fiscal.endswith("-12-31")
        lag = (LAGS.get(code) or LAGS["*"])[q4]
    return (dt.date.fromisoformat(fiscal) + dt.timedelta(days=lag)).isoformat()


def quarter_ends(from_year, until):
    out = []
    for y in range(from_year, until.year + 1):
        for m, d in ((3, 31), (6, 30), (9, 30), (12, 31)):
            q = dt.date(y, m, d)
            if q <= until:
                out.append(q.isoformat())
    return out


def ttm_timeline(by_quarter, code):
    """[(ngày công bố, tổng 4 quý liên tiếp)] — cho chỉ tiêu luỹ kế."""
    seq = sorted((q, by_quarter[q][code]) for q in by_quarter if code in by_quarter[q])
    merged, floor = {}, ""
    for i in range(3, len(seq)):
        win = seq[i - 3:i + 1]
        months = [int(q[:4]) * 12 + int(q[5:7]) for q, _ in win]
        if months != list(range(months[0], months[0] + 12, 3)):
            continue                                  # phải là 4 quý liên tiếp
        floor = max(publish_date(win[-1][0], win[-1][1][1], code), floor)
        merged[floor] = sum(v[0] for _, v in win)
    return sorted(merged.items())


def point_timeline(by_quarter, code):
    """[(ngày công bố, giá trị kỳ gần nhất)] — cho chỉ tiêu thời điểm."""
    seq = sorted((q, by_quarter[q][code]) for q in by_quarter if code in by_quarter[q])
    merged, floor = {}, ""
    for q, (v, pub) in seq:
        floor = max(publish_date(q, pub, code), floor)
        merged[floor] = v
    return sorted(merged.items())


def at(timeline, day):
    """Giá trị có hiệu lực tại ngày `day`, None nếu chưa công bố gì."""
    i = bisect.bisect_right([x[0] for x in timeline], day) - 1
    return timeline[i][1] if i >= 0 else None


# ----------------------------------------------------------------- dựng ---

def build():
    os.makedirs(CACHE_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    t0 = time.time()

    print("· VNINDEX ...", flush=True)
    vni = fetch_vnindex()
    days = sorted(vni)
    print(f"  {len(days)} phiên {days[0]} → {days[-1]}")

    trading = [d for d in days if d >= PRICE_START]
    anchors = trading[::ANCHOR_EVERY]
    if anchors[-1] != trading[-1]:
        anchors.append(trading[-1])
    legacy = [d for d in days if LEGACY_START <= d < PRICE_START][::ANCHOR_EVERY]
    print(f"· {len(anchors)} mốc từ {PRICE_START[:4]} (giá gốc) "
          f"+ {len(legacy)} mốc trước đó (giá điều chỉnh)")

    print("· Tải BCTC quý toàn thị trường ...", flush=True)
    quarters = quarter_ends(int(LEGACY_START[:4]) - 1, dt.date.today())
    fin = {name: {} for name in ITEMS}
    jobs = [(n, q) for n in ITEMS for q in quarters]
    done = 0
    with cf.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(fetch_item_quarter, n, q): (n, q) for n, q in jobs}
        for fu in cf.as_completed(futs):
            n, q = futs[fu]
            fin[n][q] = fu.result()
            done += 1
            if done % 80 == 0:
                print(f"  {done}/{len(jobs)}", flush=True)
    codes = {c for q in fin["npat"].values() for c in q}
    print(f"  {len(quarters)} quý · {len(codes)} mã có số liệu")

    LAGS.clear()
    LAGS.update(build_lag_model(fin))
    g = LAGS["*"]
    print(f"  độ trễ nộp báo cáo: học được cho {len(LAGS)-1} mã · "
          f"trung vị chung {g[False]} ngày (quý 4: {g[True]})")

    print("· Dựng chuỗi theo mã ...", flush=True)
    tl = {}
    for c in codes:
        ttm = ttm_timeline(fin["npat"], c)
        cap = point_timeline(fin["capital"], c)
        if not ttm or not cap:
            continue
        tl[c] = {"ttm": ttm, "cap": cap,
                 "tre": point_timeline(fin["treasury"], c),
                 "eq": point_timeline(fin["equity"], c),
                 "mi": point_timeline(fin["minority"], c)}
    print(f"  {len(tl)} mã đủ lợi nhuận và vốn góp")

    print("· Tải giá gốc theo mốc ...", flush=True)
    snaps, done = {}, 0
    with cf.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(fetch_snapshot, d): d for d in anchors}
        for fu in cf.as_completed(futs):
            snaps[futs[fu]] = fu.result()
            done += 1
            if done % 150 == 0:
                print(f"  {done}/{len(anchors)}", flush=True)

    # Mỗi mốc chốt THÀNH PHẦN rổ và vốn hoá từng mã tại mốc đó.
    members = {}
    for d in anchors:
        lst = []
        for code, price in (snaps.get(d) or {}).items():
            t = tl.get(code)
            if not t:
                continue
            cap = at(t["cap"], d)
            if not cap:
                continue
            shares = (cap - abs(at(t["tre"], d) or 0)) / PAR_VALUE
            if shares > 0:
                lst.append((code, price * shares))
        members[d] = lst
    print(f"  trung bình {sum(len(v) for v in members.values())//max(1, len(members))} mã/rổ")

    # --- giai đoạn trước 2013: chỉ có giá điều chỉnh ---------------------
    # Với mỗi mã, quy đổi một lần tại mốc giá gốc sớm nhất:
    #     k = giá_gốc × số_CP / giá_điều_chỉnh
    # rồi dùng chính k đó cho các mốc cũ hơn. Nếu phép điều chỉnh chỉ xử lý
    # cổ phiếu thưởng và chia tách thì k là hằng số, phép quy đổi đúng tuyệt
    # đối. Thực tế nó còn trừ cổ tức tiền mặt nên k trôi nhẹ — đo trên đoạn
    # 2013–2026 thì bình quân theo vốn hoá chỉ 0,45%/năm, tức suy ngược bốn
    # năm lệch chưa tới 2%. Đủ chính xác, nhưng vẫn là ƯỚC LƯỢNG.
    legacy_from = None
    if legacy:
        d0 = anchors[0]
        base_codes = [c for c, _ in members.get(d0, [])]
        print(f"· Tải giá điều chỉnh cho {len(base_codes)} mã (trước {PRICE_START[:4]}) ...",
              flush=True)
        adj = fetch_adjusted(base_codes)
        kfac = {}
        for code, mc0 in members.get(d0, []):
            a = (adj.get(code) or {}).get(d0)
            if a and a > 0:
                kfac[code] = mc0 / a          # = giá_gốc × số_CP / giá_điều_chỉnh
        print(f"  quy đổi được {len(kfac)} mã")
        for d in legacy:
            lst = []
            for code, k in kfac.items():
                a = (adj.get(code) or {}).get(d)
                if a and a > 0:
                    lst.append((code, a * k))
            if lst:
                members[d] = lst
        anchors = sorted(set(anchors) | {d for d in legacy if d in members})
        legacy_from = next((d for d in anchors if d in members), None)

    print("· Tổng hợp theo ngày ...", flush=True)
    series, contrib = [], []
    first_pe = first_pb = None
    for day in days:
        row = {"d": day, "i": round(vni[day], 2)}
        k = bisect.bisect_right(anchors, day) - 1
        if k >= 0:
            a = anchors[k]
            base = vni.get(a)
            if base:
                # giá chốt tại mốc, trượt theo VNINDEX tới ngày đang xét;
                # lợi nhuận và vốn chủ sở hữu thì đọc đúng theo ngày.
                scale = vni[day] / base
                mc_all = mc_e = earn = mc_b = book = 0.0
                n = 0
                for code, mc0 in members[a]:
                    mc = mc0 * scale
                    mc_all += mc
                    t = tl[code]
                    e = at(t["ttm"], day)
                    if e is not None:
                        mc_e += mc
                        earn += e
                        n += 1
                    eq = at(t["eq"], day)
                    if eq is not None:
                        b = eq - (at(t["mi"], day) or 0)
                        if b > 0:
                            mc_b += mc
                            book += b
                if mc_all > 0 and n >= MIN_TICKERS:
                    if earn > 0 and mc_e / mc_all >= MIN_COVERAGE:
                        row["pe"] = round(mc_e / earn, 3)
                        if day < PRICE_START:
                            row["est"] = 1          # suy từ giá điều chỉnh
                        contrib.append(n)
                        first_pe = first_pe or day
                    if book > 0 and mc_b / mc_all >= MIN_COVERAGE:
                        row["pb"] = round(mc_b / book, 4)
                        first_pb = first_pb or day
        series.append(row)

    payload = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "method": ("P/E = sum(VonHoa)/sum(LNST TTM cong ty me da cong bo); "
                   "P/B = sum(VonHoa)/sum(Von chu so huu cong ty me). VonHoa = "
                   "gia dong cua GOC x so co phieu tai thoi diem do (von gop chia "
                   "menh gia, tru co phieu quy). Ro gom moi ma dang niem yet HOSE "
                   "tai tung thoi diem, ke ca ma ve sau huy niem yet."),
        "sources": {
            "index": "trading.vietcap.com.vn/api/chart/OHLCChart/gap",
            "prices": "api-finfo.vndirect.com.vn/v4/stock_prices?q=floor:HOSE",
            "financials": "api-finfo.vndirect.com.vn/v4/financial_statements",
        },
        "universe_size": len(tl),
        "avg_contributors": round(sum(contrib) / len(contrib)) if contrib else 0,
        "index_from": series[0]["d"] if series else None,
        "valuation_from": first_pe,
        "exact_from": PRICE_START,
        "series": series,
    }
    path = os.path.join(OUT_DIR, "vnindex_pe.json")
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    os.replace(tmp, path)
    print(f"· Ghi {path} ({os.path.getsize(path)/1024:.0f} KB, {len(series)} phiên, "
          f"{time.time()-t0:.0f}s)")
    print(f"  VNINDEX từ {series[0]['d']} · P/E từ {first_pe} · P/B từ {first_pb}")
    for r in (series[0], series[-1]):
        print(f"  {r['d']}: VNINDEX={r['i']}  P/E={r.get('pe','—')}  P/B={r.get('pb','—')}")
    return payload


if __name__ == "__main__":
    sys.exit(0 if build() else 1)
