/* Bảng số liệu dùng chung cho mọi workspace: cột do bên gọi khai báo, còn lọc
   theo khoảng ngày và sắp xếp thì giống nhau.

   Danh sách có thể lên tới ~6.000 dòng nên vẽ bằng một lần gán innerHTML thay
   vì tạo từng node — nhanh hơn hẳn và vẫn đủ đơn giản. */

export class DataTable {
  constructor({ head, body, count, onSelect }) {
    this.head = head; this.body = body; this.count = count;
    this.onSelect = onSelect;
    this.cols = [];
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
        : { col, dir: 'desc' };
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

  /** cols: [{ key, label, type:'date'|'num'|'pct', digits }] */
  setColumns(cols) {
    this.cols = cols;
    if (!cols.some(c => c.key === this.sort.col)) this.sort = { col: 'd', dir: 'desc' };
    this.renderHead();
  }

  setRows(rows, t) { this.rows = rows; this.t = t; this.render(); }
  setFilter(patch) { Object.assign(this.filter, patch); this.render(); }
  setLang(t) { this.t = t; this.renderHead(); this.render(); }

  renderHead() {
    this.head.innerHTML = '<tr>' + this.cols.map(c =>
      `<th data-col="${c.key}" aria-sort="none">${c.label}<span class="arrow">▾</span></th>`
    ).join('') + '</tr>';
  }

  computeView() {
    const { quick, from, to } = this.filter;
    let out = this.rows;
    if (quick !== 'all' && quick !== 'custom') {
      out = out.slice(-parseInt(quick, 10));
    } else if (quick === 'custom') {
      if (from) out = out.filter(r => r.d >= from);
      if (to) out = out.filter(r => r.d <= to);
    }
    return out.slice();
  }

  render() {
    const t = this.t;
    if (!t || !this.cols.length) return;
    this.view = this.computeView();

    const { col, dir } = this.sort;
    const sign = dir === 'asc' ? 1 : -1;
    this.view.sort((a, b) => {
      const x = a[col], y = b[col];
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
      this.body.innerHTML =
        `<tr><td colspan="${this.cols.length}" class="empty">${t.noRows}</td></tr>`;
      return;
    }

    const dmy = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
    const fdate = t.locale === 'vi-VN' ? dmy : (iso => iso);
    const num = (v, d) => v == null ? '—'
      : v.toLocaleString(t.locale, { minimumFractionDigits: d, maximumFractionDigits: d });

    const cell = (r, c) => {
      const v = r[c.key];
      if (c.type === 'date') return `<td>${fdate(v)}</td>`;
      if (c.type === 'pct') {
        if (v == null) return '<td class="flat">—</td>';
        const cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
        return `<td class="${cls}">${v > 0 ? '+' : ''}${num(v, 2)}</td>`;
      }
      return `<td>${num(v, c.digits ?? 2)}</td>`;
    };

    this.body.innerHTML = this.view.map(r =>
      `<tr data-d="${r.d}">${this.cols.map(c => cell(r, c)).join('')}</tr>`).join('');
  }

  toCSV() {
    const head = this.cols.map(c => c.key).join(',');
    const body = this.view.map(r => this.cols.map(c => r[c.key] ?? '').join(','));
    return [head, ...body].join('\n');
  }
}
