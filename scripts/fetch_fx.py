#!/usr/bin/env python3
"""
Dựng bộ dữ liệu tỷ giá cho tab "Tỷ giá".

Nguồn:
  1. Yahoo Finance — chuỗi ngày, miễn phí, không cần khoá
     USDVND=X   tỷ giá USD/VND thị trường (liên ngân hàng)
     DX-Y.NYB   chỉ số Dollar Index — sức mạnh USD so với rổ tiền tệ lớn
     USDCNY=X   USD/CNY, để đối chiếu với đồng tiền neo thương mại lớn nhất
  2. Vietcombank — bản tin tỷ giá công khai (XML), chỉ có giá TẠI THỜI ĐIỂM GỌI
     https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10

Vietcombank không cho tra lịch sử (tham số ngày bị bỏ qua, luôn trả bản hôm nay),
nên chuỗi mua/bán của ngân hàng được BỒI DẦN: mỗi lần chạy ghi thêm một điểm vào
file cũ. Chuỗi Yahoo thì tải lại toàn bộ mỗi lần.
"""

import datetime as dt
import gzip
import io
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "data", "fx.json")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart"
VCB = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10"

SERIES = {
    "usdvnd": "USDVND=X",
    "dxy": "DX-Y.NYB",
    "usdcny": "USDCNY=X",
}
START = "2003-01-01"


def http(url, timeout=60, tries=4):
    last = None
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA, "Accept-Encoding": "gzip",
                "Accept": "application/json,text/xml,*/*"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                if r.headers.get("Content-Encoding") == "gzip":
                    raw = gzip.GzipFile(fileobj=io.BytesIO(raw)).read()
                return raw.decode("utf-8", "ignore")
        except Exception as e:                       # noqa: BLE001
            last = e
            time.sleep(0.6 * (k + 1))
    raise RuntimeError(f"{url} thất bại: {last}")


def yahoo_daily(symbol):
    """{ngày: giá đóng cửa} từ Yahoo."""
    p1 = int(dt.datetime.fromisoformat(START).replace(tzinfo=dt.timezone.utc).timestamp())
    p2 = int(time.time()) + 86400
    url = f"{YAHOO}/{symbol}?period1={p1}&period2={p2}&interval=1d"
    d = json.loads(http(url))["chart"]["result"][0]
    closes = d["indicators"]["quote"][0]["close"]
    out = {}
    for ts, c in zip(d["timestamp"], closes):
        if c is None:
            continue
        day = dt.datetime.fromtimestamp(int(ts), dt.timezone.utc).date().isoformat()
        out[day] = float(c)
    return out


def vcb_today():
    """Tỷ giá USD của Vietcombank tại thời điểm gọi."""
    xml = http(VCB, timeout=30)
    m = re.search(r'CurrencyCode="USD"[^>]*?Buy="([\d,.]+)"[^>]*?'
                  r'Transfer="([\d,.]+)"[^>]*?Sell="([\d,.]+)"', xml)
    if not m:
        return None
    num = lambda s: float(s.replace(",", ""))         # noqa: E731
    stamp = re.search(r"<DateTime>([^<]+)</DateTime>", xml)
    return {
        "buy": num(m.group(1)),
        "transfer": num(m.group(2)),
        "sell": num(m.group(3)),
        "at": (stamp.group(1).strip() if stamp else ""),
    }


def build():
    print("· Tải chuỗi Yahoo ...", flush=True)
    data = {}
    for key, sym in SERIES.items():
        data[key] = yahoo_daily(sym)
        days = sorted(data[key])
        print(f"  {key:8} {len(days):>5} phiên  {days[0]} → {days[-1]}")

    # Trục thời gian lấy theo USD/VND — đây là chuỗi chính của tab này.
    # Yahoo có báo giá USD/VND cả Chủ nhật (rất mỏng) trong khi DXY thì không,
    # nên bỏ ngày cuối tuần để hai chuỗi khớp lịch và bảng không đầy ô trống.
    days = [d for d in sorted(data["usdvnd"])
            if dt.date.fromisoformat(d).weekday() < 5]
    series = []
    for d in days:
        row = {"d": d, "usdvnd": round(data["usdvnd"][d], 2)}
        if d in data["dxy"]:
            row["dxy"] = round(data["dxy"][d], 3)
        if d in data["usdcny"]:
            row["usdcny"] = round(data["usdcny"][d], 4)
        series.append(row)

    # Vietcombank: bồi dần, giữ nguyên các điểm đã ghi lần trước.
    vcb = []
    if os.path.exists(OUT):
        try:
            with open(OUT) as f:
                vcb = json.load(f).get("vcb") or []
        except Exception:                            # noqa: BLE001
            vcb = []
    try:
        q = vcb_today()
        if q:
            today = dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date().isoformat()
            vcb = [v for v in vcb if v["d"] != today]
            vcb.append({"d": today, "buy": q["buy"],
                        "transfer": q["transfer"], "sell": q["sell"]})
            vcb.sort(key=lambda v: v["d"])
            print(f"· Vietcombank {today}: mua {q['buy']:,.0f} · chuyển khoản "
                  f"{q['transfer']:,.0f} · bán {q['sell']:,.0f}")
    except Exception as e:                           # noqa: BLE001
        print(f"· Vietcombank lỗi ({e}) — giữ nguyên chuỗi cũ")

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "sources": {
            "usdvnd": "Yahoo Finance USDVND=X",
            "dxy": "Yahoo Finance DX-Y.NYB (ICE Dollar Index)",
            "usdcny": "Yahoo Finance USDCNY=X",
            "vcb": "portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx",
        },
        "note": ("Vietcombank khong cho tra lich su nen chuoi mua/ban duoc boi dan "
                 "moi lan chay; chuoi Yahoo tai lai toan bo."),
        "vcb_from": vcb[0]["d"] if vcb else None,
        "series": series,
        "vcb": vcb,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    os.replace(tmp, OUT)
    print(f"· Ghi {OUT} ({os.path.getsize(OUT)/1024:.0f} KB, {len(series)} phiên)")
    print(f"  {series[-1]['d']}: USD/VND={series[-1]['usdvnd']:,.0f} "
          f"DXY={series[-1].get('dxy','—')} USD/CNY={series[-1].get('usdcny','—')}")
    return out


if __name__ == "__main__":
    sys.exit(0 if build() else 1)
