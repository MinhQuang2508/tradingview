# Ghi chú vận hành nội bộ (không đưa lên repo công khai)

## Bản tự host — có cập nhật trong phiên

```bash
docker compose up -d          # nginx, 127.0.0.1:8843
```

`nginx.conf` có `location = /live/ohlc` proxy sang
`trading.vietcap.com.vn/api/chart/OHLCChart/gap`. Cần thiết vì Vietcap **chặn
CORS** (từ chối cả preflight OPTIONS khi có header `Origin`), nên trình duyệt
không gọi thẳng được. Nhớ giữ `proxy_buffer_size 32k` — header của Vietcap dài
hơn mặc định 4k của nginx.

Bản GitHub Pages không có proxy này nên tự tắt phần live, hiện "DỮ LIỆU CUỐI NGÀY".

## Cron

```
15 16 * * 1-5  refresh.sh    # sau khi đóng cửa
30 17 * * 1-5  refresh.sh    # bắt BCTC công bố cuối chiều
```

`refresh.sh` tải dữ liệu → commit → push → GitHub Actions deploy lại Pages.

## Tên miền tradingview.koliaphan.net (chưa hoàn tất)

Cần root, chạy `sudo deploy/publish-domain.sh`. Hai việc:

1. Ingress rule trong `/etc/cloudflared/config.yml` (tunnel
   `205d58de-7a7d-46ac-abe3-d29bb5e01995`, systemd `cloudflared.service`)
   → `http://127.0.0.1:8843`. **Đã làm xong ngày 20/08/2026.**
2. Bản ghi DNS riêng: `cloudflared tunnel route dns <tunnel-id> tradingview.koliaphan.net`.
   **Chưa làm.** `koliaphan.net` có wildcard `*.koliaphan.net` nhưng nó trỏ sang
   tunnel khác, nên subdomain chưa khai riêng nhận 503 y hệt subdomain không tồn
   tại — đừng nhầm "dig ra IP Cloudflare" là DNS đã xong.

Cổng đang dùng trên máy: 8840 gold-accuracy-site · 8842 vnindex-site (user `pc`)
· 8843 dự án này.
