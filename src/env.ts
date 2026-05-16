import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ENV_PATH = path.join(PROJECT_ROOT, '.env')

function parse(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

export function readEnvFile(keys?: string[]): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {}
  let raw: string
  try {
    raw = readFileSync(ENV_PATH, 'utf8')
  } catch {
    return {}
  }
  const all = parse(raw)
  if (!keys) return all
  const filtered: Record<string, string> = {}
  for (const k of keys) {
    if (k in all) filtered[k] = all[k]
  }
  return filtered
}

export function getEnvPath(): string {
  return ENV_PATH
}
