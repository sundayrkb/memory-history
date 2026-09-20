import { getOllamaConfig } from './config.js';
import { getDbSchema } from './db.js';
import { searchSessions } from './db.js';

const SCHEMA_CACHE = { schema: null, timestamp: 0 };

async function getCachedSchema() {
  const now = Date.now();
  if (SCHEMA_CACHE.schema && (now - SCHEMA_CACHE.timestamp) < 300000) {
    return SCHEMA_CACHE.schema;
  }
  const schema = getDbSchema();
  SCHEMA_CACHE.schema = schema;
  SCHEMA_CACHE.timestamp = now;
  return schema;
}

async function callOllama(prompt, host, model) {
  const response = await fetch(`${host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 500 }
    })
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
  const data = await response.json();
  return data.response;
}

export async function naturalLanguageQuery(topic, projectDir, options = {}) {
  const config = await import('./config.js').then(m => m.getOllamaConfig());
  if (!config.enabled) {
    return searchSessions(topic, projectDir, options);
  }

  try {
    const schema = await getCachedSchema();
    const prompt = `Convert this search topic to a SQLite query for OpenCode sessions database.

Schema:
${schema}

Topic: "${topic}"
Project filter: ${projectDir || 'all projects'}
Limit: ${options.limit || 50}

Return ONLY the SQL query. Use LIKE for text search. Join session and message tables.`;

    const sql = await callOllama(prompt, config.host, config.model);
    const cleanSql = sql.replace(/```sql|```/g, '').trim();

    const { getDb } = await import('./db.js');
    const db = getDb();
    const stmt = db.prepare(cleanSql);
    const results = stmt.all();

    return results;
  } catch (error) {
    console.error('NL query failed, falling back to SQL search:', error.message);
    return searchSessions(topic, projectDir, options);
  }
}
