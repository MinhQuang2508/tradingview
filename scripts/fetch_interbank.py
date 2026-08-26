#!/usr/bin/env python3
"""Dựng chuỗi lãi suất liên ngân hàng từ dữ liệu NHNN do DLKT tổng hợp.

Nguồn chính trả toàn bộ lịch sử công khai. Snapshot Viet Dataverse chỉ là dự
phòng khi nguồn chính gián đoạn; dữ liệu cũ luôn được merge để không mất phiên.
"""

import datetime as dt
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "data", "interbank.json")
FULL = "https://api.dulieukinhte.com/api/tablemacro/391?full=1"
FALLBACK = "https://api.vietdataverse.online/fe/data/sbv_1m.json"

ROWS = {
    34248: "overnight", 34249: "week_1", 34250: "week_2",
    34251: "month_1", 34252: "month_3", 34253: "month_6", 34254: "month_9",
}


def fetch_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "tradingview-data/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.loads(res.read().decode("utf-8"))


def day_of(timestamp_ms):
    vn = dt.timezone(dt.timedelta(hours=7))
    return dt.datetime.fromtimestamp(timestamp_ms / 1000, vn).date().isoformat()


def rows_from_dlkt(payload):
    by_id = {row.get("id"): row for row in payload.get("row", [])}
    if 34248 not in by_id:
        raise RuntimeError("Nguồn thiếu dòng lãi suất qua đêm 34248")
    merged = {}
    for row_id, key in ROWS.items():
        row = by_id.get(row_id)
        if not row:
            continue
        for timestamp, value in row.get("data", []):
            if not isinstance(value, (int, float)):
                continue
            day = day_of(timestamp)
            merged.setdefault(day, {"d": day})[key] = round(float(value), 4)
    return [merged[d] for d in sorted(merged) if "overnight" in merged[d]]


def rows_from_snapshot(payload):
    data = payload.get("data", payload)
    dates = data.get("dates") or []
    rows = []
    for i, day in enumerate(dates):
        row = {"d": day}
        for key in ROWS.values():
            values = data.get(key) or []
            value = values[i] if i < len(values) else None
            if isinstance(value, (int, float)):
                row[key] = round(float(value), 4)
        if "overnight" in row:
            rows.append(row)
    return rows


def old_rows():
    try:
        with open(OUT, encoding="utf-8") as f:
            return json.load(f).get("series") or []
    except (FileNotFoundError, ValueError, OSError):
        return []


def build():
    source_url = "https://dulieukinhte.com/du-lieu-dong/lai-suat-thi-truong-lien-ngan-hang-qua-dem-34248"
    transport = "Dữ Liệu Kinh Tế full public API"
    try:
        fresh = rows_from_dlkt(fetch_json(FULL))
        full_history = True
    except Exception as exc:
        print(f"· Nguồn lịch sử đầy đủ lỗi ({exc}) — dùng snapshot dự phòng", file=sys.stderr)
        fresh = rows_from_snapshot(fetch_json(FALLBACK))
        transport = "Viet Dataverse public 1-month fallback"
        full_history = False
    if not fresh:
        raise RuntimeError("Nguồn trả về nhưng không có lãi suất qua đêm hợp lệ")

    if full_history:
        # Không trộn snapshot cũ vào lịch sử chuẩn: hai bên từng quy ước ngày
        # khác nhau, merge sẽ tạo thêm các phiên giả lệch một ngày.
        series = fresh
    else:
        merged = {r["d"]: dict(r) for r in old_rows() if r.get("d")}
        for row in fresh:
            merged.setdefault(row["d"], {"d": row["d"]}).update(row)
        series = [merged[d] for d in sorted(merged)]

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source": "State Bank of Vietnam (SBV), aggregated by Dữ Liệu Kinh Tế",
        "source_url": source_url,
        "transport": transport,
        "unit": "%/year",
        "series": series,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, OUT)
    print(f"· Ghi {OUT}: {len(series)} phiên {series[0]['d']} → {series[-1]['d']} "
          f"({transport})")
    return out


if __name__ == "__main__":
    build()
