#!/usr/bin/env bash
# Tải lại dữ liệu cuối ngày rồi đẩy lên GitHub.
#
# Máy này gọi API Vietcap ổn định hơn runner của GitHub (không bị chặn IP), nên
# nó là nguồn cập nhật chính; Actions chỉ chạy dự phòng. Có commit mới thì
# workflow Deploy tự dựng lại GitHub Pages.
set -euo pipefail
cd "$(dirname "$0")"

python3 scripts/fetch_data.py

if ! git diff --quiet -- site/data/vnindex_pe.json; then
  git add site/data/vnindex_pe.json
  git -c user.name='vnindex-bot' -c user.email='koliacodex@gmail.com' \
      commit -q -m "Cập nhật dữ liệu $(date +%d/%m/%Y)"
  git push -q origin main && echo "· Đã đẩy lên GitHub, Pages sẽ tự deploy."
else
  echo "· Dữ liệu không đổi, không đẩy."
fi
