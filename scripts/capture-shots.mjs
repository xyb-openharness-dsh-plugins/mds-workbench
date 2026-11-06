#!/usr/bin/env node
/* capture-shots.mjs — README 实渲截图（33 号：≥4 张 + 折叠收/展态，文件名含版本） */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.PORT || 8131)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }
const server = createServer(async (req, rsp) => {
  const path = decodeURIComponent((req.url || '/').split('?')[0])
  if (path === '/favicon.ico') { rsp.writeHead(204).end(); return }
  const file = join(ROOT, normalize(path).replace(/^([/\\])+/, ''))
  try { const b = await readFile(file); rsp.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(b) } catch { rsp.writeHead(404).end() }
})
const chrome = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync)
const puppeteer = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/')('puppeteer-core')
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 })
const base = `http://127.0.0.1:${PORT}/prototypes/v0.2/index.html`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(join(ROOT, 'docs', 'shots'), { recursive: true })
const shot = async (name) => { await page.screenshot({ path: join(ROOT, 'docs', 'shots', name) }); console.log('saved', name) }
const nav = async (pg, sub) => { await page.evaluate((p, s) => { [...document.querySelectorAll('#nav .nav-button')].find((x) => x.dataset.page === p)?.click(); if (s) [...document.querySelectorAll('[data-action="sub"]')].find((x) => x.dataset.sub === s)?.click() }, pg, sub); await sleep(250) }

await page.goto(base, { waitUntil: 'networkidle0' })
await sleep(300)
await shot('v0.2.0-home-profile-a.png')

await page.evaluate(() => { document.querySelector('[data-action="profiles"]')?.click() })
await sleep(200)
await page.evaluate(() => { [...document.querySelectorAll('[data-action="switch-profile"]')].pop()?.click() })
await sleep(300)
await shot('v0.2.0-home-profile-b.png')

await nav('labs', 'cards')
await page.evaluate(() => { document.querySelector('.mcard')?.click() })
await sleep(420)
await shot('v0.2.0-labs-card-flipped.png')
await page.evaluate(() => { document.querySelector('.mcard')?.click() })
await sleep(300)

await nav('treatment')
await sleep(200)
await shot('v0.2.0-treatment-folds-closed.png')
await page.evaluate(() => { document.querySelector('details.phase-fold')?.setAttribute('open', '') })
await sleep(200)
await shot('v0.2.0-treatment-fold-open.png')

await nav('transfusion')
await sleep(200)
await shot('v0.2.0-transfusion-iron.png')
await nav('chart')
await sleep(300)
await shot('v0.2.0-one-chart.png')
await page.evaluate(() => { document.querySelector('[data-primer-open]')?.click() })
await sleep(450)
await shot('v0.2.0-disease-primer.png')
await browser.close(); server.close()
console.log('done')
