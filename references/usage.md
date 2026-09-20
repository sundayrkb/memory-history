# Memory-History Skill - Usage Guide

## Installation

```bash
# From the project directory
cd /home/sunday/openidea/projects/memory-history
npm install
npm link

# Or install globally
npm install -g /home/sunday/openidea/projects/memory-history
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
memory-history sync --target gist --project my-project

# Manage bootstrap plugin
memory-history plugin status
memory-history plugin create

# Switch projects
memory-history project switch my-other-project
```

## Commands Reference

### `memory-history handoff`
Update SESSION_HANDOFF.md with current session state.

```bash
memory-history handoff \
  --objective "Add user authentication" \
  --completed "Created User model" "Added JWT middleware" \
  --state "Tests passing, ready for review" \
  --next-steps "Add login endpoint" "Write integration tests" \
  --project my-project
```

### `memory-history query`
Search session history using SQL or natural language.

```bash
# Natural language (requires Ollama)
memory-history query "authentication bugs"

# Raw SQL
memory-history query "auth" --sql --project my-project

# All projects
memory-history query "auth" --all

# Output formats
memory-history query "auth" --format json
memory-history query "auth" --format md
```

### `memory-history compact`
Trigger manual compaction with context injection.

```bash
memory-history compact --project my-project --inject
```

### `memory-history status`
Show memory/history status for a project.

```bash
memory-history status --project my-project --verbose --json
```

### `memory-history init`
Initialize project context files.

```bash
memory-history init --project new-project --force
```

### `memory-history export`
Export session history in JSON, Markdown, or CSV.

```bash
memory-history export --format md --project my-project --output history.md
memory-history export --format csv --all --output all_history.csv
memory-history export --since 1704067200000 --compress
```

### `memory-history report`
Generate reports using Handlebars templates.

```bash
memory-history report --type summary --project my-project
memory-history report --type detailed --output report.md
memory-history report --type activity --project my-project
```

### `memory-history sync`
Sync to external storage (GitHub Gist or local file).

```bash
# GitHub Gist (requires GITHUB_TOKEN)
export GITHUB_TOKEN=ghp_xxx
memory-history sync --target gist --project my-project

# Local file
memory-history sync --target file --project my-project
```

### `memory-history plugin`
Manage the bootstrap plugin.

```bash
memory-history plugin status
memory-history plugin enable
memory-history plugin disable
memory-history plugin create
```

### `memory-history project`
Manage projects.

```bash
memory-history project list
memory-history project current
memory-history project switch my-project
memory-history project create new-project
```

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

## Templates

Custom Handlebars templates in `~/.config/memory-history/templates/`:
- `report-summary.hbs`
- `report-detailed.hbs`
- `report-activity.hbs`
- `export-md.hbs`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub PAT for Gist sync |
| `OLLAMA_HOST` | Ollama host (default: http://localhost:11434) |
| `OLLAMA_MODEL` | Ollama model (default: llama3.1:8b) |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Ollama not found | Install Ollama: `ollama pull llama3.1:8b` |
| Gist sync fails | Check GITHUB_TOKEN has `gist` scope |
| SQLite locked | Close other OpenCode sessions |
| Plugin not loading | Run `memory-history plugin create` |
| Natural language queries fail | Ensure Ollama is running with `llama3.1:8b` |