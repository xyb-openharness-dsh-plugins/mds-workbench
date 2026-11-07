/* client：agent-draft 桥（监听+同源校验+send:true）、customFrame、布局合同 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PANEL, AGENT_PANE, assertPanelConfig } from '../lib/layout.js'

const client = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const proto = readFileSync(new URL('../prototypes/v0.2/app.js', import.meta.url), 'utf8')

test('桥两端正穿：页面发 mds:agent-draft（send:true），壳层监听同名并校验 event.source', () => {
  assert.ok(proto.includes("'mds:agent-draft'"), '原型应有 mds:agent-draft 协议链接')
  assert.ok(client.includes("'mds:agent-draft'"), '壳层应监听 mds:agent-draft')
  assert.ok(client.includes('event.source !== frame.contentWindow'), '必须校验 event.source（不认谁都能发的消息）')
  assert.ok(proto.includes('send: true'), '页面 postMessage 带 send:true（34 号契约）')
  /* 壳层不自动发送：收到消息只填原生草稿（Q17），所以 lib 侧不允许出现替用户 submit 的调用 */
  assert.ok(client.includes('setDraft'), '壳层走 setDraft 只填草稿')
})

test('面板合同：customFrame=true、宽度区间 25–45、assertPanelConfig 零问题', () => {
  assert.equal(PANEL.customFrame, true)
  assert.ok(AGENT_PANE.min >= 0.25 && AGENT_PANE.max <= 0.45)
  assert.deepEqual(assertPanelConfig(), [])
})

test('会话始终挂载（display 控制，不卸载输入树）+ 宽度记忆键为 mds 命名', () => {
  assert.ok(client.includes("display: paneVisible ? 'flex' : 'none'"))
  assert.ok(client.includes('mds.pal.agent-pane.v1'))
})
