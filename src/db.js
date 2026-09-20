import Database from 'better-sqlite3';
import { getOpencodeDbPath } from './config.js';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    const dbPath = getOpencodeDbPath();
    dbInstance = new Database(dbPath, { readonly: true });
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function extractContent(data) {
  try {
    const parsed = JSON.parse(data);
    // Message data can have different structures
    if (parsed.content) return parsed.content;
    if (parsed.parts) {
      return parsed.parts.map(p => p.text || p.content || '').join('\n');
    }
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return data;
  }
}

export function getSessions(projectDir = null, options = {}) {
  const db = getDb();
  const { limit = 50, offset = 0, since = null, until = null } = options;

  let query = `
    SELECT s.id, s.title, s.directory, s.time_created, s.time_updated,
           s.cost, s.tokens_input, s.tokens_output, s.tokens_reasoning,
           s.tokens_cache_read, s.tokens_cache_write,
           s.model, s.agent
    FROM session s
  `;
  const params = [];

  if (projectDir) {
    query += ' WHERE s.directory LIKE ?';
    params.push(`%${projectDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}%`);
  }

  if (since) {
    query += params.length ? ' AND' : ' WHERE';
    query += ' s.time_created >= ?';
    params.push(since);
  }

  if (until) {
    query += params.length ? ' AND' : ' WHERE';
    query += ' s.time_created <= ?';
    params.push(until);
  }

  query += ' ORDER BY s.time_created DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getSessionMessages(sessionId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT m.id, m.session_id, m.time_created, m.data
    FROM message m
    WHERE m.session_id = ?
    ORDER BY m.time_created ASC
  `);
  const rows = stmt.all(sessionId);
  return rows.map(row => ({
    ...row,
    content: extractContent(row.data)
  }));
}

export function searchSessions(topic, projectDir = null, options = {}) {
  const db = getDb();
  const { limit = 50, since = null, until = null } = options;

  const searchTerm = `%${topic}%`;
  let query = `
    SELECT DISTINCT s.id, s.title, s.directory, s.time_created,
           m.data as message_data
    FROM session s
    JOIN message m ON m.session_id = s.id
    WHERE (m.data LIKE ? OR s.title LIKE ?)
  `;
  const params = [searchTerm, searchTerm];

  if (projectDir) {
    query += ' AND s.directory LIKE ?';
    params.push(`%${projectDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}%`);
  }

  if (since) {
    query += ' AND s.time_created >= ?';
    params.push(since);
  }

  if (until) {
    query += ' AND s.time_created <= ?';
    params.push(until);
  }

  query += ' ORDER BY s.time_created DESC LIMIT ?';
  params.push(limit);

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows.map(row => ({
    ...row,
    message_content: extractContent(row.message_data)
  }));
}

export function getProjectStats(projectDir) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      COUNT(DISTINCT s.id) as session_count,
      COUNT(m.id) as message_count,
      SUM(s.tokens_input + s.tokens_output + s.tokens_reasoning) as total_tokens,
      SUM(s.cost) as total_cost,
      MIN(s.time_created) as first_session,
      MAX(s.time_created) as last_session
    FROM session s
    LEFT JOIN message m ON m.session_id = s.id
    WHERE s.directory LIKE ?
  `);
  return stmt.get(`%${projectDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}%`);
}

export function getRecentActivity(hours = 24) {
  const db = getDb();
  const since = Date.now() - hours * 60 * 60 * 1000;
  const stmt = db.prepare(`
    SELECT s.id, s.title, s.directory, s.time_created,
           s.cost, s.tokens_input + s.tokens_output as tokens
    FROM session s
    WHERE s.time_created >= ?
    ORDER BY s.time_created DESC
    LIMIT 100
  `);
  return stmt.all(since);
}

export function getDbSchema() {
  const db = getDb();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const schema = [];
  for (const t of tables) {
    const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
    schema.push(`${t.name}(${cols.map(c => `${c.name} ${c.type}`).join(', ')})`);
  }
  return schema.join('\n');
}
