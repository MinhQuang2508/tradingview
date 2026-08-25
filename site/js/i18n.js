/* Từ điển hai ngôn ngữ. Khoá đặt theo ngữ cảnh chứ không theo câu chữ,
   để sửa câu chữ một bên không phải sửa bên kia. */

export const DICT = {
  vi: {
    locale: 'vi-VN',
    ws: { market:'Tổng hợp' },
    wsTip: { market:'So sánh VNINDEX với định giá, tỷ giá và thanh khoản', val:'VNINDEX cùng P/E và P/B toàn thị trường HOSE',
             fx:'USD/VND đặt cạnh sức mạnh đồng đô la và USD/CNY',
             ib:'Lãi suất giao dịch VND bình quân trên thị trường liên ngân hàng',
             omo:'Tín phiếu và nghiệp vụ thị trường mở của Ngân hàng Nhà nước' },
    market: {
      m: { pe:'P/E', usdvnd:'USD/VND', overnight:'LNH O/N', net:'Hút/Bơm' },
      metricTip:'Bật hoặc tắt chuỗi so sánh',
      axisLeft:'Đang hiển thị trên trục trái', axisPick:'Chọn làm trục trái',
      left:'Trục trái', right:'Trục phải',
      key: { index:'VNINDEX', pe:'P/E', usdvnd:'USD/VND', overnight:'Lãi suất LNH qua đêm', net:'Tín phiếu/OMO hút bơm ròng' },
      col: { date:'Ngày', index:'VNINDEX', pe:'P/E', usd:'USD/VND', ib:'LNH O/N', net:'Hút/Bơm' },
      note: {
        index:'Mỗi chuỗi được chuẩn hóa 0–100 theo mức thấp/cao trong kỳ để năm đường cùng đọc được trên một trục; dải số phía trên vẫn là giá trị gốc.',
        raw:'VNINDEX dùng trục phải; chỉ báo có dấu ← dùng trục trái. Bấm một chỉ báo để đổi trục trái; ba đường còn lại vẫn tự auto-fit theo scale ẩn.'
      },
      about: {
        h1:'Biểu đồ tổng hợp', h2:'Nguồn dữ liệu', h3:'Lưu ý',
        p1:'Một biểu đồ duy nhất so sánh VNINDEX, P/E toàn thị trường, USD/VND, lãi suất liên ngân hàng qua đêm và lượng bơm/hút ròng qua OMO, tín phiếu.',
        p2:'VNINDEX và định giá lấy từ Vietcap/VNDirect; USD/VND từ Yahoo Finance; lãi suất liên ngân hàng từ số liệu NHNN qua Viet Dataverse; OMO và tín phiếu từ số liệu NHNN do Dữ Liệu Kinh Tế tổng hợp.',
        l1:'Các chuỗi khác đơn vị nên đường biểu đồ biểu diễn vị trí 0–100 trong biên độ của chính chuỗi đó, không phải giá trị tuyệt đối.',
        l2:'Bơm/hút ròng là dòng tiền từng ngày và có thể đổi dấu; cần đọc cùng giá trị gốc trên dải số liệu.'
      }
    },
    omo: {
      m: { repoIn:'Bơm OMO', repoBal:'OMO lưu hành', billBal:'Tín phiếu' },
      metricTip:'Chọn dòng tiền hoặc số dư muốn hiển thị',
      key: { net:'Bơm/hút ròng', repoIn:'Trúng thầu OMO', repoBal:'OMO lưu hành', billBal:'Tín phiếu lưu hành' },
      col: { date:'Ngày', net:'Ròng', repoBal:'OMO', billBal:'Tín phiếu' },
      note: {
        dual:'Hai chuỗi dùng trục độc lập. Đơn vị là tỷ đồng; số dương ở chuỗi ròng là bơm, số âm là hút.',
        stack:'Mỗi chuỗi một khung riêng, chung trục thời gian. Đơn vị là tỷ đồng; dương là bơm, âm là hút.',
        index:'Các chuỗi quy về 100 tại đầu kỳ để so biến động; không thể hiện quy mô tiền tuyệt đối.'
      },
      about: {
        h1:'Cách đọc', h2:'Nguồn dữ liệu', h3:'Lưu ý',
        p1:'<b>Bơm/hút ròng</b> đã tính cả tiền đáo hạn: số dương là NHNN bơm thanh khoản, số âm là hút. Mua giấy tờ có giá qua OMO bơm tiền; OMO đáo hạn hút tiền. Phát hành tín phiếu hút tiền, còn tín phiếu đáo hạn trả tiền về hệ thống.',
        p2:'Dữ liệu gốc do Ngân hàng Nhà nước công bố sau phiên đấu thầu, được Dữ Liệu Kinh Tế tổng hợp thành chuỗi ngày. Trang lưu một bản JSON tĩnh để lịch sử vẫn hoạt động khi nguồn tạm gián đoạn.',
        l1:'Dòng ròng là luồng tiền trong ngày, còn OMO và tín phiếu lưu hành là số dư cuối ngày; không cộng trực tiếp các đường với nhau.',
        l2:'Ngày không có quan sát được giữ trống, không tự gán bằng 0 và không nội suy.',
        l3:'Số liệu công khai có thể được nguồn điều chỉnh hồi tố khi lịch đáo hạn hoặc kết quả đấu thầu được cập nhật.'
      }
    },
    ib: {
      m: { week1:'1T', week2:'2T', month1:'1TH', month3:'3TH', month6:'6TH', month9:'9TH' },
      metricTip:'Chọn kỳ hạn lãi suất muốn hiển thị',
      key: { overnight:'Qua đêm', week1:'1 tuần', week2:'2 tuần', month1:'1 tháng',
             month3:'3 tháng', month6:'6 tháng', month9:'9 tháng' },
      col: { date:'Ngày', overnight:'Qua đêm', change:'Δ đpt', month1:'1 tháng', month3:'3 tháng' },
      note: {
        dual:'Qua đêm và một kỳ hạn dùng hai trục độc lập. Mọi số liệu là %/năm; Δ được tính bằng điểm phần trăm.',
        stack:'Mỗi kỳ hạn một khung riêng, chung trục thời gian — phù hợp khi đường cong lãi suất cách xa nhau.',
        index:'Các kỳ hạn quy về 100 tại đầu kỳ để so tốc độ thay đổi, không phải mức lãi suất tuyệt đối.'
      },
      about: {
        h1:'Cách đọc', h2:'Nguồn dữ liệu', h3:'Giới hạn',
        p1:'Lãi suất liên ngân hàng là lãi suất giao dịch VND bình quân giữa các tổ chức tín dụng. Kỳ hạn qua đêm nhạy nhất với thanh khoản tức thời: tăng đột biến thường phản ánh nhu cầu vốn ngắn hạn trong hệ thống đang căng.',
        p2:'Nguồn gốc là số liệu do Ngân hàng Nhà nước Việt Nam công bố. Pipeline lấy bản chuẩn hoá từ Viet Dataverse, lưu thành JSON tĩnh rồi mới đưa lên GitHub Pages; khoá API không bao giờ xuất hiện trong trình duyệt.',
        l1:'Đây là lãi suất bình quân của giao dịch đã phát sinh, không phải lãi suất điều hành và không phải lãi suất cho vay khách hàng.',
        l2:'Không phải ngày làm việc nào cũng có đủ giao dịch ở mọi kỳ hạn; ô trống được giữ nguyên, không nội suy.',
        l3:'Khi chưa cấu hình API key, pipeline chỉ bồi dần từ snapshot công khai một tháng; lịch sử sẽ dài lên qua mỗi lần cập nhật.'
      }
    },
    fx: {
      keyUsd:'USD/VND (đồng)', keyDxy:'Dollar Index (điểm)',
      keyCny:'USD/CNY', keyVcb:'Vietcombank bán (đồng)',
      roUsd:'USD/VND', roDxy:'DXY', roCny:'USD/CNY', roYtd:'Từ đầu năm',
      metricTip:'Chọn chỉ tiêu đối chiếu',
      m: { dxy:'DXY', usdcny:'CNY', vcbsell:'VCB' },
      col: { date:'Ngày', usd:'USD/VND', chg:'±%', dxy:'DXY', cny:'USD/CNY' },
      statUsd:'USD/VND trong kỳ', statDxy:'Dollar Index trong kỳ',
      note: {
        dual:'Hai trục có thang đo độc lập — khoảng cách giữa các đường không mang ý nghĩa. Dùng "Chuẩn hoá 100" để so mức biến động thực.',
        stack:'Mỗi chỉ tiêu một khung riêng, chung trục thời gian — đọc mức tuyệt đối chính xác.',
        index:'Tất cả quy về 100 tại đầu kỳ, chung một trục — thấy ngay VND mất giá nhanh hay chậm hơn sức mạnh chung của USD.'
      },
      about: {
        h1:'Các chuỗi', h2:'Nguồn dữ liệu', h3:'Giới hạn',
        p1:'<b>USD/VND</b> là tỷ giá thị trường (liên ngân hàng), không phải tỷ giá niêm yết của một ngân hàng cụ thể. Đặt cạnh <b>Dollar Index</b> để tách phần VND mất giá do đồng đô la mạnh lên trên toàn cầu khỏi phần do sức ép trong nước; <b>USD/CNY</b> để đối chiếu với đồng tiền của bạn hàng thương mại lớn nhất.',
        p2:'Chuỗi ngày lấy từ Yahoo Finance: <code>USDVND=X</code>, <code>DX-Y.NYB</code>, <code>USDCNY=X</code>. Giá mua/bán của Vietcombank lấy từ bản tin tỷ giá công khai của ngân hàng.',
        l1: d => `Vietcombank không cho tra lịch sử — chuỗi mua/bán được bồi dần mỗi lần chạy, hiện có từ ${d}.`,
        l2:'Tỷ giá trung tâm của Ngân hàng Nhà nước và tỷ giá thị trường tự do chưa có trong biểu đồ: chưa tìm được nguồn miễn phí mở cho hai chuỗi này.',
        l3:'Yahoo lấy tỷ giá theo múi giờ giao dịch quốc tế nên ngày cuối chuỗi có thể lệch một phiên so với bảng trong nước.'
      }
    },
    docTitle: 'VNINDEX · P/E · P/B — định giá thị trường HOSE',
    brandSub: 'định giá thị trường HOSE',
    range: { '1m':'1 tháng', '6m':'6 tháng', '1y':'1 năm', '3y':'3 năm', '5y':'5 năm', '10y':'10 năm', all:'Tất cả' },
    rangeShort: { '1m':'1TH', '6m':'6TH', '1y':'1N', '3y':'3N', '5y':'5N', '10y':'10N', all:'TC' },
    view:  { index:'Chuẩn hoá 0–100', raw:'Đơn vị riêng' },
    viewTip: {
      dual:'Chỉ số và định giá chung một khung, hai thang đo riêng',
      stack:'Mỗi chỉ tiêu một khung, chung trục thời gian',
      index:'Quy tất cả về 100 tại đầu kỳ, chung một trục'
    },
    metricTip: 'Chọn chỉ tiêu định giá muốn hiển thị',
    liveOn:'ĐANG MỞ PHIÊN', liveOff:'ĐÃ ĐÓNG PHIÊN', liveLunch:'NGHỈ TRƯA', liveEod:'DỮ LIỆU CUỐI NGÀY', liveWait:'ĐANG KẾT NỐI', liveErr:'MẤT KẾT NỐI',
    updated:'Cập nhật', themeTip:'Đổi nền sáng / tối', langTip:'Switch to English',
    roDate:'Phiên', roIndex:'VNINDEX', roPe:'P/E', roPb:'P/B', roBand:'Định giá',
    band: { cheap:'RẺ', fair:'HỢP LÝ', rich:'ĐẮT' },
    bandTip: 'So P/E hiện tại với chính nó trong kỳ đang xem: dưới −1σ là rẻ, trên +1σ là đắt',
    keyIndex:'VNINDEX (điểm)', keyPe:'P/E toàn thị trường (lần)', keyPb:'P/B toàn thị trường (lần)',
    note: {
      dual:'Hai trục có thang đo độc lập — khoảng cách giữa các đường không mang ý nghĩa. Dùng "Chuẩn hoá 100" để so mức biến động thực.',
      stack:'Mỗi chỉ tiêu một khung riêng, chung trục thời gian — đọc mức tuyệt đối chính xác.',
      index:'Tất cả quy về 100 tại đầu kỳ, chung một trục — chênh lệch giữa các đường là chênh lệch % biến động.'
    },
    tab: { data:'Số liệu', stats:'Thống kê', about:'Thông tin' },
    filter: { last:'Gần nhất', from:'Từ', to:'Đến', reset:'Xoá lọc', custom:'Tuỳ chọn' },
    quick: { d30:'30N', d90:'90N', d180:'180N', d365:'1 năm', all:'Tất cả' },
    col: { date:'Ngày', index:'VNINDEX', chg:'±%', pe:'P/E', pb:'P/B' },
    rows: n => `${n.toLocaleString('vi-VN')} phiên`,
    noRows:'Không có phiên nào khớp bộ lọc.',
    csv:'Tải CSV',
    stats: {
      peTitle:'P/E trong kỳ đang xem', pbTitle:'P/B trong kỳ đang xem', idxTitle:'VNINDEX trong kỳ đang xem',
      cur:'Hiện tại', mean:'Trung bình', sd:'Độ lệch chuẩn', z:'Lệch chuẩn (z)',
      min:'Thấp nhất', max:'Cao nhất', pct:'Phân vị hiện tại',
      idxChg:'Biến động kỳ', cheap:'rẻ', rich:'đắt', gauge:'Vị thế trong kỳ'
    },
    about: {
      h1:'Cách tính', h2:'Nguồn dữ liệu', h3:'Cập nhật', h4:'Giới hạn',
      p1:'P/E và P/B toàn thị trường tính theo phương pháp tổng hợp, cùng họ với FiinTrade và Bloomberg:',
      p2: u => `Vốn hoá dùng <b>giá đóng cửa gốc</b> nhân số cổ phiếu <b>tại chính thời điểm đó</b> (vốn góp chia mệnh giá, trừ cổ phiếu quỹ) — không dùng giá điều chỉnh, vì phép điều chỉnh trừ cả cổ tức tiền mặt nên sẽ làm vốn hoá quá khứ thấp đi. Lợi nhuận TTM là tổng lãi sau thuế của cổ đông công ty mẹ 4 quý gần nhất đã công bố; vốn chủ sở hữu lấy kỳ gần nhất đã công bố. Rổ gồm <b>mọi mã đang niêm yết HOSE tại từng thời điểm</b>, kể cả mã về sau huỷ niêm yết, nên không có survivorship bias; cơ sở dữ liệu có ${u} mã.`,
      p3:'API công khai, không cần đăng nhập:',
      s1:'VNINDEX theo ngày và theo phút — Vietcap',
      s2:'Giá đóng cửa gốc toàn sàn HOSE — VNDirect finfo',
      s3:'Báo cáo kết quả kinh doanh và cân đối kế toán theo quý — VNDirect finfo',
      p4:'Dữ liệu cuối ngày chạy lại tự động sau mỗi phiên; trang tự dò file mới mỗi 5 phút. Trong giờ giao dịch, VNINDEX cập nhật mỗi 20 giây và P/E, P/B suy ra theo tỉ lệ — lợi nhuận và vốn chủ sở hữu không đổi trong phiên nên đây là cách tính đúng.',
      l1:'Vốn hoá chốt lại mỗi năm phiên rồi nội suy theo VNINDEX. Hợp lệ vì VNINDEX chính là tổng vốn hoá chia cho một số chia chỉ đổi khi có niêm yết mới hoặc phát hành thêm.',
      l2:'Ngày công bố báo cáo chỉ ghi nhận chính xác từ 2020. Với kỳ cũ hơn, mỗi doanh nghiệp được gán độ trễ nộp điển hình của chính nó học từ giai đoạn sau — nên các bước chuyển mùa báo cáo là ước lượng.',
      l3:'Từ 2013 trở đi vốn hoá dùng giá gốc. Trước đó không có nguồn giá gốc miễn phí, nên vốn hoá được suy từ giá điều chỉnh với hệ số quy đổi chốt tại đầu 2013 — đo trên đoạn 2013–2026 thì cách này lệch khoảng 0,45%/năm, tức phần 2008–2012 sai số vài phần trăm. Rổ giai đoạn đó cũng chỉ gồm mã còn niêm yết tới 2013.',
      l4:'Có thể lệch vài phần trăm so với số FiinTrade công bố (khác rổ và cách xử lý free-float).'
    },
    estNote: d => `Phần trước ${d} là ƯỚC LƯỢNG: vốn hoá suy từ giá điều chỉnh vì chưa có nguồn giá gốc miễn phí cho giai đoạn đó (sai số đo được khoảng 2%).`,
    noVal: d => `Chỉ có giá trước ${d} — P/E và P/B bắt đầu từ đó, do chuỗi giá gốc dùng để tính vốn hoá chỉ lùi tới đầu 2013.`,
    toastNew:'Có dữ liệu mới — đã tải lại'
  },

  en: {
    locale: 'en-US',
    ws: { market:'Overview' },
    wsTip: { market:'Compare VNINDEX with valuation, FX and liquidity', val:'VNINDEX with market P/E and P/B',
             fx:'USD/VND against dollar strength and USD/CNY',
             ib:'Average VND interbank transaction rates by tenor',
             omo:'State Bank open-market operations and bill liquidity absorption' },
    market: {
      m: { pe:'P/E', usdvnd:'USD/VND', overnight:'O/N rate', net:'Injection' },
      metricTip:'Toggle comparison series',
      axisLeft:'Shown on the left axis', axisPick:'Use as left axis',
      left:'Left axis', right:'Right axis',
      key: { index:'VNINDEX', pe:'P/E', usdvnd:'USD/VND', overnight:'Overnight interbank rate', net:'Net OMO/bill injection' },
      col: { date:'Date', index:'VNINDEX', pe:'P/E', usd:'USD/VND', ib:'O/N rate', net:'Net injection' },
      note: {
        index:'Each series is scaled from 0–100 over its own selected-period range so all five remain readable on one axis; the strip above retains raw values.',
        raw:'VNINDEX uses the right axis; the ← indicator uses the left. Click an indicator to change the left axis; the other three retain hidden auto-fit scales.'
      },
      about: {
        h1:'Market overview', h2:'Data sources', h3:'Notes',
        p1:'One chart compares VNINDEX, market P/E, USD/VND, the overnight interbank rate, and net liquidity injection or withdrawal through OMO and bills.',
        p2:'VNINDEX and valuation use Vietcap/VNDirect; USD/VND uses Yahoo Finance; interbank rates use SBV figures via Viet Dataverse; OMO and bills use SBV figures aggregated by Dữ Liệu Kinh Tế.',
        l1:'Because units differ, each line shows its 0–100 position within its own range rather than an absolute level.',
        l2:'Net injection is a daily flow that can change sign; use the raw-value strip for interpretation.'
      }
    },
    omo: {
      m: { repoIn:'OMO injection', repoBal:'OMO outstanding', billBal:'Bills' },
      metricTip:'Choose the flow or outstanding balance to display',
      key: { net:'Net injection/withdrawal', repoIn:'OMO awarded', repoBal:'OMO outstanding', billBal:'Bills outstanding' },
      col: { date:'Date', net:'Net', repoBal:'OMO', billBal:'Bills' },
      note: {
        dual:'Two series use independent axes. Unit: VND bn; positive net means injection and negative means withdrawal.',
        stack:'Each series has its own pane on a shared time axis. Unit: VND bn; positive means injection and negative withdrawal.',
        index:'Series are rebased to 100 at period start for movement comparison, not absolute liquidity size.'
      },
      about: {
        h1:'How to read', h2:'Data source', h3:'Notes',
        p1:'<b>Net injection/withdrawal</b> includes maturities: positive values mean the SBV injected liquidity; negative values mean it withdrew liquidity. OMO purchases inject cash and their maturity withdraws it. Bill issuance absorbs cash while bill maturity returns it.',
        p2:'The underlying figures are published by the State Bank of Vietnam after auctions and aggregated into daily series by Dữ Liệu Kinh Tế. The site stores a static JSON copy so history remains available during source outages.',
        l1:'Net is a daily flow, whereas OMO and bill outstanding are end-of-day stocks; the lines must not be added directly.',
        l2:'Dates without observations stay blank; the app never substitutes zero or interpolates.',
        l3:'Public figures may be revised retrospectively as maturity schedules or auction results are updated.'
      }
    },
    ib: {
      m: { week1:'1W', week2:'2W', month1:'1M', month3:'3M', month6:'6M', month9:'9M' },
      metricTip:'Choose interbank tenors to display',
      key: { overnight:'Overnight', week1:'1 week', week2:'2 weeks', month1:'1 month',
             month3:'3 months', month6:'6 months', month9:'9 months' },
      col: { date:'Date', overnight:'Overnight', change:'Δ pp', month1:'1 month', month3:'3 months' },
      note: {
        dual:'Overnight and one tenor use independent axes. All values are % p.a.; Δ is measured in percentage points.',
        stack:'Each tenor has its own pane on a shared time axis — useful when the curve is widely dispersed.',
        index:'Tenors are rebased to 100 at period start to compare movement, not absolute rate levels.'
      },
      about: {
        h1:'How to read', h2:'Data source', h3:'Limitations',
        p1:'Interbank rates are average VND transaction rates between credit institutions. Overnight is the most sensitive gauge of immediate liquidity; sharp spikes commonly signal short-term funding pressure.',
        p2:'The underlying figures are published by the State Bank of Vietnam. The pipeline retrieves a normalized copy from Viet Dataverse and writes static JSON for GitHub Pages; an API key is never exposed to browsers.',
        l1:'These are averages of completed transactions, not policy rates or customer lending rates.',
        l2:'Not every business day has transactions at every tenor; missing observations remain blank and are never interpolated.',
        l3:'Without an API key the pipeline accumulates the public one-month snapshot, so history grows with each update.'
      }
    },
    fx: {
      keyUsd:'USD/VND', keyDxy:'Dollar Index', keyCny:'USD/CNY',
      keyVcb:'Vietcombank sell', 
      roUsd:'USD/VND', roDxy:'DXY', roCny:'USD/CNY', roYtd:'YTD',
      metricTip:'Choose comparison series',
      m: { dxy:'DXY', usdcny:'CNY', vcbsell:'VCB' },
      col: { date:'Date', usd:'USD/VND', chg:'±%', dxy:'DXY', cny:'USD/CNY' },
      statUsd:'USD/VND over period', statDxy:'Dollar Index over period',
      note: {
        dual:'The axes are scaled independently — the gap between lines carries no meaning. Use "Indexed 100" to compare real movement.',
        stack:'Each measure keeps its own pane and scale while sharing the time axis — absolute levels read correctly.',
        index:'Everything rebased to 100 at period start on one axis — shows at a glance whether the dong slid faster or slower than the dollar rose everywhere else.'
      },
      about: {
        h1:'The series', h2:'Data sources', h3:'Limitations',
        p1:'<b>USD/VND</b> is the market (interbank) rate, not any single bank\'s board rate. <b>Dollar Index</b> sits beside it to separate dong weakness caused by a globally stronger dollar from domestic pressure; <b>USD/CNY</b> tracks the currency of Vietnam\'s largest trading partner.',
        p2:'Daily series from Yahoo Finance: <code>USDVND=X</code>, <code>DX-Y.NYB</code>, <code>USDCNY=X</code>. Vietcombank buy/sell comes from the bank\'s public rate feed.',
        l1: d => `Vietcombank publishes no history — the buy/sell series accumulates on each run and currently starts ${d}.`,
        l2:'The State Bank central rate and the parallel-market rate are not plotted: no open free source found for either.',
        l3:'Yahoo timestamps FX in international trading hours, so the final point can sit one session away from domestic boards.'
      }
    },
    docTitle: 'VNINDEX · P/E · P/B — HOSE market valuation',
    brandSub: 'HOSE market valuation',
    range: { '1m':'1M', '6m':'6M', '1y':'1Y', '3y':'3Y', '5y':'5Y', '10y':'10Y', all:'All' },
    rangeShort: { '1m':'1M', '6m':'6M', '1y':'1Y', '3y':'3Y', '5y':'5Y', '10y':'10Y', all:'All' },
    view:  { index:'Scaled 0–100', raw:'Own units' },
    viewTip: {
      dual:'Index and valuation in one pane, separate scales',
      stack:'One pane per measure, shared time axis',
      index:'Everything rebased to 100 at period start'
    },
    metricTip: 'Choose which valuation measures to plot',
    liveOn:'MARKET OPEN', liveOff:'MARKET CLOSED', liveLunch:'LUNCH BREAK', liveEod:'END OF DAY', liveWait:'CONNECTING', liveErr:'DISCONNECTED',
    updated:'Updated', themeTip:'Switch light / dark', langTip:'Chuyển sang tiếng Việt',
    roDate:'Session', roIndex:'VNINDEX', roPe:'P/E', roPb:'P/B', roBand:'Valuation',
    band: { cheap:'CHEAP', fair:'FAIR', rich:'RICH' },
    bandTip: 'Current P/E against its own range this period: below −1σ is cheap, above +1σ is rich',
    keyIndex:'VNINDEX (points)', keyPe:'Market P/E (×)', keyPb:'Market P/B (×)',
    note: {
      dual:'The axes are scaled independently — the gap between lines carries no meaning. Use "Indexed 100" to compare real movement.',
      stack:'Each measure keeps its own pane and scale while sharing the time axis — absolute levels read correctly.',
      index:'Everything rebased to 100 at period start on one axis — the gap is the difference in percent change.'
    },
    tab: { data:'Data', stats:'Statistics', about:'About' },
    filter: { last:'Last', from:'From', to:'To', reset:'Clear', custom:'Custom' },
    quick: { d30:'30D', d90:'90D', d180:'180D', d365:'1Y', all:'All' },
    col: { date:'Date', index:'VNINDEX', chg:'±%', pe:'P/E', pb:'P/B' },
    rows: n => `${n.toLocaleString('en-US')} sessions`,
    noRows:'No sessions match the filter.',
    csv:'Download CSV',
    stats: {
      peTitle:'P/E over selected period', pbTitle:'P/B over selected period', idxTitle:'VNINDEX over selected period',
      cur:'Current', mean:'Mean', sd:'Std deviation', z:'Z-score',
      min:'Low', max:'High', pct:'Current percentile',
      idxChg:'Period change', cheap:'cheap', rich:'rich', gauge:'Position in period'
    },
    about: {
      h1:'Method', h2:'Data sources', h3:'Updates', h4:'Limitations',
      p1:'Market P/E and P/B use the aggregate method, the same family Bloomberg and FiinTrade use:',
      p2: u => `Market cap uses the <b>raw closing price</b> times the share count <b>as it stood at the time</b> (paid-in capital over par, less treasury shares) — not adjusted prices, whose dividend adjustment would understate historical market cap. TTM earnings sum the last four reported quarters of net profit attributable to parent; book value takes the latest reported quarter. The basket holds <b>every stock listed on HOSE at each point in time</b>, including names later delisted, so there is no survivorship bias; the database covers ${u} tickers.`,
      p3:'Public APIs, no login required:',
      s1:'Daily and intraday VNINDEX — Vietcap',
      s2:'Raw closing prices for the whole HOSE board — VNDirect finfo',
      s3:'Quarterly income statements and balance sheets — VNDirect finfo',
      p4:'End-of-day data rebuilds automatically after each session and the page checks for a newer file every 5 minutes. During trading hours VNINDEX refreshes every 20 seconds and P/E and P/B scale with it — earnings and book value do not change intraday, so this is exact.',
      l1:'Market cap is fixed every fifth session and interpolated by VNINDEX in between — valid because VNINDEX is itself total market cap over a divisor that only moves on new listings and share issues.',
      l2:'Filing dates are only recorded accurately from 2020. For older quarters each company is assigned its own typical filing lag learned from the later period, so earnings-season transitions there are estimates.',
      l3:'From 2013 onward market cap uses raw prices. Before that no free raw-price source exists, so market cap is derived from adjusted prices with a conversion factor fixed at the start of 2013 — measured over 2013–2026 that approach drifts about 0.45%/year, so the 2008–2012 stretch carries a few percent of error. Its basket also only holds names that survived to 2013.',
      l4:"Expect a few percent difference from FiinTrade's published figures (different basket and free-float treatment)."
    },
    estNote: d => `Everything before ${d} is ESTIMATED: market cap is derived from adjusted prices because no free raw-price source reaches that far back (measured error about 2%).`,
    noVal: d => `Price only before ${d} — P/E and P/B start there, because the raw price series behind market cap only reaches back to early 2013.`,
    toastNew:'New data available — reloaded'
  }
};
