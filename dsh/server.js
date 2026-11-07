/* public/ 静态出口：两条链路（dev-server 与宿主）共用。
 * 关键坑（LESSONS L66）：UI 挂在 /api/<slug>/ui/ 子路径下，页面里相对引用
 * （primer.js / demo-data.js / style.css）必须剥掉**完整前缀**再定位文件，
 * 否则子路径资源全部 404、疾病概要静默失效。 */
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.csv': 'text/csv; charset=utf-8' }

export function servePublic(req, res, urlPath) {
  const rel = urlPath === '' || urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '')
  const file = join(PUBLIC_DIR, normalize(rel))
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403).end(); return true }
  return readFile(file)
    .then((body) => { res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body); return true })
    .catch(() => false)
}
