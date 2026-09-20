# memory-history

Universal self-learning memory/history management for OpenCode projects with Graphify knowledge graph integration.

## Features

- **Self-Learning Session Handoff**: Auto-updates SESSION_HANDOFF.md on session end with extracted insights
- **Graphify Knowledge Graph Integration**: Stores session insights as nodes/edges for cross-session learning
- **Pattern Recognition**: Tracks recurring errors, successful commands, and workflows across sessions
- **Adaptive Handoff**: SESSION_HANDOFF.md template evolves with auto-populated pattern sections
- **Cross-Session Learning**: Identifies patterns across sessions, suggests optimizations
- **Graphify Query Interface**: Query session insights via `/graphify query`
- **Project Context**: Initialize and manage project context files (AGENTS.md, RULES.md, PROJECT_CONTEXT.md, SESSION_HANDOFF.md)
- **Graphify Knowledge Graph**: AST-based graphs for all projects with query/explain/path
- **Project Context**: Initialize and manage project context files (AGENTS.md, RULES.md, PROJECT_CONTEXT.md, SESSION_HANDOFF.md)

## Installation

### Option 1: Universal Installer (Recommended)

```bash
# Run the universal installer (includes ECC, Ollama, Graphify, AgentShield, self-learning plugin)
sudo -E bash install-universal-opencode-stack-sudo.sh
```

### Option 2: Manual Install (CLI only)

```bash
# Clone and install
git clone https://github.com/sundayrkb/memory-history
cd memory-history
npm install
npm link

# Or install globally
npm install -g github:sundayrkb/memory-history
```

### Option 3: OpenCode Plugin (Self-Learning)

The self-learning plugin is installed by the universal installer. To install manually:

```bash
# The plugin is installed at ~/.config/opencode/plugins/memory-history-selflearning-plugin.js
# The skill is at ~/.config/opencode/skills/memory-history-selflearning/
# Added to opencode.jsonc plugin array automatically
```

## Quick Start

```bash
# Initialize a project
memory-history init --project my-project

# Check status
memory-history status --project my-project

# Update session handoff manually
memory-history handoff --objective "Implement user auth" --completed "Created User model" --next-steps "Add login endpoint"

# Self-learning commands (in OpenCode session)
memory-history-selflearning extract    # Extract session insights
memory-history-selflearning patterns   # Show cross-session patterns
memory-history-selflearning enrich     # Enrich handoff with patterns
memory-history-selflearning query "auth bugs"  # Query insights via Graphify

# Query knowledge graph
graphify query "what connects auth to database?" --graph ~/openidea/projects/my-project/graphify-out/graph.json

# Explain a component
graphify explain "Exporter" --graph ~/openidea/projects/my-project/graphify-out/graph.json

# Find paths
graphify path "Auth" "Database" --undirected --graph ~/openidea/projects/my-project/graphify-out/graph.json
```

## Self-Learning Architecture

### OpenCode Plugin (`~/.config/opencode/plugins/memory-history-selflearning-plugin.js`)
- Registers event handlers for session lifecycle events
- Auto-triggers on `session.idle`, `session.status` (idle/completed/failed), `session.next.compaction.ended`
- Extracts insights from session transcript or Graphify knowledge graph
- Updates SESSION_HANDOFF.md with extracted insights

### Self-Learning Skill (`~/.config/opencode/skills/memory-history-selflearning/`)
| Module | Function |
|--------|----------|
| `extractor.js` | Extracts insights from session transcript or Graphify graph |
| `graphify-client.js` | Load/query Graphify knowledge graphs |
| `pattern-engine.js` | Cross-session pattern recognition (errors, commands, workflows) |
| `adaptive-handoff.js` | Auto-evolving SESSION_HANDOFF.md with pattern insights |
| `hooks.js` | OpenCode event hooks for session.idle, status, compaction |

### Knowledge Graph (`~/openidea/projects/<project>/graphify-out/`)
- AST-based graphs built by Graphify with Ollama backend (qwen3:1.7b)
- Query with `graphify query`, `graphify explain`, `graphify path`
- Cross-project queries via `--graph` flag

## Commands

### Main CLI (`memory-history`)

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

### Self-Learning Skill (`memory-history-selflearning` in OpenCode session)

| Command | Description |
|---------|-------------|
| `extract` | Extract session insights |
| `patterns` | Show cross-session patterns |
| `enrich` | Enrich handoff with patterns |
| `query <topic>` | Query insights via Graphify |

## Configuration

### Global Config: `~/.config/memory-history-selflearning/config.json`
```json
{
  "graphifyGraphPath": "~/openidea/projects/{project}/graphify-out/graph.json",
  "ollama": { "host": "http://localhost:11434", "model": "qwen3:1.7b" },
  "extraction": { "enabled": true, "temperature": 0.1 },
  "patterns": { "minFrequency": 2, "minSuccessRate": 0.5 },
  "handoff": { "adaptive": true, "maxSections": 10 }
}
```

## Requirements

- Node.js >= 18
- OpenCode installed
- Graphify with Ollama extra: `uv tool install "graphifyy[ollama]"`
- Ollama with qwen3:1.7b: `ollama pull qwen3:1.7b`
- OpenCode installed

## How Self-Learning Works

1. **Session End** (`session.idle` / `session.status: idle`) → Plugin extracts insights from session
2. **Insight Extraction** → Uses transcript (if available) or Graphify knowledge graph
3. **Knowledge Graph Update** → Insights stored as nodes/edges in project's Graphify graph
4. **SESSION_HANDOFF.md Update** → Auto-appends session summary with decisions, errors, next steps
5. **Adaptive Handoff** → Template evolves with auto-populated pattern sections
6. **Cross-Session Patterns** → Pattern engine analyzes accumulated graph for recurring patterns
7. **Next Session** → Compaction injects SESSION_HANDOFF.md context for continuity

## Universal Installer

The `install-universal-opencode-stack-sudo.sh` script installs the complete stack:

- OpenCode
- ECC (Full Profile) with AgentShield
- Ollama with qwen3:1.7b
- Graphify with Ollama extra
- ECC AgentShield
- Self-learning memory-history plugin
- Global AGENTS.md and project initializer

Run with:
```bash
sudo -E bash install-universal-opencode-stack-sudo.sh
```

## License

MIT