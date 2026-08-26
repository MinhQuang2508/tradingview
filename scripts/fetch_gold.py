#!/usr/bin/env python3
"""Dựng chuỗi vàng quốc tế và SJC, không cần API key."""
import http.cookiejar, json, time, urllib.parse, urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site/data/gold.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"

def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def world_gold():
    p2 = int(time.time()) + 86400
    url = "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?" + urllib.parse.urlencode({
        "period1": 0, "period2": p2, "interval": "1d", "events": "history"})
    r = get_json(url)["chart"]["result"][0]
    q = r["indicators"]["quote"][0]
    yahoo = {}
    for i, ts in enumerate(r["timestamp"]):
        c = q["close"][i]
        if c is not None:
            yahoo[datetime.fromtimestamp(ts, timezone.utc).date().isoformat()] = round(c, 4)
    first = min(yahoo)
    lbma = {}
    for row in get_json("https://prices.lbma.org.uk/json/gold_pm.json"):
        d = str(row.get("d", ""))[:10]
        v = row.get("v") or []
        if d < first and v and isinstance(v[0], (int, float)):
            lbma[d] = round(v[0], 4)
    return {**lbma, **yahoo}

def sjc_history():
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    headers = {"User-Agent": UA, "Referer": "https://sjc.com.vn/bieu-do-gia-vang",
               "X-Requested-With": "XMLHttpRequest",
               "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}
    op.open(urllib.request.Request("https://sjc.com.vn/bieu-do-gia-vang", headers={"User-Agent": UA}), timeout=30).read()
    rows = {}
    start, today = date(2010, 1, 1), date.today()
    while start <= today:
        end = min(start + timedelta(days=88), today)
        body = urllib.parse.urlencode({"method": "GetGoldPriceHistory", "goldPriceId": "1",
            "fromDate": start.strftime("%d/%m/%Y"), "toDate": end.strftime("%d/%m/%Y")}).encode()
        for attempt in range(3):
            try:
                with op.open(urllib.request.Request("https://sjc.com.vn/GoldPrice/Services/PriceService.ashx",
                                                    data=body, headers=headers), timeout=45) as resp:
                    payload = json.load(resp)
                if not payload.get("success"): raise RuntimeError(payload.get("message"))
                break
            except Exception:
                if attempt == 2: raise
                time.sleep(1 + attempt)
        for x in payload.get("data", []):
            ms = int(str(x["GroupDate"]).split("(")[1].split(")")[0])
            d = datetime.fromtimestamp(ms / 1000, timezone(timedelta(hours=7))).date().isoformat()
            # API trả nhiều lần cập nhật trong ngày; bản ghi sau cùng là giá đóng ngày.
            if ms >= rows.get(d, {}).get("_ts", 0):
                rows[d] = {"sjc_buy": round(float(x["BuyValue"]) / 1e6, 3),
                           "sjc_sell": round(float(x["SellValue"]) / 1e6, 3), "_ts": ms}
        start = end + timedelta(days=1)
        time.sleep(.08)
    return rows

def central_bank_flows():
    """Gom mua/bán ròng theo tháng từ đúng dataset đang cấp cho cbgold.html."""
    url = "https://gold.koliaphan.net/cbgold_data.js"
    req = urllib.request.Request(url + f"?t={int(time.time())}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        text = resp.read().decode("utf-8-sig")
    prefix = "window.CB_GOLD = "
    if prefix not in text: raise RuntimeError("cbgold_data.js sai định dạng")
    doc = json.loads(text.split(prefix, 1)[1].strip().removesuffix(";"))
    months = doc["months"]
    totals = {m: {"cb_net": 0.0, "cb_buy": 0.0, "cb_sell": 0.0,
                  "cb_buyers": 0, "cb_sellers": 0} for m in months}
    for e in doc["entities"]:
        if e.get("isAggregate"): continue  # Euro area/ECB would double-count members.
        start = months.index(e["from"])
        prev = None
        for offset, holding in enumerate(e["v"]):
            pos = start + offset
            if pos >= len(months): break
            if holding is None: continue
            if prev is not None:
                change = float(holding) - float(prev)
                x = totals[months[pos]]
                x["cb_net"] += change
                if change >= 0.1: x["cb_buy"] += change; x["cb_buyers"] += 1
                elif change <= -0.1: x["cb_sell"] += change; x["cb_sellers"] += 1
            prev = holding
    return {m + "-01": {k: round(v, 3) if isinstance(v, float) else v for k, v in x.items()}
            for m, x in totals.items()}, doc.get("source"), doc.get("sourceUrl")

def main():
    xau = world_gold()
    sjc = sjc_history()
    cb, cb_source, cb_url = central_bank_flows()
    fxdoc = json.loads((ROOT / "site/data/fx.json").read_text())
    fx = {r["d"]: r.get("usdvnd") for r in fxdoc["series"] if r.get("usdvnd")}
    dates = sorted(set(xau) | set(sjc) | set(cb))
    last_fx = None; series = []
    for d in dates:
        if d in fx: last_fx = fx[d]
        row = {"d": d}
        if d in xau:
            row["xau"] = xau[d]
            if last_fx:
                # 1 lượng = 37,5 g; 1 troy oz = 31,1034768 g.
                row["world_vnd"] = round(xau[d] * last_fx * 37.5 / 31.1034768 / 1e6, 3)
        if d in sjc:
            row.update({k: v for k, v in sjc[d].items() if not k.startswith("_")})
            if row.get("sjc_sell") is not None and row.get("world_vnd") is not None:
                row["premium"] = round(row["sjc_sell"] - row["world_vnd"], 3)
        if d in cb: row.update(cb[d])
        series.append(row)
    doc = {"generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
           "source": "LBMA + Yahoo Finance (GC=F) + SJC official",
           "source_urls": ["https://prices.lbma.org.uk/json/gold_pm.json",
             "https://finance.yahoo.com/quote/GC=F/", "https://sjc.com.vn/bieu-do-gia-vang", cb_url],
           "central_bank_source": cb_source,
           "unit": {"xau": "USD/oz", "world_vnd": "triệu VND/lượng",
                    "sjc_buy": "triệu VND/lượng", "sjc_sell": "triệu VND/lượng", "premium": "triệu VND/lượng",
                    "cb_net": "tấn/tháng"},
           "series": series}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print(f"gold: {len(series)} ngày; SJC {len(sjc)} ngày; {series[0]['d']} → {series[-1]['d']}")

if __name__ == "__main__": main()
