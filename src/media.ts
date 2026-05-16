import { mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { UPLOADS_DIR } from './config.js'
import { logger } from './logger.js'

function ensureDir(): void {
  mkdirSync(UPLOADS_DIR, { recursive: true })
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120) || 'file'
}

interface TelegramFileResponse {
  ok: boolean
  result?: { file_path?: string }
  description?: string
}

export async function downloadMedia(
  botToken: string,
  fileId: string,
  originalFilename?: string,
): Promise<string> {
  ensureDir()
  const metaRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
  )
  if (!metaRes.ok) {
    throw new Error(`Telegram getFile failed: ${metaRes.status}`)
  }
  const meta = (await metaRes.json()) as TelegramFileResponse
  if (!meta.ok || !meta.result?.file_path) {
    throw new Error(`Telegram getFile returned no file_path: ${meta.description ?? 'unknown'}`)
  }
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${meta.result.file_path}`
  const dlRes = await fetch(fileUrl)
  if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`)
  const buf = Buffer.from(await dlRes.arrayBuffer())

  const baseName = sanitize(originalFilename ?? path.basename(meta.result.file_path))
  const outPath = path.join(UPLOADS_DIR, `${Date.now()}_${baseName}`)
  writeFileSync(outPath, buf)
  return outPath
}

export function buildPhotoMessage(localPath: string, caption?: string): string {
  const base = `[Photo attached at ${localPath}]`
  return caption ? `${base}\n\n${caption}` : `${base}\n\nPlease analyze the photo.`
}

export function buildDocumentMessage(
  localPath: string,
  filename: string,
  caption?: string,
): string {
  const base = `[Document "${filename}" attached at ${localPath}]`
  return caption ? `${base}\n\n${caption}` : `${base}\n\nPlease read it and report what's inside.`
}

export function buildVideoMessage(localPath: string, caption?: string): string {
  const base = [
    `[Video attached at ${localPath}]`,
    `Use the gemini-api-dev skill (or call the Gemini API directly) with the GOOGLE_API_KEY`,
    `from the project's .env file to analyze this video. Upload the file via the Gemini Files API`,
    `then run a generateContent request describing what's happening.`,
  ].join('\n')
  return caption ? `${base}\n\n${caption}` : base
}

export function cleanupOldUploads(maxAgeMs = 24 * 60 * 60 * 1000): void {
  try {
    ensureDir()
    const cutoff = Date.now() - maxAgeMs
    for (const entry of readdirSync(UPLOADS_DIR)) {
      const p = path.join(UPLOADS_DIR, entry)
      try {
        const st = statSync(p)
        if (st.isFile() && st.mtimeMs < cutoff) unlinkSync(p)
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    logger.warn({ err }, 'cleanupOldUploads failed')
  }
}
