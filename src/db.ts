import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DB_PATH, STORE_DIR } from './config.js'

let _db: Database.Database | null = null

export function db(): Database.Database {
  if (_db) return _db
  mkdirSync(STORE_DIR, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  return _db
}

export function initDatabase(): void {
  const d = db()
  d.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      chat_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      topic_key TEXT,
      content TEXT NOT NULL,
      sector TEXT NOT NULL CHECK(sector IN ('semantic','episodic')),
      salience REAL NOT NULL DEFAULT 1.0,
      created_at INTEGER NOT NULL,
      accessed_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memories_chat ON memories(chat_id);
    CREATE INDEX IF NOT EXISTS idx_memories_accessed ON memories(accessed_at DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      content,
      content='memories',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content) VALUES (new.id, new.content);
    END;
    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content) VALUES('delete', old.id, old.content);
    END;
    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content) VALUES('delete', old.id, old.content);
      INSERT INTO memories_fts(rowid, content) VALUES (new.id, new.content);
    END;

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      schedule TEXT NOT NULL,
      next_run INTEGER NOT NULL,
      last_run INTEGER,
      last_result TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused')),
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON scheduled_tasks(status, next_run);
  `)
}

// --- Sessions ---

export function getSession(chatId: string): string | null {
  const row = db()
    .prepare('SELECT session_id FROM sessions WHERE chat_id = ?')
    .get(chatId) as { session_id: string } | undefined
  return row?.session_id ?? null
}

export function setSession(chatId: string, sessionId: string): void {
  db()
    .prepare(
      `INSERT INTO sessions (chat_id, session_id, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET session_id = excluded.session_id, updated_at = excluded.updated_at`,
    )
    .run(chatId, sessionId, Date.now())
}

export function clearSession(chatId: string): void {
  db().prepare('DELETE FROM sessions WHERE chat_id = ?').run(chatId)
}

// --- Memories ---

export interface Memory {
  id: number
  chat_id: string
  topic_key: string | null
  content: string
  sector: 'semantic' | 'episodic'
  salience: number
  created_at: number
  accessed_at: number
}

export function insertMemory(
  chatId: string,
  content: string,
  sector: 'semantic' | 'episodic',
  topicKey: string | null = null,
): number {
  const now = Date.now()
  const info = db()
    .prepare(
      `INSERT INTO memories (chat_id, topic_key, content, sector, salience, created_at, accessed_at)
       VALUES (?, ?, ?, ?, 1.0, ?, ?)`,
    )
    .run(chatId, topicKey, content, sector, now, now)
  return Number(info.lastInsertRowid)
}

export function searchMemoriesFts(
  chatId: string,
  query: string,
  limit = 3,
): Memory[] {
  if (!query.trim()) return []
  try {
    return db()
      .prepare(
        `SELECT m.* FROM memories_fts f
         JOIN memories m ON m.id = f.rowid
         WHERE f.content MATCH ? AND m.chat_id = ?
         ORDER BY rank
         LIMIT ?`,
      )
      .all(query, chatId, limit) as Memory[]
  } catch {
    return []
  }
}

export function recentMemories(chatId: string, limit = 5): Memory[] {
  return db()
    .prepare(
      `SELECT * FROM memories WHERE chat_id = ?
       ORDER BY accessed_at DESC LIMIT ?`,
    )
    .all(chatId, limit) as Memory[]
}

export function touchMemory(id: number): void {
  db()
    .prepare(
      `UPDATE memories
       SET accessed_at = ?,
           salience = MIN(salience + 0.1, 5.0)
       WHERE id = ?`,
    )
    .run(Date.now(), id)
}

export function decayMemories(): { decayed: number; deleted: number } {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  const decayInfo = db()
    .prepare('UPDATE memories SET salience = salience * 0.98 WHERE created_at < ?')
    .run(cutoff)
  const deleteInfo = db()
    .prepare('DELETE FROM memories WHERE salience < 0.1')
    .run()
  return { decayed: decayInfo.changes, deleted: deleteInfo.changes }
}

export function memoryCount(chatId?: string): number {
  if (chatId) {
    const r = db()
      .prepare('SELECT COUNT(*) as n FROM memories WHERE chat_id = ?')
      .get(chatId) as { n: number }
    return r.n
  }
  const r = db().prepare('SELECT COUNT(*) as n FROM memories').get() as { n: number }
  return r.n
}

// --- Scheduled Tasks ---

export interface ScheduledTask {
  id: string
  chat_id: string
  prompt: string
  schedule: string
  next_run: number
  last_run: number | null
  last_result: string | null
  status: 'active' | 'paused'
  created_at: number
}

export function createTask(t: Omit<ScheduledTask, 'created_at' | 'last_run' | 'last_result'>): void {
  db()
    .prepare(
      `INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(t.id, t.chat_id, t.prompt, t.schedule, t.next_run, t.status, Date.now())
}

export function listTasks(): ScheduledTask[] {
  return db()
    .prepare('SELECT * FROM scheduled_tasks ORDER BY next_run ASC')
    .all() as ScheduledTask[]
}

export function getTask(id: string): ScheduledTask | null {
  return (
    (db()
      .prepare('SELECT * FROM scheduled_tasks WHERE id = ?')
      .get(id) as ScheduledTask | undefined) ?? null
  )
}

export function deleteTask(id: string): void {
  db().prepare('DELETE FROM scheduled_tasks WHERE id = ?').run(id)
}

export function setTaskStatus(id: string, status: 'active' | 'paused'): void {
  db().prepare('UPDATE scheduled_tasks SET status = ? WHERE id = ?').run(status, id)
}

export function getDueTasks(): ScheduledTask[] {
  return db()
    .prepare(
      `SELECT * FROM scheduled_tasks
       WHERE status = 'active' AND next_run <= ?
       ORDER BY next_run ASC`,
    )
    .all(Date.now()) as ScheduledTask[]
}

export function updateTaskAfterRun(
  id: string,
  nextRun: number,
  lastResult: string,
): void {
  db()
    .prepare(
      `UPDATE scheduled_tasks
       SET last_run = ?, last_result = ?, next_run = ?
       WHERE id = ?`,
    )
    .run(Date.now(), lastResult.slice(0, 4000), nextRun, id)
}
