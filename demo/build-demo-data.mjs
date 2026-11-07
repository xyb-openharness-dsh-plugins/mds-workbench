#!/usr/bin/env node
/* demo/build-demo-data.mjs — 演示数据唯一源（L30 教训：原型与生成器分叉是假唯一源）
 *
 * 产物两份，同一对象 JSON.stringify 逐字一致：
 *   demo/demo-data.json            事实层基准（M3/M5 与 parity 测试读它）
 *   prototypes/v0.2/demo-data.js   window.DEMO_DATA 字面量（原型 <script> 直接加载）
 *
 * 两套合成档案（硬要求：缺一套 M2 不成立）：
 *   A 低危初诊 · 观察等待 —— 记录少、多处未知、零输血（空态路径）
 *   B 较高危 · 去甲基化治疗 —— 疗程多、输血多、指标与文档都多
 * 全部人物与数值为合成示例，不指向任何真实患者。
 *
 * 运行：node demo/build-demo-data.mjs
 * 校验：npm run check 里由 check-workbench-package.mjs 触发 demo 唯一源比对（M5 起）。
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const TODAY = '2026-11-07'
const DATA_START = '2026-03-02'

/* ---------- 工具：确定性生成，不用随机 ---------- */
const d = (iso) => iso
const addDays = (iso, n) => {
  const t = new Date(`${iso}T00:00:00Z`)
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}
const step = (base, seq) => seq[i = (i + 1) % seq.length]
let i = 0

/* ---------- B 档案：高危 · 去甲基化治疗（记录多） ---------- */
/* 血红蛋白序列：输血抬升后缓慢回落（每 3–4 周一输），24 点 */
function hbSeriesB() {
  const pts = []
  let v = 62
  const day0 = '2026-03-02'
  for (let k = 0; k < 24; k++) {
    const dt = addDays(day0, k * 12)
    v = v - 6 + (k % 3 === 0 ? 26 : 0)
    if (v < 55) v = 58
    if (v > 96) v = 92
    pts.push({ d: dt, v, src: '门诊血常规' })
  }
  return pts
}
/* 白细胞 / 中性粒细胞 / 血小板：疗程内压低、间歇回升 */
function cbcSeriesB() {
  const out = { wbc: [], anc: [], plt: [] }
  const day0 = '2026-03-02'
  for (let k = 0; k < 24; k++) {
    const dt = addDays(day0, k * 12)
    const dip = (k % 4 === 1 || k % 4 === 2) ? 1 : 0
    const wbc = dip ? 1.4 + (k % 3) * 0.2 : 2.6 + (k % 5) * 0.5
    out.wbc.push({ d: dt, v: Math.round(wbc * 10) / 10, src: '门诊血常规' })
    out.anc.push({ d: dt, v: Math.round(wbc * 0.45 * 10) / 10, src: '门诊血常规' })
    out.plt.push({ d: dt, v: dip ? 18 + (k % 3) * 4 : 52 + (k % 6) * 9, src: '门诊血常规' })
  }
  return out
}
/* 铁蛋白：随输血累计缓慢抬升（跨两机构 → 可比组断线素材） */
function ferritinB() {
  return [
    { d: '2026-03-05', v: 820, src: '市一院 · 生化（免疫比浊）', site: '市一院' },
    { d: '2026-04-16', v: 1050, src: '市一院 · 生化（免疫比浊）', site: '市一院' },
    { d: '2026-05-28', v: 1280, src: '市一院 · 生化（免疫比浊）', site: '市一院' },
    { d: '2026-06-20', v: 1390, src: '省肿瘤医院 · 免疫科（化学发光）', site: '省肿瘤医院' },
    { d: '2026-07-30', v: 1465, src: '省肿瘤医院 · 免疫科（化学发光）', site: '省肿瘤医院' },
    { d: '2026-08-24', v: 1510, src: '市一院 · 生化（免疫比浊）', site: '市一院' },
    { d: '2026-09-26', v: 1602, src: '市一院 · 生化（免疫比浊）', site: '市一院' },
    { d: '2026-10-31', v: 1688, src: '市一院 · 生化（免疫比浊）', site: '市一院' }
  ]
}
/* 输血 14 次：红细胞 11 + 血小板 3，其中 2 次缺输前值（显式 null） */
function transfusionsB() {
  const rows = []
  const redDates = ['03-04', '03-25', '04-15', '05-06', '05-27', '06-17', '07-08', '07-29', '08-19', '09-23', '10-28']
  const preHb = [61, null, 58, 63, null, 59, 60, 62, 58, 61, 57]
  redDates.forEach((md, k) => {
    rows.push({ id: `bt-r${k + 1}`, d: `2026-${md}`, component: '红细胞', units: k % 4 === 3 ? 3 : 2, preHb: preHb[k], site: k % 5 === 4 ? '省肿瘤医院' : '市一院', note: k === 1 ? '输血记录单未拍照，输前值缺' : '' })
  })
  ;['04-02', '06-24', '09-09'].forEach((md, k) => {
    rows.push({ id: `bt-p${k + 1}`, d: `2026-${md}`, component: '血小板', units: 1, preHb: null, site: '市一院', note: '治疗性单采血小板 1 个治疗量' })
  })
  return rows.sort((a, b) => a.d < b.d ? -1 : 1)
}
/* 去甲基化疗程 6 个（折叠卡） */
function cyclesB() {
  const cycles = []
  let start = '2026-03-09'
  for (let n = 1; n <= 6; n++) {
    const days = []
    for (let k = 0; k < 7; k++) {
      days.push({ d: addDays(start, k), done: true, note: k === 0 ? '第 1 天，门诊日间病房' : k === 6 ? '第 7 天，本程结束' : '' })
    }
    cycles.push({
      id: `cyc${n}`, no: n, drug: '阿扎胞苷（实际用药登记，非推荐）',
      start, end: addDays(start, 6), rest: addDays(start, 7) + ' 起，休息 3 周（出院小结口径）',
      days,
      nadir: n >= 2 ? { code: 'anc', label: '中性粒细胞绝对值', v: [1.1, 0.6, 0.8, 0.5, 0.7, 0.6][n - 1], d: addDays(start, 12) } : null,
      status: n === 6 ? '已结束' : '已结束'
    })
    start = addDays(start, 28)
  }
  return cycles
}

