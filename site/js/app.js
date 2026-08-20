import { DICT } from './i18n.js';
import { ValuationChart, SERIES } from './chart.js';
import { DataTable } from './table.js';

/* ------------------------------------------------------------ trạng thái --- */

const LS = 'vnindex-pe:v1';
const state = Object.assign({
  lang: 'vi',
  theme: 'dark',
  range: '1y',
  view: 'dual',
  metrics: ['pe'],
  tab: 'data',
}, JSON.parse(localStorage.getItem(LS) || '{}'));

const save = () => localStorage.setItem(LS, JSON.stringify(state));
let t = DICT[state.lang];

let DATA = null;          // toàn bộ file JSON
let ROWS = [];            // series đã tính sẵn % thay đổi
let live = { on: false, index: null, at: null, fail: 0, disabled: false };

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ------------------------------------------------------------ tiện ích --- */

const RANGE_DAYS = { '1m':30, '6m':182, '1y':365, '3y':1095, '5y':1826, '10y':3652, all:null };
const fmt = (v, d = 2) => v == null ? '—'
  : v.toLocaleString(t.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
const dmy = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fdate = iso => state.lang === 'vi' ? dmy(iso) : iso;

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => el.classList.add('hidden'), 3200);
}

/** Trạng thái phiên HOSE theo giờ Việt Nam:
 *  T2–T6 09:00–11:30 và 13:00–15:00, giữa là nghỉ trưa (không có khớp lệnh). */
function sessionState(now = new Date()) {
  const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const day = vn.getDay();
  if (day === 0 || day === 6) return 'closed';
  const m = vn.getHours() * 60 + vn.getMinutes();
  if (m >= 9 * 60 && m < 11 * 60 + 30) return 'open';
  if (m >= 11 * 60 + 30 && m < 13 * 60) return 'lunch';
  if (m >= 13 * 60 && m <= 15 * 60) return 'open';
  return 'closed';
}
const marketOpen = () => sessionState() === 'open';

function sliceRange() {
  const days = RANGE_DAYS[state.range];
  if (!days || !ROWS.length) return ROWS;
  const last = new Date(ROWS[ROWS.length - 1].d + 'T00:00:00Z');
  const from = new Date(last.getTime() - days * 864e5).toISOString().slice(0, 10);
  const i = ROWS.findIndex(r => r.d >= from);
  return i < 0 ? ROWS : ROWS.slice(i);
}

function stats(values) {
  const v = values.filter(x => x != null).slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
  return { mean, sd, min: v[0], max: v[v.length - 1], sorted: v };
}
const percentile = (sorted, x) => {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const m = (lo + hi) >> 1; sorted[m] < x ? lo = m + 1 : hi = m; }
  return (lo / sorted.length) * 100;
};

/* ------------------------------------------------------------- dữ liệu --- */

