import { DICT } from './i18n.js';
import { ValuationChart, SERIES } from './chart.js';
import { DataTable } from './table.js';

/* ------------------------------------------------------------ workspace --- */
/* Hai bộ dữ liệu dùng chung khung giao diện: cùng biểu đồ, cùng bảng, cùng bộ
   lọc. Khác nhau chỉ ở phần khai báo dưới đây. */

const WS = {
  val: {
    file: 'data/vnindex_pe.json',
    primary: 'index',
    optional: ['pe', 'pb'],
    metrics: ['pe'],
    fromKey: 'valuation_from',
  },
  fx: {
    file: 'data/fx.json',
    primary: 'usdvnd',
    optional: ['dxy', 'usdcny', 'vcbsell'],
    metrics: ['dxy'],
    fromKey: null,
  },
};

/* ------------------------------------------------------------ trạng thái --- */

const LS = 'vnindex-pe:v2';
const state = Object.assign({
  ws: 'val', lang: 'vi', theme: 'dark', range: '1y', tab: 'data',
  // Kiểu xem và chỉ tiêu đối chiếu tách riêng cho từng workspace: tỷ giá có ba
  // chuỗi lệch thang nhau hàng nghìn lần nên mặc định phải là xếp tầng.
  view: { val: 'dual', fx: 'stack' },
  metrics: { val: ['pe'], fx: ['dxy', 'usdcny'] },
}, JSON.parse(localStorage.getItem(LS) || '{}'));

const save = () => localStorage.setItem(LS, JSON.stringify(state));
let t = DICT[state.lang];

const store = { val: null, fx: null };          // dữ liệu thô theo workspace
const rowsOf = { val: [], fx: [] };             // đã tính sẵn % thay đổi
let live = { on: false, index: null, at: null, fail: 0, disabled: false, probed: false };

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const cfg = () => WS[state.ws];
const DATA = () => store[state.ws];
const ROWS = () => rowsOf[state.ws];
const metrics = () => state.metrics[state.ws];
const view = () => state.view[state.ws];

/* -------------------------------------------------------------- tiện ích --- */

const RANGE_DAYS = { '1m':30, '6m':182, '1y':365, '3y':1095, '5y':1826, '10y':3652, all:null };
const fmt = (v, d = 2) => v == null ? '—'
  : v.toLocaleString(t.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
const dmy = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fdate = iso => iso ? (state.lang === 'vi' ? dmy(iso) : iso) : '—';

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => el.classList.add('hidden'), 3200);
}

/** Phiên HOSE theo giờ Việt Nam: T2–T6, 09:00–11:30 và 13:00–15:00. */
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

