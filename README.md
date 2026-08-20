# VNINDEX · P/E · P/B · Tỷ giá

Terminal web hai bộ dữ liệu về thị trường Việt Nam.

**→ https://minhquang2508.github.io/tradingview/**

| Tab | Nội dung |
|---|---|
| **Định giá** | VNINDEX từ **2004** cùng **P/E** và **P/B** toàn thị trường HOSE từ **2008** (4.333 phiên), tính từ báo cáo tài chính của từng doanh nghiệp chứ không lấy lại số của bên thứ ba |
| **Tỷ giá** | **USD/VND** từ **2003** (5.222 phiên) đặt cạnh **Dollar Index** và **USD/CNY**, kèm giá mua/bán Vietcombank |

| | |
|---|---|
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

## Tab Tỷ giá

| Chuỗi | Ý nghĩa |
|---|---|
| **USD/VND** | Tỷ giá thị trường (liên ngân hàng), không phải giá niêm yết của một ngân hàng cụ thể |
| **Dollar Index** | Tách phần VND mất giá do đồng đô la mạnh lên toàn cầu khỏi phần do sức ép trong nước |
| **USD/CNY** | Đối chiếu với đồng tiền của bạn hàng thương mại lớn nhất |
| **Vietcombank mua/bán** | Bản tin tỷ giá công khai của ngân hàng — Vietcombank không cho tra lịch sử nên chuỗi này được **bồi dần** mỗi lần chạy |

Chưa có **tỷ giá trung tâm** của Ngân hàng Nhà nước và **tỷ giá thị trường tự do**:
đã dò SBV, Vietstock, VNSignal, WiChart, trolyluat, CafeF — nơi có dữ liệu thì
đều bắt đăng nhập, thu phí hoặc mã hoá payload. Cũng vì lý do đó mà **lãi suất
liên ngân hàng** và **OMO / tín phiếu** chưa lên được biểu đồ.

## Nguồn dữ liệu

Tab Định giá — API công khai, không cần đăng nhập:

| Dữ liệu | Endpoint |
|---|---|
| VNINDEX theo ngày và theo phút | `POST trading.vietcap.com.vn/api/chart/OHLCChart/gap` |
| Giá đóng cửa gốc toàn sàn HOSE | `GET api-finfo.vndirect.com.vn/v4/stock_prices?q=floor:HOSE~date:…` |
| KQKD & CĐKT theo quý, toàn thị trường | `GET api-finfo.vndirect.com.vn/v4/financial_statements?q=itemCode:…` |

Truy vấn VNDirect không cần lọc theo mã: một lời gọi trả về cả sàn cho một ngày
hoặc một kỳ báo cáo.

Tab Tỷ giá:

| Dữ liệu | Nguồn |
|---|---|
| USD/VND, DXY, USD/CNY | Yahoo Finance — `USDVND=X`, `DX-Y.NYB`, `USDCNY=X` |
| Tỷ giá Vietcombank | `portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10` |

## Cập nhật

`scripts/fetch_data.py` dựng lại `site/data/vnindex_pe.json`, `scripts/fetch_fx.py`
dựng `site/data/fx.json`. Máy chủ nội bộ chạy `refresh.sh` sau mỗi phiên rồi đẩy
lên đây; GitHub Actions thấy commit mới sẽ deploy lại Pages. Có thêm một lịch
chạy dự phòng ngay trên Actions.

Bản đặt trên GitHub Pages là **dữ liệu cuối ngày**. Cập nhật trong phiên (mỗi 20
giây) chỉ có ở bản tự host, vì API của Vietcap chặn CORS nên cần một proxy cùng
origin.

## Chạy tại máy

```bash
python3 scripts/fetch_data.py     # VNINDEX + P/E + P/B
python3 scripts/fetch_fx.py       # USD/VND + DXY + USD/CNY
python3 -m http.server -d site 8000
```

## Giới hạn đã biết

* **Ngày công bố báo cáo chỉ chính xác từ 2020.** VNDirect nạp gộp toàn bộ dữ liệu
  cũ vào tháng 12/2019 nên `createdDate` của kỳ trước đó không phải ngày nộp thật.
  Với các kỳ đó, mỗi doanh nghiệp được gán độ trễ nộp điển hình *của chính nó*, học
  từ giai đoạn sau — nên bước chuyển mùa báo cáo trước 2020 là ước lượng.
* **Đoạn 2008–2012 là ước lượng** (xem bảng hai giai đoạn ở trên); rổ giai đoạn đó
  cũng chỉ gồm mã còn niêm yết tới 2013 nên có survivorship bias cục bộ.
* Dữ liệu VNINDEX của Vietcap có đúng một bar hỏng — thứ Bảy 16/08/2008 ghi 900,26
  trong khi phiên trước đó là 488,94. Pipeline lọc bỏ mọi bar rơi vào cuối tuần.
* Vốn hoá chốt mỗi 5 phiên rồi nội suy — sai số nhỏ khi có phát hành thêm giữa hai mốc.
* Có thể lệch vài phần trăm so với số FiinTrade công bố (khác rổ, khác cách xử lý free-float).