const profileB = {
  id: 'demo-b', name: '郑淑芬（演示）', age: 73, gender: '女',
  diagnosis: '骨髓增生异常综合征 · 较高危组（医生结论原文登记，本台不判定）（演示）',
  diagnosisShort: 'MDS 较高危 · 阿扎胞苷 6 程中（演示）',
  riskLine: '医生原话（2026-03-10 门诊）：「按 IPSS-R 属较高危组」——本台只登记原话，不换算',
  riskSource: '门诊病历 · 2026-03-10',
  caregiver: '郑建国（演示）· 弟弟 · 代管资料',
  anchor: '2026-03-09', anchorLabel: '第 1 个疗程开始日',
  dash: {
    stage: '阿扎胞苷第 6 程已结束 · 休息期（按医生安排）',
    anchorDays: 243,
    nextVisit: '2026-11-18（复查血象 + 铁蛋白，以医院通知为准）',
    rhythm90: null, /* 由 app 计算 */
    modeNote: '血象与输血节奏由记录汇总；何时治疗、何时输血由医生决定。',
    sceneTitle: '现在到哪一步了'
  },
  docs: [
    { id: 'bd1', name: '骨髓穿刺报告 · 初诊', date: '2026-03-06', type: '骨髓', status: '已核对', hasFile: true },
    { id: 'bd2', name: '染色体核型报告', date: '2026-03-08', type: '细胞遗传学', status: '已核对', hasFile: true },
    { id: 'bd3', name: '分子检测报告（SF3B1/TP53 等）', date: '2026-03-09', type: '分子', status: '已核对', hasFile: true },
    { id: 'bd4', name: '出院小结 · 第 1 程', date: '2026-03-16', type: '住院', status: '已核对', hasFile: true },
    { id: 'bd5', name: '门诊血常规 · 近期', date: '2026-10-31', type: '检验', status: '已核对', hasFile: true },
    { id: 'bd6', name: '出院小结 · 第 5 程', date: '2026-09-30', type: '住院', status: '待核对', hasFile: true },
    { id: 'bd7', name: '输血记录单（2 张）', date: null, type: '输血', status: '待核对', hasFile: false },
    { id: 'bd8', name: '铁蛋白化验单 · 省肿瘤', date: '2026-07-30', type: '检验', status: '已核对', hasFile: true }
  ],
  candidates: [
    { id: 'bc1', name: '第 6 疗程结束日期', value: '2026-11-01', source: '出院小结 · 第 6 程 · 第 1 页', status: 'candidate' },
    { id: 'bc2', name: '下次复查项目', value: '血常规 + 铁蛋白', source: '门诊病历 · 2026-10-31', status: 'candidate' },
    { id: 'bc3', name: '输血记录单日期', value: '原文手写不清', source: '输血记录单 · 扫描件', status: 'needs_review' }
  ],
  facts: [
    { id: 'bf1', name: '骨髓原始细胞比例', value: '医生记录原文：8%', source: '骨髓穿刺报告 · 2026-03-06', date: '2026-03-06' },
    { id: 'bf2', name: '染色体核型', value: '医生记录原文：正常核型', source: '染色体核型报告 · 2026-03-08', date: '2026-03-08' },
    { id: 'bf3', name: '基因检测', value: '医生记录原文：SF3B1 突变阳性；TP53 未检出', source: '分子检测报告 · 2026-03-09', date: '2026-03-09' },
    { id: 'bf4', name: '风险分层（医生原话）', value: '「按 IPSS-R 属较高危组」', source: '门诊病历 · 2026-03-10', date: '2026-03-10' }
  ],
  metrics: {
    hb: { cat: '血象', label: '血红蛋白', unit: 'g/L', dec: 0, points: hbSeriesB() },
    wbc: { cat: '血象', label: '白细胞', unit: '10⁹/L', dec: 1, points: cbcSeriesB().wbc },
    anc: { cat: '血象', label: '中性粒细胞绝对值', unit: '10⁹/L', dec: 1, points: cbcSeriesB().anc },
    plt: { cat: '血象', label: '血小板', unit: '10⁹/L', dec: 0, points: cbcSeriesB().plt },
    ferritin: { cat: '铁代谢', label: '血清铁蛋白', unit: 'ng/mL', dec: 0, points: ferritinB() }
  },
  transfusions: transfusionsB(),
  chelation: [
    { id: 'ch1', d: '2026-07-02', drug: '去铁酮（实际用药登记，非推荐）', dose: '医生处方原话：按说明书剂量', note: '铁蛋白持续升高后医生开具；本台不判定用药时机' },
    { id: 'ch2', d: '2026-10-05', drug: '去铁酮（实际用药登记，非推荐）', dose: '继续原方案', note: '复诊续方' }
  ],
  cycles: cyclesB(),
  daily: [
    { id: 'dy1', d: '2026-03-12', source: '医生门诊记录 · 2026-03-12', text: '「化疗后 7–14 天血象最低，这段时间少去人多的地方，出门戴口罩；每天测体温，超过 38 度就给病区打电话。」' },
    { id: 'dy2', d: '2026-04-20', source: '护士站宣教 · 2026-04-20', text: '「牙龈出血或身上瘀斑变多，先用清水漱口，别用硬毛牙刷，下次复诊时告诉医生。」' }
  ],
  privateNotes: [
    { id: 'pn1', d: '2026-05-11', text: '姐姐这周情绪很低，夜里睡不好，说输血越输越勤害怕以后更依赖。', role: '家属记录 · 郑建国', private: true },
    { id: 'pn2', d: '2026-08-02', text: '她自己不想让街坊知道病情，复诊都说成「常规体检」，材料在家人间传看要注意。', role: '家属记录 · 郑建国', private: true }
  ],
  symptoms: [
    { id: 'sm1', d: '2026-04-12', code: 'fatigue', label: '乏力', level: 2, note: '上午还能买菜，下午必须躺一会儿' },
    { id: 'sm2', d: '2026-06-05', code: 'fatigue', label: '乏力', level: 1, note: '输血后两天明显轻一些' },
    { id: 'sm3', d: '2026-09-15', code: 'dizzy', label: '头晕', level: 1, note: '蹲下起来时明显' }
  ],
  trials: [
    { id: 'tr1', nct: 'NCT-XXXX01（演示）', title: '去甲基化药物联合方案在较高危骨髓增生异常肿瘤中的 III 期研究（演示条目）', phase: 'III 期', status: '招募中', site: '多中心（含国内站点，未核实）', statusNote: '登记状态未核实，以官方登记库为准', snapshot: '2026-11-07' },
    { id: 'tr2', nct: 'NCT-XXXX02（演示）', title: '较低危骨髓增生异常肿瘤贫血方向的红细胞成熟剂研究（演示条目）', phase: 'II 期', status: '不招募', site: '国内单中心（未核实）', statusNote: '登记状态未核实，以官方登记库为准', snapshot: '2026-11-07' },
    { id: 'tr3', nct: 'NCT-XXXX03（演示）', title: 'TP53 突变骨髓增生异常肿瘤的靶向联合研究（演示条目）', phase: 'I/II 期', status: '招募中', site: '多中心（未核实）', statusNote: '登记状态未核实，以官方登记库为准', snapshot: '2026-11-07' }
  ],
  questions: [
    { id: 'bq1', text: '这半年输了 11 次红细胞，输血间隔在变短，下次复诊要不要把这个节奏给医生看？', source: '输血记录衍生 · 家属保留', selected: true, kind: 'fact' },
    { id: 'bq2', text: '铁蛋白从 820 涨到 1688，祛铁药继续吃还是先做别的检查？', source: '铁蛋白趋势衍生 · 家属保留', selected: true, kind: 'fact' },
    { id: 'bq3', text: '第 6 程结束后什么时候评估下一步？需要提前准备哪些材料？', source: '家属保留', selected: true, kind: 'fact' },
    { id: 'bq4', text: '我觉得她最近比上一个疗程恢复得慢，是不是药该调了？', source: '家属看法 · 2026-10-20', selected: true, kind: 'view' }
  ],
  viewpoints: [
    { id: 'bv1', d: '2026-10-20', text: '我觉得她最近比上一个疗程恢复得慢。', role: 'caregiver' }
  ]
}

