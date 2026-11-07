/* 路由表：dev-server 与 DSH 宿主两条链路共用这一份（不抽出来就会「本地能开、装机 404」）。
 * 只依赖 node 内置模块，不许 import Schemastery（独立启动时 peer 不存在）。
 * 鉴权不在这里：宿主链路由 dsh/index.js 先过 connection.requestRejection。 */

import { readFileSync, writeFileSync } from 'node:fs'

export const API_PREFIX = '/api/mds'
export const UI_PREFIX = `${API_PREFIX}/ui`

function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': buf.length, 'cache-control': 'no-store' })
  res.end(buf)
}

/** MinerU 设置（18 号 v2 · 六部件的最小闭环）：
 *  1) Token 只进资料目录下的本地密钥文件（不在库里、不进日志）；
 *  2) GET 只回掩码与来源路径，不回原文；
 *  3) 触发解析时没有 Token → 503 NOT_CONFIGURED（如实失败，不假装成功）。 */
function keyFileOf(root) { return `${String(root || '').replace(/\/+$/, '')}/mineru.token` }

function readToken(root) {
  try { return readTokenFile(keyFileOf(root)) } catch { return null }
}
function readTokenFile(file) {
  const text = readFileSync(file, 'utf8').trim()
  return text || null
}
const maskToken = (t) => (t ? `${t.slice(0, 3)}····${t.slice(-4)}` : null)

/**
 * @param {object} opts
 * @param {{bootstrap():object, profile(key:string):object|null, exportPreview(key:string):object|null, db:object, root:unknown}} opts.source
 * @param {string} opts.version
 * @param {string} opts.build
 * @param {(req:object,res:object,path:string)=>Promise<boolean>|boolean} opts.serveUi
 * @param {string|null} [opts.failure]
 */
export function createApiHandler({ source, version, build, serveUi, failure = null }) {
  return async function handle(req, res) {
    const url = new URL(req.url, 'http://127.0.0.1')
    const path = url.pathname

    if (path === `${API_PREFIX}/health`) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      return sendJson(res, 200, {
        ok: !failure, version, build, apiVersion: 'v1', ui: UI_PREFIX,
        capabilities: ['bootstrap', 'profile', 'export', 'mineru-settings', 'parse'],
        error: failure || undefined,
      })
    }

    const unavailable = (res2) => sendJson(res2, 503, { error: 'bootstrap_unavailable', message: failure })
    if (failure && !(path === UI_PREFIX || path.startsWith(`${UI_PREFIX}/`))) return unavailable(res)

    if (path === `${API_PREFIX}/bootstrap`) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      try { return sendJson(res, 200, source.bootstrap()) } catch (e) { return sendJson(res, 500, { error: 'internal_error', message: e.message }) }
    }

    const pm = path.match(/^\/api\/mds\/profile\/([\w-]+)$/)
    if (pm) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      try {
        const body = source.profile(pm[1])
        return body ? sendJson(res, 200, body) : sendJson(res, 404, { error: 'not_found' })
      } catch (e) { return sendJson(res, 500, { error: 'internal_error', message: e.message }) }
    }

    const em = path.match(/^\/api\/mds\/export\/([\w-]+)$/)
    if (em) {
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })
      try {
        const body = source.exportPreview?.(em[1])
        return body ? sendJson(res, 200, body) : sendJson(res, 404, { error: 'not_found' })
      } catch (e) { return sendJson(res, 500, { error: 'internal_error', message: e.message }) }
    }

    if (path === `${API_PREFIX}/settings/mineru`) {
      if (req.method === 'GET') {
        return sendJson(res, 200, {
          connected: false,
          tokenMasked: maskToken(readToken(source.root)),
          tokenSourcePath: keyFileOf(source.root),
          note: '未接入：填写 Token 并保存到本机密钥文件后，解析仍需云端服务可用；日志只输出掩码。',
        })
      }
      if (req.method === 'PUT') {
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          try {
            const token = String(JSON.parse(body || '{}').token || '').trim()
            if (!token) return sendJson(res, 400, { error: 'token_required' })
            writeFileSync(keyFileOf(source.root), token + '\n', { mode: 0o600 })
            return sendJson(res, 200, { saved: true, tokenMasked: maskToken(token) })
          } catch (e) { return sendJson(res, 400, { error: 'bad_request', message: e.message }) }
        })
        return undefined
      }
      return sendJson(res, 405, { error: 'method_not_allowed' })
    }

    if (path === `${API_PREFIX}/parse` && req.method === 'POST') {
      const token = readToken(source.root)
      if (!token) return sendJson(res, 503, { error: 'NOT_CONFIGURED', message: '未配置 MinerU Token：解析未执行（原件保留在本机，可手工录入）。' })
      return sendJson(res, 503, { error: 'UNREACHABLE', message: '云端解析服务不可用（本机窗口未联外部服务）；本次未产生任何候选。' })
    }

    if (path === UI_PREFIX || path.startsWith(`${UI_PREFIX}/`)) {
      const served = await serveUi(req, res, path.slice(UI_PREFIX.length))
      if (served) return undefined
      /* SPA 兜底前先剥干净子路径：绝不把 index.html 当 JS 发（装机探针据此验收） */
      return sendJson(res, 404, { error: 'ui_not_found', path })
    }

    return sendJson(res, 404, { error: 'not_found', path })
  }
}
