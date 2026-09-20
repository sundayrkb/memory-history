import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { getSessions, getSessionMessages, getProjectStats } from './db.js';
import { readHandoff } from './handoff.js';

const SUMMARY_TEMPLATE = `# {{projectName}} - Session Summary

**Period:** {{startDate}} to {{endDate}}
**Sessions:** {{sessionCount}}
**Total Tokens:** {{totalTokens}}
**Total Cost:** \${{totalCost}}

## Recent Activity
{{#each recentSessions}}
- **{{title}}** ({{date}}) - {{tokens}} tokens, \${{cost}}
{{/each}}

## Key Decisions
{{#each decisions}}
- {{this}}
{{/each}}
`;

const DETAILED_TEMPLATE = `# {{projectName}} - Detailed Report

{{#each sessions}}
## Session: {{title}} ({{date}})
**Duration:** {{duration}} | **Tokens:** {{tokens}} | **Cost:** \${{cost}}

### Messages
{{#each messages}}
- [{{role}}] {{content}}
{{/each}}
{{/each}}
`;

const ACTIVITY_TEMPLATE = `# {{projectName}} - Activity Report

**Period:** {{startDate}} to {{endDate}}
**Total Sessions:** {{sessionCount}}
**Total Tokens:** {{totalTokens}}
**Total Cost:** \${{totalCost}}

## Daily Activity
{{#each dailyStats}}
### {{date}}
- Sessions: {{sessionCount}}
- Tokens: {{tokens}}
- Cost: \${{cost}}
{{/each}}

## Top Sessions by Tokens
{{#each topSessions}}
- **{{title}}** - {{tokens}} tokens (\${{cost}})
{{/each}}
`;

export class ReportGenerator {
  constructor(db, config) {
    this.db = db;
    this.config = config;
    this.templates = {
      summary: Handlebars.compile(SUMMARY_TEMPLATE),
      detailed: Handlebars.compile(DETAILED_TEMPLATE),
      activity: Handlebars.compile(ACTIVITY_TEMPLATE)
    };

    // Load custom templates if directory exists
    if (config.templateDir && fs.existsSync(config.templateDir)) {
      const files = fs.readdirSync(config.templateDir).filter(f => f.endsWith('.hbs'));
      for (const file of files) {
        const name = path.basename(file, '.hbs');
        const content = fs.readFileSync(path.join(config.templateDir, file), 'utf-8');
        this.templates[name] = Handlebars.compile(content);
      }
    }
  }

  async generate(projectDir, type = 'summary', options = {}) {
    const stats = await import('./db.js').then(m => m.getProjectStats(projectDir));
    const sessions = await import('./db.js').then(m => m.getSessions(projectDir, { limit: 100 }));
    const handoff = readHandoff(projectDir);

    const projectName = path.basename(projectDir);
    const dates = sessions.map(s => new Date(s.time_created));
    const startDate = dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : 'N/A';
    const endDate = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : 'N/A';

    // Extract decisions from handoff
    const decisions = this._extractDecisions(handoff);

    const data = {
      projectName,
      projectDir,
      startDate,
      endDate,
      sessionCount: sessions.length,
      totalTokens: stats.total_tokens || 0,
      totalCost: (stats.total_cost || 0).toFixed(4),
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title || 'Untitled',
        date: new Date(s.time_created).toLocaleDateString(),
        tokens: (s.tokens_input || 0) + (s.tokens_output || 0) + (s.tokens_reasoning || 0),
        cost: (s.cost || 0).toFixed(4),
        duration: 'N/A' // Would need start/end times
      })),
      recentSessions: sessions.slice(0, 10).map(s => ({
        title: s.title || 'Untitled',
        date: new Date(s.time_created).toLocaleDateString(),
        tokens: (s.tokens_input || 0) + (s.tokens_output || 0) + (s.tokens_reasoning || 0),
        cost: (s.cost || 0).toFixed(4)
      })),
      decisions,
      dailyStats: this._getDailyStats(sessions),
      topSessions: sessions
        .map(s => ({ title: s.title, tokens: (s.tokens_input||0)+(s.tokens_output||0)+(s.tokens_reasoning||0), cost: (s.cost||0).toFixed(4) }))
        .sort((a,b) => b.tokens - a.tokens)
        .slice(0, 10)
    };

    // Fill in messages for detailed report
    if (type === 'detailed') {
      for (const session of data.sessions) {
        const messages = await import('./db.js').then(m => m.getSessionMessages(session.id));
        session.messages = messages.map(m => ({
          role: m.role,
          content: m.content.slice(0, 200)
        }));
      }
    }

    const template = this.templates[type] || this.templates.summary;
    return template(data);
  }

  _extractDecisions(handoff) {
    if (!handoff) return [];
    const decisions = [];
    const decisionSection = handoff.split('## Decisions')[1];
    if (decisionSection) {
      const lines = decisionSection.split('\n');
      for (const line of lines) {
        const match = line.match(/^[-*]\s+(.+)/);
        if (match) decisions.push(match[1].trim());
      }
    }
    return decisions;
  }

  _getDailyStats(sessions) {
    const daily = {};
    for (const s of sessions) {
      const date = new Date(s.time_created).toLocaleDateString();
      if (!daily[date]) daily[date] = { date, sessionCount: 0, tokens: 0, cost: 0 };
      daily[date].sessionCount++;
      daily[date].tokens += (s.tokens_input||0)+(s.tokens_output||0)+(s.tokens_reasoning||0);
      daily[date].cost += s.cost || 0;
    }
    return Object.values(daily).sort((a,b) => b.date.localeCompare(a.date));
  }
}