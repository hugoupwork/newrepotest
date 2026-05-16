import {
  insertMemory,
  recentMemories,
  searchMemoriesFts,
  touchMemory,
  decayMemories,
  type Memory,
} from './db.js'
import { logger } from './logger.js'

const SEMANTIC_REGEX = /\b(my|i am|i'm|i prefer|remember|always|never)\b/i

function sanitizeFtsQuery(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && w.length < 30)
    .slice(0, 6)
  if (cleaned.length === 0) return ''
  return cleaned.map((w) => `${w}*`).join(' OR ')
}

export async function buildMemoryContext(
  chatId: string,
  userMessage: string,
): Promise<string> {
  const query = sanitizeFtsQuery(userMessage)
  const matched = query ? searchMemoriesFts(chatId, query, 3) : []
  const recent = recentMemories(chatId, 5)

  const seen = new Set<number>()
  const combined: Memory[] = []
  for (const m of [...matched, ...recent]) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    combined.push(m)
  }
  if (combined.length === 0) return ''

  for (const m of combined) touchMemory(m.id)

  const lines = combined.map(
    (m) => `- ${m.content} (${m.sector})`,
  )
  return `[Memory context]\n${lines.join('\n')}\n\n`
}

export async function saveConversationTurn(
  chatId: string,
  userMsg: string,
  assistantMsg: string,
): Promise<void> {
  try {
    if (userMsg.length > 20 && !userMsg.startsWith('/')) {
      const sector = SEMANTIC_REGEX.test(userMsg) ? 'semantic' : 'episodic'
      insertMemory(chatId, `user: ${userMsg.slice(0, 500)}`, sector)
    }
    if (assistantMsg.length > 40) {
      insertMemory(chatId, `assistant: ${assistantMsg.slice(0, 500)}`, 'episodic')
    }
  } catch (err) {
    logger.warn({ err }, 'failed to save conversation turn')
  }
}

export function runDecaySweep(): void {
  try {
    const { decayed, deleted } = decayMemories()
    logger.info({ decayed, deleted }, 'memory decay sweep complete')
  } catch (err) {
    logger.warn({ err }, 'decay sweep failed')
  }
}
