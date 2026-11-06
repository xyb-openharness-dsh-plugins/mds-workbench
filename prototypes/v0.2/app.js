/* 小髓宝 MdsPal · 交互原型 v0.2.0
 * 结构基准：小粉宝 v0.4（五 Tab/卡片/3D 翻转/最近报告）+ 小橙宝 v0.2（导航分组/折叠卡/事件泳道/agent-draft 契约）。
 * 全部数据来自 window.DEMO_DATA（demo/build-demo-data.mjs 生成，唯一源，页面不写死数字）。
 * 合成演示：人物、数值与时间线不指向任何真实患者；未接入 DSH / AI。
 */
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidSeq = 0;
const uid = (p) => p + (++uidSeq);
const APP = { name: '小髓宝', en: 'MdsPal', version: 'v0.2.0', build: '2026-11-07', slug: 'mds' };
const DAY = 86400000;
const todayISO = () => (window.DEMO_DATA?.meta.today) || new Date().toISOString().slice(0, 10);
const dayGap = (from, to = todayISO()) => Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / DAY);
const shortDate = (d) => d ? String(d).slice(5).replace('-', '.') : '未知日期';
const longDate = (d) => d ? String(d).replace(/-/g, '.') : '未知日期';
const fmtNum = (v, dec) => v == null ? '—' : (dec === 0 ? String(Math.round(v)) : Number(v).toFixed(dec ?? 1));

const icons = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9h13v-9', folder: 'M3.5 6.5h6l2 2.5h9v9.5h-17zM3.5 6.5v-2h6',
  lab: 'M9 3h6M10 3v6l-5 8.5A2.4 2.4 0 0 0 7.2 21h9.6a2.4 2.4 0 0 0 2-3.5L14 9V3M8 15h8',
  chart: 'M4 19.5h16M6 16l3.6-4.4 3 2.4 4.9-6.5', drop: 'M12 3.5s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z',
  fold: 'M8 4h8M8 20h8M6 8l6 4-6 4M18 8l-6 4 6 4', heart: 'M12 20s-7.5-4.7-9.3-9A5 5 0 0 1 12 6.7 5 5 0 0 1 21.3 11c-1.8 4.3-9.3 9-9.3 9z',
  trial: 'M9 3h6M10 3v5.2L4.9 17a2.6 2.6 0 0 0 2.3 4h9.6a2.6 2.6 0 0 0 2.3-4L14 8.2V3M7.5 14h9',
  calendar: 'M4.5 6.5h15v13.5h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4'
};
const icon = (k) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[k] || icons.home}"/></svg>`;

/* ---------------- 页面树 ---------------- */
const PAGES = [
  ['home', '看板', 'home'], ['records', '资料与报告', 'folder'], ['labs', '血象与指标', 'lab'],
  ['chart', '病情一图秀', 'chart'], ['transfusion', '输血与铁监测', 'drop'], ['treatment', '治疗与疗程', 'fold'],
  ['daily', '日常观察', 'heart'], ['trial', '临床研究', 'trial'], ['visits', '就诊与回顾', 'calendar']
];
const SUBPAGES = {
  labs: [['src', '来源'], ['check', '核对'], ['file', '档案'], ['cards', '分类指标'], ['sum', '汇总']],
  trial: [['facts', '建档'], ['search', '检索'], ['match', '匹配结果']]
};
/* 探针覆盖清单（check-probe-coverage：全量探针必须扫到每条叶子路由） */
const ROUTES = ['home', 'records', 'labs', 'labs/src', 'labs/check', 'labs/file', 'labs/cards', 'labs/sum', 'chart', 'transfusion', 'treatment', 'daily', 'trial', 'trial/facts', 'trial/search', 'trial/match', 'visits'];
const SUBTITLES = {
  home: '把眼前的事情理清楚，让每次记录都能继续帮到你。',
  records: '原始材料有出处，整理结果可核对，一次记录多处复用。',
  labs: '血象怎么走、铁蛋白高不高，都在这里按可比组整理。',
  chart: '治疗、输血、血象与感受，放回同一段时间里看。',
  transfusion: '输了几次、间隔多久、铁蛋白怎么变，记录清楚就好。',
  treatment: '一次疗程一张卡，收起来是进度，展开是细节。',
  daily: '这里放医生交代的话和家里的观察，不替你判断。',
  trial: '临床试验三步：建档 → 检索 → 匹配结果；线索不是推荐。',
  visits: '复诊前把问题理清楚，把材料带齐。'
};

/* ---------------- 状态 ---------------- */
const DB = () => window.DEMO_DATA || { meta: {}, profiles: [] };
const state = {
  page: 'home', sub: {}, profileId: null,
  flipped: new Set(), range: 'all', sel: ['hb', 'plt'], toggles: { treatment: true, labels: true },
  trial: { tab: 'trial-facts', q: '', status: 'all', loaded: false },
  pin: null, query: ''
};

/* ---------------- 档案访问与派生（读时算，不落库） ---------------- */
function prof() {
  const ps = DB().profiles;
  return ps.find((p) => p.id === state.profileId) || ps[0];
}
const metricsOf = (p) => p.metrics || {};
const privateNotes = (p) => (p.privateNotes || []).filter((n) => n.private);
const publicNotes = (p) => (p.privateNotes || []).filter((n) => !n.private);
/* 隐私三出口共用过滤：看板提醒 / 导出 / AI 上下文都走这一个函数 */
const filterPrivate = (items) => (items || []).filter((x) => !x.private);
function privateRatio(p) {
  const all = p.privateNotes || [];
  return { total: all.length, hidden: all.filter((n) => n.private).length };
}
/* 近 90 天输血节奏：按月聚合次数（唯一源派生） */
function rhythm90(p) {
  const to = todayISO();
  const from = new Date(Date.parse(`${to}T00:00:00`) - 89 * DAY).toISOString().slice(0, 10);
  const rows = (p.transfusions || []).filter((t) => t.d >= from && t.d <= to);
  const months = [];
  for (let k = 2; k >= 0; k--) {
    const dt = new Date(`${to}T00:00:00`); dt.setMonth(dt.getMonth() - k);
    const key = dt.toISOString().slice(0, 7);
    months.push({ key, label: `${dt.getMonth() + 1}月`, count: 0, units: 0 });
  }
  rows.forEach((t) => { const m = months.find((x) => t.d.startsWith(x.key)); if (m) { m.count++; m.units += t.units || 0; } });
  return { from, to, rows, months };
}
const totalUnits = (p, component) => (p.transfusions || []).filter((t) => !component || t.component === component).reduce((s, t) => s + (t.units || 0), 0);
/* 可比组：同机构+同方法才算一组；跨组不差值不连线 */
function comparables(p, code) {
  const pts = (metricsOf(p)[code] || {}).points || [];
  const groups = new Map();
  pts.forEach((pt) => {
    const key = pt.site || pt.src || '默认';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pt);
  });
  return groups;
}
function lastPoint(p, code) {
  const pts = (metricsOf(p)[code] || {}).points || [];
  if (!pts.length) return null;
  const sorted = [...pts].sort((a, b) => a.d < b.d ? -1 : 1);
  return sorted[sorted.length - 1];
}
/* 差值：仅当最后两点在同一可比组 */
function diffOf(p, code) {
  const pts = (metricsOf(p)[code] || {}).points || [];
  if (pts.length < 2) return null;
  const sorted = [...pts].sort((a, b) => a.d < b.d ? -1 : 1);
  const a = sorted[sorted.length - 2], b = sorted[sorted.length - 1];
  const ga = a.site || a.src || '默认', gb = b.site || b.src || '默认';
  if (ga !== gb) return { comparable: false };
  const m = metricsOf(p)[code] || {};
  return { comparable: true, from: a.v, to: b.v, delta: Math.round((b.v - a.v) * 10) / 10, unit: m.unit, dec: m.dec, d: b.d };
}

