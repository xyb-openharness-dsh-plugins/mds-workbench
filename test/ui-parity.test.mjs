/* ui-parity：public 与已签认原型逐字符一致（数据文件除外，但其内容必须与 demo JSON 全等） */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const FILES = ['index.html', 'style.css', 'app.js', 'primer.js', 'primer.css', 'primer-data.js']
for (const f of FILES) {
  test(`public/${f} 与原型逐字符一致`, () => {
    const a = readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8')
    const b = readFileSync(new URL(`../prototypes/v0.2/${f}`, import.meta.url), 'utf8')
    assert.equal(a, b)
  })
}

test('public/demo-data.js 的 DEMO_DATA 与 demo/demo-data.json 全等', () => {
  const js = readFileSync(new URL('../public/demo-data.js', import.meta.url), 'utf8')
  const json = readFileSync(new URL('../demo/demo-data.json', import.meta.url), 'utf8')
  const m = js.match(/window\.DEMO_DATA = ([\s\S]*?)\n$/)
  assert.ok(m, 'demo-data.js 必须是 window.DEMO_DATA 字面量')
  assert.equal(JSON.stringify(JSON.parse(m[1])), JSON.stringify(JSON.parse(json)))
})
