# VNINDEX · Định giá · Thanh khoản · Giá vàng

Terminal web tổng hợp định giá và thanh khoản thị trường Việt Nam trên một biểu đồ.

Tab **Giá vàng** là chart độc lập gồm vàng quốc tế USD/oz, giá thế giới quy đổi
sang triệu đồng/lượng, giá mua/bán vàng miếng SJC TP.HCM và premium SJC so với
thế giới. Panel cuối là lượng mua/bán ròng theo tháng của các ngân hàng trung
ương, liên kết sang bảng 88 thực thể tại `gold.koliaphan.net/cbgold.html`.
Chuỗi quốc tế ghép benchmark London PM của LBMA với COMEX `GC=F`; chuỗi trong
nước lấy trực tiếp API biểu đồ chính thức của SJC; dòng NHTW dùng IMF IRFCL.

**→ https://minhquang2508.github.io/tradingview/**

Biểu đồ duy nhất gồm năm đường: **VNINDEX**, **P/E toàn thị trường**, **USD/VND**,
**lãi suất liên ngân hàng qua đêm** và **bơm/hút ròng OMO–tín phiếu**. Do năm
chuỗi khác đơn vị, mỗi đường được chuẩn hóa 0–100 theo biên độ trong kỳ đang xem;
dải số phía trên và bảng vẫn giữ giá trị gốc.

Có thể chuyển sang **Chồng 2 trục** để mỗi đường dùng một price scale độc lập,
tự auto-fit theo dữ liệu gốc. Nút `⤢` auto-fit lại cả thời gian và price scale.
Ở chế độ này VNINDEX dùng trục phải, còn chỉ báo có dấu `←` dùng trục trái;
bấm P/E, USD/VND, LNH O/N hoặc Hút/Bơm để đổi chỉ báo trên trục trái.

Chế độ mặc định **Xếp dọc** đặt VNINDEX ở panel chính và bốn chỉ báo ở bốn
panel bên dưới. Tất cả dùng chung trục thời gian nhưng giữ price scale riêng.

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

## Chuỗi tỷ giá

| Chuỗi | Ý nghĩa |
|---|---|
| **USD/VND** | Tỷ giá thị trường (liên ngân hàng), không phải giá niêm yết của một ngân hàng cụ thể |
| **Vietcombank mua/bán** | Bản tin tỷ giá công khai của ngân hàng — Vietcombank không cho tra lịch sử nên chuỗi này được **bồi dần** mỗi lần chạy |

Chưa có **tỷ giá trung tâm** của Ngân hàng Nhà nước và **tỷ giá thị trường tự do**:
đã dò SBV, Vietstock, VNSignal, WiChart, trolyluat, CafeF — nơi có dữ liệu thì
đều bắt đăng nhập, thu phí hoặc mã hoá payload.

## Nguồn dữ liệu

Tab Định giá — API công khai, không cần đăng nhập:

| Dữ liệu | Endpoint |
|---|---|
| VNINDEX theo ngày và theo phút | `POST trading.vietcap.com.vn/api/chart/OHLCChart/gap` |
| Giá đóng cửa gốc toàn sàn HOSE | `GET api-finfo.vndirect.com.vn/v4/stock_prices?q=floor:HOSE~date:…` |
| KQKD & CĐKT theo quý, toàn thị trường | `GET api-finfo.vndirect.com.vn/v4/financial_statements?q=itemCode:…` |

Truy vấn VNDirect không cần lọc theo mã: một lời gọi trả về cả sàn cho một ngày
hoặc một kỳ báo cáo.

Nguồn tỷ giá:

| Dữ liệu | Nguồn |
|---|---|
| USD/VND | Yahoo Finance — `USDVND=X` |
| Tỷ giá Vietcombank | `portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10` |

Chuỗi Lãi suất LNH lấy số liệu gốc do **Ngân hàng Nhà nước Việt Nam** công bố,
qua API công khai do Dữ Liệu Kinh Tế tổng hợp. API thực tế có 2.664 quan sát
từ 05/01/2015; snapshot Viet Dataverse một tháng chỉ được dùng làm dự phòng.

Tab Hút/Bơm lấy kết quả nghiệp vụ thị trường mở do **Ngân hàng Nhà nước Việt
Nam** công bố, qua bảng tổng hợp công khai của Dữ Liệu Kinh Tế. Chuỗi ròng đã
tính cả tiền đáo hạn: dương là bơm, âm là hút.

## Cập nhật

`scripts/fetch_data.py` dựng lại `site/data/vnindex_pe.json`, `scripts/fetch_fx.py`
dựng `site/data/fx.json`, `scripts/fetch_interbank.py` dựng
`site/data/interbank.json`, còn `scripts/fetch_omo.py` dựng `site/data/omo.json`.
Máy chủ nội bộ chạy `refresh.sh` sau mỗi phiên rồi đẩy
lên đây; GitHub Actions thấy commit mới sẽ deploy lại Pages. Có thêm một lịch
chạy dự phòng ngay trên Actions.

Bản đặt trên GitHub Pages là **dữ liệu cuối ngày**. Cập nhật trong phiên (mỗi 20
giây) chỉ có ở bản tự host, vì API của Vietcap chặn CORS nên cần một proxy cùng
origin.

## Chạy tại máy

```bash
python3 scripts/fetch_data.py     # VNINDEX + P/E + P/B
python3 scripts/fetch_fx.py       # USD/VND + DXY + USD/CNY
python3 scripts/fetch_interbank.py # lãi suất liên ngân hàng SBV
python3 scripts/fetch_omo.py       # OMO và tín phiếu SBV
python3 scripts/fetch_gold.py      # LBMA/COMEX + vàng miếng SJC
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