/* ---------------- 通用 UI ---------------- */
const btn = (text, action, cls = '', attr = '') => `<button class="${cls}" data-action="${action}" ${attr}>${text}</button>`;
const go = (text, page, sub = '', cls = '', attr = '') => btn(text, 'go', cls, `data-page="${page}"${sub ? ` data-sub="${esc(sub)}"` : ''}${attr ? ' ' + attr : ''}`);
const pill = (text, cls = '') => `<span class="pill ${cls || ''}">${esc(text)}</span>`;
const aiBtn = (key, label = '和 AI 讨论这一页') => {
  const prompt = aiPromptWithCtx(key);
  return `<a class="chip ai-link" href="${APP.slug}:agent-draft?prompt=${encodeURIComponent(prompt)}" data-ai="${esc(key)}" title="把预写提示词与当前病情上下文带给 AI（回复是候选，核对才采纳）">${esc(label)} ↗</a>`;
};
function aiPromptWithCtx(key) {
  const p = prof();
  const pageName = (PAGES.find((x) => x[0] === key) || [key, key])[1];
  const facts = [];
  facts.push(`页面：${pageName}`);
  facts.push(`演示档案：${p.name.replace('（演示）', '')}（合成示例）`);
  const last = lastPoint(p, 'hb');
  if (last) facts.push(`最近血红蛋白 ${fmtNum(last.v, metricsOf(p).hb.dec)} ${metricsOf(p).hb.unit}（${longDate(last.d)}）`);
  if ((p.transfusions || []).length) facts.push(`累计输血 ${p.transfusions.length} 次（红细胞 ${totalUnits(p, '红细胞')} 单位）`);
  else facts.push('暂无输血记录');
  facts.push(`资料 ${p.docs.length} 份（待核对 ${p.docs.filter((x) => x.status === '待核对').length} 份）`);
  /* 只带事实，不带判定词；私密记录（家属记录）不进入 */
  return `请帮我把「${pageName}」里的记录整理成一份家人能看懂的清单：${facts.join('；')}。只整理与提问，不做任何判断或建议。`;
}
function toast(t, opts = {}) {
  clearTimeout(state.toastTimer);
  const el = $('#toast'); el.textContent = t; el.classList.add('show');
  state.toastTimer = setTimeout(() => { el.classList.remove('show'); if (opts.back) history.back(); }, opts.long ? 6000 : 2600);
}
function openModal(title, body, foot = '', eyebrowLabel = '小髓宝 · 交互演示') {
  $('#dialog-title').textContent = title; $('#dialog-eyebrow').textContent = eyebrowLabel;
  $('#dialog-body').innerHTML = body; $('#dialog-foot').innerHTML = foot || '<button data-action="close">关闭</button>';
  const dlg = $('#dialog'); if (!dlg.open) dlg.showModal();
  $('#dialog-body').scrollTop = 0;
}
const closeModal = () => { const d = $('#dialog'); if (d.open) d.close(); };
const head = (title, desc, action = '') => `<div class="head"><h1>${esc(title)}</h1><p>${desc}</p>${action ? `<div class="actions" style="margin-top:10px">${action}</div>` : ''}</div>`;
const section = (title, desc = '', action = '') => `<div class="section-title"><div><h2>${esc(title)}</h2>${desc ? `<p>${esc(desc)}</p>` : ''}</div>${action ? `<div class="actions">${action}</div>` : ''}</div>`;
const subnav = () => {
  const subs = SUBPAGES[state.page];
  if (!subs) return '';
  const cur = state.sub[state.page] || subs[0][0];
  return `<div class="grid" style="grid-auto-flow:column;justify-content:start;gap:8px;margin:14px 0 4px">${subs.map(([key, label]) => btn(esc(label), 'sub', cur === key ? 'soft' : '', `data-sub="${esc(key)}"`)).join('')}</div>`;
};

/* ---------------- 整页视图（32 号 · 内联单文件版，file:// 可用） ----------------
 * history 是导航栈唯一真源：open=pushState(#page=slug)，返回=history.back()，关闭=一次退到主页。
 * 每层同时有「返回」与「关闭」两个入口；Esc 退一层；焦点回触发元素；主页滚动位置不动。
 */
