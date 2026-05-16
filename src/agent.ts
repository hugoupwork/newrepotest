import { query } from '@anthropic-ai/claude-agent-sdk'
import { PROJECT_ROOT } from './config.js'
import { readEnvFile } from './env.js'
import { logger } from './logger.js'

export interface AgentResult {
  text: string | null
  newSessionId?: string
}

export async function runAgent(
  message: string,
  sessionId?: string,
  onTyping?: () => void,
): Promise<AgentResult> {
  const secrets = readEnvFile()

  // Build a sanitized env for the subprocess: pass through PATH/HOME/etc, plus the
  // .env keys, without mutating our own process.env.
  const childEnv: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') childEnv[k] = v
  }
  for (const [k, v] of Object.entries(secrets)) {
    childEnv[k] = v
  }

  let typingInterval: NodeJS.Timeout | null = null
  if (onTyping) {
    typingInterval = setInterval(() => {
      try {
        onTyping()
      } catch (err) {
        logger.warn({ err }, 'typing callback threw')
      }
    }, 4000)
  }

  let resultText: string | null = null
  let newSessionId: string | undefined

  try {
    const iter = query({
      prompt: message,
      options: {
        cwd: PROJECT_ROOT,
        resume: sessionId,
        settingSources: ['project', 'user'],
        permissionMode: 'bypassPermissions',
        env: childEnv,
      },
    })

    for await (const event of iter) {
      const e = event as { type?: string; subtype?: string; session_id?: string; result?: string }
      if (e.type === 'system' && e.subtype === 'init' && e.session_id) {
        newSessionId = e.session_id
      } else if (e.type === 'result') {
        resultText = typeof e.result === 'string' ? e.result : null
      }
    }
  } finally {
    if (typingInterval) clearInterval(typingInterval)
  }

  return { text: resultText, newSessionId }
}
