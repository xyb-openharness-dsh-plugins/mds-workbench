import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { basename, join } from 'node:path'

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

export function serializeTrialRecord(recordId, mergedSources, record, snapshotDate) {
  return {
    recordId,
    mergedSources,
    sourceId: record.source?.id ?? recordId.split(':')[0] ?? null,
    title: record.title ?? null,
    studyType: record.studyType ?? null,
    sponsor: record.sponsorOrInstitution ?? record.sponsor ?? null,
    registryNumbers: record.registryNumbers ?? null,
    dates: record.dates ?? null,
    sourceUrl: record.sourceUrl ?? null,
    retrievedAt: record.provenance?.retrievedAt ?? record.retrievedAt ?? null,
    statusNote: record.statusNote ?? '登记状态，未核实',
    snapshotDate: record.snapshotDate ?? snapshotDate,
  }
}

export function flattenSourceStatuses(perQuery) {
  const rows = []
  for (const query of perQuery) {
    for (const status of query.statuses ?? []) {
      rows.push({
        query: query.query,
        source_id: status.sourceId ?? null,
        state: status.state ?? null,
        reason_code: status.reasonCode ?? null,
        coverage: query.coverage ? JSON.stringify(query.coverage) : null,
        completeness: query.completeness ? JSON.stringify(query.completeness) : null,
        total_records: query.totalRecords ?? null,
      })
    }
    if (query.error) rows.push({
      query: query.query,
      source_id: null,
      state: 'ERROR',
      reason_code: null,
      coverage: null,
      completeness: null,
      total_records: null,
    })
  }
  return rows
}

export function writeTrialSnapshot({ outDir, records, sourceStatuses, manifest: manifestBase }) {
  try {
    mkdirSync(outDir, { recursive: false })
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Refusing to overwrite existing snapshot directory: ${outDir}`)
    throw error
  }

  let db
  try {
    const jsonlPath = join(outDir, 'trials-2026.jsonl')
    const dbPath = join(outDir, 'mds_cancer_trials_2026.sqlite')
    const rows = records.map((record) => ({
      ...record,
      sponsor: record.sponsor ?? null,
    }))
    writeFileSync(jsonlPath, rows.length ? rows.map((row) => JSON.stringify(row)).join('\n') + '\n' : '')

    db = new DatabaseSync(dbPath)
    db.exec(`CREATE TABLE trials (
      record_id TEXT PRIMARY KEY,
      merged_sources TEXT NOT NULL,
      source_id TEXT NOT NULL,
      title TEXT,
      study_type TEXT,
      sponsors TEXT,
      registry_numbers TEXT,
      dates TEXT,
      source_url TEXT,
      retrieved_at TEXT,
      status_note TEXT NOT NULL DEFAULT '登记状态，未核实',
      snapshot_date TEXT NOT NULL
    );
    CREATE INDEX idx_trials_source ON trials(source_id);
    CREATE TABLE source_statuses (
      query TEXT NOT NULL,
      source_id TEXT,
      state TEXT,
      reason_code TEXT,
      coverage TEXT,
      completeness TEXT,
      total_records INTEGER
    );`)
    const insertTrial = db.prepare('INSERT INTO trials (record_id, merged_sources, source_id, title, study_type, sponsors, registry_numbers, dates, source_url, retrieved_at, status_note, snapshot_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    const insertStatus = db.prepare('INSERT INTO source_statuses (query, source_id, state, reason_code, coverage, completeness, total_records) VALUES (?,?,?,?,?,?,?)')
    db.exec('BEGIN')
    for (const row of rows) {
      insertTrial.run(
        row.recordId,
        JSON.stringify(row.mergedSources),
        row.sourceId,
        row.title,
        row.studyType,
        row.sponsor == null ? null : JSON.stringify(row.sponsor),
        row.registryNumbers == null ? null : JSON.stringify(row.registryNumbers),
        row.dates == null ? null : JSON.stringify(row.dates),
        row.sourceUrl,
        row.retrievedAt,
        row.statusNote,
        row.snapshotDate,
      )
    }
    for (const status of sourceStatuses) {
      insertStatus.run(status.query, status.source_id, status.state, status.reason_code, status.coverage, status.completeness, status.total_records)
    }
    db.exec('COMMIT')
    const integrity = db.prepare('PRAGMA integrity_check').get()
    if (Object.values(integrity ?? {})[0] !== 'ok') throw new Error('SQLite integrity_check failed')
    const dbCount = db.prepare('SELECT COUNT(*) AS n FROM trials').get().n
    db.close()
    db = null
    const manifest = {
      ...manifestBase,
      recordCount: rows.length,
      dbCount,
      sourceStatusRows: sourceStatuses.length,
      files: {
        'trials-2026.jsonl': { sha256: sha256(jsonlPath) },
        'mds_cancer_trials_2026.sqlite': { sha256: sha256(dbPath) },
      },
    }
    writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    return manifest
  } catch (error) {
    try { db?.close() } catch {}
    throw new Error(`Snapshot output failed in ${basename(outDir)}; the new output directory was preserved for inspection: ${error.message}`, { cause: error })
  }
}
