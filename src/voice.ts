import { readFileSync, renameSync, existsSync } from 'node:fs'
import path from 'node:path'
import { GROQ_API_KEY } from './config.js'

export function voiceCapabilities(): { stt: boolean; tts: boolean } {
  return { stt: Boolean(GROQ_API_KEY), tts: false }
}

export async function transcribeAudio(filePath: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  // Groq won't accept .oga; rename to .ogg if needed.
  let actualPath = filePath
  if (filePath.endsWith('.oga')) {
    actualPath = filePath.replace(/\.oga$/, '.ogg')
    if (existsSync(filePath)) renameSync(filePath, actualPath)
  }

  const fileBuf = readFileSync(actualPath)
  const filename = path.basename(actualPath)
  const boundary = `----claudeclaw${Date.now().toString(16)}`

  const parts: Buffer[] = []
  const push = (s: string) => parts.push(Buffer.from(s, 'utf8'))

  push(`--${boundary}\r\n`)
  push(`Content-Disposition: form-data; name="model"\r\n\r\n`)
  push(`whisper-large-v3\r\n`)
  push(`--${boundary}\r\n`)
  push(`Content-Disposition: form-data; name="response_format"\r\n\r\n`)
  push(`json\r\n`)
  push(`--${boundary}\r\n`)
  push(
    `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
  )
  push(`Content-Type: application/octet-stream\r\n\r\n`)
  parts.push(fileBuf)
  push(`\r\n--${boundary}--\r\n`)

  const body = Buffer.concat(parts)

  const res = await fetch(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq transcription failed ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { text?: string }
  return data.text ?? ''
}
