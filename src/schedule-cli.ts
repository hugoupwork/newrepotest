import { randomUUID } from 'node:crypto'
import {
  initDatabase,
  createTask,
  listTasks,
  deleteTask,
  setTaskStatus,
  getTask,
} from './db.js'
import { computeNextRun, validateCron } from './scheduler.js'

function printHelp(): void {
  console.log(`Usage:
  schedule-cli create "<prompt>" "<cron>" <chat_id>
  schedule-cli list
  schedule-cli delete <id>
  schedule-cli pause <id>
  schedule-cli resume <id>

Cron examples:
  "0 9 * * *"     daily at 9am
  "0 9 * * 1"     every Monday at 9am
  "0 */4 * * *"   every 4 hours`)
}

function formatTime(ms: number | null): string {
  if (!ms) return '-'
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19)
}

async function main() {
  initDatabase()
  const [, , cmd, ...rest] = process.argv

  switch (cmd) {
    case 'create': {
      const [prompt, schedule, chatId] = rest
      if (!prompt || !schedule || !chatId) {
        console.error('Missing args. Need: "<prompt>" "<cron>" <chat_id>')
        process.exit(1)
      }
      if (!validateCron(schedule)) {
        console.error(`Invalid cron expression: ${schedule}`)
        process.exit(1)
      }
      const id = randomUUID().slice(0, 8)
      const nextRun = computeNextRun(schedule)
      createTask({ id, chat_id: chatId, prompt, schedule, next_run: nextRun, status: 'active' })
      console.log(`Created task ${id}`)
      console.log(`Next run: ${formatTime(nextRun)}`)
      break
    }
    case 'list': {
      const tasks = listTasks()
      if (tasks.length === 0) {
        console.log('No scheduled tasks.')
        break
      }
      console.log(
        ['ID', 'STATUS', 'NEXT RUN', 'SCHEDULE', 'PROMPT'].join('\t'),
      )
      for (const t of tasks) {
        console.log(
          [t.id, t.status, formatTime(t.next_run), t.schedule, t.prompt.slice(0, 60)].join('\t'),
        )
      }
      break
    }
    case 'delete': {
      const [id] = rest
      if (!id) {
        console.error('Missing id')
        process.exit(1)
      }
      if (!getTask(id)) {
        console.error(`No task with id ${id}`)
        process.exit(1)
      }
      deleteTask(id)
      console.log(`Deleted ${id}`)
      break
    }
    case 'pause':
    case 'resume': {
      const [id] = rest
      if (!id) {
        console.error('Missing id')
        process.exit(1)
      }
      if (!getTask(id)) {
        console.error(`No task with id ${id}`)
        process.exit(1)
      }
      setTaskStatus(id, cmd === 'pause' ? 'paused' : 'active')
      console.log(`${cmd}d ${id}`)
      break
    }
    default:
      printHelp()
      process.exit(cmd ? 1 : 0)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
