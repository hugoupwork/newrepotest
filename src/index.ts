import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  TELEGRAM_BOT_TOKEN,
  PID_PATH,
  STORE_DIR,
  DECAY_INTERVAL_MS,
  PROJECT_ROOT,
} from './config.js'
import { initDatabase } from './db.js'
import { logger } from './logger.js'
import { createBot, sendToChat } from './bot.js'
import { runDecaySweep } from './memory.js'
import { cleanupOldUploads } from './media.js'
import { initScheduler, stopScheduler } from './scheduler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function showBanner(): void {
  const bannerPath = path.join(PROJECT_ROOT, 'banner.txt')
  if (existsSync(bannerPath)) {
    console.log(readFileSync(bannerPath, 'utf8'))
  } else {
    console.log('=== ClaudeClaw ===')
  }
}

function acquireLock(): void {
  mkdirSync(STORE_DIR, { recursive: true })
  if (existsSync(PID_PATH)) {
    const prev = Number(readFileSync(PID_PATH, 'utf8').trim())
    if (Number.isFinite(prev) && prev > 0) {
      try {
        process.kill(prev, 0)
        logger.warn({ pid: prev }, 'killing stale ClaudeClaw process')
        try {
          process.kill(prev, 'SIGTERM')
        } catch {
          /* ignore */
        }
      } catch {
        // not alive
      }
    }
  }
  writeFileSync(PID_PATH, String(process.pid))
}

function releaseLock(): void {
  try {
    if (existsSync(PID_PATH)) {
      const recorded = Number(readFileSync(PID_PATH, 'utf8').trim())
      if (recorded === process.pid) unlinkSync(PID_PATH)
    }
  } catch {
    /* ignore */
  }
}

async function main(): Promise<void> {
  showBanner()

  if (!TELEGRAM_BOT_TOKEN) {
    console.error(
      'TELEGRAM_BOT_TOKEN is missing from .env. Run `npm run setup` to configure.',
    )
    process.exit(1)
  }

  acquireLock()
  initDatabase()

  runDecaySweep()
  const decayHandle = setInterval(runDecaySweep, DECAY_INTERVAL_MS)

  cleanupOldUploads()

  const bot = createBot()
  initScheduler((chatId, text) => sendToChat(bot, chatId, text))

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down')
    stopScheduler()
    clearInterval(decayHandle)
    try {
      await bot.stop()
    } catch {
      /* ignore */
    }
    releaseLock()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  logger.info({ cwd: PROJECT_ROOT, script: __dirname }, 'ClaudeClaw starting')
  await bot.start({
    onStart: (info) => {
      logger.info({ username: info.username }, 'Telegram bot online')
    },
  })
}

main().catch((err) => {
  logger.error({ err }, 'fatal error')
  releaseLock()
  process.exit(1)
})
