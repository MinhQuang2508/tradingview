# VNINDEX · P/E · P/B

Terminal web theo dõi **VNINDEX** cùng **P/E** và **P/B** toàn thị trường HOSE,
tính từ báo cáo tài chính của từng doanh nghiệp chứ không lấy lại số của bên thứ ba.

**→ https://minhquang2508.github.io/tradingview/**

| | |
|---|---|
| Chuỗi giá | VNINDEX từ **2004** (5.632 phiên) |
| Chuỗi định giá | P/E và P/B từ **2019** — báo cáo tài chính của Vietcap chỉ lùi tới quý 1/2018 |
| Biểu đồ | Lightweight Charts — 3 kiểu: 2 trục, xếp tầng, chuẩn hoá 100 |
| Bảng | Lọc nhanh / theo khoảng ngày, sắp xếp mọi cột, tải CSV |
| Ngôn ngữ | Tiếng Việt · English |

## Cách tính

Phương pháp tổng hợp (aggregate), cùng họ FiinTrade / Bloomberg:

```
P/E(t) = Σ VốnHoá_i(t) / Σ LợiNhuậnTTM_i(t)
P/B(t) = Σ VốnHoá_i(t) / Σ VốnChủSởHữu_i(t)
```

* **Vốn hoá** = giá đóng cửa điều chỉnh × số cổ phiếu đang lưu hành.
* **Lợi nhuận TTM** = lãi sau thuế của cổ đông công ty mẹ (`isa22`) 4 quý gần nhất
  **đã công bố**.
* **Vốn chủ sở hữu** = `bsa78 − bsa210` của kỳ gần nhất **đã công bố**.
* Cả hai neo theo ngày công bố của **từng doanh nghiệp**, nên chỉ số trượt dần
  suốt mùa báo cáo thay vì nhảy bậc một lần.
* Một phiên chỉ có P/E hoặc P/B khi nhóm đã công bố chiếm **≥ 85% vốn hoá** của rổ
  (403 cổ phiếu HOSE).

Đối chiếu biểu đồ định giá FiinTrade ngày 13/08/2026: FiinTrade ≈ 12,1 — số ở đây 12,30.

## Nguồn dữ liệu

API công khai của Vietcap, không cần đăng nhập:

| Dữ liệu | Endpoint |
|---|---|
| Giá theo ngày và theo phút | `POST trading.vietcap.com.vn/api/chart/OHLCChart/gap` |
| Danh sách mã niêm yết | `GET trading.vietcap.com.vn/api/price/symbols/getAll` |
| KQKD & CĐKT theo quý (kèm `publicDate`) | `GET iq.vietcap.com.vn/api/iq-insight-service/v1/company/{sym}/financial-statement?section=…` |
| Số cổ phiếu lưu hành | `GET iq.vietcap.com.vn/api/iq-insight-service/v1/company/{sym}/statistics-financial` |

## Cập nhật

`scripts/fetch_data.py` dựng lại `site/data/vnindex_pe.json`. Máy chủ nội bộ chạy
lệnh này sau mỗi phiên rồi đẩy lên đây; GitHub Actions thấy commit mới sẽ deploy
lại Pages. Có thêm một lịch chạy dự phòng ngay trên Actions.

Bản đặt trên GitHub Pages là **dữ liệu cuối ngày**. Cập nhật trong phiên (mỗi 20
giây) chỉ có ở bản tự host, vì API của Vietcap chặn CORS nên cần một proxy cùng
origin.

## Chạy tại máy

```bash
python3 scripts/fetch_data.py     # dựng dữ liệu
python3 -m http.server -d site 8000
```

## Giới hạn đã biết

* **Survivorship bias** — rổ chỉ gồm mã *đang* niêm yết, không có mã đã huỷ niêm yết.
* Vốn hoá dùng giá điều chỉnh cổ tức nên thấp hơn vốn hoá danh nghĩa ở giai đoạn xa.
* Có thể lệch vài phần trăm so với số FiinTrade công bố (khác rổ, khác cách xử lý free-float).
