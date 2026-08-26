/* Lớp bọc quanh Lightweight Charts.
   Ba kiểu xem dùng chung một instance, đổi kiểu thì dựng lại series —
   rẻ hơn nhiều so với tạo lại cả biểu đồ, và giữ nguyên vùng zoom. */

const LWC = window.LightweightCharts;

/* Mỗi chuỗi khai báo khoá trong dữ liệu, biến màu CSS và số chữ số thập phân.
   Ô màu dùng chung một bảng đã kiểm định độ tách biệt cho người mù màu ở cả
   nền sáng lẫn nền tối, nên hai workspace tái sử dụng cùng bốn ô. */
export const SERIES = {
  // workspace "định giá"
  index:  { key:'i',       cssVar:'--s1', digits:2 },
  pe:     { key:'pe',      cssVar:'--s2', digits:2 },
  pb:     { key:'pb',      cssVar:'--s3', digits:2 },
  // workspace "tỷ giá"
  usdvnd: { key:'usdvnd',  cssVar:'--s3', digits:0 },
  dxy:    { key:'dxy',     cssVar:'--s2', digits:2 },
  usdcny: { key:'usdcny',  cssVar:'--s3', digits:3 },
  vcbsell:{ key:'vcb_sell',cssVar:'--s4', digits:0 },
  // workspace "lãi suất liên ngân hàng" (%/năm)
  overnight:{ key:'overnight',cssVar:'--s4', digits:2 },
  week1:    { key:'week_1',   cssVar:'--s2', digits:2 },
  week2:    { key:'week_2',   cssVar:'--s3', digits:2 },
  month1:   { key:'month_1',  cssVar:'--s4', digits:2 },
  month3:   { key:'month_3',  cssVar:'--s5', digits:2 },
  month6:   { key:'month_6',  cssVar:'--s6', digits:2 },
  month9:   { key:'month_9',  cssVar:'--s7', digits:2 },
  // workspace "nghiệp vụ thị trường mở" (tỷ đồng)
  net:      { key:'net',             cssVar:'--s5', digits:0 },
  repoIn:   { key:'repo_injection',  cssVar:'--s2', digits:0 },
  repoBal:  { key:'repo_outstanding',cssVar:'--s3', digits:0 },
  billBal:  { key:'bill_outstanding',cssVar:'--s4', digits:0 },
  xau:      { key:'xau',      cssVar:'--s1', digits:2 },
  worldVnd: { key:'world_vnd',cssVar:'--s2', digits:2 },
  sjcBuy:   { key:'sjc_buy',  cssVar:'--s3', digits:2 },
  sjcSell:  { key:'sjc_sell', cssVar:'--s4', digits:2 },
  premium:  { key:'premium',  cssVar:'--s5', digits:2 },
  cbNet:    { key:'cb_net',   cssVar:'--s6', digits:1 },
};

const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

export class ValuationChart {
  constructor(el, { onCrosshair }) {
    this.el = el;
    this.onCrosshair = onCrosshair;
    this.series = {};
    this.needLeftScale = true;
    this.locale = 'vi-VN';
    this.mode = 'dual';
    this.base = {};
    this.chart = LWC.createChart(el, this._chartOptions());
    this.chart.subscribeCrosshairMove(p => {
      if (!p.time) { this.onCrosshair(null); return; }
      this.onCrosshair(p.time);
    });
  }

