#!/usr/bin/env bash
# Tải lại dữ liệu cuối ngày. Trang tĩnh đọc thẳng site/data/vnindex_pe.json
# nên không cần build lại gì; file được ghi nguyên tử để trang đang mở không
# đọc phải bản dở.
set -euo pipefail
cd "$(dirname "$0")"
exec python3 scripts/fetch_data.py