/* ---------- A 档案：低危初诊 · 观察等待（记录少、空态、未知多） ---------- */
const profileA = {
  id: 'demo-a', name: '吴建国（演示）', age: 68, gender: '男',
  diagnosis: '骨髓增生异常综合征 · 低危组（医生结论原文登记，本台不判定）（演示）',
  diagnosisShort: 'MDS 低危 · 观察等待中（演示）',
  riskLine: '医生原话（2026-10-14 门诊）：「按 IPSS-R 属低危组，先观察，定期查血」——本台只登记原话，不换算',
  riskSource: '门诊病历 · 2026-10-14',
  caregiver: null,
  anchor: '2026-10-14', anchorLabel: '确诊后首次门诊日',
  dash: {
    stage: '观察等待（按医生安排定期复查）',
    anchorDays: 24,
    nextVisit: '2026-11-28（复查血常规，以医院通知为准）',
    rhythm90: null,
    modeNote: '暂无输血记录；是否需要治疗由医生决定。',
    sceneTitle: '现在到哪一步了'
  },
  docs: [
    { id: 'ad1', name: '血常规 · 门诊', date: '2026-10-14', type: '检验', status: '已核对', hasFile: true },
    { id: 'ad2', name: '骨髓穿刺报告', date: '2026-10-11', type: '骨髓', status: '已核对', hasFile: false },
    { id: 'ad3', name: '体检报告（发现血象异常那一次）', date: null, type: '体检', status: '无原件', hasFile: false }
  ],
  candidates: [
    { id: 'ac1', name: '下次复查日期', value: '2026-11-28', source: '门诊病历 · 2026-10-14', status: 'candidate' }
  ],
  facts: [
    { id: 'af1', name: '骨髓原始细胞比例', value: '医生记录原文：<5%', source: '骨髓穿刺报告 · 2026-10-11', date: '2026-10-11' },
    { id: 'af2', name: '风险分层（医生原话）', value: '「按 IPSS-R 属低危组，先观察，定期查血」', source: '门诊病历 · 2026-10-14', date: '2026-10-14' }
  ],
  metrics: {
    hb: { cat: '血象', label: '血红蛋白', unit: 'g/L', dec: 0, points: [
      { d: '2026-09-30', v: 98, src: '体检血常规' },
      { d: '2026-10-14', v: 94, src: '门诊血常规' }
    ] },
    wbc: { cat: '血象', label: '白细胞', unit: '10⁹/L', dec: 1, points: [
      { d: '2026-09-30', v: 3.2, src: '体检血常规' },
      { d: '2026-10-14', v: 2.9, src: '门诊血常规' }
    ] },
    anc: { cat: '血象', label: '中性粒细胞绝对值', unit: '10⁹/L', dec: 1, points: [
      { d: '2026-09-30', v: 1.6, src: '体检血常规' },
      { d: '2026-10-14', v: 1.4, src: '门诊血常规' }
    ] },
    plt: { cat: '血象', label: '血小板', unit: '10⁹/L', dec: 0, points: [
      { d: '2026-09-30', v: 118, src: '体检血常规' },
      { d: '2026-10-14', v: 106, src: '门诊血常规' }
    ] },
    ret: { cat: '血象', label: '网织红细胞', unit: '10⁹/L', dec: 2, points: [
      { d: '2026-06-15', v: 0.062, src: '半年前血象随访（含网织）' }
    ] }
  },
  transfusions: [],
  chelation: [],
  cycles: [],
  daily: [
    { id: 'adly1', d: '2026-10-14', source: '医生门诊记录 · 2026-10-14', text: '「现在不用特殊忌口，正常吃饭；贫血会有点没力气，别勉强爬楼梯，头晕就坐下。」' }
  ],
  privateNotes: [],
  symptoms: [
    { id: 'asm1', d: '2026-10-14', code: 'fatigue', label: '乏力', level: 1, note: '爬三层楼要歇一次' }
  ],
  trials: [],
  questions: [
    { id: 'aq1', text: '血红蛋白 98 降到 94，两次都在同一家医院，这个变化需要在复诊时特别说吗？', source: '血象对比衍生 · 本人保留', selected: true, kind: 'fact' },
    { id: 'aq2', text: '观察等待期间，家里孙辈感冒要不要避开？', source: '本人保留', selected: false, kind: 'fact' }
  ],
  viewpoints: [
    { id: 'av1', d: '2026-10-20', text: '不输血不吃药反而心里没底，总怕耽误了。', role: 'patient' }
  ]
}