  _chartOptions() {
    const text = cssv('--text-2'), line = cssv('--line'), soft = cssv('--line-soft');
    return {
      // autoSize để chính thư viện theo dõi kích thước hộp chứa. Tự gắn
      // ResizeObserver rồi applyOptions({height}) sẽ tạo vòng lặp: đặt chiều
      // cao làm hộp phình ra, hộp phình lại kích hoạt observer.
      autoSize: true,
      layout: {
        background: { type: 'solid', color: cssv('--bg') },
        textColor: text,
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 11,
        attributionLogo: false,
        panes: { separatorColor: line, separatorHoverColor: cssv('--panel-3') },
      },
      grid: { vertLines: { color: soft }, horzLines: { color: soft } },
      rightPriceScale: { visible: true, borderColor: line,
                         scaleMargins: { top: 0.08, bottom: 0.08 } },
      leftPriceScale:  { visible: this.needLeftScale, borderColor: line,
                         scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: {
        borderColor: line, rightOffset: 3, minBarSpacing: 0.02,
        // Bộ định dạng sẵn có của thư viện cho ra nhãn tháng lẫn lộn ở tiếng
        // Việt ("4" thay vì "Th4"), nên tự viết cho gọn và nhất quán.
        tickMarkFormatter: (time, type) => {
          const d = typeof time === 'string' ? new Date(time + 'T00:00:00Z')
                                             : new Date(time * 1000);
          const vi = this.locale === 'vi-VN';
          const M = d.getUTCMonth() + 1, Y = d.getUTCFullYear();
          if (type === 0) return String(Y);                           // Year
          if (type === 1) return vi ? `Th${M}` : d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
          if (type === 2) return `${d.getUTCDate()}/${M}`;             // DayOfMonth
          return d.toLocaleTimeString(this.locale, { hour: '2-digit', minute: '2-digit' });
        },
      },
      crosshair: {
        mode: LWC.CrosshairMode.Normal,
        vertLine: { color: cssv('--text-3'), width: 1, style: 2, labelBackgroundColor: cssv('--panel-3') },
        horzLine: { color: cssv('--text-3'), width: 1, style: 2, labelBackgroundColor: cssv('--panel-3') },
      },
      localization: { locale: 'vi-VN' },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
    };
  }

  /** Áp lại toàn bộ màu khi đổi giao diện sáng/tối. */
  restyle() {
    this.chart.applyOptions(this._chartOptions());
    for (const [name, s] of Object.entries(this.series)) {
      s.applyOptions({ color: cssv(SERIES[name].cssVar) });
    }
  }

  setLocale(locale) {
    this.locale = locale;
    this.chart.applyOptions({ localization: { locale } });
    this.chart.timeScale().applyOptions({});   // buộc vẽ lại nhãn
  }

  /**
   * @param rows   [{d,i,pe,pb}] đã lọc theo kỳ
   * @param mode   'dual' | 'stack' | 'index'
   * @param active ['index','pe','pb'] — chỉ tiêu đang bật
   */
  render(rows, mode, active, primary = 'index', axisMetric = active[0]) {
    const range = this.chart.timeScale().getVisibleLogicalRange();
    const hadSeries = Object.keys(this.series).length > 0;

    for (const s of Object.values(this.series)) this.chart.removeSeries(s);
    this.series = {};
    // gỡ các pane thừa từ lần vẽ trước
    while (this.chart.panes().length > 1) this.chart.removePane(this.chart.panes().length - 1);

    this.needLeftScale = mode === 'dual' || mode === 'raw';
    this.chart.priceScale('left').applyOptions({ visible: this.needLeftScale });

    const names = [primary, ...active];
    this.mode = mode;
    this.base = {};
    if (mode === 'index')
      for (const n of names) {
        const values = rows.map(r => r[SERIES[n].key]).filter(v => v != null);
        this.base[n] = values.length
          ? { min: Math.min(...values), max: Math.max(...values) }
          : { min: 0, max: 1 };
      }

    names.forEach((name, k) => {
      const spec = SERIES[name];
      const paneIndex = mode === 'stack' ? k : 0;
      let priceScaleId = 'right';
      if (mode === 'dual') priceScaleId = name === primary ? 'right' : 'left';
      if (mode === 'index') priceScaleId = 'right';
      // Mỗi chuỗi một overlay price scale: thư viện tự fit theo đơn vị gốc của
      // từng chuỗi nhưng cả năm đường vẫn nằm trong cùng một pane.
      if (mode === 'raw') priceScaleId = name === primary ? 'right'
        : name === axisMetric ? 'left' : `raw-${name}`;

      const hasVisibleAxis = mode !== 'raw' || name === primary || name === axisMetric;

      const s = this.chart.addSeries(LWC.LineSeries, {
        color: cssv(spec.cssVar),
        lineWidth: mode === 'stack' ? (name === primary ? 3 : 2)
          : name === primary ? 3 : name === axisMetric ? 2 : 1,
        priceScaleId,
        priceLineVisible: hasVisibleAxis,
        priceLineWidth: 1,
        priceLineStyle: 2,
        lastValueVisible: hasVisibleAxis,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: name === primary || name === axisMetric ? 4 : 3,
        priceFormat: { type: 'price', precision: spec.digits,
                       minMove: spec.digits ? 10 ** -spec.digits : 1 },
      }, paneIndex);

      // Điểm thiếu phải đẩy vào dưới dạng "whitespace" (chỉ có time, không có
      // value) chứ không được bỏ qua: bỏ qua thì thư viện nối thẳng hai đầu lỗ
      // hổng, trông y như số liệu thật.
      const data = [];
      for (const r of rows) {
        const v = r[spec.key];
        data.push(v == null ? { time: r.d } : { time: r.d, value: this._project(name, v) });
      }
      s.setData(data);
      if (mode === 'raw') s.priceScale().applyOptions({
        autoScale: true, scaleMargins: { top: 0.08, bottom: 0.08 },
      });
      this.series[name] = s;
    });

    if (mode === 'stack') {
      // khung chỉ số cao gấp đôi mỗi khung định giá
      this.chart.panes().forEach((p, k) => p.setStretchFactor(k === 0 ? 2 : 1));
    }

    if (hadSeries && range) this.chart.timeScale().setVisibleLogicalRange(range);
    else this.chart.timeScale().fitContent();
  }

  fit() {
    this.chart.timeScale().fitContent();
    for (const s of Object.values(this.series))
      s.priceScale().applyOptions({ autoScale: true });
  }

  /** Giá trị thô -> giá trị vẽ, theo kiểu xem hiện tại. */
  _project(name, v) {
    if (this.mode !== 'index') return v;
    const b = this.base[name] || { min: 0, max: 1 };
    return ((v - b.min) / (b.max - b.min || 1)) * 100;
  }

  /** Cập nhật điểm cuối trong phiên mà không dựng lại series. */
  updateLast(name, time, rawValue) {
    const s = this.series[name];
    if (s) s.update({ time, value: this._project(name, rawValue) });
  }
}