async function loadData(quiet = false) {
  const res = await fetch(`data/vnindex_pe.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(res.status);
  const json = await res.json();
  const isNew = DATA && json.generated_at !== DATA.generated_at;
  DATA = json;

  ROWS = json.series.map((r, k, arr) => {
    const p = arr[k - 1];
    const d = (cur, prev) => (cur == null || prev == null) ? null : (cur / prev - 1) * 100;
    return { ...r, _dI: d(r.i, p?.i), _dPe: d(r.pe, p?.pe), _dPb: d(r.pb, p?.pb) };
  });

  if (isNew && !quiet) toast(t.toastNew);
  return isNew;
}

/** VNINDEX trong phiên. P/E, P/B suy ra theo tỉ lệ vì lợi nhuận và vốn chủ
 *  sở hữu không đổi trong ngày — nhân đúng tỉ lệ giá là ra số chính xác. */
async function pollLive() {
  // Bản đặt trên host tĩnh (GitHub Pages) không có proxy /live/ohlc — phát hiện
  // một lần rồi tắt hẳn, thay vì báo "mất kết nối" gây hiểu nhầm.
  if (live.disabled) { renderStatus(); return; }
  // Nghỉ trưa vẫn giữ nguyên giá trị đang có, chỉ dừng gọi API cho đỡ tốn.
  if (!marketOpen()) {
    if (sessionState() === 'closed') live.on = false;
    renderStatus();
    return;
  }
  try {
    const now = Math.floor(Date.now() / 1000);
    const res = await fetch('live/ohlc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeFrame: 'ONE_MINUTE', symbols: ['VNINDEX'],
                             from: now - 3600, to: now + 60 }),
    });
    if (res.status === 404 || res.status === 405 || res.status === 501) {
      live.disabled = true; live.on = false; renderStatus(); return;
    }
    if (!res.ok) throw new Error(res.status);
    const arr = await res.json();
    const d = arr?.[0];
    if (!d?.c?.length) throw new Error('rỗng');
    live.index = +d.c[d.c.length - 1];
    live.at = new Date(+d.t[d.t.length - 1] * 1000);
    live.on = true;
    live.fail = 0;
    applyLive();
  } catch {
    live.fail++;
    if (live.fail >= 3) live.on = false;
    if (live.fail >= 5) live.disabled = true;   // không có proxy thì thôi hẳn
  }
  renderStatus();
}

/** Ghi giá trị trong phiên vào phiên cuối của chuỗi. */
function applyLive() {
  if (!live.on || !ROWS.length || live.index == null) return;
  const last = ROWS[ROWS.length - 1];
  const ratio = live.index / last._closeI;
  last.i = +live.index.toFixed(2);
  if (last._closePe != null) last.pe = +(last._closePe * ratio).toFixed(3);
  if (last._closePb != null) last.pb = +(last._closePb * ratio).toFixed(4);

  chart.updateLast('index', last.d, last.i);
  for (const m of state.metrics) if (last[SERIES[m].key] != null)
    chart.updateLast(m, last.d, last[SERIES[m].key]);
  renderReadout(last);
}

/* --------------------------------------------------------------- vẽ UI --- */

let chart, table;

function renderChrome() {
  document.documentElement.lang = state.lang;
  document.title = t.docTitle;
  $('#brandSub').textContent = t.brandSub;
  $('#langBtn').textContent = state.lang === 'vi' ? 'EN' : 'VI';
  $('#langBtn').title = t.langTip;
  $('#themeBtn').title = t.themeTip;

  $('#rangeSeg').innerHTML = Object.entries(t.range).map(([k, v]) =>
    `<button type="button" data-v="${k}" aria-pressed="${state.range === k}" title="${v}">` +
    `<span class="lbl-long">${v}</span><span class="lbl-short">${t.rangeShort[k]}</span></button>`).join('');
  $('#viewSeg').innerHTML = Object.entries(t.view).map(([k, v]) =>
    `<button type="button" data-v="${k}" title="${t.viewTip[k]}" aria-pressed="${state.view === k}">${v}</button>`).join('');
  $('#metricSeg').innerHTML = ['pe', 'pb'].map(k =>
    `<button type="button" data-v="${k}" aria-pressed="${state.metrics.includes(k)}">${k.toUpperCase()}</button>`).join('');
  $('#metricSeg').title = t.metricTip;

  $$('.tab').forEach(b => {
    b.textContent = t.tab[b.dataset.tab];
    b.classList.toggle('active', b.dataset.tab === state.tab);
  });
  $$('.pane').forEach(p => p.classList.toggle('active', p.id === `pane-${state.tab}`));

  $('#keyIndex').lastChild.textContent = ' ' + t.keyIndex;
  $('#keyPe').lastChild.textContent = ' ' + t.keyPe;
  $('#keyPb').lastChild.textContent = ' ' + t.keyPb;
  $('#keyPe').classList.toggle('hidden', !state.metrics.includes('pe'));
  $('#keyPb').classList.toggle('hidden', !state.metrics.includes('pb'));
  const rows = ROWS.length ? sliceRange() : [];
  const gap = rows.length && DATA?.valuation_from && rows[0].d < DATA.valuation_from;
  $('#chartNote').textContent =
    (gap ? t.noVal(fdate(DATA.valuation_from)) + ' ' : '') + t.note[state.view];

  $('#quickSeg').innerHTML = Object.entries(t.quick).map(([k, v]) =>
    `<button type="button" data-v="${k === 'all' ? 'all' : k.replace('d', '')}"
      aria-pressed="${table?.filter.quick === (k === 'all' ? 'all' : k.replace('d', ''))}">${v}</button>`).join('');
  $('#lblFrom').textContent = t.filter.from;
  $('#lblTo').textContent = t.filter.to;
  $('#btnReset').textContent = t.filter.reset;
  $('#btnCsv').textContent = t.csv;

  $('#thDate').firstChild.textContent = t.col.date;
  $('#thIndex').firstChild.textContent = t.col.index;
  $('#thChg').firstChild.textContent = t.col.chg;
  $('#thPe').firstChild.textContent = t.col.pe;
  $('#thPb').firstChild.textContent = t.col.pb;

  renderStatus();
  renderAbout();
}

function renderStatus() {
  const el = $('#status');
  const ss = sessionState();
  const open = ss === 'open';
  el.classList.toggle('is-live', open && live.on);
  const label = live.disabled ? t.liveEod
    : ss === 'lunch' ? t.liveLunch
    : ss === 'closed' ? t.liveOff
    : live.on ? t.liveOn : (live.fail ? t.liveErr : t.liveWait);
  const hhmm = d => d.toLocaleTimeString(t.locale,
    { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
  const ddmm = d => d.toLocaleDateString(t.locale,
    { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const stamp = live.on && !live.disabled && live.at ? hhmm(live.at)
    : DATA ? `${t.updated} ${hhmm(new Date(DATA.generated_at))} ${ddmm(new Date(DATA.generated_at))}`
    : '';
  $('#statusText').textContent = label;
  $('#statusTime').textContent = stamp ? ` · ${stamp}` : '';
}

function renderReadout(row) {
  if (!row) return;
  const rows = sliceRange();
  const pe = stats(rows.map(r => r.pe));
  const hasBand = pe && pe.sd > 0 && row.pe != null;
  const z = hasBand ? (row.pe - pe.mean) / pe.sd : 0;
  const band = z <= -1 ? 'cheap' : z >= 1 ? 'rich' : 'fair';
  const bandColor = { cheap: 'var(--up)', fair: 'var(--text-3)', rich: 'var(--down)' }[band];

  const delta = (v, digits = 2) => {
    if (v == null) return '<span class="ro-d flat">—</span>';
    const cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    return `<span class="ro-d ${cls} num">${v > 0 ? '+' : ''}${fmt(v, digits)}%</span>`;
  };

  $('#readout').innerHTML = `
    <div class="ro"><span class="ro-k">${t.roDate}</span><span class="ro-v num">${fdate(row.d)}</span></div>
    <div class="ro"><span class="ro-k c-idx">${t.roIndex}</span>
      <span class="ro-v num c-idx">${fmt(row.i)}</span>${delta(row._dI)}</div>
    <div class="ro"><span class="ro-k c-pe">${t.roPe}</span>
      <span class="ro-v num c-pe">${fmt(row.pe)}</span>${delta(row._dPe)}</div>
    <div class="ro"><span class="ro-k">${t.roPb}</span>
      <span class="ro-v num">${fmt(row.pb)}</span>${delta(row._dPb)}</div>
    ${hasBand ? `<div class="ro" title="${t.bandTip}"><span class="ro-k">${t.roBand}</span>
      <span class="band" style="color:${bandColor};border:1px solid ${bandColor}">${t.band[band]}</span>
      <span class="ro-d num" style="color:var(--text-3)">${z > 0 ? '+' : ''}${fmt(z)}σ</span></div>` : ''}`;
}

function renderStats() {
  const rows = sliceRange();
  if (!rows.length) return;
  const last = rows[rows.length - 1], first = rows[0];
  const box = [];

  const card = (title, cur, st, digits, gauge) => {
    if (!st || cur == null) return '';
    const z = st.sd ? (cur - st.mean) / st.sd : 0;
    const p = percentile(st.sorted, cur);
    const pos = ((cur - st.min) / (st.max - st.min || 1)) * 100;
    return `<div class="card"><h4>${title}</h4>
      <div class="kv"><span>${t.stats.cur}</span><span>${fmt(cur, digits)}</span></div>
      <div class="kv"><span>${t.stats.mean}</span><span>${fmt(st.mean, digits)}</span></div>
      <div class="kv"><span>${t.stats.sd}</span><span>${fmt(st.sd, digits)}</span></div>
      <div class="kv"><span>${t.stats.z}</span><span class="${z > 1 ? 'down' : z < -1 ? 'up' : ''}">${z > 0 ? '+' : ''}${fmt(z)}σ</span></div>
      <div class="kv"><span>${t.stats.min}</span><span>${fmt(st.min, digits)}</span></div>
      <div class="kv"><span>${t.stats.max}</span><span>${fmt(st.max, digits)}</span></div>
      <div class="kv"><span>${t.stats.pct}</span><span>${fmt(p, 0)}%</span></div>
      ${gauge ? `<div class="gauge"><div class="gauge-bar"><div class="gauge-pin" style="left:calc(${pos.toFixed(1)}% - 1px)"></div></div>
        <div class="gauge-scale"><span>${fmt(st.min, digits)} · ${t.stats.cheap}</span><span>${t.stats.rich} · ${fmt(st.max, digits)}</span></div></div>` : ''}
    </div>`;
  };

  box.push(card(t.stats.peTitle, last.pe, stats(rows.map(r => r.pe)), 2, true));
  box.push(card(t.stats.pbTitle, last.pb, stats(rows.map(r => r.pb)), 2, true));

  const si = stats(rows.map(r => r.i));
  const chg = (last.i / first.i - 1) * 100;
  box.push(`<div class="card"><h4>${t.stats.idxTitle}</h4>
    <div class="kv"><span>${t.stats.cur}</span><span>${fmt(last.i)}</span></div>
    <div class="kv"><span>${t.stats.idxChg}</span><span class="${chg > 0 ? 'up' : chg < 0 ? 'down' : ''}">${chg > 0 ? '+' : ''}${fmt(chg)}%</span></div>
    <div class="kv"><span>${t.stats.min}</span><span>${fmt(si.min)}</span></div>
    <div class="kv"><span>${t.stats.max}</span><span>${fmt(si.max)}</span></div></div>`);

  $('#pane-stats').innerHTML = `<div class="cards">${box.join('')}</div>`;
}

function renderAbout() {
  const a = t.about, s = DATA?.sources || {};
  $('#pane-about').innerHTML = `<div class="doc">
    <h4>${a.h1}</h4>
    <p>${a.p1}</p>
    <div class="formula">P/E = Σ VốnHoá / Σ LợiNhuậnTTM<br>P/B = Σ VốnHoá / Σ VốnChủSởHữu</div>
    <p>${a.p2(DATA?.universe_size ?? '—')}</p>
    <h4>${a.h2}</h4>
    <p>${a.p3}</p>
    <ul>
      <li>${a.s1} — <code>${s.price || ''}</code></li>
      <li>${a.s2} — <code>${(s.income_statement || '').split('/').slice(-1)[0]}</code></li>
      <li>${a.s3} — <code>${(s.shares || '').split('/').slice(-1)[0]}</code></li>
    </ul>
    <h4>${a.h3}</h4>
    <p>${a.p4}</p>
    <h4>${a.h4}</h4>
    <ul><li>${a.l1}</li><li>${a.l2}</li><li>${a.l3}</li><li>${a.l4}</li></ul>
  </div>`;
}

function renderAll() {
  const rows = sliceRange();
  chart.render(rows, state.view, state.metrics);
  chart.setLocale(t.locale);
  table.setRows(ROWS, t);
  renderReadout(rows[rows.length - 1]);
  renderStats();
}

/* ---------------------------------------------------------- sự kiện UI --- */

function wireSeg(sel, key, multi = false) {
  $(sel).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (multi) {
      const v = b.dataset.v;
      const has = state[key].includes(v);
      if (has && state[key].length === 1) return;      // luôn giữ ít nhất một chỉ tiêu
      state[key] = has ? state[key].filter(x => x !== v)
                       : ['pe', 'pb'].filter(x => x === v || state[key].includes(x));
    } else {
      state[key] = b.dataset.v;
    }
    save(); renderChrome(); renderAll();
  });
}

function boot() {
  document.documentElement.dataset.theme = state.theme;
  t = DICT[state.lang];

  chart = new ValuationChart($('#chart'), {
    onCrosshair: time => {
      const row = time ? ROWS.find(r => r.d === time) : null;
      renderReadout(row || sliceRange().slice(-1)[0]);
    },
  });

  table = new DataTable({
    head: $('#tblHead'), body: $('#tblBody'), count: $('#rowCount'),
    onSelect: d => { const r = ROWS.find(x => x.d === d); if (r) renderReadout(r); },
  });
  table.filter.quick = 'all';

  wireSeg('#rangeSeg', 'range');
  wireSeg('#viewSeg', 'view');
  wireSeg('#metricSeg', 'metrics', true);

  $('#quickSeg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#fromDate').value = ''; $('#toDate').value = '';
    table.setFilter({ quick: b.dataset.v, from: '', to: '' });
    renderChrome();
  });
  const onDate = () => table.setFilter({
    quick: 'custom', from: $('#fromDate').value, to: $('#toDate').value,
  });
  $('#fromDate').addEventListener('change', () => { onDate(); renderChrome(); });
  $('#toDate').addEventListener('change', () => { onDate(); renderChrome(); });
  $('#btnReset').addEventListener('click', () => {
    $('#fromDate').value = ''; $('#toDate').value = '';
    table.setFilter({ quick: 'all', from: '', to: '' });
    renderChrome();
  });
  $('#btnCsv').addEventListener('click', () => {
    const blob = new Blob([table.toCSV()], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vnindex-pe-pb-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $$('.tab').forEach(b => b.addEventListener('click', () => {
    state.tab = b.dataset.tab; save(); renderChrome();
    if (state.tab === 'stats') renderStats();
  }));

  $('#langBtn').addEventListener('click', () => {
    state.lang = state.lang === 'vi' ? 'en' : 'vi';
    t = DICT[state.lang]; save(); renderChrome(); renderAll();
  });
  $('#themeBtn').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = state.theme;
    save(); chart.restyle(); renderAll();
  });
  $('#btnFit').addEventListener('click', () => chart.fit());

  loadData(true).then(() => {
    // giữ giá đóng cửa gốc để suy ra giá trị trong phiên
    const last = ROWS[ROWS.length - 1];
    last._closeI = last.i; last._closePe = last.pe; last._closePb = last.pb;
    renderChrome();
    renderAll();
    pollLive();
    setInterval(pollLive, 20_000);
    setInterval(async () => {
      const fresh = await loadData().catch(() => false);
      if (fresh) {
        const l = ROWS[ROWS.length - 1];
        l._closeI = l.i; l._closePe = l.pe; l._closePb = l.pb;
        renderAll();
      }
    }, 300_000);
  }).catch(err => {
    $('#chart').innerHTML = `<div class="empty">Không tải được dữ liệu: ${err.message}</div>`;
  });
}

boot();