const DATA = {
  meta: {
    dataStart: DATA_START,
    today: TODAY,
    disclaimer: '演示数据（合成）：人物、数值与时间线不指向任何真实患者。',
    trialNote: '试验条目为演示占位（NCT 号打码）；登记状态未核实，以官方登记库为准；线索不是推荐。',
    guidelineNote: '医生原话与分类名只登记不判定；阈值与参考范围一律【待核】，未过临床审核不展示。',
    privateNote: '「家属记录」默认私密：看板提醒、导出、AI 上下文三处都不出现。'
  },
  profiles: [profileA, profileB]
}

/* ---------- 写出两份产物 ---------- */
const json = JSON.stringify(DATA, null, 2)
mkdirSync(join(ROOT, 'demo'), { recursive: true })
mkdirSync(join(ROOT, 'prototypes', 'v0.2'), { recursive: true })
writeFileSync(join(ROOT, 'demo', 'demo-data.json'), json + '\n')
const banner = '/* 由 demo/build-demo-data.mjs 生成（勿手改）。合成演示数据：人物、数值与时间线不指向任何真实患者。 */\n'
writeFileSync(join(ROOT, 'prototypes', 'v0.2', 'demo-data.js'), banner + 'window.DEMO_DATA = ' + json + '\n')
writeFileSync(join(ROOT, 'public', 'demo-data.js'), banner + 'window.DEMO_DATA = ' + json + '\n')
/* demo/demo-data.sqlite：按 schema 播种（check-demo-columns 与 demo-parity 的比对基准） */
const { DatabaseSync } = await import('node:sqlite')
const { readdirSync, rmSync } = await import('node:fs')
rmSync(join(ROOT, 'demo', 'demo-data.sqlite'), { force: true })
const db = new DatabaseSync(join(ROOT, 'demo', 'demo-data.sqlite'))
for (const f of readdirSync(join(ROOT, 'schema')).filter((x) => /^\d{4}_.*\.sql$/.test(x)).sort()) db.exec(readFileSync(join(ROOT, 'schema', f), 'utf8'))
const { seedDemo } = await import('../dsh/demo.js')
/* 复用 seedDemo 但指向本 demo 数据（demo.js 读同一份 JSON，一一对应） */
seedDemo(db)
db.close()
console.log('demo sqlite 已按 schema 播种'); console.log(`demo 唯一源已写出：profile A=${profileA.id}（输血 ${profileA.transfusions.length} 条） profile B=${profileB.id}（输血 ${profileB.transfusions.length} 条 · 疗程 ${profileB.cycles.length} 个） today=${TODAY}`)