const PV = (function () {
  const registry = {}; /* slug -> {title, render(pv)} */
  let stack = []; let lastTrigger = null;
  function overlayEl() { return $('.pv-overlay'); }
  function ensureDom() {
    if (overlayEl()) return;
    const ov = document.createElement('div');
    ov.className = 'pv-overlay'; ov.hidden = true;
    ov.innerHTML = `<div class="pv-panel" role="dialog" aria-modal="true" aria-labelledby="pv-title" tabindex="-1">
      <div class="pv-head"><span class="pv-crumb" hidden></span><h2 class="pv-title" id="pv-title"></h2>
        <div class="pv-head-actions">
          <button class="pv-back" data-pv="back">← 返回</button>
          <button class="pv-close" data-pv="close">关闭</button>
        </div></div>
      <div class="pv-body"><div class="pv-inner"></div></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pv]');
      if (!b) return;
      if (b.dataset.pv === 'back') history.back();
      else closeAll();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !ov.hidden && !$('#dialog').open) { e.preventDefault(); history.back(); }
    });
    window.addEventListener('popstate', () => sync());
  }
  function paintTop() {
    const ov = overlayEl(); if (!ov) return;
    const top = stack[stack.length - 1];
    if (!top) { ov.hidden = true; document.body.style.overflow = ''; return; }
    const item = registry[top.slug];
    ov.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.pv-title', ov).textContent = item.title;
    const crumb = $('.pv-crumb', ov);
    if (stack.length > 1) { crumb.hidden = false; crumb.textContent = '路径：' + stack.slice(0, -1).map((s) => registry[s.slug].title).join(' › '); }
    else crumb.hidden = true;
    $('.pv-inner', ov).innerHTML = item.render(top);
    /* A10：返回与关闭两个入口每层常显（一层时返回=退到主页）；关闭按钮标题态不替代返回 */
    $('.pv-back', ov).hidden = false;
    $('.pv-panel', ov).focus?.();
  }
  function open(slug, trigger) {
    ensureDom();
    const item = registry[slug];
    if (!item) { toast('该整页尚未实现'); return; }
    lastTrigger = trigger || document.activeElement;
    const depth = stack.length;
    stack.push({ slug });
    const url = depth === 0 ? `#page=${slug}` : location.hash;
    history.pushState({ pv: stack.length, slug }, '', url);
    paintTop();
    $('.pv-body', overlayEl()).scrollTop = 0;
    $('.pv-panel', overlayEl()).focus?.();
  }
  function openChild(slug, trigger) { open(slug, trigger); }
  function closeAll() {
    if (!stack.length) return;
    history.go(-stack.length);
  }
  function sync() {
    const depth = (history.state && history.state.pv) || 0;
    if (depth === 0) { stack = []; paintTop(); if (lastTrigger) { try { lastTrigger.focus(); } catch {} lastTrigger = null; } return; }
    stack = stack.slice(0, depth);
    paintTop();
  }
  function restoreFromHash() {
    const m = (location.hash || '').match(/^#page=([\w-]+)$/);
    if (!m) return false;
    if (registry[m[1]]) { open(m[1], null); return true; }
    return false;
  }
  return { open, openChild, closeAll, restoreFromHash, reg: (slug, title, render) => { registry[slug] = { title, render }; } };
})();

/* ---------------- 一图秀（16 号：每线按全期 min/max 归一化并写明不可比） ---------------- */
const CW = 980, CH = 400, CX0 = 56, CX1 = 940, CY0 = 24, CY1 = 330;
function smoothPath(coords) { /* Fritsch–Carlson 单调三次插值 */
  if (coords.length < 2) return '';
  const xs = coords.map((c) => c.x), ys = coords.map((c) => c.y);
  const n = coords.length;
  const dx = [], dy = [], m = [];
  for (let k = 0; k < n - 1; k++) { dx.push(xs[k + 1] - xs[k]); dy.push(ys[k + 1] - ys[k]); m.push(dy[k] / (dx[k] || 1)); }
  const t = [m[0]];
  for (let k = 1; k < n - 1; k++) {
    if (m[k - 1] * m[k] <= 0) t.push(0);
    else { const w1 = 2 * dx[k] + dx[k - 1], w2 = dx[k] + 2 * dx[k - 1]; t.push((w1 + w2) / (w1 / m[k - 1] + w2 / m[k])); }
  }
  t.push(m[n - 2]);
  let dstr = `M ${coords[0].x} ${coords[0].y}`;
  for (let k = 0; k < n - 1; k++) {
    const x1 = xs[k] + dx[k] / 3, y1 = ys[k] + t[k] * dx[k] / 3;
    const x2 = xs[k + 1] - dx[k] / 3, y2 = ys[k + 1] - t[k + 1] * dx[k] / 3;
    dstr += ` C ${Math.round(x1 * 10) / 10} ${Math.round(y1 * 10) / 10}, ${Math.round(x2 * 10) / 10} ${Math.round(y2 * 10) / 10}, ${coords[k + 1].x} ${coords[k + 1].y}`;
  }
  return dstr;
}
const SER_COLORS = { hb: '#22705f', wbc: '#a8650a', anc: '#7c6aae', plt: '#b23f2c', ferritin: '#6f5f9e' };
function seriesFor(code, p, t0, t1) {
  const m = metricsOf(p)[code];
  if (!m) return null;
  const inWin = m.points.filter((pt) => Date.parse(pt.d) >= t0 && Date.parse(pt.d) <= t1).sort((a, b) => a.d < b.d ? -1 : 1);
  /* 全期 min/max 归一化（写明：不同指标各按自己全期缩放，纵向占满，线与线不可比） */
  const all = m.points.map((pt) => pt.v);
  const min = Math.min(...all), max = Math.max(...all);
  const span = Math.max(1e-9, max - min);
  return { code, m, pts: inWin, min, max, span,
    yOf: (v) => CY1 - ((v - min) / span) * (CY1 - CY0) };
}
function xOf(d, t0, t1) { return CX0 + (Date.parse(d) - t0) / Math.max(1, t1 - t0) * (CX1 - CX0); }
function chartSVG(p) {
  const to = Date.parse(`${todayISO()}T23:59:59`);
  const from = state.range === '3m' ? to - 92 * DAY : Date.parse(`${DB().meta.dataStart || '2026-01-01'}T00:00:00`);
  const codes = state.sel.filter((c) => metricsOf(p)[c]);
  const bands = state.toggles.treatment ? (p.cycles || []) : [];
  const parts = [];
  parts.push(`<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="病情一图秀：所选指标趋势图（各线按该指标全期归一化，线与线不可比）">`);
  parts.push(`<rect x="0" y="0" width="${CW}" height="${CH}" fill="none" stroke="none"/>`);
  /* 治疗条与数据点分层：底层独立 <g> 画治疗带 */
  if (bands.length) {
    parts.push('<g class="treatment-layer" aria-hidden="true">');
    bands.forEach((c, k) => {
      const x0 = xOf(c.start, from, to), x1 = xOf(c.end, from, to);
      if (x1 < CX0 || x0 > CX1) return;
      parts.push(`<rect x="${Math.max(CX0, x0)}" y="${CY0}" width="${Math.max(2, Math.min(CX1, x1) - Math.max(CX0, x0))}" height="${CY1 - CY0}" fill="#22705f" opacity="0.07"/><text x="${Math.max(CX0, x0) + 6}" y="${CY0 + 16}" font-size="11" fill="#5d6f68">疗程${c.no}</text>`);
    });
    parts.push('</g>');
  }
  /* 网格与刻度 */
  const months = [];
  for (let t = from; t <= to; t += 28 * DAY) months.push(new Date(t));
  parts.push('<g class="grid-layer">');
  months.forEach((dt) => { const x = xOf(dt.toISOString().slice(0, 10), from, to); if (x >= CX0 && x <= CX1) parts.push(`<line x1="${x}" y1="${CY0}" x2="${x}" y2="${CY1}" stroke="#dbe7e1" stroke-width="1"/><text x="${x}" y="${CY1 + 22}" font-size="11" fill="#5d6f68" text-anchor="middle">${dt.getMonth() + 1}月</text>`); });
  parts.push(`<line x1="${CX0}" y1="${CY1}" x2="${CX1}" y2="${CY1}" stroke="#b9c9c2"/>`);
  parts.push('</g>');
  /* 数据层：每条线独立归一化 */
  let emptyAll = true;
  codes.forEach((code) => {
    const s = seriesFor(code, p, from, to);
    if (!s) return;
    if (s.pts.length) emptyAll = false;
    const color = SER_COLORS[code] || '#22705f';
    if (s.pts.length === 1) { /* C2 单点不连线 */
      parts.push(`<circle cx="${xOf(s.pts[0].d, from, to)}" cy="${s.yOf(s.pts[0].v)}" r="4" fill="${color}"/>`);
      return;
    }
    if (!s.pts.length) return;
    const coords = s.pts.map((pt) => ({ x: Math.round(xOf(pt.d, from, to) * 10) / 10, y: Math.round(s.yOf(pt.v) * 10) / 10 }));
    parts.push(`<path class="series" data-series="${esc(code)}" d="${smoothPath(coords)}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`);
    if (state.toggles.labels) { /* C5 只标末点 */
      const last = coords[coords.length - 1];
      const lx = Math.min(CX1 - 2, last.x + 8);
      parts.push(`<text x="${lx}" y="${last.y - 6}" font-size="11" fill="${color}">${esc(fmtNum(s.pts[s.pts.length - 1].v, s.m.dec))}</text>`);
    }
  });
  if (emptyAll) { /* C3 空窗口给空态（svg 子节点非空） */
    parts.push(`<text x="${CW / 2}" y="${(CY0 + CY1) / 2}" font-size="15" fill="#5d6f68" text-anchor="middle">没有所选指标在这个时间窗内的记录；换个指标或回到「全部」再试。</text>`);
  }
  parts.push('</svg>');
  return parts.join('');
}
function chartLegend(p) {
  const all = Object.entries(metricsOf(p));
  return `<div class="legend">${all.map(([code, m]) => `<label><input type="checkbox" data-action="sel" value="${esc(code)}" ${state.sel.includes(code) ? 'checked' : ''}><span class="swatch" style="background:${SER_COLORS[code] || '#22705f'}"></span>${esc(m.label)}${code === 'ferritin' ? '（跨机构不连线）' : ''}</label>`).join('')}</div>
  <p class="small muted" style="margin:6px 2px 0">每条线按该指标全期最低—最高归一化占满纵向空间；不同指标的线与线不可比，只看各自走势。</p>`;
}

/* ---------------- 3D 指标卡 ---------------- */
function sparklineSVG(pts, color, dec, connect) {
  if (!pts.length) return '';
  const W = 240, H = 92, X0 = 8, X1 = W - 8, Y0 = 10, Y1 = H - 14;
  const min = Math.min(...pts.map((x) => x.v)), max = Math.max(...pts.map((x) => x.v));
  const span = Math.max(1e-9, max - min);
  const coords = pts.map((pt) => ({ x: X0 + (Date.parse(pt.d) - Date.parse(pts[0].d)) / Math.max(1, Date.parse(pts[pts.length - 1].d) - Date.parse(pts[0].d)) * (X1 - X0), y: Y1 - ((pt.v - min) / span) * (Y1 - Y0) }));
  let out = `<svg class="bspark" viewBox="0 0 ${W} ${H}" role="img" aria-label="趋势缩略图">`;
  if (pts.length === 1) out += `<circle cx="${coords[0].x}" cy="${coords[0].y}" r="4" fill="${color}"/>`;
  else {
    if (connect) out += `<path d="${smoothPath(coords)}" fill="none" stroke="${color}" stroke-width="2"/>`;
    coords.forEach((c) => { out += `<circle cx="${c.x}" cy="${c.y}" r="2.6" fill="${color}"/>`; });
    if (!connect) out += `<text x="${W - 10}" y="${Y1 + 12}" font-size="10" fill="#5d6f68" text-anchor="end">跨机构/方法，不连线</text>`;
  }
  return out + '</svg>';
}
function metricCard(p, code) {
  const m = metricsOf(p)[code];
  const last = lastPoint(p, code);
  const diff = diffOf(p, code);
  const flipped = state.flipped.has(code);
  const pts = (m.points || []).slice().sort((a, b) => a.d < b.d ? -1 : 1);
  const groups = comparables(p, code);
  const connect = groups.size === 1; /* 只有一个可比组才连线 */
  const diffText = !diff ? '首次记录' : !diff.comparable ? '跨方法/机构，不可比' : `较上次 ${diff.delta > 0 ? '+' : ''}${fmtNum(diff.delta, diff.dec)} ${diff.unit}`;
  return `<button class="mcard" data-action="flip" data-code="${esc(code)}" aria-pressed="${flipped}" aria-label="${esc(m.label)}，最近 ${esc(fmtNum(last?.v, m.dec))} ${esc(m.unit)}，点按翻面看趋势">
    <div class="mcard-inner">
      <div class="mface front">
        <div class="mtop"><span class="pill">${esc(m.cat)}</span><span class="mcat">${esc(pts.length)} 次记录</span></div>
        <div style="margin-top:10px"><span class="mval">${esc(fmtNum(last?.v, m.dec))}</span> <span class="munit">${esc(m.unit)}</span></div>
        <div class="mdiff">${esc(diffText)}<span class="muted"> · ${esc(shortDate(last?.d))}</span></div>
        <div class="msrc">来源：${esc(last?.src || last?.site || '登记记录')} · 点按看趋势</div>
      </div>
      <div class="mface back" ${flipped ? '' : 'inert aria-hidden="true"'}>
        <div class="mtop"><b>${esc(m.label)} · 走势</b><span class="mcat">${esc(m.unit)}</span></div>
        <div class="bspark-wrap" style="flex:1;min-height:0">${sparklineSVG(pts, SER_COLORS[code] || '#22705f', m.dec, connect)}</div>
        <div class="bnote">${connect ? '同一可比组内连线；跨组不连线不差值。' : '存在多个机构/方法，只画点、不连线。'}「较上次」不构成疗效结论。</div>
      </div>
    </div></button>`;
}
function metricGroups(p, limitTo) {
  const cats = [...new Set(Object.values(metricsOf(p)).map((m) => m.cat))];
  return cats.map((cat) => {
    const codes = Object.keys(metricsOf(p)).filter((c) => metricsOf(p)[c].cat === cat);
    if (limitTo && !limitTo.includes(cat)) return '';
    return section(cat, '组内卡片按分类整理；与一图秀同一份目录。') +
      `<div class="grid g2">${codes.map((c) => metricCard(p, c)).join('')}</div>`;
  }).join('');
}

/* ---------------- 各页 ---------------- */
function stageCard(p) {
  const r = rhythm90(p);
  return `<div class="stage-card">
    <h3>${esc(p.dash.sceneTitle)}</h3>
    <div class="days">${esc(p.dash.anchorDays)} 天</div>
    <p class="muted small" style="margin:2px 0 8px">${esc(p.dash.anchorLabel)}（${esc(longDate(p.anchor))}）至今 · ${esc(p.dash.stage)}</p>
    <p class="small" style="margin:2px 0">${esc(p.dash.modeNote)}</p>
    <p class="small muted" style="margin:6px 0 0">下次：${esc(p.dash.nextVisit)}</p>
    <div class="actions" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="soft" data-primer-open>疾病概要：骨髓增生异常综合征是什么？</button>
      ${aiBtn('home', '和 AI 讨论我的看板')}
    </div>
  </div>`;
}
function rhythmCard(p) {
  const r = rhythm90(p);
  const has = r.rows.length > 0;
  const maxC = Math.max(1, ...r.months.map((m) => m.count));
  const bars = r.months.map((m) => `<div style="display:flex;align-items:flex-end;gap:6px;flex:1;min-width:0;flex-direction:column;align-items:center"><div style="height:${has ? Math.round(8 + (m.count / maxC) * 56) : 8}px;width:34px;background:${m.count ? 'var(--accent-transf)' : 'var(--line)'};border-radius:6px"></div><span class="small muted">${esc(m.label)} · ${m.count} 次</span></div>`).join('');
  return `<div class="card">
    <div class="mtop" style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b>近 90 天输血节奏</b>${pill(`${r.rows.length} 次`, r.rows.length ? 'transf' : 'grey')}</div>
    <div style="display:flex;gap:10px;margin-top:12px">${bars}</div>
    <p class="small muted" style="margin:10px 2px 0">${has ? `近 90 天 ${r.rows.length} 次 · 红细胞共 ${totalUnits(p, '红细胞')} 单位；明细与口径见「输血与铁监测」。` : '近 90 天没有输血记录；是否需要输血由医生决定，本台只做记录。'}</p>
  </div>`;
}
function home(p) {
  const pr = privateRatio(p);
  const symptoms = p.symptoms || [];
  const lastHb = lastPoint(p, 'hb');
  const ironLast = lastPoint(p, 'ferritin');
  const iron = metricsOf(p).ferritin;
  const paired = symptoms.length > 0 && !!lastHb;
  return head('看板', SUBTITLES.home) + `<div class="grid g2" style="margin-top:14px">
    ${stageCard(p)}
    ${rhythmCard(p)}
  </div>
  ${section('整页视图入口', '报告、化验与大图开整页，不塞弹窗。')}
  <div class="grid g3">
    <button class="card" data-open="pathology">骨髓穿刺报告（整页）</button>
    <button class="card" data-open="labs">化验记录（整页大表）</button>
    <button class="card" data-open="chart">病情一图秀（整页）</button>
  </div>
  ${section('最近血象与铁', '来自唯一演示数据源；卡片可翻面看走势。', go('去血象与指标 →', 'labs', '', 'linkish'))}
  <div class="grid g2">${Object.keys(metricsOf(p)).filter((c) => ['hb', 'plt'].includes(c)).map((c) => metricCard(p, c)).join('')}</div>
  ${section('提醒：身体感受 与 指标记录 两列并置', paired ? '两列同时出现；本台不写因果、不写处置。' : '只有一侧有内容时不构成提醒配对。')}
  <div class="grid g2">
    <div class="card"><b>表达面（感受）</b>${symptoms.length ? `<ul class="kv" style="margin-top:8px">${symptoms.slice(-3).map((s) => `<dt>${esc(shortDate(s.d))}</dt><dd>${esc(s.label)}（${['', '轻', '中', '重'][s.level] || '—'}）：${esc(s.note)}</dd>`).join('')}</ul>` : '<p class="muted small">暂无感受记录；有记录后这里会并排展示。</p>'}</div>
    <div class="card"><b>指标面（记录）</b><ul class="kv" style="margin-top:8px">
      ${lastHb ? `<dt>${esc(shortDate(lastHb.d))}</dt><dd>血红蛋白 ${esc(fmtNum(lastHb.v, metricsOf(p).hb.dec))} ${esc(metricsOf(p).hb.unit)}</dd>` : '<dt>—</dt><dd class="muted">暂无血象记录</dd>'}
      ${ironLast && iron ? `<dt>${esc(shortDate(ironLast.d))}</dt><dd>铁蛋白 ${esc(fmtNum(ironLast.v, iron.dec))} ${esc(iron.unit)}${(comparables(p, 'ferritin').size > 1) ? '（跨机构，不比高低）' : ''}</dd>` : ''}
    </ul></div>
  </div>
  ${pr.total ? `<p class="small muted" style="margin:10px 2px 0">${pr.total} 条家庭记录中私密 ${pr.hidden} 条——看板提醒、导出、AI 上下文三处都排除。</p>` : ''}
  ${section('继续整理', '')}
  <div class="grid g3">
    ${go('资料与报告', 'records', '', 'card soft')}
    ${go('就诊与回顾', 'visits', '', 'card soft')}
    <button class="card soft" data-action="go" data-page="records">确诊依据档案</button>
  </div>`;
}
function records(p) {
  const cands = p.candidates || [];
  return head('资料与报告', SUBTITLES.records, btn('导入资料（演示）', 'import')) +
  section('确认依据档案（医生结论原文登记）', '只登记原文与日期，本台不解读。') +
  `<div class="grid g2">${(p.facts || []).map((f) => `<div class="card"><b>${esc(f.name)}</b><p style="margin:6px 0 4px">${esc(f.value)}</p><p class="small muted" style="margin:0">来源：${esc(f.source)}</p></div>`).join('') || '<div class="empty"><b>还没有登记的确认依据</b>导入报告后逐项核对入档<div class="actions">' + btn('导入资料（演示）', 'import') + '</div></div>'}</div>` +
  section('最近报告与材料', '原件状态逐份可查。') +
  `<div class="table-wrap"><table><thead><tr><th>材料</th><th>日期</th><th>类型</th><th>状态</th><th>原件</th><th></th></tr></thead><tbody>
    ${(p.docs || []).map((d) => `<tr><td>${esc(d.name)}</td><td class="nowrap">${esc(d.date ? longDate(d.date) : '未知日期')}</td><td>${esc(d.type)}</td><td>${pill(d.status, d.status === '已核对' ? '' : d.status === '待核对' ? 'warn' : 'grey')}</td><td>${d.hasFile ? '有扫描件' : '无原件'}</td><td>${btn('回看', 'doc-detail', 'linkish', `data-doc="${esc(d.id)}"`)}</td></tr>`).join('')}
  </tbody></table></div>
  <p class="scroll-hint">表格可横向滚动。</p>` +
  section('候选信息核对', '候选来自导入解析；逐项确认才进档案，拒收零副作用。') +
  (cands.length ? `<div class="grid g2">${cands.map((c) => `<div class="card"><b>${esc(c.name)}</b><p style="margin:6px 0 4px">${esc(c.value)}</p><p class="small muted" style="margin:0 0 8px">来源：${esc(c.source)}</p><div class="actions" style="display:flex;gap:8px">${btn('确认入档', 'cand-accept', 'primary', `data-cand="${esc(c.id)}"`)}${btn('先不收', 'cand-reject', `data-cand="${esc(c.id)}"`)}</div></div>`).join('')}</div>` : '<div class="empty"><b>没有待核对的候选</b>导入新资料后会出现在这里<div class="actions">' + btn('导入资料（演示）', 'import') + '</div></div>') +
  `<div style="margin-top:16px">${aiBtn('records')}</div>`;
}
function labs(p) {
  const subs = SUBPAGES.labs;
  const cur = state.sub.labs || subs[0][0];
  let body = '';
  if (cur === 'src') {
    body = section('检验来源与原件', '同一指标不同机构/方法算不同可比组。') +
      `<div class="table-wrap"><table><thead><tr><th>指标</th><th>最近日期</th><th>机构/方法</th><th>记录数</th></tr></thead><tbody>
      ${Object.entries(metricsOf(p)).map(([code, m]) => (m.points || []).slice(-1).map((pt) => `<tr><td>${esc(m.label)}</td><td class="nowrap">${esc(longDate(pt.d))}</td><td>${esc(pt.site || pt.src || '—')}</td><td>${m.points.length}</td></tr>`).join('')).join('')}
      </tbody></table></div><p class="scroll-hint">表格可横向滚动。</p>`;
  } else if (cur === 'check') {
    const cands = p.candidates || [];
    body = section('候选核对', '确认前不入图；核对后血象页与一图秀读同一值。') +
      (cands.length ? `<div class="grid g2">${cands.map((c) => `<div class="card"><b>${esc(c.name)}</b><p style="margin:6px 0 4px">${esc(c.value)}</p><p class="small muted" style="margin:0 0 8px">来源：${esc(c.source)}</p><div class="actions" style="display:flex;gap:8px">${btn('确认入档', 'cand-accept', 'primary', `data-cand="${esc(c.id)}"`)}${btn('先不收', 'cand-reject', `data-cand="${esc(c.id)}"`)}</div></div>`).join('')}</div>` : '<div class="empty"><b>没有待核对项</b>全部候选都已处理<div class="actions">' + go('去资料导入', 'records', '', '') + '</div></div>');
  } else if (cur === 'file') {
    body = section('病情档案（确认后的事实）', '确认依据与检验结果登记。') +
      `<div class="grid g2">${(p.facts || []).map((f) => `<div class="card"><b>${esc(f.name)}</b><p style="margin:6px 0 4px">${esc(f.value)}</p><p class="small muted" style="margin:0">来源：${esc(f.source)} · ${esc(longDate(f.date))}</p></div>`).join('')}</div>`;
  } else if (cur === 'cards') {
    body = section('分类指标卡', '按类别分组；翻面看走势，不上下展开。') + metricGroups(p);
  } else {
    const codes = Object.keys(metricsOf(p));
    body = section('病情汇总', '同一目录、同一来源。') +
      `<div class="table-wrap"><table><thead><tr><th>指标</th><th>类别</th><th>最近值</th><th>较上次</th><th>次数</th></tr></thead><tbody>
      ${codes.map((code) => { const m = metricsOf(p)[code]; const diff = diffOf(p, code); const last = lastPoint(p, code); return `<tr><td>${esc(m.label)}</td><td>${esc(m.cat)}</td><td class="nowrap">${esc(fmtNum(last?.v, m.dec))} ${esc(m.unit)}</td><td>${!diff ? '首次' : !diff.comparable ? '不可比' : esc((diff.delta > 0 ? '+' : '') + fmtNum(diff.delta, diff.dec))}</td><td>${m.points.length}</td></tr>`; }).join('')}
      </tbody></table></div>`;
  }
  return head('血象与指标', SUBTITLES.labs, aiBtn('labs')) + subnav() + body;
}
function chartPage(p) {
  return head('病情一图秀', SUBTITLES.chart) +
  `<div class="chart-wrap">${chartSVG(p)}</div>` +
  chartLegend(p) +
  `<div class="grid g2" style="margin-top:14px">
    <div class="card"><b>时间窗</b><div class="actions" style="margin-top:8px;display:flex;gap:8px">${btn('全部', 'range', state.range === 'all' ? 'primary' : '', 'data-range="all"')}${btn('近 3 月', 'range', state.range === '3m' ? 'primary' : '', 'data-range="3m"')}</div></div>
    <div class="card"><b>图层</b><div class="actions" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">${btn((state.toggles.treatment ? '✓ ' : '') + '治疗条', 'treatment-toggle', 'soft')}${btn((state.toggles.labels ? '✓ ' : '') + '末点数值', 'labels-toggle', 'soft')}</div><p class="small muted" style="margin:8px 0 0">治疗条与数据线分两层；关掉治疗条不改曲线。</p></div>
  </div>
  <div style="margin-top:14px">${aiBtn('chart', '和 AI 讨论这张图')}</div>`;
}
function transfusionPage(p) {
  const rows = (p.transfusions || []);
  const iron = metricsOf(p).ferritin;
  const ironLast = lastPoint(p, 'ferritin');
  const headBlock = head('输血与铁监测', SUBTITLES.transfusion, aiBtn('transfusion'));
  if (!rows.length && !iron) {
    return headBlock + `<div class="empty" style="margin-top:14px"><b>还没有输血与铁的记录</b>有记录后这里会给出节奏与对照；是否需要输血由医生决定<div class="actions">${btn('记一次输血（演示）', 'transfusion-add')}${go('去血象与指标', 'labs', '')}</div></div>`;
  }
  const ironCard = !iron ? '' : `<div class="card"><b>血清铁蛋白 趋势 与 累计输血量（只对照，不解读）</b>
    <div class="kv" style="margin-top:10px"><dt>累计红细胞</dt><dd>${totalUnits(p, '红细胞')} 单位 / ${rows.filter((x) => x.component === '红细胞').length} 次</dd>
    <dt>最近铁蛋白</dt><dd>${esc(fmtNum(ironLast?.v, iron.dec))} ${esc(iron.unit)}（${esc(longDate(ironLast?.d))}）</dd>
    <dt>可比组</dt><dd>${[...comparables(p, 'ferritin').keys()].map(esc).join('、')}</dd></div>
    ${sparklineSVG((iron.points || []).slice().sort((a, b) => a.d < b.d ? -1 : 1), SER_COLORS.ferritin, iron.dec, comparables(p, 'ferritin').size === 1)}
    <p class="small muted" style="margin:6px 0 0">输血次数多与铁蛋白升高可能有关联，也可能无关；本台只并排展示，因果与处置问医生。</p></div>`;
  const chel = (p.chelation || []);
  return headBlock +
  section('输血记录', '按次记录；输前值缺失的如实标「未记录」。', btn('记一次输血（演示）', 'transfusion-add')) +
  `<div class="table-wrap"><table><thead><tr><th>日期</th><th>成分</th><th>单位数</th><th>输前血红蛋白</th><th>机构</th><th>备注</th></tr></thead><tbody>
    ${rows.slice().sort((a, b) => a.d < b.d ? 1 : -1).map((t) => `<tr><td class="nowrap">${esc(longDate(t.d))}</td><td>${pill(t.component, t.component === '红细胞' ? 'transf' : '')}</td><td>${t.units}</td><td>${t.preHb == null ? '<span class="muted">未记录</span>' : esc(fmtNum(t.preHb, 0)) + ' g/L'}</td><td>${esc(t.site)}</td><td class="small">${esc(t.note || '')}</td></tr>`).join('')}
  </tbody></table></div><p class="scroll-hint">表格可横向滚动。</p>
  <div style="margin-top:12px">${btn('整页查看输血明细大表（可滚动）', 'pv-transfusion', 'soft')}</div>
  <div class="grid g2" style="margin-top:16px">
    ${ironCard}
    <div class="card"><b>祛铁/相关用药登记</b>${chel.length ? `<ul class="kv" style="margin-top:8px">${chel.map((c) => `<dt>${esc(longDate(c.d))}</dt><dd>${esc(c.drug)}：${esc(c.dose)}<br><span class="small muted">${esc(c.note)}</span></dd>`).join('')}</ul>` : '<p class="muted small">暂无用药登记。</p>'}<p class="small muted" style="margin:8px 0 0">只登记实际发生的用药；本台不判定用药时机，也不做铁过载分级。</p></div>
  </div>`;
}
function treatmentPage(p) {
  const cycles = p.cycles || [];
  return head('治疗与疗程', SUBTITLES.treatment, aiBtn('treatment')) +
  (cycles.length ? section('疗程折叠卡', `共 ${cycles.length} 个疗程；收起看进度，展开看每天与最低点。`) +
    `<div class="grid" style="gap:10px">${cycles.slice().reverse().map((c) => `
      <details class="phase-fold" ${state.pin === c.id ? 'open' : ''}>
        <summary><span class="pill">第 ${c.no} 程</span><b>${esc(c.drug)}</b><span class="muted small">${esc(shortDate(c.start))}–${esc(shortDate(c.end))} · 7 天</span>${c.nadir ? pill(`最低 ANC ${fmtNum(c.nadir.v, 1)}`, 'warn') : ''}<span class="caret">⌄</span></summary>
        <div class="fold-body">
          <p class="small muted" style="margin:0 0 8px">${esc(c.rest || '')}</p>
          <div class="grid" style="grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">${c.days.map((dy) => `<div class="card" style="padding:8px;text-align:center"><b class="small">${esc(shortDate(dy.d))}</b><div class="small muted">已记录</div></div>`).join('')}</div>
          ${c.nadir ? `<p class="small" style="margin:10px 2px 0">本程最低点：${esc(c.nadir.label)} ${esc(fmtNum(c.nadir.v, 1))}×10⁹/L（${esc(longDate(c.nadir.d))}）——只登记数值，不做分级。</p>` : ''}
        </div>
      </details>`).join('')}</div>` :
    `<div class="empty" style="margin-top:14px"><b>还没有疗程记录</b>观察等待期间没有疗程是正常状态；有治疗后按「一次疗程」开卡<div class="actions">${btn('开一个疗程卡（演示）', 'cycle-add')}</div></div>`) +
  `<div style="margin-top:16px">${aiBtn('treatment')}</div>`;
}
function dailyPage(p) {
  const pr = privateRatio(p);
  const orders = p.daily || [];
  const notes = p.privateNotes || [];
  const symptoms = p.symptoms || [];
  /* IP6：每页显式编辑入口 ≤1 —— 两个手工入口收进「⋯ 更多」 */
  const moreMenu = `<details class="more-menu"><summary class="chip" aria-label="更多操作">⋯ 更多</summary><div class="more-body">${btn('记一条医嘱原话（演示）', 'daily-add')}${btn('记一条感受（演示）', 'symptom-add')}</div></details>`;
  return head('日常观察', SUBTITLES.daily, aiBtn('daily')) +
  section('医生交代的观察要点（原话）', '只显示患者已确认的医嘱原话；本台不生成通用建议。', moreMenu) +
  (orders.length ? `<div class="grid g2">${orders.map((o) => `<div class="card"><p style="margin:0 0 6px">${esc(o.text)}</p><p class="small muted" style="margin:0">来源：${esc(o.source)}</p></div>`).join('')}</div>` :
    `<div class="empty"><b>还没有登记的医嘱原话</b>用「⋯ 更多」把医生交代的观察要点原话记进来<div class="actions">${btn('记一条医嘱原话（演示）', 'daily-add')}</div></div>`) +
  section('家庭记录', pr.total ? `${pr.total} 条中私密 ${pr.hidden} 条（默认私密：看板提醒、导出、AI 上下文三处都不出现）。` : '默认私密。') +
  (notes.length ? `<div class="grid g2">${notes.map((n) => `<div class="card"><p style="margin:0 0 6px">${esc(n.text)}</p><p class="small muted" style="margin:0">${esc(n.role)} · ${esc(longDate(n.d))} ${n.private ? pill('私密', 'grey') : ''}</p></div>`).join('')}</div>` : '<div class="empty"><b>没有家庭记录</b>这一栏只有家人自己看；默认不进任何导出与 AI</div>') +
  section('感受记录', '轻中重是当事人自己的标记，不是分级。') +
  (symptoms.length ? `<div class="table-wrap"><table><thead><tr><th>日期</th><th>感受</th><th>程度（自评）</th><th>说明</th></tr></thead><tbody>${symptoms.map((s) => `<tr><td class="nowrap">${esc(longDate(s.d))}</td><td>${esc(s.label)}</td><td>${['', '轻', '中', '重'][s.level] || '—'}</td><td class="small">${esc(s.note)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">暂无感受记录。</p>');
}
/* ---------------- 临床研究（35 号三步：建档→检索→匹配结果） ---------------- */
function trialFactsOf(p) {
  return [
    { name: '诊断（医生原文登记）', value: p.diagnosis, src: p.riskSource },
    { name: '风险分层（医生原话）', value: (p.facts || []).find((f) => f.name.includes('风险分层'))?.value || '未登记', src: (p.facts || []).find((f) => f.name.includes('风险分层'))?.source || '' },
    { name: '基因/分子（原文登记）', value: (p.facts || []).find((f) => f.name.includes('基因'))?.value || '未登记', src: '' },
    { name: '输血史', value: (p.transfusions || []).length ? `有（${p.transfusions.length} 次）` : '无', src: '输血记录' }
  ];
}
function trialFactsPage(p) {
  return section('第一步 · 建档', '参与条件对照用的档案事实；全部来自已核对记录，缺什么如实显示。', go('去检索 →', 'trial', 'search', 'soft')) +
  `<div class="grid g2">${trialFactsOf(p).map((f) => `<div class="card"><b>${esc(f.name)}</b><p style="margin:6px 0 4px">${esc(f.value)}</p>${f.src ? `<p class="small muted" style="margin:0">来源：${esc(f.src)}</p>` : ''}</div>`).join('')}</div>
  <p class="notice quiet" style="margin-top:12px">档案里没有的字段不补写；缺的字段在匹配结果里按「待确认」处理。</p>`;
}
function trialSearchPage(p) {
  const t = state.trial;
  const items = (p.trials || []).filter((x) => (!t.q || x.title.includes(t.q)) && (t.status === 'all' || x.status === t.status));
  return section('第二步 · 检索', '检索缓存的登记条目；登记状态未核实，以官方登记库为准。') +
  `<div class="actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
    <input style="max-width:280px" type="search" value="${esc(t.q)}" data-action-input="trial-q" placeholder="搜索标题关键词" aria-label="搜索试验标题">
    <select data-action-input="trial-status" aria-label="按状态筛选" style="max-width:160px"><option value="all">全部状态</option><option value="招募中">招募中</option><option value="不招募">不招募</option></select>
    ${btn('检索（演示缓存）', 'trial-load', 'primary')}
  </div>` +
  (!t.loaded ? `<div class="empty"><b>还没有检索</b>点「检索」读取演示缓存（本台未联网）；正式版走官方登记库双通道<div class="actions">${btn('检索（演示缓存）', 'trial-load', 'primary')}</div></div>` :
    (items.length ? `<div class="grid g2">${items.map((x) => `<div class="card"><b>${esc(x.title)}</b><p class="small" style="margin:6px 0 4px">${esc(x.phase)} · ${esc(x.status)} · ${esc(x.site)}</p><p class="small muted" style="margin:0">登记号：${esc(x.nct)} · 快照 ${esc(x.snapshot)} · ${esc(x.statusNote)}</p></div>`).join('')}</div>` : '<div class="empty"><b>没有符合条件的条目</b>换个关键词，或清空筛选再试</div>'));
}
function trialMatchBand(p, x) {
  /* 三态：字段都对得上 / 部分对得上 / 无法自动匹配；档位不是入组资格 */
  const facts = trialFactsOf(p);
  const gene = facts.find((f) => f.name.includes('基因'))?.value || '';
  const risk = facts.find((f) => f.name.includes('风险'))?.value || '';
  const title = String(x.title || '');
  const known = /演示/.test(title) && /NCT-XXXX/.test(x.nct || '');
  if (!known) return { band: 'unknown', met: 0, unmet: 0, pending: 0, reason: '条目无法结构化' };
  const mentions = { gene: /TP53|SF3B1|IDH/.test(title), risk: /较高危|较低危/.test(title), lower: /较低危/.test(title), higher: /较高危/.test(title) };
  if (!mentions.gene && !mentions.risk) return { band: 'broad', met: 0, unmet: 0, pending: 1, reason: '该条目按演示口径未给出结构化条件，全部按「待确认」处理' };
  let met = 0, unmet = 0, pending = 0;
  if (mentions.gene) { if (/未检出|野生型/.test(gene)) unmet++; else if (/阳性|突变/.test(gene)) met++; else pending++; }
  if (mentions.higher) { if (/较高危/.test(risk)) met++; else if (risk === '未登记') pending++; else unmet++; }
  if (mentions.lower) { if (/较低危/.test(risk)) met++; else if (risk === '未登记') pending++; else unmet++; }
  const band = pending > 0 ? 'partial' : (unmet > 0 ? 'partial' : 'match');
  return { band, met, unmet, pending, reason: pending ? '部分条件档案缺失，列为待确认' : '演示条件下逐字段对照完成' };
}
function trialMatchPage(p) {
  const items = (p.trials || []);
  if (!items.length) return section('第三步 · 匹配结果', '没有检索缓存就没有匹配结果。') + `<div class="empty"><b>先完成检索</b>匹配结果只对已检索的条目生成<div class="actions">${go('去检索', 'trial', 'search', '')}</div></div>`;
  const rows = items.map((x) => {
    const r = trialMatchBand(p, x);
    const bandText = r.band === 'match' ? '字段都对得上' : r.band === 'partial' ? '部分对得上' : '无法自动匹配';
    return `<tr><td>${esc(x.nct)}</td><td>${esc(x.title)}</td><td>${pill(bandText, r.band === 'match' ? '' : r.band === 'partial' ? 'warn' : 'grey')}</td><td>${r.pending ? pill('待确认 ×' + r.pending, 'warn') : '—'}</td><td class="small muted">${esc(r.reason)}</td></tr>`;
  }).join('');
  return section('第三步 · 匹配结果', '检索线索加证据链；档位不是入组资格。') +
  `<div class="notice" style="margin-bottom:10px">「字段都对得上 / 部分对得上」是字段对照的结果，<b>不是入组资格判定</b>；是否适合参加任何研究，由医生与研究中心决定。</div>
  <div class="table-wrap"><table><thead><tr><th>登记号</th><th>条目</th><th>字段对照</th><th>待确认</th><th>说明</th></tr></thead><tbody>${rows}</tbody></table></div><p class="scroll-hint">表格可横向滚动。</p>
  <p class="small muted" style="margin:10px 2px 0">全部条目为演示占位、登记状态未核实，以官方登记库为准；快照 ${esc(items[0].snapshot || '—')}。本台不提供匹配指数，也不设任何判读列。</p>`;
}
function trialPage(p) {
  const subs = SUBPAGES.trial;
  const cur = state.sub.trial || subs[0][0];
  const body = cur === 'facts' ? trialFactsPage(p) : cur === 'search' ? trialSearchPage(p) : trialMatchPage(p);
  return head('临床研究', SUBTITLES.trial, aiBtn('trial')) + subnav() + body;
}
function visitsPage(p) {
  const qs = (p.questions || []);
  const pub = filterPrivate(qs);
  return head('就诊与回顾', SUBTITLES.visits, aiBtn('visits')) +
  section('问题清单', `勾选要带去复诊的问题；${qs.length} 条中私密 0 条（家属记录默认不出现在导出）。`) +
  `<div class="grid g2">${qs.map((q) => `<div class="card"><label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" style="width:auto" data-action-input="qsel" data-q="${esc(q.id)}" ${q.selected ? 'checked' : ''}><span>${esc(q.text)}<br><span class="small muted">${esc(q.source)}</span></span></label></div>`).join('') || '<div class="empty"><b>还没有问题</b>在别的页面点「和 AI 讨论」或手工添加<div class="actions">' + btn('加一个问题（演示）', 'question-add') + '</div></div>'}</div>
  <div class="actions" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">${btn('加一个问题（演示）', 'question-add')}${btn('导出就诊材料（CSV 文件）', 'export')}${btn('整页预览就诊材料', 'pv-visit', 'soft')}</div>
  ${section('回顾', '导出与 AI 上下文共用同一份过滤（私密不出现）。') + `<p class="small muted" style="margin:0 2px">导出内容：勾选的问题 + 资料清单 + 输血节奏摘要；格式真实的 CSV 文件保存到本机下载目录。</p>`}`;
}
function settingsModal() {
  openModal('设置（演示态）', `<h3>资料目录</h3><p>演示态：未连接真实目录。正式版在本页选择本机资料目录（主目录/桌面/下载根不可选）。</p>
  <h3>大字</h3><p>顶栏「大字 Aa」即时生效。</p>
  <h3>文档解析（MinerU）</h3><p class="notice quiet">未接入：本原型不启用云端解析；正式版接入后在此填写 Token 并如实回显来源与路径。</p>
  <h3>演示数据</h3><p>两套合成档案（A 低危初诊 / B 较高危治疗）由 demo/build-demo-data.mjs 生成，刷新重置。</p>`,
  `${btn('返回', 'close')}<button class="primary" data-action="profiles">切换演示档案</button>`);
}
function profilesModal() {
  const ps = DB().profiles;
  openModal('切换演示档案', `<p class="notice quiet">两套合成档案：A 刚确诊记录少、B 长期治疗记录多；切换后整页联动，不串档。</p>` +
    ps.map((x) => `<div class="card" style="margin-top:10px"><b>${esc(x.name)}</b><p class="small muted" style="margin:4px 0 8px">${esc(x.diagnosisShort)} · 资料 ${x.docs.length} 份 · 输血 ${(x.transfusions || []).length} 次</p>${x.id === state.profileId ? pill('当前', '') : btn('切换到这套', 'switch-profile', 'primary', `data-profile="${esc(x.id)}"`)}</div>`).join(''));
}
function docDetailModal(p, id) {
  const d = (p.docs || []).find((x) => x.id === id);
  if (!d) return;
  openModal(`材料回看 · ${d.name}`, `<div class="notice">这不是实际报告。以下为合成演示内容，不代表个人病情。</div>
  <dl class="kv" style="margin-top:10px"><dt>日期</dt><dd>${esc(d.date ? longDate(d.date) : '未知日期')}</dd><dt>类型</dt><dd>${esc(d.type)}</dd><dt>状态</dt><dd>${esc(d.status)}</dd><dt>原件</dt><dd>${d.hasFile ? '有扫描件（演示占位，不展示内容）' : '无原件'}</dd></dl>`,
  `${btn('返回工作台', 'close')}${d.hasFile ? btn('查看扫描件（整页）', 'pv-doc', 'soft', `data-doc="${esc(d.id)}"`) : ''}`);
}
function importModal() {
  openModal('导入资料（演示）', `<div class="notice quiet">演示态：不会读取任何真实文件。正式版从本机资料目录导入 PDF/图片并逐项核对。</div>
  <h3>这一步会发生什么</h3><ul class="small" style="line-height:1.8"><li>选择本机文件 → 解析为候选信息（未接入，本原型跳过）</li><li>逐项核对：确认才进档案；拒收零副作用</li><li>原件保留在本机，不上传</li></ul>`,
  `${btn('取消', 'close')}<button disabled title="演示态未接入">开始导入（未接入）</button>`);
}
function transfusionAddModal() {
  openModal('记一次输血（演示）', `<form id="bt-form"><label><span class="form-label">日期</span><input type="date" name="d" required value="${esc(todayISO())}"></label>
  <label style="margin-top:10px"><span class="form-label">成分</span><select name="component"><option>红细胞</option><option>血小板</option></select></label>
  <label style="margin-top:10px"><span class="form-label">单位数</span><input name="units" inputmode="numeric" pattern="[0-9]*" value="2" required></label>
  <label style="margin-top:10px"><span class="form-label">输前血红蛋白 g/L（可留空）</span><input name="preHb" inputmode="numeric" pattern="[0-9]*" placeholder="例如 61"></label>
  <label style="margin-top:10px"><span class="form-label">机构</span><input name="site" value="演示医院"></label></form>`,
  `${btn('取消', 'close')}<button type="submit" form="bt-form" class="primary">保存演示记录</button>`);
}
function cycleAddModal() {
  openModal('开一个疗程卡（演示）', `<form id="cyc-form"><label><span class="form-label">药品名（实际用药登记）</span><input name="drug" required placeholder="抄出院小结原文名"></label>
  <label style="margin-top:10px"><span class="form-label">开始日期</span><input type="date" name="start" required value="${esc(todayISO())}"></label>
  <label style="margin-top:10px"><span class="form-label">天数</span><input name="days" inputmode="numeric" pattern="[0-9]*" value="7" required></label></form>`,
  `${btn('取消', 'close')}<button type="submit" form="cyc-form" class="primary">保存演示疗程</button>`);
}
function questionAddModal() {
  openModal('加一个问题', `<form id="q-form"><label><span class="form-label">问题</span><textarea name="text" required maxlength="200" placeholder="复诊时想问医生的问题"></textarea></label></form>`,
  `${btn('取消', 'close')}<button type="submit" form="q-form" class="primary">保存到问题清单</button>`);
}
function dailyAddModal() {
  openModal('记一条医嘱原话', `<div class="notice quiet">只登记医生原话；本台不会替你总结成「该做什么」。</div>
  <form id="dy-form"><label style="margin-top:10px"><span class="form-label">原话内容</span><textarea name="text" required maxlength="300" placeholder="「少去人多的地方，出门戴口罩……」"></textarea></label>
  <label style="margin-top:10px"><span class="form-label">来源（谁说的、何时）</span><input name="source" required value="医生门诊记录 · ${esc(todayISO())}"></label></form>`,
  `${btn('取消', 'close')}<button type="submit" form="dy-form" class="primary">保存原话</button>`);
}
function symptomAddModal() {
  openModal('记一条感受', `<form id="sm-form"><label><span class="form-label">感受</span><select name="label"><option>乏力</option><option>头晕</option><option>出血点/瘀斑</option><option>其他</option></select></label>
  <label style="margin-top:10px"><span class="form-label">程度（自评）</span><select name="level"><option value="1">轻</option><option value="2">中</option><option value="3">重</option></select></label>
  <label style="margin-top:10px"><span class="form-label">说明</span><textarea name="note" maxlength="200" placeholder="什么时候更明显、做了什么会好一点"></textarea></label></form>`,
  `${btn('取消', 'close')}<button type="submit" form="sm-form" class="primary">保存感受</button>`);
}

/* ---------------- 导出（真实文件）与隐私过滤 ---------------- */
function exportCSV() {
  const p = prof();
  const qs = filterPrivate(p.questions || []).filter((q) => q.selected);
  const r = rhythm90(p);
  const lines = [
    `小髓宝 MdsPal 就诊材料（合成演示数据 · ${todayISO()}）`,
    `档案,${p.name}（演示）,诊断登记,${p.diagnosisShort}`,
    '',
    '带去复诊的问题',
    ...qs.map((q) => `问题,${q.text}`),
    '',
    '资料清单',
    ...(p.docs || []).map((d) => `资料,${d.name},${d.status},${d.hasFile ? '有原件' : '无原件'}`),
    '',
    '近90天输血',
    ...r.rows.map((t) => `输血,${t.d},${t.component},${t.units}单位,输前${t.preHb == null ? '未记录' : t.preHb},${t.site}`)
  ];
  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mds-visit-notes-${todayISO()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(`已导出 CSV（${qs.length} 个问题 · ${r.rows.length} 条输血；私密内容不出现）`);
}

/* ---------------- AI（34 号：mds:agent-draft 一键携带） ---------------- */
const EMBEDDED = () => window.parent && window.parent !== window;
function sendAgentDraft(prompt) {
  if (EMBEDDED()) {
    try {
      window.parent.postMessage({ type: `${APP.slug}:agent-draft`, prompt, send: true }, location.origin === 'null' ? '*' : location.origin);
      toast('已发送到 AI 对话（回复是候选，核对才采纳）');
    } catch { toast('发送失败：内容保留在输入提示里'); }
  } else {
    openModal('交给 AI 之前（演示面板）', `<div class="notice">原型独立打开，未接入 AI，不会发送任何内容。</div>
    <h3>拟带给 AI 的内容</h3><pre class="small" style="white-space:pre-wrap;background:#f4f9f7;border:1px solid var(--line);border-radius:10px;padding:10px">${esc(prompt)}</pre>
    <p class="small muted">嵌入式（壳层 iframe）形态会经 ${esc(APP.slug)}:agent-draft · send:true 直接发送；私密记录不在其中。</p>`,
    `${btn('返回', 'close')}<button disabled>未接入，无法发送</button>`);
  }
}

/* ---------------- 动作表 ---------------- */
const actions = {
  go: (el) => { if ($('#dialog').open) closeModal(); navigate(el.dataset.page, el.dataset.sub); },
  sub: (el) => { state.sub[state.page] = el.dataset.sub; render(); },
  close: closeModal,
  settings: settingsModal,
  help: () => openModal('原型操作说明', '<p style="font-size:13.5px">· 左侧切换 9 条一级线；二级页签在标题下方展开。<br>· 顶栏「?」打开疾病概要（36 号，整页四段）。<br>· 「AI 协助 ↗」是 mds:agent-draft 协议链接（34 号）：嵌入式直接发送；独立打开走演示面板（未接入）。<br>· 指标卡点按翻面（3D，194px 定高）。<br>· 全部数据为合成演示，刷新重置。</p>'),
  about: () => openModal('关于小髓宝', `<dl class="kv"><dt>版本</dt><dd>${APP.version}</dd><dt>构建日期</dt><dd>${APP.build}</dd><dt>形态</dt><dd>HTML 交互原型（全部合成演示数据）</dd><dt>接入</dt><dd>未接入 DSH / AI / 云端解析</dd></dl>`),
  font: () => {
    const large = document.body.classList.toggle('large');
    $('#font-toggle').setAttribute('aria-pressed', String(large));
    $('#font-toggle').textContent = large ? '标准字 Aa' : '大字 Aa';
  },
  profiles: profilesModal,
  'open-store': () => toast('演示态：资料目录未连接（正式版在此选择本机目录）'),
  'switch-profile': (el) => {
    state.profileId = el.dataset.profile; state.flipped = new Set(); state.trial.loaded = false;
    closeModal(); render(); toast('已切换演示档案：整页数据联动，不串档');
  },
  import: importModal,
  'doc-detail': (el) => docDetailModal(prof(), el.dataset.doc),
  'cand-accept': (el) => {
    const p = prof(); const idx = (p.candidates || []).findIndex((c) => c.id === el.dataset.cand);
    if (idx >= 0) { const c = p.candidates.splice(idx, 1)[0]; (p.facts = p.facts || []).push({ id: uid('f'), name: c.name, value: c.value, source: c.source + '（已核对）', date: todayISO() }); toast('已入档（演示）；拒收零副作用，确认可追溯'); }
    render();
  },
  'cand-reject': (el) => {
    const p = prof(); const idx = (p.candidates || []).findIndex((c) => c.id === el.dataset.cand);
    if (idx >= 0) p.candidates.splice(idx, 1)[0];
    toast('已拒收（演示）：档案不变，候选移出列表');
    render();
  },
  flip: (el) => {
    const code = el.dataset.code;
    if (state.flipped.has(code)) state.flipped.delete(code); else state.flipped.add(code);
    const pressed = state.flipped.has(code);
    el.setAttribute('aria-pressed', String(pressed));
    const back = $('.mface.back', el);
    if (pressed) { back.removeAttribute('inert'); back.removeAttribute('aria-hidden'); }
    else { back.setAttribute('inert', ''); back.setAttribute('aria-hidden', 'true'); }
  },
  range: (el) => { state.range = el.dataset.range; render(); },
  'treatment-toggle': () => { state.toggles.treatment = !state.toggles.treatment; render(); },
  'labels-toggle': () => { state.toggles.labels = !state.toggles.labels; render(); },
  'trial-load': () => { state.trial.loaded = true; render(); toast('已读取演示缓存；正式版走官方登记库双通道，状态未核实'); },
  'transfusion-add': transfusionAddModal,
  'cycle-add': cycleAddModal,
  'question-add': questionAddModal,
  'daily-add': dailyAddModal,
  'symptom-add': symptomAddModal,
  export: exportCSV,
  'pv-transfusion': (el) => PV.open('transfusion-detail', el),
  'pv-visit': (el) => PV.open('visit-material', el),
  'pv-doc': (el) => { closeModal(); PV.openChild('doc-original', el); }
};
document.addEventListener('click', (e) => {
  const t = e.target;
  const ai = t.closest('a[href^="' + APP.slug + ':agent-draft"]');
  if (ai) { e.preventDefault(); sendAgentDraft(aiPromptWithCtx(ai.dataset.ai)); return; }
  const pvTrigger = t.closest('[data-open]');
  if (pvTrigger) { PV.open(pvTrigger.dataset.open, pvTrigger); return; }
  const sel = t.closest('[data-action="sel"]');
  if (sel) { const v = sel.value; if (sel.checked) { if (!state.sel.includes(v)) state.sel.push(v); } else state.sel = state.sel.filter((x) => x !== v); if (!state.sel.length) state.sel = ['hb']; updateChartOnly(); return; }
  const b = t.closest('[data-action]');
  if (!b) return;
  const fn = actions[b.dataset.action];
  if (fn) fn(b);
});
function updateChartOnly() {
  const panel = $('.chart-wrap');
  if (!panel) return;
  panel.innerHTML = chartSVG(prof());
}
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('[data-action-input="trial-q"]')) { state.trial.q = el.value; }
  if (el.matches('[data-action-input="trial-status"]')) { state.trial.status = el.value; }
  if (el.matches('[data-action-input="qsel"]')) {
    const p = prof(); const q = (p.questions || []).find((x) => x.id === el.dataset.q);
    if (q) q.selected = el.checked;
  }
});
document.addEventListener('submit', (e) => {
  const f = e.target; e.preventDefault();
  const p = prof();
  const fd = new FormData(f);
  if (f.id === 'bt-form') {
    (p.transfusions = p.transfusions || []).push({ id: uid('bt'), d: fd.get('d'), component: fd.get('component'), units: Number(fd.get('units')) || 0, preHb: fd.get('preHb') ? Number(fd.get('preHb')) : null, site: fd.get('site') || '', note: '演示录入' });
    closeModal(); render(); toast('已记录演示输血；节奏卡与明细同步更新');
  } else if (f.id === 'cyc-form') {
    const n = (p.cycles || []).length + 1;
    const start = fd.get('start'); const days = Number(fd.get('days')) || 7;
    (p.cycles = p.cycles || []).push({ id: uid('cyc'), no: n, drug: `${fd.get('drug')}（实际用药登记，非推荐）`, start, end: addDaysISO(start, days - 1), days: Array.from({ length: days }, (_, k) => ({ d: addDaysISO(start, k), done: true, note: '' })), nadir: null, status: '进行中', rest: '' });
    closeModal(); render(); toast('已开疗程卡（演示）；第几个疗程按记录计次');
  } else if (f.id === 'q-form') {
    (p.questions = p.questions || []).unshift({ id: uid('q'), text: fd.get('text'), source: '本人添加 · 演示', selected: true, kind: 'fact' });
    closeModal(); render(); toast('已加入问题清单');
  } else if (f.id === 'dy-form') {
    (p.daily = p.daily || []).push({ id: uid('dy'), d: todayISO(), source: fd.get('source'), text: fd.get('text') });
    closeModal(); render(); toast('已登记医嘱原话（演示）');
  } else if (f.id === 'sm-form') {
    (p.symptoms = p.symptoms || []).unshift({ id: uid('sm'), d: todayISO(), code: 'fatigue', label: fd.get('label'), level: Number(fd.get('level')), note: fd.get('note') || '' });
    closeModal(); render(); toast('已记下感受；只作为信息，不进趋势或结论');
  }
});
const addDaysISO = (iso, n) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

/* ---------------- 整页视图注册（32 号：内容超过 1.5 屏的不塞弹窗） ---------------- */
function bigTransfusionTable(p) {
  const rows = (p.transfusions || []).slice().sort((a, b) => a.d < b.d ? 1 : -1);
  return `<div class="table-wrap"><table><thead><tr><th>#</th><th>日期</th><th>成分</th><th>单位</th><th>输前 Hb</th><th>机构</th><th>备注</th></tr></thead><tbody>
  ${rows.map((t, k) => `<tr><td>${k + 1}</td><td class="nowrap">${esc(longDate(t.d))}</td><td>${esc(t.component)}</td><td>${t.units}</td><td>${t.preHb == null ? '未记录' : esc(fmtNum(t.preHb, 0))}</td><td>${esc(t.site)}</td><td class="small">${esc(t.note || '')}</td></tr>`).join('')}
  </tbody></table></div><p class="scroll-hint">共 ${rows.length} 条；表格可横向滚动。</p>`;
}
function registerPageViews() {
  const p = prof();
  PV.reg('pathology', '病理报告', () => `
    <div class="notice">合成演示报告，不代表个人病情。</div>
    <dl class="kv" style="margin-top:12px"><dt>检查名</dt><dd>骨髓穿刺及活检（演示）</dd><dt>日期</dt><dd>${esc(longDate(((p.docs || []).find((d) => d.type === '骨髓') || {}).date))}</dd><dt>机构</dt><dd>演示医院 血液科</dd></dl>
    <h3 style="margin:14px 0 6px">报告要点（抄录登记，不解读）</h3>
    <ul class="kv">${(p.facts || []).filter((f) => /骨髓|原始细胞/.test(f.name)).map((f) => `<dt>${esc(f.name)}</dt><dd>${esc(f.value)}</dd>`).join('')}</ul>
    <h3 style="margin:14px 0 6px">抄录登记说明</h3>
    <p class="small" style="line-height:1.8">本页所有字段都来自「已核对」的报告登记：报告原文、日期、机构逐项可回溯；候选信息未经确认不会出现在这里。</p>
    <p class="small" style="line-height:1.8">原始细胞比例、发育异常描述、染色体与基因结果分别登记在「资料与报告」的确认依据档案里；本台不把任何一项换算成诊断或分层结论。</p>
    <p class="small" style="line-height:1.8">报告的扫描件状态在明细表中标注「有原件 / 无原件」；无原件的条目在导出与 AI 上下文中保留「未取得原件」标注。</p>
    <p class="small" style="line-height:1.8">如果你在纸质报告上看到与本页不一致的数值，以纸质报告为准，并在「资料与报告」发起更正——更正会保留历史版本。</p>
    <p style="margin-top:14px"><button class="pv-btn soft" data-action="pv-doc">查看报告原文摘录（整页）</button></p>`);
  PV.reg('doc-original', '报告原文摘录（演示）', () => `
    <p class="small muted">演示摘录；正式版在此展示原件扫描页与逐字段候选核对。</p>
    <blockquote style="border-left:3px solid var(--line);margin:10px 0;padding:2px 12px;color:var(--muted)">「骨髓增生明显活跃，粒红比…（演示文本，非真实报告）」</blockquote>
    <p class="small">本台只抄写原文，不判断结果含义。</p>`);
  PV.reg('labs', '化验记录', () => {
    const ms = metricsOf(p);
    const rows = Object.entries(ms).flatMap(([code, m]) => (m.points || []).map((pt) => ({ code, m, pt }))).sort((a, b) => a.pt.d < b.pt.d ? 1 : -1);
    return `<div class="table-wrap"><table><thead><tr><th>日期</th><th>指标</th><th>结果</th><th>单位</th><th>机构/方法</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td class="nowrap">${esc(longDate(r.pt.d))}</td><td>${esc(r.m.label)}</td><td>${esc(fmtNum(r.pt.v, r.m.dec))}</td><td>${esc(r.m.unit)}</td><td>${esc(r.pt.site || r.pt.src || '—')}</td></tr>`).join('')}
    </tbody></table></div><p class="scroll-hint">共 ${rows.length} 条；表格可横向滚动。跨机构同一指标是不同可比组。</p>`;
  });
  PV.reg('chart', '病情一图秀（整页）', () => `<div class="chart-wrap">${chartSVG(p)}</div>${chartLegend(p)}`);
  PV.reg('transfusion-detail', '输血明细大表', () => bigTransfusionTable(p));
  PV.reg('visit-material', '就诊材料预览（演示）', () => {
    const qs = filterPrivate(p.questions || []).filter((q) => q.selected);
    return `<div class="notice quiet">导出的文件与本页一致；私密记录（家属记录）不出现。</div>
    <h3>带去复诊的问题（${qs.length}）</h3><ol class="small" style="line-height:1.9">${qs.map((q) => `<li>${esc(q.text)}</li>`).join('')}</ol>
    <h3>近 90 天输血节奏</h3><p class="small">${esc(rhythm90(p).rows.length)} 次 / 红细胞 ${totalUnits(p, '红细胞')} 单位</p>`;
  });
}

/* ---------------- 渲染与导航 ---------------- */
const VIEWS = { home, records, labs, chart: chartPage, transfusion: transfusionPage, treatment: treatmentPage, daily: dailyPage, trial: trialPage, visits: visitsPage };
function navigate(page, sub) {
  state.page = page;
  if (sub) state.sub[page] = sub;
  render();
  $('#main').scrollTop = 0;
}
function render() {
  const p = prof();
  $('#profile-avatar').textContent = p.name.slice(0, 1);
  $('#profile-name').textContent = `${p.name.replace('（演示）', '')}的资料`;
  $('#profile-meta').textContent = `${p.diagnosisShort} · ${p.id === 'demo-a' ? '档案 A' : '档案 B'}`;
  $('#nav').innerHTML = PAGES.map(([id, label, ic]) => `<button class="nav-button" data-action="go" data-page="${id}" ${state.page === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(label)}</span></button>`).join('');
  $('#breadcrumb').textContent = (PAGES.find((x) => x[0] === state.page) || [state.page, state.page])[1];
  $('#main').innerHTML = `<div class="page-enter">${(VIEWS[state.page] || home)(p)}</div>`;
  window.DiseasePrimer?.mount?.();
}
/* 深链接：index.html#labs 或 #trial/检索（页面级） */
function applyHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  if (!raw || raw.startsWith('page=')) return false;
  const parts = raw.split('/');
  const pg = decodeURIComponent(parts[0] || '');
  const s = parts[1] ? decodeURIComponent(parts[1]) : '';
  if (!PAGES.some((x) => x[0] === pg)) return false;
  state.page = pg;
  if (s && (SUBPAGES[pg] || []).some((x) => x[0] === s)) state.sub[pg] = s;
  return true;
}
function init() {
  const ps = DB().profiles;
  if (!ps.length) { $('#main').innerHTML = '<div class="empty">演示数据缺失：请先运行 node demo/build-demo-data.mjs</div>'; return; }
  state.profileId = ps[0].id;
  registerPageViews();
  if (!PV.restoreFromHash() && applyHash()) render(); else render();
  window.addEventListener('hashchange', () => { if (applyHash()) { render(); $('#main').scrollTop = 0; } });
}
init();
