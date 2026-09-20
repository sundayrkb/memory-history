---
name: memory-history
description: Manage OpenCode session memory/history - session handoffs, compaction, history queries, project context, export, reports, sync. Controls bootstrap plugin auto-updates.
license: MIT
---

# Memory History Skill

Universal memory/history management for OpenCode projects.

## Commands

| Command | Description |
|---------|-------------|
| `handoff` | Update SESSION_HANDOFF.md |
| `query` | Search session history (SQL + NL) |
| `compact` | Trigger manual compaction |
| `status` | Show memory/history status |
| `init` | Initialize project context |
| `export` | Export session history (JSON/MD/CSV) |
| `report` | Generate reports (summary/detailed/activity) |
| `sync` | Sync to external storage (gist/file) |
| `plugin` | Manage bootstrap plugin (enable/disable/status/create) |
| `project` | Project management (switch/list/current/create) |

## Auto-Features (via bootstrap plugin)

- SESSION_HANDOFF.md updated on session.end
- Compaction context injection
- Project context bootstrap

## Configuration

Global: `~/.config/memory-history/config.json`
Project: `<project>/.memory-history.json`