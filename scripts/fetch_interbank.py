#!/usr/bin/env python3
"""Dựng site/data/interbank.json từ lãi suất liên ngân hàng do SBV công bố.

Viet Dataverse chuẩn hoá dữ liệu nguồn SBV thành cùng một schema. Có API key thì
tải trọn lịch sử; không có key thì lấy snapshot công khai một tháng và merge với
file cũ. Cách sau giúp job dự phòng trên GitHub vẫn bồi được dữ liệu mà không lộ
secret ra frontend.
"""

import datetime as dt
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "data", "interbank.json")
API = "https://api.vietdataverse.online/api/v1/sbv-interbank?period=all"
PUBLIC = "https://api.vietdataverse.online/fe/data/sbv_1m.json"

FIELDS = {
    "overnight": "overnight",
    "week_1": "week_1",
    "week_2": "week_2",
    "month_1": "month_1",
    "month_3": "month_3",
    "month_6": "month_6",
    "month_9": "month_9",
}


def fetch_json(url, api_key=None):
    headers = {"User-Agent": "tradingview-data/1.0", "Accept": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode("utf-8"))


def rows_from(payload):
    data = payload.get("data", payload)
    dates = data.get("dates") or []
    rows = []
    for i, day in enumerate(dates):
        row = {"d": day}
        for source, target in FIELDS.items():
            values = data.get(source) or []
            value = values[i] if i < len(values) else None
            if isinstance(value, (int, float)):
                row[target] = round(float(value), 4)
        if len(row) > 1:
            rows.append(row)
    return rows


def old_rows():
    try:
        with open(OUT, encoding="utf-8") as f:
            return json.load(f).get("series") or []
    except (FileNotFoundError, ValueError, OSError):
        return []


def build():
    api_key = os.environ.get("VIETDATAVERSE_API_KEY", "").strip()
    source_url = API if api_key else PUBLIC
    try:
        payload = fetch_json(source_url, api_key or None)
    except Exception as exc:
        if not api_key:
            raise
        # Key hết quota/hết hạn không được làm hỏng toàn bộ lượt cập nhật.
        print(f"· API đầy đủ lỗi ({exc}) — dùng snapshot công khai", file=sys.stderr)
        api_key = ""
        source_url = PUBLIC
        payload = fetch_json(PUBLIC)
    fresh = rows_from(payload)
    if not fresh:
        raise RuntimeError("Nguồn trả về nhưng không có điểm lãi suất hợp lệ")

    # Merge theo ngày và theo trường: snapshot ngắn không được xoá lịch sử, đồng
    # thời một kỳ hạn bị thiếu hôm nay không được xoá giá trị đã tải trước đó.
    merged = {r["d"]: dict(r) for r in old_rows() if r.get("d")}
    for row in fresh:
        merged.setdefault(row["d"], {"d": row["d"]}).update(row)
    series = [merged[d] for d in sorted(merged)]

    out = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source": "State Bank of Vietnam (SBV), normalized by Viet Dataverse",
        "source_url": "https://www.sbv.gov.vn/vi/lai-suat",
        "transport": "full API" if api_key else "public 1-month snapshot (accumulating)",
        "unit": "%/year",
        "series": series,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, OUT)
    print(f"· Ghi {OUT}: {len(series)} phiên {series[0]['d']} → {series[-1]['d']} "
          f"({out['transport']})")
    return out


if __name__ == "__main__":
    build()
