#!/usr/bin/env python3
"""Dựng chuỗi bơm/hút thanh khoản NHNN từ bảng công khai tổng hợp dữ liệu SBV."""

import datetime as dt
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "data", "omo.json")
URL = "https://api.dulieukinhte.com/api/tablemacro/334?full=1"

# Dòng ròng 66505 có lịch sử dài và đã trừ các khoản đáo hạn suy theo kỳ hạn.
ROWS = {
    66505: "net",
    27690: "repo_injection",
    53602: "repo_outstanding",
    53609: "bill_outstanding",
}


def fetch():
    req = urllib.request.Request(URL, headers={
        "User-Agent": "tradingview-data/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.loads(res.read().decode("utf-8"))


def day_of(timestamp_ms):
    vn = dt.timezone(dt.timedelta(hours=7))
    return dt.datetime.fromtimestamp(timestamp_ms / 1000, vn).date().isoformat()


def build():
    payload = fetch()
    by_id = {r.get("id"): r for r in payload.get("row", [])}
    merged = {}
    for row_id, key in ROWS.items():
        row = by_id.get(row_id)
        if not row:
            raise RuntimeError(f"Nguồn thiếu dòng bắt buộc {row_id}")
        for timestamp, value in row.get("data", []):
            if not isinstance(value, (int, float)):
                continue
            day = day_of(timestamp)
            merged.setdefault(day, {"d": day})[key] = round(float(value), 2)

    # Trục chính là bơm/hút ròng. Những ngày chỉ có dữ liệu dư nợ nhưng không có
    # dòng ròng không được tự điền 0 vì 0 và "chưa có dữ liệu" là hai nghĩa khác.
    series = [merged[d] for d in sorted(merged) if "net" in merged[d]]
    if not series:
        raise RuntimeError("Nguồn không trả chuỗi bơm/hút ròng")

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source": "State Bank of Vietnam (SBV), aggregated by Dữ Liệu Kinh Tế",
        "source_url": "https://dulieukinhte.com/du-lieu/sbv-bomhut-tien-334",
        "unit": "billion VND",
        "sign": "positive=injection, negative=withdrawal",
        "series": series,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, OUT)
    print(f"· Ghi {OUT}: {len(series)} phiên {series[0]['d']} → {series[-1]['d']}")
    return out


if __name__ == "__main__":
    build()
