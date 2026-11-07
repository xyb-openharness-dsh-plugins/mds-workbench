/* routes：两链路共用的路由表（健康/档案/导出/MinerU 设置/解析诚实失败） */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase, migrate, close } from '../dsh/store.js'
import { seedDemo } from '../dsh/demo.js'
import { bootstrap, getProfile, exportPreview } from '../dsh/readmodels.js'
import { createApiHandler, API_PREFIX, UI_PREFIX } from '../dsh/routes.js'
import os from 'node:os'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

function makeSource() {
  const root = mkdtempSync(join(tmpdir(), 'mds-test-'))
  const db = openDatabase(':memory:')
  migrate(db); seedDemo(db)
  return { db, root, bootstrap: () => bootstrap(db, { version: '0.2.0', build: 'test' }), profile: (k) => getProfile(db, k), exportPreview: (k) => exportPreview(db, k), close: () => close(db) }
}
const res = () => ({ code: 0, headers: {}, body: '', writeHead(c, h) { this.code = c; this.headers = h; return this }, end(b) { this.body = b ?? ''; return this } })

test('health：200 + capabilities', async () => {
  const src = makeSource()
  const handler = createApiHandler({ source: src, version: '0.2.0', build: 'test', serveUi: async () => false })
  const r = res()
  await handler({ method: 'GET', url: `${API_PREFIX}/health` }, r)
  const body = JSON.parse(r.body)
  assert.equal(r.code, 200); assert.equal(body.ok, true); assert.ok(body.capabilities.includes('bootstrap'))
  src.close()
})

test('bootstrap + profile：两套档案、派生私密计数', async () => {
  const src = makeSource()
  const handler = createApiHandler({ source: src, version: '0.2.0', build: 'test', serveUi: async () => false })
  const r1 = res(); await handler({ method: 'GET', url: `${API_PREFIX}/bootstrap` }, r1)
  const bs = JSON.parse(r1.body)
  assert.equal(bs.profiles.length, 2)
  const r2 = res(); await handler({ method: 'GET', url: `${API_PREFIX}/profile/demo-b` }, r2)
  const p = JSON.parse(r2.body)
  assert.equal(p.transfusions.length, 14)
  const r3 = res(); await handler({ method: 'GET', url: `${API_PREFIX}/export/demo-b` }, r3)
  const ex = JSON.parse(r3.body)
  assert.equal(ex.privateExcluded, 2)
  src.close()
})

test('未知档案 404；未配置 MinerU 解析 503 NOT_CONFIGURED（不假装成功）', async () => {
  const src = makeSource()
  const handler = createApiHandler({ source: src, version: '0.2.0', build: 'test', serveUi: async () => false })
  const r1 = res(); await handler({ method: 'GET', url: `${API_PREFIX}/profile/nope` }, r1)
  assert.equal(r1.code, 404)
  const r2 = res(); await handler({ method: 'POST', url: `${API_PREFIX}/parse` }, r2)
  assert.equal(r2.code, 503)
  assert.equal(JSON.parse(r2.body).error, 'NOT_CONFIGURED')
  src.close()
})

test('UI 静态：子路径剥前缀后命中 index.html；未知路径 JSON 404 而非 HTML', async () => {
  const src = makeSource()
  const { servePublic } = await import('../dsh/server.js')
  const handler = createApiHandler({ source: src, version: '0.2.0', build: 'test', serveUi: (req, r2, p) => servePublic(req, r2, p) })
  const r1 = res(); await handler({ method: 'GET', url: `${UI_PREFIX}/` }, r1)
  assert.equal(r1.code, 200)
  assert.match(String(r1.headers['content-type']), /text\/html/)
  const r2 = res(); await handler({ method: 'GET', url: `${UI_PREFIX}/no-such.js` }, r2)
  assert.equal(r2.code, 404)
  assert.match(String(r2.headers['content-type']), /json/)
  src.close()
})
