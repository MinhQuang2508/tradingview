/* Bảng số liệu: lọc theo khoảng ngày + sắp xếp theo bất kỳ cột nào.
   Danh sách có thể lên tới ~1.900 dòng nên vẽ bằng một lần gán innerHTML
   thay vì tạo từng node — nhanh hơn hẳn và vẫn đủ đơn giản. */

export class DataTable {
  constructor({ head, body, count, onSelect }) {
    this.head = head; this.body = body; this.count = count;
    this.onSelect = onSelect;
    this.sort = { col: 'd', dir: 'desc' };
    this.filter = { quick: 'all', from: '', to: '' };
    this.rows = [];
    this.view = [];

    head.addEventListener('click', e => {
      const th = e.target.closest('th[data-col]');
      if (!th) return;
      const col = th.dataset.col;
      this.sort = this.sort.col === col
        ? { col, dir: this.sort.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: col === 'd' ? 'desc' : 'desc' };
      this.render();
    });

    body.addEventListener('click', e => {
      const tr = e.target.closest('tr[data-d]');
      if (!tr) return;
      body.querySelectorAll('tr.is-sel').forEach(x => x.classList.remove('is-sel'));
      tr.classList.add('is-sel');
      this.onSelect?.(tr.dataset.d);
    });
  }

  setRows(rows, t) { this.rows = rows; this.t = t; this.render(); }
  setFilter(patch) { Object.assign(this.filter, patch); this.render(); }
  setLang(t) { this.t = t; this.render(); }

  /** Dòng sau khi lọc, đã tính sẵn % thay đổi so với phiên liền trước. */
  computeView() {
    const { quick, from, to } = this.filter;
    let out = this.rows;

    if (quick !== 'all' && quick !== 'custom') {
      const n = parseInt(quick, 10);
      out = out.slice(-n);
    } else if (quick === 'custom') {
      if (from) out = out.filter(r => r.d >= from);
      if (to)   out = out.filter(r => r.d <= to);
    }

    // % thay đổi luôn tính theo phiên liền trước trong chuỗi gốc, không phải
    // trong tập đã lọc — nếu không thì đổi bộ lọc lại ra con số khác.
    return out.map(r => ({ ...r, dI: r._dI, dPe: r._dPe, dPb: r._dPb }));
  }

  render() {
    const t = this.t;
    this.view = this.computeView();

    const { col, dir } = this.sort;
    const sign = dir === 'asc' ? 1 : -1;
    const key = { d:'d', i:'i', pe:'pe', pb:'pb', dI:'dI' }[col] || 'd';
    this.view.sort((a, b) => {
      const x = a[key], y = b[key];
      if (x == null) return 1;
      if (y == null) return -1;
      return x > y ? sign : x < y ? -sign : 0;
    });

    this.head.querySelectorAll('th[data-col]').forEach(th => {
      const on = th.dataset.col === col;
      th.setAttribute('aria-sort', on ? (dir === 'asc' ? 'ascending' : 'descending') : 'none');
      const arrow = th.querySelector('.arrow');
      if (arrow) arrow.textContent = on ? (dir === 'asc' ? '▲' : '▼') : '▾';
    });

    this.count.textContent = t.rows(this.view.length);

    if (!this.view.length) {
      this.body.innerHTML = `<tr><td colspan="5" class="empty">${t.noRows}</td></tr>`;
      return;
    }

    const nf = (v, d) => v == null ? '—'
      : v.toLocaleString(t.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
    const pct = v => {
      if (v == null) return '<td class="flat">—</td>';
      const cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
      const s = (v > 0 ? '+' : '') + v.toLocaleString(t.locale,
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `<td class="${cls}">${s}</td>`;
    };
    const dmy = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
    const fdate = t.locale === 'vi-VN' ? dmy : (iso => iso);

    this.body.innerHTML = this.view.map(r =>
      `<tr data-d="${r.d}"><td>${fdate(r.d)}</td>` +
      `<td>${nf(r.i, 2)}</td>${pct(r.dI)}` +
      `<td>${nf(r.pe, 2)}</td><td>${nf(r.pb, 2)}</td></tr>`
    ).join('');
  }

  toCSV() {
    const head = 'date,vnindex,change_pct,pe,pb';
    const body = this.view.map(r => [r.d, r.i, r.dI ?? '', r.pe ?? '', r.pb ?? ''].join(','));
    return [head, ...body].join('\n');
  }
}
