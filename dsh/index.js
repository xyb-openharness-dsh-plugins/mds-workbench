/**
 * 包入口：DSH 插件服务端。宿主加载本文件，需要 name/inject/Config/apply（workbench-standard §3.4）。
 * 四件事：开库（root 缺省=内存演示库）→ 过宿主鉴权 → 交给 routes.js 共用路由表 → 卸载按序关库。
 * UI 走 iframe（/api/mds/ui/），面板是 customFrame=true（lib/layout.js 是分栏合同唯一来源）。
 */
import Schema from '@deepseek-ai/schemastery'
import { openDatabase, migrate, close } from './store.js'
import { seedDemo, hasDemoData } from './demo.js'
import { bootstrap, getProfile, exportPreview } from './readmodels.js'
import { servePublic } from './server.js'
import { createApiHandler, API_PREFIX, UI_PREFIX } from './routes.js'
import { version, build } from '../lib/version.js'

export const name = 'mds-main'
export const inject = ['webServer', 'connection']

export { API_PREFIX, UI_PREFIX }

export const Config = Schema.object({
  root: Schema.string(),
})

function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': buf.length, 'cache-control': 'no-store' })
  res.end(buf)
}

function openDataSource(root) {
  const file = root ? `${root.replace(/\/+$/, '')}/xyb-mds.sqlite` : ':memory:'
  const db = openDatabase(file)
  migrate(db)
  if (!hasDemoData(db)) seedDemo(db)
  return {
    db, root: root ?? null,
    bootstrap: () => bootstrap(db, { version, build }),
    profile: (key) => getProfile(db, key),
    exportPreview: (key) => exportPreview(db, key),
    close: () => close(db),
  }
}

export function apply(ctx, config = {}) {
  if (!ctx.webServer?.register) throw new Error('Desktop webServer.register is unavailable')

  let source = null
  let failure = null
  try {
    source = openDataSource(config.root)
  } catch (error) {
    failure = error.message
  }

  const api = createApiHandler({
    source: source ?? {
      db: null, root: null,
      bootstrap: () => { throw new Error(failure) },
      profile: () => null,
      exportPreview: () => null,
    },
    version,
    build,
    serveUi: (req, res, urlPath) => servePublic(req, res, urlPath),
    failure,
  })

  const handler = (req, res) => {
    if (typeof ctx.connection?.requestRejection !== 'function') {
      return sendJson(res, 503, { error: 'connection authentication capability unavailable' })
    }
    const rejection = ctx.connection.requestRejection(req)
    if (rejection !== undefined) return sendJson(res, rejection, { error: 'Authentication required' })
    return api(req, res)
  }

  ctx.effect(() => {
    const dispose = ctx.webServer.register({ kind: 'prefix', path: API_PREFIX, handler })
    return () => {
      try { dispose && dispose() } catch { /* 宿主卸载清理失败不遮蔽原错误 */ }
      if (source) { try { source.close() } catch { /* 同上 */ } }
    }
  }, 'mds ui + api')
}
