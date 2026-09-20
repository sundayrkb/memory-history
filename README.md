# memory-history

Universal memory/history management CLI skill for OpenCode projects with session handoff, compaction, history queries, export, reports, and sync.

## Features

- **Session Handoff**: Auto-updates SESSION_HANDOFF.md on session end
- **History Queries**: Search sessions with SQL or natural language (via Ollama)
- **Compaction Control**: Trigger manual compaction with context injection
- **Project Context**: Initialize and manage project context files (AGENTS.md, RULES.md, PROJECT_CONTEXT.md, SESSION_HANDOFF.md)
- **Export**: Export session history as JSON, Markdown, or CSV
- **Reports**: Generate summary, detailed, or activity reports with Handlebars templates
- **Sync**: Sync to GitHub Gist or local file
- **Plugin Management**: Enable/disable/create OpenCode bootstrap plugin
- **Project Management**: Switch/list/create projects under configurable root

## Installation

```bash
# Clone and install
git clone https://github.com/sundayrkb/memory-history
cd memory-history
npm install
npm link

# Or install globally
npm install -g github:sundayrkb/memory-history
```

## Quick Start

```bash
# Initialize a project
memory-history init --project my-project

# Check status
memory-history status --project my-project

# Update session handoff
memory-history handoff --objective "Implement user auth" --completed "Created User model" --next-steps "Add login endpoint"

# Search history
memory-history query "authentication" --project my-project

# Export history
memory-history export --format md --project my-project --output history.md

# Generate report
memory-history report --type summary --project my-project

# Sync to GitHub Gist
export GITHUB_TOKEN=ghp_xxx
memory-history sync --target gist --project my-project

# Manage bootstrap plugin
memory-history plugin status
memory-history plugin create

# Switch projects
memory-history project switch my-other-project
```

## Commands

| Command | Description |
|---------|-------------|
| `handoff` | Update SESSION_HANDOFF.md |
| `query` | Search session history (SQL + NL) |
| `compact` | Trigger manual compaction |
| `status` | Show memory/history status |
| `init` | Initialize project context |
| `export` | Export session history |
| `report` | Generate reports |
| `sync` | Sync to external storage |
| `plugin` | Manage bootstrap plugin |
| `project` | Project management |

## Configuration

### Global Config: `~/.config/memory-history/config.json`
```json
{
  "projectsRoot": "~/openidea/projects",
  "opencodeDb": "~/.local/share/opencode/opencode.db",
  "ollama": { "host": "http://localhost:11434", "model": "llama3.1:8b", "enabled": true },
  "export": { "defaultFormat": "json", "outputDir": "~/memory-history-exports" },
  "sync": { "enabled": false, "targets": ["gist", "file"] },
  "bootstrapPlugin": { "autoCreate": true, "path": "~/.config/opencode/plugins/project-context-bootstrap.js" }
}
```

### Project Config: `<project>/.memory-history.json`
```json
{
  "name": "my-project",
  "handoffAutoUpdate": true,
  "compactionContextInjection": true,
  "syncEnabled": false
}
```

## Requirements

- Node.js >= 18
- OpenCode installed
- Ollama (optional, for natural language queries): `ollama pull llama3.1:8b`
- GitHub PAT with `gist` scope (for Gist sync)

## License

MIT
