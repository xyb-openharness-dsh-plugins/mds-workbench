/* store：内存建库、迁移、播种、NULL/私密/版本纪律 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase, migrate, close, insert } from '../dsh/store.js'
import { seedDemo, hasDemoData } from '../dsh/demo.js'

test('迁移建出 18 张表（schema 0001 冻结形态）', () => {
  const db = openDatabase(':memory:')
  const files = migrate(db)
  assert.equal(files.length, 1)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name)
  assert.equal(tables.length, 18)
  close(db)
})

test('播种：两套档案、输血 14 条（B）/0 条（A）、缺输前值是 NULL 不是 0', () => {
  const db = openDatabase(':memory:')
  migrate(db)
  assert.equal(hasDemoData(db), false)
  seedDemo(db)
  assert.equal(hasDemoData(db), true)
  const b = db.prepare("SELECT COUNT(*) AS n FROM transfusions WHERE profile_id='demo-b'").get().n
  const a = db.prepare("SELECT COUNT(*) AS n FROM transfusions WHERE profile_id='demo-a'").get().n
  assert.equal(b, 14); assert.equal(a, 0)
  const nullPre = db.prepare("SELECT COUNT(*) AS n FROM transfusions WHERE profile_id='demo-b' AND pre_hb_num IS NULL").get().n
  assert.ok(nullPre >= 2, `缺输前值行应 >=2，实际 ${nullPre}`)
  const zeroFake = db.prepare("SELECT COUNT(*) AS n FROM transfusions WHERE pre_hb_num = 0").get().n
  assert.equal(zeroFake, 0, '不允许用 0 冒充缺失')
  close(db)
})

test('私密是行级标记：family_notes 默认私密且 B 档案 2 条', () => {
  const db = openDatabase(':memory:')
  migrate(db); seedDemo(db)
  const rows = db.prepare('SELECT private_flag, COUNT(*) AS n FROM family_notes GROUP BY private_flag').all()
  const map = Object.fromEntries(rows.map((r) => [r.private_flag, r.n]))
  assert.equal(map[1], 2)
  assert.equal(map[0] ?? 0, 0)
  close(db)
})

test('insert：undefined → 显式 NULL', () => {
  const db = openDatabase(':memory:')
  migrate(db)
  insert(db, 'profiles', { id: 't1', display_name: '测试', dx_summary_text: '演示', created_at: '2026-11-07', caregiver_text: undefined })
  const row = db.prepare('SELECT caregiver_text FROM profiles WHERE id = ?').get('t1')
  assert.equal(row.caregiver_text, null)
  close(db)
})
