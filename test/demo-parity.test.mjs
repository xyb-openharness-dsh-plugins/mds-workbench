/* demo-parity：库中读回 与 demo-data.json 逐点全等（L30：只比末值会假绿） */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase, migrate, close } from '../dsh/store.js'
import { seedDemo, loadDemoJson } from '../dsh/demo.js'
import { getProfile } from '../dsh/readmodels.js'

test('每套档案每条指标的每个点（日期+值）与唯一源逐点全等', () => {
  const data = loadDemoJson()
  const db = openDatabase(':memory:')
  migrate(db); seedDemo(db)
  for (const p of data.profiles) {
    const got = getProfile(db, p.id)
    for (const [code, m] of Object.entries(p.metrics || {})) {
      const want = m.points.map((pt) => ({ d: pt.d, v: pt.v }))
      const have = (got.metrics[code]?.points || []).map((pt) => ({ d: pt.d, v: pt.v }))
      assert.deepEqual(have, want, `${p.id}.${code} 点序列必须逐点全等`)
    }
    const wantTx = (p.transfusions || []).map((t) => ({ d: t.d, c: t.component, u: t.units, pre: t.preHb ?? null })).sort((x, y) => x.d < y.d ? -1 : 1)
    const haveTx = got.transfusions.map((t) => ({ d: t.d, c: t.component, u: t.units, pre: t.preHb ?? null })).sort((x, y) => x.d < y.d ? -1 : 1)
    assert.deepEqual(haveTx, wantTx, `${p.id} 输血记录全等（preHb null 语义一致）`)
  }
  close(db)
})
