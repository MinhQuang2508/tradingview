/* Từ điển hai ngôn ngữ. Khoá đặt theo ngữ cảnh chứ không theo câu chữ,
   để sửa câu chữ một bên không phải sửa bên kia. */

export const DICT = {
  vi: {
    locale: 'vi-VN',
    ws: { val:'Định giá', fx:'Tỷ giá' },
    wsTip: { val:'VNINDEX cùng P/E và P/B toàn thị trường HOSE',
             fx:'USD/VND đặt cạnh sức mạnh đồng đô la và USD/CNY' },
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
    view:  { dual:'2 trục', stack:'Xếp tầng', index:'Chuẩn hoá 100' },
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
    tab: { data:'Số liệu', stats:'Định giá', about:'Thông tin' },
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
    ws: { val:'Valuation', fx:'FX' },
    wsTip: { val:'VNINDEX with market P/E and P/B',
             fx:'USD/VND against dollar strength and USD/CNY' },
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
    view:  { dual:'Dual axis', stack:'Stacked', index:'Indexed 100' },
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
    tab: { data:'Data', stats:'Valuation', about:'About' },
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
