import fs from 'fs';
import path from 'path';
import { getSessions, getSessionMessages, getProjectStats } from './db.js';
import Handlebars from 'handlebars';
import { readHandoff } from './handoff.js';

const MD_TEMPLATE = `# {{projectName}} - Session Export

**Exported:** {{exportDate}}
**Project:** {{projectDir}}
**Sessions:** {{sessionCount}}

{{#each sessions}}
## {{title}} ({{date}})
**Tokens:** {{tokens}} | **Cost:** \${{cost}}

{{#each messages}}
### {{role}}
{{content}}
{{/each}}
{{/each}}
`;

const CSV_HEADERS = 'session_id,title,directory,date,tokens,cost,role,content';

export class Exporter {
  constructor(db, config) {
    this.db = db;
    this.config = config;
    this.mdTemplate = Handlebars.compile(MD_TEMPLATE);
  }

  async exportProject(projectDir, options = {}) {
    const { format = 'json', since = null } = options;
    const sessions = await this._getSessions(projectDir, since);

    const stats = await import('./db.js').then(m => m.getProjectStats(projectDir));
    const handoff = readHandoff(projectDir);

    const data = {
      projectName: path.basename(projectDir),
      projectDir,
      exportDate: new Date().toISOString(),
      sessionCount: sessions.length,
      stats,
      handoff,
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        directory: s.directory,
        date: new Date(s.time_created).toISOString(),
        tokens: (s.tokens_input || 0) + (s.tokens_output || 0) + (s.tokens_reasoning || 0),
        cost: s.cost,
        messages: [] // Will be filled per session
      }))
    };

    // Fetch messages for each session
    for (const session of data.sessions) {
      const messages = await import('./db.js').then(m => m.getSessionMessages(session.id));
      session.messages = messages.map(m => ({
        role: m.role,
        content: m.content,
        time: m.time_created
      }));
    }

    return this._format(data, format);
  }

  async exportAllProjects(options = {}) {
    const { format = 'json' } = options;
    const projectsRoot = (await import('./config.js')).getProjectsRoot();
    
    if (!fs.existsSync(projectsRoot)) return '{}';

    const projects = fs.readdirSync(projectsRoot, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(projectsRoot, e.name));

    const allData = { exportDate: new Date().toISOString(), projects: [] };

    for (const projectDir of projects) {
      const projectData = await this.exportProject(projectDir, { ...options, format: 'json' });
      const parsed = JSON.parse(projectData);
      allData.projects.push(parsed);
    }

    return this._format(allData, format);
  }

  async _getSessions(projectDir, since) {
    const sessions = await import('./db.js').then(m => m.getSessions(projectDir, { limit: 1000 }));
    return since 
      ? sessions.filter(s => s.time_created >= since)
      : sessions;
  }

  _format(data, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'md':
        return this.mdTemplate(data);
      case 'csv':
        return this._toCsv(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  _toCsv(data) {
    const rows = [CSV_HEADERS];
    if (data.sessions) {
      for (const session of data.sessions) {
        for (const msg of session.messages) {
          const content = msg.content.replace(/"/g, '""').replace(/\n/g, ' ');
          rows.push(`"${session.id}","${session.title}","${session.directory}","${session.date}",${session.tokens},${session.cost},"${msg.role}","${content}"`);
        }
      }
    }
    return rows.join('\n');
  }
}