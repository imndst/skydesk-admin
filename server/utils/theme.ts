import { normalizeTheme, type Theme } from '#shared/theme'
import { getDb, stmt } from './db'

export interface ThemeRecord { version: number, updatedAt: string | null, updatedBy: string | null, settings: Theme }

// Theme is read on every SSR render; keep the parsed value in memory (invalidated on write).
let cached: ThemeRecord | null = null

export function readTheme(): ThemeRecord {
  if (cached) return cached
  const row = stmt("SELECT value, version, updated_at AS updatedAt, updated_by AS updatedBy FROM settings WHERE key = 'theme'")
    .get() as { value: string, version: number, updatedAt: string, updatedBy: string } | undefined
  let parsed: unknown = {}
  try { parsed = row ? JSON.parse(row.value) : {} } catch { /* corrupt row → defaults */ }
  cached = { version: row?.version ?? 0, updatedAt: row?.updatedAt ?? null, updatedBy: row?.updatedBy ?? null, settings: normalizeTheme(parsed) }
  return cached
}

/** Optimistic concurrency: the write succeeds only if `expectedVersion` is still current. */
export function writeTheme(settings: Theme, expectedVersion: number, by: string): ThemeRecord | null {
  const json = JSON.stringify(settings)
  const ok = getDb().transaction(() => {
    const cur = stmt("SELECT version FROM settings WHERE key = 'theme'").get() as { version: number } | undefined
    if ((cur?.version ?? 0) !== expectedVersion) return false
    if (cur) stmt("UPDATE settings SET value = ?, version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_by = ? WHERE key = 'theme'").run(json, by)
    else stmt("INSERT INTO settings (key, value, version, updated_by) VALUES ('theme', ?, 1, ?)").run(json, by)
    return true
  })()
  cached = null
  return ok ? readTheme() : null
}
