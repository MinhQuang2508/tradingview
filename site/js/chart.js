/* Lớp bọc quanh Lightweight Charts.
   Ba kiểu xem dùng chung một instance, đổi kiểu thì dựng lại series —
   rẻ hơn nhiều so với tạo lại cả biểu đồ, và giữ nguyên vùng zoom. */

const LWC = window.LightweightCharts;

export const SERIES = {
  index: { key:'i',  color:'var(--idx)', cssVar:'--idx', digits:2 },
  pe:    { key:'pe', color:'var(--pe)',  cssVar:'--pe',  digits:2 },
  pb:    { key:'pb', color:'var(--live)',cssVar:'--live',digits:2 },
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
  render(rows, mode, active) {
    const range = this.chart.timeScale().getVisibleLogicalRange();
    const hadSeries = Object.keys(this.series).length > 0;

    for (const s of Object.values(this.series)) this.chart.removeSeries(s);
    this.series = {};
    // gỡ các pane thừa từ lần vẽ trước
    while (this.chart.panes().length > 1) this.chart.removePane(this.chart.panes().length - 1);

    this.needLeftScale = mode === 'dual';
    this.chart.priceScale('left').applyOptions({ visible: this.needLeftScale });

    const names = ['index', ...active];
    this.mode = mode;
    this.base = {};
    if (mode === 'index')
      for (const n of names) this.base[n] = rows[0]?.[SERIES[n].key] || 1;

    names.forEach((name, k) => {
      const spec = SERIES[name];
      const paneIndex = mode === 'stack' ? k : 0;
      let priceScaleId = 'right';
      if (mode === 'dual') priceScaleId = name === 'index' ? 'right' : 'left';
      if (mode === 'index') priceScaleId = 'right';

      const s = this.chart.addSeries(LWC.LineSeries, {
        color: cssv(spec.cssVar),
        lineWidth: 2,
        priceScaleId,
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineStyle: 2,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
        priceFormat: { type: 'price', precision: spec.digits, minMove: 10 ** -spec.digits },
      }, paneIndex);

      const data = [];
      for (const r of rows) {
        const v = r[spec.key];
        if (v == null) continue;
        data.push({ time: r.d, value: this._project(name, v) });
      }
      s.setData(data);
      this.series[name] = s;
    });

    if (mode === 'stack') {
      // khung chỉ số cao gấp đôi mỗi khung định giá
      this.chart.panes().forEach((p, k) => p.setStretchFactor(k === 0 ? 2 : 1));
    }

    if (hadSeries && range) this.chart.timeScale().setVisibleLogicalRange(range);
    else this.chart.timeScale().fitContent();
  }

  fit() { this.chart.timeScale().fitContent(); }

  /** Giá trị thô -> giá trị vẽ, theo kiểu xem hiện tại. */
  _project(name, v) {
    return this.mode === 'index' ? (v / (this.base[name] || 1)) * 100 : v;
  }

  /** Cập nhật điểm cuối trong phiên mà không dựng lại series. */
  updateLast(name, time, rawValue) {
    const s = this.series[name];
    if (s) s.update({ time, value: this._project(name, rawValue) });
  }
}
