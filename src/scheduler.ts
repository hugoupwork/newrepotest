import parser from 'cron-parser'
import { getDueTasks, updateTaskAfterRun } from './db.js'
import { runAgent } from './agent.js'
import { logger } from './logger.js'
import { SCHEDULER_TICK_MS } from './config.js'

export type Sender = (chatId: string, text: string) => Promise<void>

let sendFn: Sender | null = null
let tickHandle: NodeJS.Timeout | null = null

export function computeNextRun(cronExpression: string): number {
  const it = parser.parseExpression(cronExpression)
  return it.next().getTime()
}

export function validateCron(cronExpression: string): boolean {
  try {
    parser.parseExpression(cronExpression)
    return true
  } catch {
    return false
  }
}

export async function runDueTasks(): Promise<void> {
  const due = getDueTasks()
  for (const task of due) {
    logger.info({ id: task.id, prompt: task.prompt.slice(0, 80) }, 'running scheduled task')
    try {
      if (sendFn) {
        await sendFn(task.chat_id, `⏰ Running scheduled task: ${task.prompt.slice(0, 100)}`)
      }
      const { text } = await runAgent(task.prompt)
      const result = text ?? '(no output)'
      if (sendFn) await sendFn(task.chat_id, result)

      let next: number
      try {
        next = computeNextRun(task.schedule)
      } catch {
        next = Date.now() + 24 * 60 * 60 * 1000
      }
      updateTaskAfterRun(task.id, next, result.slice(0, 4000))
    } catch (err) {
      logger.error({ err, id: task.id }, 'scheduled task failed')
      try {
        if (sendFn) await sendFn(task.chat_id, `❌ Scheduled task ${task.id} failed: ${(err as Error).message}`)
      } catch {
        /* ignore */
      }
      const next =
        (() => {
          try {
            return computeNextRun(task.schedule)
          } catch {
            return Date.now() + 60 * 60 * 1000
          }
        })()
      updateTaskAfterRun(task.id, next, `error: ${(err as Error).message}`)
    }
  }
}

export function initScheduler(send: Sender): void {
  sendFn = send
  if (tickHandle) clearInterval(tickHandle)
  tickHandle = setInterval(() => {
    runDueTasks().catch((err) => logger.error({ err }, 'scheduler tick failed'))
  }, SCHEDULER_TICK_MS)
  logger.info({ tickMs: SCHEDULER_TICK_MS }, 'scheduler started')
}

export function stopScheduler(): void {
  if (tickHandle) {
    clearInterval(tickHandle)
    tickHandle = null
  }
}
