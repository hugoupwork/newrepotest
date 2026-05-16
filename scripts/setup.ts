import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { spawnSync, execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ENV_PATH = path.join(PROJECT_ROOT, '.env')
const BANNER_PATH = path.join(PROJECT_ROOT, 'banner.txt')

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

const ok = (m: string) => console.log(`${GREEN}✓${RESET} ${m}`)
const warn = (m: string) => console.log(`${YELLOW}⚠${RESET} ${m}`)
const bad = (m: string) => console.log(`${RED}✗${RESET} ${m}`)
const info = (m: string) => console.log(`${CYAN}${m}${RESET}`)
const heading = (m: string) => console.log(`\n${BOLD}${m}${RESET}\n`)

function readExistingEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
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

function writeEnv(values: Record<string, string>): void {
  const lines = [
    '# ClaudeClaw configuration. Never commit this file.',
    '',
    `TELEGRAM_BOT_TOKEN=${values.TELEGRAM_BOT_TOKEN ?? ''}`,
    `ALLOWED_CHAT_ID=${values.ALLOWED_CHAT_ID ?? ''}`,
    '',
    `GROQ_API_KEY=${values.GROQ_API_KEY ?? ''}`,
    `GOOGLE_API_KEY=${values.GOOGLE_API_KEY ?? ''}`,
    `APIFY_API_TOKEN=${values.APIFY_API_TOKEN ?? ''}`,
    '',
    `LOG_LEVEL=${values.LOG_LEVEL ?? 'info'}`,
    '',
  ]
  writeFileSync(ENV_PATH, lines.join('\n'), { mode: 0o600 })
}

function showBanner(): void {
  if (existsSync(BANNER_PATH)) {
    console.log(readFileSync(BANNER_PATH, 'utf8'))
  } else {
    console.log(`${BOLD}=== ClaudeClaw setup ===${RESET}`)
  }
}

async function main() {
  showBanner()

  heading('Step 1: requirements')
  const nodeMajor = Number(process.versions.node.split('.')[0])
  if (nodeMajor >= 20) ok(`Node ${process.versions.node}`)
  else {
    bad(`Node ${process.versions.node} (need >= 20)`)
    process.exit(1)
  }

  try {
    const v = execSync('claude --version', { encoding: 'utf8' }).trim()
    ok(`Claude CLI: ${v}`)
  } catch {
    bad('Claude CLI not found. Install from https://docs.claude.com/claude-code and run `claude login`.')
    process.exit(1)
  }

  heading('Step 2: build the project')
  const buildRes = spawnSync('npm', ['run', 'build'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  })
  if (buildRes.status !== 0) {
    bad('Build failed. Fix TypeScript errors and re-run setup.')
    process.exit(1)
  }
  ok('Build succeeded')

  const rl = createInterface({ input: stdin, output: stdout })
  const existing = readExistingEnv()
  const next: Record<string, string> = { ...existing }

  const ask = async (label: string, key: string, hint?: string): Promise<void> => {
    const current = existing[key]
    const display = current ? ` ${YELLOW}[current: ${current.slice(0, 8)}…]${RESET}` : ''
    const prefix = hint ? `  ${hint}\n  ` : '  '
    const answer = (await rl.question(`${prefix}${label}${display}: `)).trim()
    if (answer) next[key] = answer
    else if (current) next[key] = current
  }

  heading('Step 3: Telegram bot token')
  info('Get this from @BotFather on Telegram. Send /newbot, follow prompts, paste here.')
  await ask('TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN')
  if (!next.TELEGRAM_BOT_TOKEN) {
    bad('TELEGRAM_BOT_TOKEN is required.')
    rl.close()
    process.exit(1)
  }

  heading('Step 4: optional API keys')
  info('Press Enter to skip any of these.')
  await ask('GROQ_API_KEY (voice transcription, free at console.groq.com)', 'GROQ_API_KEY')
  await ask('GOOGLE_API_KEY (Gemini video analysis, free at aistudio.google.com)', 'GOOGLE_API_KEY')
  await ask('APIFY_API_TOKEN (web scraping, console.apify.com)', 'APIFY_API_TOKEN')

  writeEnv(next)
  ok(`.env written to ${ENV_PATH}`)

  heading('Step 5: personalize CLAUDE.md')
  info('Opening CLAUDE.md in your editor so you can fill in [YOUR NAME] etc.')
  const editor = process.env.EDITOR ?? (process.platform === 'darwin' ? 'open -e' : 'nano')
  try {
    const [cmd, ...args] = editor.split(' ')
    spawnSync(cmd, [...args, path.join(PROJECT_ROOT, 'CLAUDE.md')], {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
    })
  } catch {
    warn(`Could not launch editor (${editor}). Edit CLAUDE.md manually.`)
  }

  heading('Step 6: discover your Telegram chat ID')
  info('Starting the bot now. Open Telegram, find your bot, send /chatid, then paste the ID here.')
  info('(Press Ctrl+C in this window AFTER you have the ID.)')
  const proc = spawnSync('node', [path.join(PROJECT_ROOT, 'dist', 'index.js')], {
    stdio: 'inherit',
    cwd: PROJECT_ROOT,
    detached: false,
  })
  void proc
  const chatId = (await rl.question('Paste your chat ID here (or skip with Enter): ')).trim()
  if (chatId) {
    next.ALLOWED_CHAT_ID = chatId
    writeEnv(next)
    ok('Chat ID saved.')
  }

  heading('Step 7: install background service')
  if (process.platform === 'darwin') {
    installLaunchd()
  } else if (process.platform === 'linux') {
    installSystemd()
  } else {
    info('Windows: install PM2 globally and run:')
    console.log(`  npm install -g pm2`)
    console.log(`  pm2 start ${path.join(PROJECT_ROOT, 'dist', 'index.js')} --name claudeclaw`)
    console.log(`  pm2 save && pm2 startup`)
  }

  rl.close()

  heading('Done')
  ok('ClaudeClaw is installed.')
  console.log(`Next: send a message to your bot on Telegram.`)
  console.log(`Logs:  /tmp/claudeclaw.log`)
  console.log(`Status: npm run status`)
}

function installLaunchd(): void {
  const plistPath = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.claudeclaw.app.plist')
  const nodeBin = process.execPath
  const dist = path.join(PROJECT_ROOT, 'dist', 'index.js')
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.claudeclaw.app</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodeBin}</string>
    <string>${dist}</string>
  </array>
  <key>WorkingDirectory</key><string>${PROJECT_ROOT}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>/tmp/claudeclaw.log</string>
  <key>StandardErrorPath</key><string>/tmp/claudeclaw.log</string>
</dict>
</plist>
`
  mkdirSync(path.dirname(plistPath), { recursive: true })
  writeFileSync(plistPath, plist)
  spawnSync('launchctl', ['unload', plistPath], { stdio: 'ignore' })
  const load = spawnSync('launchctl', ['load', plistPath], { stdio: 'inherit' })
  if (load.status === 0) ok(`launchd service installed at ${plistPath}`)
  else warn(`launchctl load failed; load manually: launchctl load ${plistPath}`)
}

function installSystemd(): void {
  const unitDir = path.join(os.homedir(), '.config', 'systemd', 'user')
  mkdirSync(unitDir, { recursive: true })
  const unitPath = path.join(unitDir, 'claudeclaw.service')
  const nodeBin = process.execPath
  const dist = path.join(PROJECT_ROOT, 'dist', 'index.js')
  const unit = `[Unit]
Description=ClaudeClaw personal assistant bot
After=network.target

[Service]
Type=simple
ExecStart=${nodeBin} ${dist}
WorkingDirectory=${PROJECT_ROOT}
Restart=always
RestartSec=10
StandardOutput=append:/tmp/claudeclaw.log
StandardError=append:/tmp/claudeclaw.log

[Install]
WantedBy=default.target
`
  writeFileSync(unitPath, unit)
  spawnSync('systemctl', ['--user', 'daemon-reload'], { stdio: 'inherit' })
  spawnSync('systemctl', ['--user', 'enable', '--now', 'claudeclaw.service'], { stdio: 'inherit' })
  ok(`systemd unit installed at ${unitPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
