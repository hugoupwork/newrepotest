import { existsSync, readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

const ok = (m: string) => console.log(`${GREEN}✓${RESET} ${m}`)
const warn = (m: string) => console.log(`${YELLOW}⚠${RESET} ${m}`)
const bad = (m: string) => console.log(`${RED}✗${RESET} ${m}`)

function readEnv(): Record<string, string> {
  const p = path.join(PROJECT_ROOT, '.env')
  if (!existsSync(p)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq <= 0) continue
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[t.slice(0, eq).trim()] = v
  }
  return out
}

async function main() {
  console.log('=== ClaudeClaw status ===\n')

  const nodeVer = process.versions.node
  const major = Number(nodeVer.split('.')[0])
  if (major >= 20) ok(`Node ${nodeVer}`)
  else bad(`Node ${nodeVer} (need >= 20)`)

  try {
    const claudeVer = execSync('claude --version', { encoding: 'utf8' }).trim()
    ok(`Claude CLI: ${claudeVer}`)
  } catch {
    bad('Claude CLI not found in PATH')
  }

  const env = readEnv()

  if (env.TELEGRAM_BOT_TOKEN) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`)
      const data = (await res.json()) as { ok: boolean; result?: { username?: string } }
      if (data.ok) ok(`Telegram token valid (@${data.result?.username})`)
      else bad('Telegram token rejected')
    } catch {
      warn('Could not reach Telegram API')
    }
  } else {
    bad('TELEGRAM_BOT_TOKEN missing')
  }

  if (env.ALLOWED_CHAT_ID) ok(`ALLOWED_CHAT_ID set (${env.ALLOWED_CHAT_ID})`)
  else warn('ALLOWED_CHAT_ID empty (bot will accept any chat)')

  if (env.GROQ_API_KEY) ok('Groq STT configured')
  else warn('GROQ_API_KEY missing (voice notes won\'t transcribe)')

  if (env.GOOGLE_API_KEY) ok('Gemini configured (video analysis)')
  else warn('GOOGLE_API_KEY missing (no video analysis)')

  if (env.APIFY_API_TOKEN) ok('Apify configured')
  else warn('APIFY_API_TOKEN missing')

  // DB check
  const dbPath = path.join(PROJECT_ROOT, 'store', 'claudeclaw.db')
  if (existsSync(dbPath)) {
    ok(`Database present (${dbPath})`)
    try {
      const { default: Database } = await import('better-sqlite3')
      const d = new Database(dbPath, { readonly: true })
      const mems = (d.prepare('SELECT COUNT(*) as n FROM memories').get() as { n: number }).n
      const tasks = (d.prepare('SELECT COUNT(*) as n FROM scheduled_tasks').get() as { n: number }).n
      const sessions = (d.prepare('SELECT COUNT(*) as n FROM sessions').get() as { n: number }).n
      d.close()
      console.log(`    memories: ${mems}   sessions: ${sessions}   scheduled tasks: ${tasks}`)
    } catch (err) {
      warn(`Could not read DB: ${(err as Error).message}`)
    }
  } else {
    warn('DB not yet created (will be created on first start)')
  }

  // Service status
  if (process.platform === 'darwin') {
    try {
      const out = execSync('launchctl list 2>/dev/null | grep claudeclaw || true', {
        encoding: 'utf8',
      })
      if (out.trim()) ok(`launchd service: ${out.trim()}`)
      else warn('launchd service not loaded')
    } catch {
      /* ignore */
    }
  } else if (process.platform === 'linux') {
    try {
      const out = execSync('systemctl --user is-active claudeclaw.service 2>/dev/null || true', {
        encoding: 'utf8',
      })
      const t = out.trim()
      if (t === 'active') ok('systemd user service active')
      else warn(`systemd user service: ${t || 'not installed'}`)
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
