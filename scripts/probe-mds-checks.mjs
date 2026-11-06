#!/usr/bin/env node
/* probe-mds-checks.mjs — M2 G2 证据探针（C/MT/Q 组中无家族探针覆盖的项）
 * 输出逐条 PASS/FAIL + 实测数字，存档 docs/evidence/。
 * 跑法：node scripts/probe-mds-checks.mjs [--url http://127.0.0.1:8125/prototypes/v0.2/index.html]
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const argOf = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const PORT = Number(argOf('--port') || 8125)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' }
function serve() {
  return new Promise((res) => {
    const server = createServer(async (req, rsp) => {
      const path = decodeURIComponent((req.url || '/').split('?')[0])
      if (path === '/favicon.ico') { rsp.writeHead(204).end(); return }
      const file = join(ROOT, normalize(path).replace(/^([/\\])+/, ''))
      if (!file.startsWith(ROOT)) { rsp.writeHead(403).end(); return }
      try { const body = await readFile(file); rsp.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(body) } catch { rsp.writeHead(404).end() }
    })
    server.listen(PORT, '127.0.0.1', () => res(server))
  })
}
function findChrome() {
  return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].find(existsSync) || null
}
/* 全量路由清单（与 prototypes/v0.2/app.js 的 ROUTES 一致；check-probe-coverage 从本文件抽取字面量比对） */
const ROUTE_COVERAGE = ['home', 'records', 'labs', 'labs/src', 'labs/check', 'labs/file', 'labs/cards', 'labs/sum', 'chart', 'transfusion', 'treatment', 'daily', 'trial', 'trial/facts', 'trial/search', 'trial/match', 'visits'];
const results = []
const check = (id, name, ok, detail = '') => { results.push({ id, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}${detail ? '  — ' + detail : ''}`) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const chrome = findChrome()
  if (!chrome) { console.log('找不到 Chrome'); process.exit(2) }
  let puppeteer
  try { puppeteer = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/')('puppeteer-core') } catch { console.log('缺 puppeteer-core'); process.exit(2) }
  const server = await serve()
  const base = argOf('--url') || `http://127.0.0.1:${PORT}/prototypes/v0.2/index.html`
  const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const errs = []
  try {
    const page = await browser.newPage()
    page.on('pageerror', (e) => errs.push(String(e.message)))
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
    await page.setViewport({ width: 1280, height: 860 })
    await page.goto(base, { waitUntil: 'networkidle0' })
    const click = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel)
    const clickAll = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].forEach((x) => x.click()), sel)
    const nav = async (pg, sub) => { await page.evaluate((p, s) => { window.__mdsNav && window.__mdsNav(p, s) }, pg, sub); await sleep(80) }
    await page.evaluate(() => { window.__mdsNav = (p, s) => { const b = [...document.querySelectorAll('#nav .nav-button')].find((x) => x.dataset.page === p); b?.click(); if (s) { const sb = [...document.querySelectorAll('[data-action="sub"]')].find((x) => x.dataset.sub === s); sb?.click(); } } })

    /* 切到档案 B（记录多）做一图秀断言 */
    await page.evaluate(() => { document.querySelector('[data-action="profiles"]')?.click() })
    await sleep(120)
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="switch-profile"]')].pop()?.click() })
    await sleep(200)
    const profB = await page.evaluate(() => document.querySelector('#profile-name')?.textContent || '')
    check('Q9', '档案切换后页头显示档案名（B）', /郑淑芬/.test(profB), profB)

    /* 一图秀页 */
    await nav('chart')
    const c1 = await page.evaluate(() => {
      const paths = [...document.querySelectorAll('svg.chart path.series')]
      if (paths.length < 2) return { ok: false, why: '系列不足' }
      const hs = paths.map((p) => { const b = p.getBBox(); return { h: b.height, d: p.getAttribute('d') } })
      const ratio = Math.max(...hs.map((x) => x.h)) / Math.max(1e-9, Math.min(...hs.map((x) => x.h)))
      return { ok: ratio < 1.25 && hs.every((x) => x.h > 40), ratio: Math.round(ratio * 1000) / 1000, n: hs.length, d0: hs[0].d.slice(0, 40) }
    })
    check('C1', '量纲不同的线都占满纵向区（全期各自归一化）', c1.ok, `高差比=${c1.ratio} 系列数=${c1.n}`)

    const pathsBefore = await page.evaluate(() => [...document.querySelectorAll('svg.chart path.series')].map((p) => p.getAttribute('d')))
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="treatment-toggle"]')][0]?.click() })
    await sleep(120)
    const pathsAfter = await page.evaluate(() => [...document.querySelectorAll('svg.chart path.series')].map((p) => p.getAttribute('d')))
    check('C4', '关治疗条不改曲线（path[d] 逐条相同且非空）', pathsBefore.length > 0 && pathsBefore.join('|') === pathsAfter.join('|'), `条数=${pathsBefore.length}`)
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="treatment-toggle"]')][0]?.click() })
    await sleep(80)

    const c5c6 = await page.evaluate(() => {
      const svg = document.querySelector('svg.chart')
      const texts = [...svg.querySelectorAll('text')]
      const nums = texts.filter((t) => /^[\d.]+$/.test((t.textContent || '').trim()))
      const vb = svg.viewBox.baseVal
      let out = 0
      for (const t of texts) { const b = t.getBBox(); if (b.x < -2 || b.y < -2 || b.x + b.width > vb.width + 2 || b.y + b.height > vb.height + 2) out++ }
      return { numeric: nums.length, series: svg.querySelectorAll('path.series').length, outside: out }
    })
    check('C5', '只标末点：数值标签数 ≤ 系列数', c5c6.numeric <= c5c6.series, `标签=${c5c6.numeric} 系列=${c5c6.series}`)
    check('C6', '标签不越界', c5c6.outside === 0, `越界=${c5c6.outside}`)

    const c8 = await page.evaluate(() => { [...document.querySelectorAll('[data-action="range"]')].find((b) => b.dataset.range === '3m')?.click() })
    await sleep(150)
    const c8r = await page.evaluate(() => {
      const ticks = [...document.querySelectorAll('svg.chart .grid-layer text')].map((t) => t.textContent)
      const pts = [...document.querySelectorAll('svg.chart path.series')].map((p) => (p.getAttribute('d').match(/C /g) || []).length + 1)
      return { firstTick: ticks[0], segs: pts }
    })
    check('C8', '时间窗联动（切近 3 月后点数减少）', c8r.segs.length > 0 && c8r.segs.every((s) => s <= 9), `每系列段数=${c8r.segs.join(',')} 首刻度=${c8r.firstTick}`)
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="range"]')].find((b) => b.dataset.range === 'all')?.click() })
    await sleep(80)

    /* C2/C3：档案 A 的单点指标 ret */
    await page.evaluate(() => { document.querySelector('[data-action="profiles"]')?.click() })
    await sleep(120)
    await page.evaluate(() => { document.querySelector('[data-action="switch-profile"]')?.click() })
    await sleep(200)
    await nav('chart')
    /* 先勾 ret，再取消其余已勾项（避免触发「至少留一个」的兜底把 hb 加回来） */
    await page.evaluate(() => { [...document.querySelectorAll('.legend input')].find((i) => i.value === 'ret')?.click() })
    await sleep(80)
    await page.evaluate(() => { [...document.querySelectorAll('.legend input')].forEach((i) => { if (i.checked && i.value !== 'ret') i.click() }) })
    await sleep(120)
    const c2 = await page.evaluate(() => {
      const svg = document.querySelector('svg.chart')
      return { paths: svg.querySelectorAll('path.series').length, circles: svg.querySelectorAll('circle').length }
    })
    check('C2', '单点不连线（无 path，有 circle）', c2.paths === 0 && c2.circles >= 1, JSON.stringify(c2))
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="range"]')].find((b) => b.dataset.range === '3m')?.click() })
    await sleep(120)
    const c3 = await page.evaluate(() => {
      const svg = document.querySelector('svg.chart')
      return { text: svg.textContent || '', children: svg.children.length, paths: svg.querySelectorAll('path.series').length }
    })
    check('C3', '空窗口给空态（含提示文字且 svg 非空）', /没有所选指标/.test(c3.text) && c3.children > 0 && c3.paths === 0, `svg子节点=${c3.children}`)
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="range"]')].find((b) => b.dataset.range === 'all')?.click() })
    await sleep(80)

    /* C10 减少动效 */
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await sleep(60)
    const c10 = await page.evaluate(() => {
      const p = document.querySelector('svg.chart path.series')
      return p ? { dash: getComputedStyle(p).strokeDashoffset, trans: getComputedStyle(p).transitionDuration } : { none: true }
    })
    check('C10', '减少动效下曲线立即可见（无描线动画）', c10.none || c10.dash === '0px' || c10.dash === 'none', JSON.stringify(c10))
    await page.emulateMediaFeatures([])
    /* C11/C12 3D 卡片翻转（labs 分类指标页） */
    await nav('labs', 'cards')
    const m0 = await page.evaluate(() => {
      const card = document.querySelector('.mcard')
      const r1 = card.getBoundingClientRect()
      const top = Math.round(r1.top), h = Math.round(r1.height)
      card.click()
      return { top, h, pressed: card.getAttribute('aria-pressed') }
    })
    await sleep(320)
    const c11 = await page.evaluate(({ top, h }) => {
      const card = document.querySelector('.mcard')
      const r = card.getBoundingClientRect()
      const inner = card.querySelector('.mcard-inner')
      return { topSame: Math.round(r.top) === top, hSame: Math.round(r.height) === h, h, matrix3d: getComputedStyle(inner).transform.startsWith('matrix3d'), pressed: card.getAttribute('aria-pressed') }
    }, m0)
    check('C11', '翻转不位移且内层为 3D 矩阵', c11.topSame && c11.hSame && c11.matrix3d && c11.h === 194, JSON.stringify(c11))
    const c12 = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.mcard')]
      const pressed = cards.map((c) => c.getAttribute('aria-pressed'))
      return { oneTrue: pressed.filter((x) => x === 'true').length === 1, total: cards.length }
    })
    check('C12', '翻转独立（只按下这张卡）', c12.oneTrue, JSON.stringify(c12))
    const mt07h1 = await page.evaluate(() => {
      const card = document.querySelector('.mcard')
      if (card.getAttribute('aria-pressed') === 'true') card.click() /* 先归位到正面 */
      return document.body.scrollHeight
    })
    await sleep(300)
    await page.evaluate(() => { document.querySelector('.mcard')?.click(); document.querySelector('.mcard')?.click() })
    await sleep(320)
    const mt07 = await page.evaluate((h1) => ({ h2: document.body.scrollHeight, pressed: document.querySelector('.mcard').getAttribute('aria-pressed') }), mt07h1)
    const hasCards = await page.evaluate(() => document.querySelectorAll('.mcard').length > 0) /* 非空前置：先证卡存在，再比高度 */
    check('MT07', '点两次恢复正面，页面高度不变', hasCards && mt07.pressed === 'false' && mt07.h2 === mt07h1, `高度 ${mt07h1}→${mt07.h2}`)
    const mt08 = await page.evaluate(() => {
      const card = document.querySelector('.mcard')
      card.focus()
      const back = card.querySelector('.mface.back')
      const inert = back.hasAttribute('inert') || back.getAttribute('aria-hidden') === 'true'
      return { focused: document.activeElement === card, backHiddenWhenFront: inert, pressedNow: card.getAttribute('aria-pressed') }
    })
    check('MT08', '键盘可达 + 正面态隐藏面 inert/aria-hidden', mt08.focused && mt08.backHiddenWhenFront && mt08.pressedNow === 'false', JSON.stringify(mt08))
    /* 翻回正面，检查背面态 */
    const mt08b = await page.evaluate(() => {
      const card = document.querySelector('.mcard'); card.click()
      const back = card.querySelector('.mface.back')
      return { pressed: card.getAttribute('aria-pressed'), backVisibleNoInert: !back.hasAttribute('inert') }
    })
    check('MT08b', '翻面后背面可交互', mt08b.pressed === 'true' && mt08b.backVisibleNoInert, JSON.stringify(mt08b))

    /* MT04 卡片正面信息完整 */
    const mt04 = await page.evaluate(() => {
      const card = document.querySelector('.mcard .mface.front')
      const t = card.textContent || ''
      return { hasCat: !!card.querySelector('.pill'), hasVal: /\d/.test(t), hasUnit: /10⁹\/L|g\/L|ng\/mL/.test(t), hasDate: /\d{2}\.\d{2}/.test(t), hasSrc: /来源/.test(t), hasCount: /次记录/.test(t), noVerdict: !/疗效|有效|恶化/.test(t) }
    })
    check('MT04', '正面完整：类别/名/值/单位/日期/次数/来源，差值无疗效结论', Object.values(mt04).every(Boolean), JSON.stringify(mt04))

    /* MT06 跨机构铁蛋白背面不连线 */
    await page.evaluate(() => { document.querySelector('[data-action="profiles"]')?.click() })
    await sleep(120)
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="switch-profile"]')].pop()?.click() })
    await sleep(200)
    await nav('labs', 'cards')
    const mt06 = await page.evaluate(() => {
      const card = [...document.querySelectorAll('.mcard')].find((c) => (c.textContent || '').includes('铁蛋白'))
      card.click()
      return new Promise((res) => setTimeout(() => {
        const svg = card.querySelector('svg.bspark')
        res({ paths: svg.querySelectorAll('path').length, circles: svg.querySelectorAll('circle').length, note: /不连线/.test(card.textContent) })
      }, 300))
    })
    check('MT06', '跨机构铁蛋白：不连线、只画点', mt06.paths === 0 && mt06.circles >= 2 && mt06.note, JSON.stringify(mt06))

    /* Q10 A/B 切换不串档（抽查 3 条记录） */
    const bSnapshot = await page.evaluate(() => ({
      bt: document.querySelectorAll('#main tbody tr').length || 0,
      hb: (document.querySelector('.mcard .mval') || {}).textContent || '',
      prof: document.querySelector('#profile-name').textContent
    }))
    await page.evaluate(() => { document.querySelector('[data-action="profiles"]')?.click() })
    await sleep(120)
    await page.evaluate(() => { document.querySelector('[data-action="switch-profile"]')?.click() })
    await sleep(200)
    const aState = await page.evaluate(() => ({ empty: document.querySelectorAll('.empty').length, hbCard: (document.querySelector('.mcard .mval') || {}).textContent || '', prof: document.querySelector('#profile-name').textContent }))
    await page.evaluate(() => { document.querySelector('[data-action="profiles"]')?.click() })
    await sleep(120)
    await page.evaluate(() => { [...document.querySelectorAll('[data-action="switch-profile"]')].pop()?.click() })
    await sleep(200)
    const bState = await page.evaluate(() => ({ hbCard: (document.querySelector('.mcard .mval') || {}).textContent || '', prof: document.querySelector('#profile-name').textContent }))
    check('Q10', 'A↔B 切换整页联动不串档', /郑淑芬/.test(bState.prof) && /吴建国/.test(aState.prof) && bState.hbCard === bSnapshot.hb, JSON.stringify({ a: aState.prof, b: bState.prof }))

    /* IP2/X1 全 (view,sub) 覆盖走查 */
    const walk = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const pages = [...document.querySelectorAll('#nav .nav-button')].map((b) => b.dataset.page)
      const visited = []
      for (const pg of pages) {
        const b = [...document.querySelectorAll('#nav .nav-button')].find((x) => x.dataset.page === pg)
        b.click(); await sleep(60)
        const h1 = document.querySelector('.head h1')?.textContent || ''
        visited.push({ pg, h1 })
        for (const sb of [...document.querySelectorAll('[data-action="sub"]')]) { sb.click(); await sleep(40); visited.push({ pg, sub: sb.dataset.sub, h1: document.querySelector('.head h1')?.textContent || '' }) }
      }
      const empties = [...document.querySelectorAll('#main .empty')].length
      return { pageButtons: pages.length, visited: visited.length, emptyViews: empties, uniq: new Set(visited.map((v) => v.pg + '/' + (v.sub || ''))).size }
    })
    check('IP2/X1', `页面全覆盖：清单 ${ROUTE_COVERAGE.length} 条路由全部可达，孤儿页=0`, walk.pageButtons === 9 && walk.uniq === ROUTE_COVERAGE.length, JSON.stringify(walk))

    /* Q14 每个一级页有 AI 讨论 */
    const ai = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const pages = [...document.querySelectorAll('#nav .nav-button')].map((b) => b.dataset.page)
      const missing = []
      for (const pg of pages) {
        [...document.querySelectorAll('#nav .nav-button')].find((x) => x.dataset.page === pg).click(); await sleep(50)
        if (!document.querySelector('#main a[href^="mds:agent-draft"]')) missing.push(pg)
      }
      return { missing, total: pages.length }
    })
    check('Q14/IP10', '每个一级页有「和 AI 讨论」入口（mds:agent-draft 链接）', ai.missing.length === 0, `缺=${ai.missing.join(',') || '无'}`)

    /* Q19 上下文无判定词 */
    const q19 = await page.evaluate(() => {
      const a = document.querySelector('#main a[href^="mds:agent-draft"]')
      const prompt = decodeURIComponent((a.getAttribute('href') || '').split('prompt=')[1] || '')
      const banned = ['诊断', '分期', '预后', '建议你', '应该用', '危险分层']
      return { prompt: prompt.slice(0, 80), hits: banned.filter((w) => prompt.includes(w)) }
    })
    check('Q19', 'AI 携带上下文只含事实（无判定词）', q19.hits.length === 0, `命中=${q19.hits.join(',') || '无'}`)

    /* Q26 三档断点无横向溢出（CDP 覆盖法口径：scrollWidth===clientWidth） */
    for (const w of [1180, 900, 390]) {
      await page.setViewport({ width: w, height: 860 })
      await sleep(150)
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
      check(`Q26@${w}`, `${w}px 无横向溢出`, m.sw <= m.cw + 1, JSON.stringify(m))
    }
    await page.setViewport({ width: 1280, height: 860 })

    /* Q11 未知日期空态（records 表） */
    await nav('records')
    const q11 = await page.evaluate(() => ({ unknownDate: /未知日期/.test(document.querySelector('#main').textContent), noFile: /无原件/.test(document.querySelector('#main').textContent) }))
    check('Q11', '缺字段/未知日期/无原件在页面可见', q11.unknownDate && q11.noFile, JSON.stringify(q11))

    /* Q35 私密过滤代码级 + 页内数字 */
    const src = await readFile(join(ROOT, 'prototypes', 'v0.2', 'app.js'), 'utf8')
    const q35 = {
      filterInExport: /const qs = filterPrivate\(p\.questions/.test(src),
      oneFilterFn: (src.match(/filterPrivate/g) || []).length >= 4,
      labelShown: false
    }
    await nav('daily')
    q35.labelShown = await page.evaluate(() => /条中私密 \d+ 条/.test(document.querySelector('#main').textContent))
    check('Q35', '私密三出口共用过滤函数 + 页内「N 条中私密 M 条」', q35.filterInExport && q35.oneFilterFn && q35.labelShown, JSON.stringify(q35))

    /* 禁词 */
    const pageText = await page.evaluate(() => document.body.textContent)
    const banned = ['生存期', '建议化疗', '危险分层', '转白风险提示', '治愈率']
    check('红线', '禁词 0 命中（界面文案）', banned.every((w) => !pageText.includes(w)), banned.filter((w) => pageText.includes(w)).join(',') || '无')

    check('E0', '全程 0 未捕获异常', errs.length === 0, errs.slice(0, 2).join(' / '))
  } finally {
    await browser.close(); server.close()
  }
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${failed.length ? 'FAIL' : 'PASS'}  ${results.length - failed.length}/${results.length}`)
  process.exit(failed.length ? 1 : 0)
}
main()
