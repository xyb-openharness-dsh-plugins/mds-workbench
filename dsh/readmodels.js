/* 读模型：从库行组装前端要的 JSON。派生值一律在这里现算（不落库）。 */
const METRIC_DEC = { hb: 0, wbc: 1, anc: 1, plt: 0, ret: 2, ferritin: 0 }

export function bootstrap(db, { version, build }) {
  const profiles = db.prepare('SELECT id, display_name, dx_summary_text, caregiver_text, anchor_date FROM profiles WHERE in_use = 1 ORDER BY rowid').all()
  return {
    ok: true, version, build, apiVersion: 'v1',
    profiles: profiles.map((p) => ({
      id: p.id, name: p.display_name, diagnosisShort: p.dx_summary_text,
      caregiver: p.caregiver_text ?? null, anchor: p.anchor_date ?? null,
      docs: db.prepare('SELECT COUNT(*) AS n FROM documents WHERE profile_id = ? AND in_use = 1').get(p.id).n,
      transfusions: db.prepare('SELECT COUNT(*) AS n FROM transfusions WHERE profile_id = ? AND in_use = 1').get(p.id).n,
      privateCount: db.prepare('SELECT COUNT(*) AS n FROM family_notes WHERE profile_id = ? AND private_flag = 1 AND in_use = 1').get(p.id).n,
    })),
  }
}

export function getProfile(db, key) {
  const p = db.prepare('SELECT * FROM profiles WHERE id = ? AND in_use = 1').get(key)
  if (!p) return null
  const metrics = {}
  for (const def of db.prepare('SELECT * FROM metric_defs ORDER BY rowid').all()) {
    const points = db.prepare('SELECT point_date AS d, value_num AS v, site_method_text AS site, source_text AS src FROM metric_points WHERE profile_id = ? AND code = ? AND in_use = 1 ORDER BY rowid').all(p.id, def.code)
    metrics[def.code] = { cat: def.category_text, label: def.label_text, unit: def.unit_text, dec: METRIC_DEC[def.code] ?? 1, points }
  }
  return {
    id: p.id, name: p.display_name, caregiver: p.caregiver_text ?? null, anchor: p.anchor_date ?? null,
    diagnosisShort: p.dx_summary_text,
    docs: db.prepare('SELECT id, title_text AS name, doc_date AS date, doc_type_text AS type, status_text AS status, has_file AS hasFile FROM documents WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    metrics,
    transfusions: db.prepare('SELECT id, tx_date AS d, component_text AS component, units, pre_hb_num AS preHb, site_text AS site, note_text AS note FROM transfusions WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    cycles: db.prepare('SELECT id, cycle_no AS no, drug_text AS drug, start_date AS start, end_date AS end, rest_note_text AS rest, status_text AS status FROM cycles WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    privateNotes: db.prepare('SELECT id, note_date AS d, body_text AS text, role_text AS role, private_flag AS private FROM family_notes WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    questions: db.prepare('SELECT id, body_text AS text, origin_text AS source, kind_text AS kind, selected_flag AS selected FROM questions WHERE profile_id = ? AND in_use = 1 AND deprecated_flag = 0 ORDER BY rowid').all(p.id),
    facts: db.prepare('SELECT id, fact_name_text AS name, quote_text AS value, source_text AS source, recorded_at AS date FROM dx_facts WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    daily: db.prepare('SELECT id, order_date AS d, quote_text AS text, source_text AS source FROM doctor_orders WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    symptoms: db.prepare('SELECT id, log_date AS d, label_text AS label, self_level AS level, note_text AS note FROM symptom_logs WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    trials: db.prepare('SELECT id, nct_text AS nct, title_text AS title, phase_text AS phase, status_text AS status, site_text AS site, snapshot_date AS snapshot FROM trial_items WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
    candidates: db.prepare('SELECT id, field_name_text AS name, proposed_value_text AS value, source_text AS source, status_text AS status FROM candidates WHERE profile_id = ? AND in_use = 1 ORDER BY rowid').all(p.id),
  }
}

/* 导出预览（服务端口径）：与前端 CSV 同一过滤谓词，私密不出现在任何出口。 */
export function exportPreview(db, key) {
  const p = getProfile(db, key)
  if (!p) return null
  return {
    profile: { id: p.id, name: p.name },
    questions: p.questions.filter((q) => q.selected),
    docs: p.docs.map((d) => ({ name: d.name, status: d.status })),
    transfusions: p.transfusions.map((t) => ({ d: t.d, component: t.component, units: t.units })),
    privateExcluded: db.prepare('SELECT COUNT(*) AS n FROM family_notes WHERE profile_id = ? AND private_flag = 1 AND in_use = 1').get(key).n,
  }
}
