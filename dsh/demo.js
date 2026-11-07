/* 演示数据播种：唯一源是 demo/demo-data.json（demo/build-demo-data.mjs 生成）。
 * 这里只做「JSON → schema 行」的映射，不定义第二份数值（L30 教训）。
 * 演示库可整页重建：全部合成示例，不指向任何真实患者。 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { insert } from './store.js'

const DEMO_JSON = join(dirname(fileURLToPath(import.meta.url)), '..', 'demo', 'demo-data.json')

export function loadDemoJson() { return JSON.parse(readFileSync(DEMO_JSON, 'utf8')) }

const METRIC_DEC = { hb: 0, wbc: 1, anc: 1, plt: 0, ret: 2, ferritin: 0 }
const METRIC_LABEL = { hb: '血红蛋白', wbc: '白细胞', anc: '中性粒细胞绝对值', plt: '血小板', ret: '网织红细胞', ferritin: '血清铁蛋白' }
const METRIC_UNIT = { hb: 'g/L', wbc: '10⁹/L', anc: '10⁹/L', plt: '10⁹/L', ret: '10⁹/L', ferritin: 'ng/mL' }
const METRIC_CAT = { hb: '血象', wbc: '血象', anc: '血象', plt: '血象', ret: '血象', ferritin: '铁代谢' }

export function hasDemoData(db) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM profiles').get()
  return (row?.n ?? 0) > 0
}

export function seedDemo(db) {
  const data = loadDemoJson()
  for (const def of Object.entries(METRIC_LABEL)) {
    insert(db, 'metric_defs', { code: def[0], label_text: METRIC_LABEL[def[0]], category_text: METRIC_CAT[def[0]], unit_text: METRIC_UNIT[def[0]], decimal_places: METRIC_DEC[def[0]] ?? 1, sort_order: 0 })
  }
  for (const p of data.profiles) {
    insert(db, 'profiles', {
      id: p.id, display_name: p.name, age_years: p.age ?? null, gender_text: p.gender ?? null,
      dx_summary_text: p.diagnosisShort, caregiver_text: p.caregiver ?? null,
      anchor_date: p.anchor ?? null, anchor_label_text: p.anchorLabel ?? null,
      created_at: data.meta.today, in_use: 1,
    })
    for (const d of p.docs || []) {
      insert(db, 'documents', { id: d.id, profile_id: p.id, title_text: d.name, doc_type_text: d.type, doc_date: d.date ?? null, date_precision_text: d.date ? 'day' : 'unknown', status_text: d.status, has_file: d.hasFile ? 1 : 0, source_note: null, in_use: 1 })
    }
    for (const [code, m] of Object.entries(p.metrics || {})) {
      for (const pt of m.points || []) {
        insert(db, 'metric_points', { id: `${p.id}-${code}-${pt.d}-${pt.v}`, profile_id: p.id, code, point_date: pt.d, value_num: pt.v, site_method_text: pt.site || pt.src || '默认', source_text: pt.src ?? pt.site ?? null, lab_report_id: null, recorded_at: data.meta.today, superseded_by: null, in_use: 1 })
      }
    }
    for (const t of p.transfusions || []) {
      insert(db, 'transfusions', { id: t.id, profile_id: p.id, tx_date: t.d, component_text: t.component, units: t.units, pre_hb_num: t.preHb ?? null, site_text: t.site ?? null, document_id: null, note_text: t.note ?? null, in_use: 1 })
    }
    for (const c of p.cycles || []) {
      insert(db, 'cycles', { id: c.id, profile_id: p.id, cycle_no: c.no, drug_text: c.drug, start_date: c.start, end_date: c.end ?? null, rest_note_text: c.rest ?? null, status_text: c.status ?? '已结束', in_use: 1 })
      for (const dy of c.days || []) insert(db, 'cycle_days', { id: `${c.id}-${dy.d}`, cycle_id: c.id, day_date: dy.d, done_flag: dy.done ? 1 : 0, note_text: dy.note || null, in_use: 1 })
    }
    for (const ch of p.chelation || []) {
      insert(db, 'medications', { id: ch.id, profile_id: p.id, med_date: ch.d, drug_text: ch.drug, dose_text: ch.dose ?? null, note_text: ch.note ?? null, in_use: 1 })
    }
    for (const s of p.symptoms || []) {
      insert(db, 'symptom_logs', { id: s.id, profile_id: p.id, log_date: s.d, label_text: s.label, self_level: s.level ?? null, note_text: s.note ?? null, in_use: 1 })
    }
    for (const o of p.daily || []) {
      insert(db, 'doctor_orders', { id: o.id, profile_id: p.id, order_date: o.d, quote_text: o.text, source_text: o.source, in_use: 1 })
    }
    for (const n of p.privateNotes || []) {
      insert(db, 'family_notes', { id: n.id, profile_id: p.id, note_date: n.d, body_text: n.text, role_text: n.role ?? null, private_flag: n.private ? 1 : 0, in_use: 1 })
    }
    for (const q of p.questions || []) {
      insert(db, 'questions', { id: q.id, profile_id: p.id, body_text: q.text, origin_text: q.source, kind_text: q.kind ?? 'fact', selected_flag: q.selected ? 1 : 0, deprecated_flag: 0, created_at: data.meta.today, in_use: 1 })
    }
    for (const f of p.facts || []) {
      insert(db, 'dx_facts', { id: f.id, profile_id: p.id, fact_name_text: f.name, quote_text: f.value, source_text: f.source, recorded_at: f.date ?? data.meta.today, document_id: null, in_use: 1 })
    }
    for (const t of p.trials || []) {
      insert(db, 'trial_items', { id: t.id, profile_id: p.id, nct_text: t.nct, title_text: t.title, phase_text: t.phase ?? null, status_text: t.status ?? null, site_text: t.site ?? null, snapshot_date: t.snapshot ?? data.meta.today, unverified_flag: 1, in_use: 1 })
    }
    for (const c of p.candidates || []) {
      insert(db, 'candidates', { id: c.id, profile_id: p.id, import_job_id: null, field_name_text: c.name, proposed_value_text: c.value, source_text: c.source, status_text: c.status === 'needs_review' ? 'needs_review' : 'candidate', in_use: 1 })
    }
  }
  return true
}
