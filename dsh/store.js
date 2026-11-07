/* SQLite 存储层：打开、迁移（schema/*.sql 按编号）、关闭。
 * 迁移只增不改：0001 冻结（见 schema/freeze-contract.md），追加只能新增 0002_*.sql。 */
import { DatabaseSync } from 'node:sqlite'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCHEMA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'schema')

export function openDatabase(file) {
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL;')
  return db
}

export function migrate(db) {
  const files = readdirSync(SCHEMA_DIR).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()
  for (const f of files) db.exec(readFileSync(join(SCHEMA_DIR, f), 'utf8'))
  return files
}

export function close(db) {
  try { db.close() } catch { /* 重复关闭不遮蔽原错误 */ }
}

/* 通用插入：列名来自对象键；值 undefined → 显式 NULL（不用空串冒充）。 */
export function insert(db, table, row) {
  const keys = Object.keys(row)
  const vals = keys.map((k) => (row[k] === undefined ? null : row[k]))
  db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...vals)
}

/* 读取层共用谓词：私密三出口（看板/导出/AI 上下文）都走这一个函数。 */
export function privateFilterSql() { return 'private_flag = 0' }
