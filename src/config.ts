import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readEnvFile } from './env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PROJECT_ROOT = path.resolve(__dirname, '..')
export const STORE_DIR = path.join(PROJECT_ROOT, 'store')
export const UPLOADS_DIR = path.join(PROJECT_ROOT, 'workspace', 'uploads')
export const DB_PATH = path.join(STORE_DIR, 'claudeclaw.db')
export const PID_PATH = path.join(STORE_DIR, 'claudeclaw.pid')

export const MAX_MESSAGE_LENGTH = 4096
export const TYPING_REFRESH_MS = 4000
export const SCHEDULER_TICK_MS = 60_000
export const DECAY_INTERVAL_MS = 24 * 60 * 60 * 1000

const env = readEnvFile()

export const TELEGRAM_BOT_TOKEN = env['TELEGRAM_BOT_TOKEN'] ?? ''
export const ALLOWED_CHAT_ID = env['ALLOWED_CHAT_ID'] ?? ''
export const GROQ_API_KEY = env['GROQ_API_KEY'] ?? ''
export const GOOGLE_API_KEY = env['GOOGLE_API_KEY'] ?? ''
export const APIFY_API_TOKEN = env['APIFY_API_TOKEN'] ?? ''
export const LOG_LEVEL = env['LOG_LEVEL'] ?? 'info'