function sliceRange(rows = ROWS()) {
  const days = RANGE_DAYS[state.range];
  if (!days || !rows.length) return rows;
  const last = new Date(rows[rows.length - 1].d + 'T00:00:00Z');
  const from = new Date(last.getTime() - days * 864e5).toISOString().slice(0, 10);
  const i = rows.findIndex(r => r.d >= from);
  return i < 0 ? rows : rows.slice(i);
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

/* --------------------------------------------------------------- dữ liệu --- */

async function loadWs(ws, quiet = false) {
  const res = await fetch(`${WS[ws].file}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(res.status);
  const json = await res.json();
  const isNew = store[ws] && json.generated_at !== store[ws].generated_at;
  store[ws] = json;

  // Vietcombank là mảng riêng — gộp vào chuỗi chính để bảng và biểu đồ dùng chung.
  const vcb = new Map((json.vcb || []).map(v => [v.d, v]));
  const keys = ws === 'val' ? ['i', 'pe', 'pb'] : ['usdvnd', 'dxy', 'usdcny'];

  rowsOf[ws] = json.series.map((r, k, arr) => {
    const p = arr[k - 1];
    const out = { ...r };
    const q = vcb.get(r.d);
    if (q) { out.vcb_buy = q.buy; out.vcb_sell = q.sell; }
    for (const key of keys) {
      out['d_' + key] = (r[key] == null || p?.[key] == null) ? null
        : (r[key] / p[key] - 1) * 100;
    }
    return out;
  });

  if (isNew && !quiet) toast(t.toastNew);
  return isNew;
}

/** VNINDEX trong phiên. P/E, P/B suy ra theo tỉ lệ vì lợi nhuận và vốn chủ sở hữu
 *  không đổi trong ngày — nhân đúng tỉ lệ giá là ra số chính xác. */
async function pollLive() {
  if (live.disabled) { renderStatus(); return; }
  // Lần gọi đầu luôn thử, kể cả ngoài giờ — để biết bản đang chạy có proxy hay không.
  if (live.probed && !marketOpen()) {
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
    if ([404, 405, 501].includes(res.status)) {
      live.disabled = true; live.on = false; live.probed = true;
      renderStatus(); return;
    }
    if (!res.ok) throw new Error(res.status);
    const d = (await res.json())?.[0];
    if (!d?.c?.length) throw new Error('rỗng');
    live.index = +d.c[d.c.length - 1];
    live.at = new Date(+d.t[d.t.length - 1] * 1000);
    live.on = marketOpen();
    live.probed = true;
    live.fail = 0;
    if (live.on) applyLive();
  } catch {
    live.probed = true;
    live.fail++;
    if (live.fail >= 3) live.on = false;
    if (live.fail >= 5) live.disabled = true;
  }
  renderStatus();
}

function applyLive() {
  const rows = rowsOf.val;
  if (!live.on || !rows.length || live.index == null) return;
  const last = rows[rows.length - 1];
  if (last._closeI == null) return;
  const ratio = live.index / last._closeI;
  last.i = +live.index.toFixed(2);
  if (last._closePe != null) last.pe = +(last._closePe * ratio).toFixed(3);
  if (last._closePb != null) last.pb = +(last._closePb * ratio).toFixed(4);
  if (state.ws !== 'val') return;
  chart.updateLast('index', last.d, last.i);
  for (const m of metrics()) if (last[SERIES[m].key] != null)
    chart.updateLast(m, last.d, last[SERIES[m].key]);
  renderReadout(last);
}

function stampCloses() {
  const rows = rowsOf.val;
  if (!rows.length) return;
  const l = rows[rows.length - 1];
  l._closeI = l.i; l._closePe = l.pe; l._closePb = l.pb;
}

/* ----------------------------------------------------------------- vẽ UI --- */

let chart, table;

function renderChrome() {
  document.documentElement.lang = state.lang;
  document.title = t.docTitle;
  $('#brandSub').textContent = t.brandSub;
  $('#langBtn').textContent = state.lang === 'vi' ? 'EN' : 'VI';
  $('#langBtn').title = t.langTip;
  $('#themeBtn').title = t.themeTip;

  $('#wsSeg').innerHTML = Object.entries(t.ws).map(([k, v]) =>
    `<button type="button" data-v="${k}" title="${t.wsTip[k]}" aria-pressed="${state.ws === k}">${v}</button>`).join('');

  $('#rangeSeg').innerHTML = Object.entries(t.range).map(([k, v]) =>
    `<button type="button" data-v="${k}" aria-pressed="${state.range === k}" title="${v}">` +
    `<span class="lbl-long">${v}</span><span class="lbl-short">${t.rangeShort[k]}</span></button>`).join('');
  $('#viewSeg').innerHTML = Object.entries(t.view).map(([k, v]) =>
    `<button type="button" data-v="${k}" title="${t.viewTip[k]}" aria-pressed="${view() === k}">${v}</button>`).join('');

  const mLabel = state.ws === 'val'
    ? { pe: 'PE', pb: 'PB' }
    : t.fx.m;
  $('#metricSeg').innerHTML = cfg().optional.map(k =>
    `<button type="button" data-v="${k}" aria-pressed="${metrics().includes(k)}">${mLabel[k]}</button>`).join('');
  $('#metricSeg').title = state.ws === 'val' ? t.metricTip : t.fx.metricTip;

  $$('.tab').forEach(b => {
    b.textContent = t.tab[b.dataset.tab];
    b.classList.toggle('active', b.dataset.tab === state.tab);
  });
  $$('.pane').forEach(p => p.classList.toggle('active', p.id === `pane-${state.tab}`));

  renderLegend();

  $('#quickSeg').innerHTML = Object.entries(t.quick).map(([k, v]) => {
    const val = k === 'all' ? 'all' : k.replace('d', '');
    return `<button type="button" data-v="${val}" aria-pressed="${table?.filter.quick === val}">${v}</button>`;
  }).join('');
  $('#lblFrom').textContent = t.filter.from;
  $('#lblTo').textContent = t.filter.to;
  $('#btnReset').textContent = t.filter.reset;
  $('#btnCsv').textContent = t.csv;

  renderStatus();
  renderAbout();
}

function renderLegend() {
  const names = [cfg().primary, ...metrics()];
  const label = state.ws === 'val'
    ? { index: t.keyIndex, pe: t.keyPe, pb: t.keyPb }
    : { usdvnd: t.fx.keyUsd, dxy: t.fx.keyDxy, usdcny: t.fx.keyCny, vcbsell: t.fx.keyVcb };
  $('#legend').innerHTML = names.map(n =>
    `<span class="key"><i style="background:var(${SERIES[n].cssVar})"></i>${label[n]}</span>`).join('');
  const note = state.ws === 'val' ? t.note[view()] : t.fx.note[view()];
  const from = cfg().fromKey && DATA()?.[cfg().fromKey];
  const rows = sliceRange();
  const gap = from && rows.length && rows[0].d < from;
  $('#chartNote').textContent = (gap ? t.noVal(fdate(from)) + ' ' : '') + note;
}

function renderStatus() {
  const el = $('#status');
  const ss = sessionState();
  const open = ss === 'open';
  el.classList.toggle('is-live', open && live.on && state.ws === 'val');
  const label = live.disabled ? t.liveEod
    : ss === 'lunch' ? t.liveLunch
    : ss === 'closed' ? t.liveOff
    : live.on ? t.liveOn : (live.fail ? t.liveErr : t.liveWait);
  const hhmm = d => d.toLocaleTimeString(t.locale,
    { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
  const ddmm = d => d.toLocaleDateString(t.locale,
    { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const g = DATA()?.generated_at;
  const stamp = state.ws === 'val' && live.on && !live.disabled && live.at ? hhmm(live.at)
    : g ? `${t.updated} ${hhmm(new Date(g))} ${ddmm(new Date(g))}` : '';
  $('#statusText').textContent = state.ws === 'val' ? label : t.liveEod;
  $('#statusTime').textContent = stamp ? ` · ${stamp}` : '';
}

const roItem = (k, v, cls = '') =>
  `<div class="ro"><span class="ro-k ${cls}">${k}</span><span class="ro-v num ${cls}">${v}</span></div>`;
const roDelta = v => {
  if (v == null) return '<span class="ro-d flat">—</span>';
  const cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  return `<span class="ro-d ${cls} num">${v > 0 ? '+' : ''}${fmt(v)}%</span>`;
};

function renderReadout(row) {
  if (!row) { $('#readout').innerHTML = ''; return; }
  const rows = sliceRange();

  if (state.ws === 'fx') {
    const jan = rows.find(r => r.d.slice(0, 4) === row.d.slice(0, 4));
    const ytd = jan && jan.usdvnd ? (row.usdvnd / jan.usdvnd - 1) * 100 : null;
    $('#readout').innerHTML = `
      <div class="ro"><span class="ro-k">${t.roDate}</span><span class="ro-v num">${fdate(row.d)}</span></div>
      <div class="ro"><span class="ro-k c-s1">${t.fx.roUsd}</span>
        <span class="ro-v num c-s1">${fmt(row.usdvnd, 0)}</span>${roDelta(row.d_usdvnd)}</div>
      <div class="ro"><span class="ro-k c-s2">${t.fx.roDxy}</span>
        <span class="ro-v num c-s2">${fmt(row.dxy)}</span>${roDelta(row.d_dxy)}</div>
      <div class="ro"><span class="ro-k c-s3">${t.fx.roCny}</span>
        <span class="ro-v num c-s3">${fmt(row.usdcny, 3)}</span>${roDelta(row.d_usdcny)}</div>
      ${ytd == null ? '' : `<div class="ro"><span class="ro-k">${t.fx.roYtd}</span>
        <span class="ro-v num ${ytd > 0 ? 'down' : 'up'}">${ytd > 0 ? '+' : ''}${fmt(ytd)}%</span></div>`}
      ${row.vcb_sell == null ? '' : roItem(t.fx.keyVcb, fmt(row.vcb_sell, 0), 'c-s4')}`;
    return;
  }

  const pe = stats(rows.map(r => r.pe));
  const hasBand = pe && pe.sd > 0 && row.pe != null;
  const z = hasBand ? (row.pe - pe.mean) / pe.sd : 0;
  const band = z <= -1 ? 'cheap' : z >= 1 ? 'rich' : 'fair';
  const bandColor = { cheap: 'var(--up)', fair: 'var(--text-3)', rich: 'var(--down)' }[band];
  $('#readout').innerHTML = `
    <div class="ro"><span class="ro-k">${t.roDate}</span><span class="ro-v num">${fdate(row.d)}</span></div>
    <div class="ro"><span class="ro-k c-s1">${t.roIndex}</span>
      <span class="ro-v num c-s1">${fmt(row.i)}</span>${roDelta(row.d_i)}</div>
    <div class="ro"><span class="ro-k c-s2">${t.roPe}</span>
      <span class="ro-v num c-s2">${fmt(row.pe)}</span>${roDelta(row.d_pe)}</div>
    <div class="ro"><span class="ro-k c-s3">${t.roPb}</span>
      <span class="ro-v num c-s3">${fmt(row.pb)}</span>${roDelta(row.d_pb)}</div>
    ${hasBand ? `<div class="ro" title="${t.bandTip}"><span class="ro-k">${t.roBand}</span>
      <span class="band" style="color:${bandColor};border:1px solid ${bandColor}">${t.band[band]}</span>
      <span class="ro-d num" style="color:var(--text-3)">${z > 0 ? '+' : ''}${fmt(z)}σ</span></div>` : ''}`;
}

function statCard(title, cur, st, digits, gauge) {
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
      <div class="gauge-scale"><span>${fmt(st.min, digits)}</span><span>${fmt(st.max, digits)}</span></div></div>` : ''}
  </div>`;
}

function renderStats() {
  const rows = sliceRange();
  if (!rows.length) { $('#pane-stats').innerHTML = ''; return; }
  const last = rows[rows.length - 1], first = rows[0];
  const box = [];

  if (state.ws === 'fx') {
    box.push(statCard(t.fx.statUsd, last.usdvnd, stats(rows.map(r => r.usdvnd)), 0, true));
    box.push(statCard(t.fx.statDxy, last.dxy, stats(rows.map(r => r.dxy)), 2, true));
    const chg = (last.usdvnd / first.usdvnd - 1) * 100;
    const dchg = first.dxy ? (last.dxy / first.dxy - 1) * 100 : null;
    box.push(`<div class="card"><h4>${t.stats.idxChg}</h4>
      <div class="kv"><span>${t.fx.roUsd}</span><span class="${chg > 0 ? 'down' : 'up'}">${chg > 0 ? '+' : ''}${fmt(chg)}%</span></div>
      ${dchg == null ? '' : `<div class="kv"><span>${t.fx.roDxy}</span><span class="${dchg > 0 ? 'up' : 'down'}">${dchg > 0 ? '+' : ''}${fmt(dchg)}%</span></div>`}
      </div>`);
  } else {
    box.push(statCard(t.stats.peTitle, last.pe, stats(rows.map(r => r.pe)), 2, true));
    box.push(statCard(t.stats.pbTitle, last.pb, stats(rows.map(r => r.pb)), 2, true));
    const si = stats(rows.map(r => r.i));
    const chg = (last.i / first.i - 1) * 100;
    box.push(`<div class="card"><h4>${t.stats.idxTitle}</h4>
      <div class="kv"><span>${t.stats.cur}</span><span>${fmt(last.i)}</span></div>
      <div class="kv"><span>${t.stats.idxChg}</span><span class="${chg > 0 ? 'up' : 'down'}">${chg > 0 ? '+' : ''}${fmt(chg)}%</span></div>
      <div class="kv"><span>${t.stats.min}</span><span>${fmt(si.min)}</span></div>
      <div class="kv"><span>${t.stats.max}</span><span>${fmt(si.max)}</span></div></div>`);
  }
  $('#pane-stats').innerHTML = `<div class="cards">${box.join('')}</div>`;
}

function renderAbout() {
  const d = DATA();
  if (state.ws === 'fx') {
    const a = t.fx.about;
    $('#pane-about').innerHTML = `<div class="doc">
      <h4>${a.h1}</h4><p>${a.p1}</p>
      <h4>${a.h2}</h4><p>${a.p2}</p>
      <h4>${a.h3}</h4>
      <ul><li>${a.l1(fdate(d?.vcb_from))}</li><li>${a.l2}</li><li>${a.l3}</li></ul>
    </div>`;
    return;
  }
  const a = t.about, s = d?.sources || {};
  $('#pane-about').innerHTML = `<div class="doc">
    <h4>${a.h1}</h4><p>${a.p1}</p>
    <div class="formula">P/E = Σ VốnHoá / Σ LợiNhuậnTTM<br>P/B = Σ VốnHoá / Σ VốnChủSởHữu</div>
    <p>${a.p2(d?.universe_size ?? '—')}</p>
    <h4>${a.h2}</h4><p>${a.p3}</p>
    <ul>
      <li>${a.s1} — <code>${s.price || ''}</code></li>
      <li>${a.s2} — <code>${(s.income_statement || '').split('/').slice(-1)[0]}</code></li>
      <li>${a.s3} — <code>${(s.shares || '').split('/').slice(-1)[0]}</code></li>
    </ul>
    <h4>${a.h3}</h4><p>${a.p4}</p>
    <h4>${a.h4}</h4>
    <ul><li>${a.l1}</li><li>${a.l2}</li><li>${a.l3}</li><li>${a.l4}</li></ul>
  </div>`;
}

function tableColumns() {
  if (state.ws === 'fx') {
    const c = t.fx.col;
    return [
      { key: 'd', label: c.date, type: 'date' },
      { key: 'usdvnd', label: c.usd, digits: 0 },
      { key: 'd_usdvnd', label: c.chg, type: 'pct' },
      { key: 'dxy', label: c.dxy, digits: 2 },
      // USD/CNY chỉ có trên biểu đồ và dải readout: thêm cột thứ năm là bảng
      // tràn ngang trong sidebar 370px, đọc khó hơn là được thêm.
    ];
  }
  const c = t.col;
  return [
    { key: 'd', label: c.date, type: 'date' },
    { key: 'i', label: c.index, digits: 2 },
    { key: 'd_i', label: c.chg, type: 'pct' },
    { key: 'pe', label: c.pe, digits: 2 },
    { key: 'pb', label: c.pb, digits: 2 },
  ];
}

function renderAll() {
  const rows = sliceRange();
  chart.render(rows, view(), metrics(), cfg().primary);
  chart.setLocale(t.locale);
  table.setColumns(tableColumns());
  table.setRows(ROWS(), t);
  renderReadout(rows[rows.length - 1]);
  renderStats();
  renderLegend();
}

/* ------------------------------------------------------------ sự kiện UI --- */

function onSeg(sel, fn) {
  $(sel).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) fn(b.dataset.v);
  });
}

async function switchWs(ws) {
  if (ws === state.ws) return;
  state.ws = ws; save();
  if (!store[ws]) {
    try { await loadWs(ws, true); } catch (err) {
      $('#chartNote').textContent = `Không tải được dữ liệu: ${err.message}`;
      return;
    }
  }
  renderChrome();
  renderAll();
  chart.fit();
}

function boot() {
  document.documentElement.dataset.theme = state.theme;
  t = DICT[state.lang];

  chart = new ValuationChart($('#chart'), {
    onCrosshair: time => {
      const row = time ? ROWS().find(r => r.d === time) : null;
      renderReadout(row || sliceRange().slice(-1)[0]);
    },
  });

  table = new DataTable({
    head: $('#tblHead'), body: $('#tblBody'), count: $('#rowCount'),
    onSelect: d => { const r = ROWS().find(x => x.d === d); if (r) renderReadout(r); },
  });

  onSeg('#wsSeg', v => switchWs(v));
  onSeg('#rangeSeg', v => { state.range = v; save(); renderChrome(); renderAll(); });
  onSeg('#viewSeg', v => {
    state.view[state.ws] = v;
    // Hai trục chỉ biểu diễn được hai thang đo, nên chuyển sang kiểu này thì
    // giữ lại đúng một chỉ tiêu đối chiếu.
    if (v === 'dual' && metrics().length > 1) state.metrics[state.ws] = [metrics()[0]];
    save(); renderChrome(); renderAll();
  });
  onSeg('#metricSeg', v => {
    const cur = metrics();
    if (view() === 'dual') {                             // chọn đơn
      state.metrics[state.ws] = [v];
    } else {
      const has = cur.includes(v);
      if (has && cur.length === 1) return;               // luôn giữ ít nhất một
      state.metrics[state.ws] = has ? cur.filter(x => x !== v)
        : cfg().optional.filter(x => x === v || cur.includes(x));
    }
    save(); renderChrome(); renderAll();
  });

  onSeg('#quickSeg', v => {
    $('#fromDate').value = ''; $('#toDate').value = '';
    table.setFilter({ quick: v, from: '', to: '' });
    renderChrome();
  });
  const onDate = () => {
    table.setFilter({ quick: 'custom', from: $('#fromDate').value, to: $('#toDate').value });
    renderChrome();
  };
  $('#fromDate').addEventListener('change', onDate);
  $('#toDate').addEventListener('change', onDate);
  $('#btnReset').addEventListener('click', () => {
    $('#fromDate').value = ''; $('#toDate').value = '';
    table.setFilter({ quick: 'all', from: '', to: '' });
    renderChrome();
  });
  $('#btnCsv').addEventListener('click', () => {
    const blob = new Blob([table.toCSV()], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.ws}-${new Date().toISOString().slice(0, 10)}.csv`;
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

  loadWs(state.ws, true).then(() => {
    stampCloses();
    renderChrome();
    renderAll();
    pollLive();
    setInterval(pollLive, 20_000);
    setInterval(async () => {
      const fresh = await loadWs(state.ws).catch(() => false);
      if (fresh) { stampCloses(); renderAll(); }
    }, 300_000);
  }).catch(err => {
    $('#chartNote').textContent = `Không tải được dữ liệu: ${err.message}`;
  });
}

boot();
