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
      p2: u => `Vốn hoá = giá đóng cửa điều chỉnh × số cổ phiếu lưu hành. Lợi nhuận TTM là tổng lãi sau thuế của cổ đông công ty mẹ 4 quý gần nhất <b>đã công bố</b>; vốn chủ sở hữu lấy kỳ gần nhất đã công bố. Cả hai neo theo ngày công bố báo cáo của <b>từng doanh nghiệp</b> — nhờ vậy chỉ số trượt dần suốt mùa báo cáo thay vì nhảy bậc một lần. Rổ tính gồm ${u} cổ phiếu niêm yết HOSE.`,
      p3:'API công khai của Vietcap, không cần đăng nhập:',
      s1:'Giá điều chỉnh theo ngày và theo phút',
      s2:'Báo cáo kết quả kinh doanh và cân đối kế toán theo quý, kèm ngày công bố',
      s3:'Số cổ phiếu đang lưu hành',
      p4:'Dữ liệu cuối ngày chạy lại tự động sau mỗi phiên; trang tự dò file mới mỗi 5 phút. Trong giờ giao dịch, VNINDEX cập nhật mỗi 20 giây và P/E, P/B suy ra theo tỉ lệ — lợi nhuận và vốn chủ sở hữu không đổi trong phiên nên đây là cách tính đúng.',
      l1:'Rổ chỉ gồm mã <b>đang</b> niêm yết, không có mã đã huỷ niêm yết — số liệu càng lùi xa càng lệch.',
      l2:'Vốn hoá dùng giá điều chỉnh cổ tức nên thấp hơn vốn hoá danh nghĩa ở giai đoạn xa.',
      l3:'Báo cáo tài chính của Vietcap bắt đầu từ quý 1/2018 nên chuỗi định giá bắt đầu từ tháng 2/2019.',
      l4:'Có thể lệch vài phần trăm so với số FiinTrade công bố (khác rổ và cách xử lý free-float).'
    },
    noVal: d => `Chỉ có giá trước ${d} — P/E và P/B bắt đầu từ đó (báo cáo tài chính của Vietcap chỉ lùi tới quý 1/2018).`,
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
      p2: u => `Market cap = adjusted close × shares outstanding. TTM earnings sum the last four <b>reported</b> quarters of net profit attributable to parent; book value takes the latest reported quarter. Both anchor to <b>each company's own</b> filing date — so the ratios drift through earnings season instead of stepping once. The basket covers ${u} HOSE-listed stocks.`,
      p3:"Vietcap's public API, no login required:",
      s1:'Adjusted daily and intraday prices',
      s2:'Quarterly income statements and balance sheets, with filing dates',
      s3:'Shares outstanding',
      p4:'End-of-day data rebuilds automatically after each session and the page checks for a newer file every 5 minutes. During trading hours VNINDEX refreshes every 20 seconds and P/E and P/B scale with it — earnings and book value do not change intraday, so this is exact.',
      l1:'The basket holds only <b>currently</b> listed tickers, so delisted names are missing and older figures drift.',
      l2:'Market cap uses dividend-adjusted prices, which understates nominal market cap further back.',
      l3:"Vietcap's statements start at Q1 2018, so the valuation series begins in February 2019.",
      l4:"Expect a few percent difference from FiinTrade's published figures (different basket and free-float treatment)."
    },
    noVal: d => `Price only before ${d} — P/E and P/B start there (Vietcap's statements go back only to Q1 2018).`,
    toastNew:'New data available — reloaded'
  }
};
