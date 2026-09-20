import fs from 'fs';
import path from 'path';
import { getConfig, getProjectsRoot } from './config.js';

const CONTEXT_FILES = [
  { name: 'AGENTS.md', template: getAgentsTemplate() },
  { name: 'RULES.md', template: getRulesTemplate() },
  { name: 'PROJECT_CONTEXT.md', template: getProjectContextTemplate() },
  { name: 'SESSION_HANDOFF.md', template: getHandoffTemplate() },
];

const AGENT_DIRS = ['.agent', '.opencode/skills'];

export function listProjects() {
  const projectsRoot = getProjectsRoot();
  if (!fs.existsSync(projectsRoot)) return [];

  const entries = fs.readdirSync(projectsRoot, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => ({
      name: e.name,
      path: path.join(projectsRoot, e.name),
      hasContext: CONTEXT_FILES.some(f => fs.existsSync(path.join(projectsRoot, e.name, f.name)))
    }));
}

export function getCurrentProject() {
  return { name: path.basename(process.cwd()), path: process.cwd() };
}

export async function switchProject(name) {
  const projects = listProjects();
  const project = projects.find(p => p.name === name);
  if (!project) throw new Error(`Project not found: ${name}`);
  process.chdir(project.path);
  return project;
}

export async function createProject(name, options = {}) {
  const projectsRoot = getProjectsRoot();
  const projectDir = path.join(projectsRoot, name);

  if (fs.existsSync(projectDir) && !options.force) {
    throw new Error(`Project already exists: ${name}`);
  }

  fs.mkdirSync(projectDir, { recursive: true });
  await initProject(projectDir, options);

  return { name, path: projectDir };
}

export async function initProject(projectDir, options = {}) {
  // Ensure project directory exists
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const created = [];
  const existed = [];

  for (const file of CONTEXT_FILES) {
    const filePath = path.join(projectDir, file.name);
    if (fs.existsSync(filePath) && !options.force) {
      existed.push(file.name);
    } else {
      fs.writeFileSync(filePath, file.template, 'utf-8');
      created.push(file.name);
    }
  }

  for (const dir of AGENT_DIRS) {
    const dirPath = path.join(projectDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      created.push(dir + '/');
    } else {
      existed.push(dir + '/');
    }
  }

  return { created, existed };
}

export function getProjectConfig(projectDir) {
  const configPath = path.join(projectDir, '.memory-history.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function getAgentsTemplate() {
  return `# Project-Specific Agent Rules

This file defines agent behavior specific to this project. It extends the global AGENTS.md.

## Project-Specific Instructions

Add project-specific rules here. Examples:
- Coding conventions for this project
- Testing requirements
- Build/deploy commands
- Architecture decisions
- File organization patterns

## Instruction Priority (Global → Project)

1. User instructions (explicit requests)
2. **This file** (project AGENTS.md)
3. Project RULES.md
4. Global AGENTS.md
5. Skills

## Project-Specific Patterns

Document patterns unique to this codebase that agents should follow.
`;
}

function getRulesTemplate() {
  return `# Project Requirements & Constraints

This file documents project-specific requirements and constraints that must be followed.

## Requirements

List verified requirements here. Never invent requirements.

### Functional Requirements
- 

### Non-Functional Requirements
- 

## Constraints

Document hard constraints (technical, business, regulatory).

### Technical Constraints
- 

### Business Constraints
- 

### Regulatory/Compliance
- 

## Decisions

Record key technical decisions with rationale (ADR-style).
- 
`;
}

function getProjectContextTemplate() {
  return `# Project Context

Stable project information. Only record verified information.

## Purpose

What problem does this project solve? Who is it for?

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Language | | |
| Framework | | |
| Database | | |
| Build Tool | | |
| Test Framework | | |
| Package Manager | | |

## Architecture

Describe the high-level architecture (monolith, microservices, serverless, etc.)

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| | | |

## Repository Structure

\`\`\`text
project-root/
├── src/
│   ├── ...
├── tests/
├── docs/
└── ...
\`\`\`

## Important Files

| File | Purpose |
|------|---------|
| | |

## Dependencies

Key dependencies and their purposes.

## Commands

| Command | Purpose |
|---------|---------|
| \`dev\` | |
| \`build\` | |
| \`test\` | |
| \`lint\` | |
| \`typecheck\` | |

## Integrations

External services, APIs, third-party tools.

## Configuration

Environment variables, config files, secrets management.

## Deployment

Deployment targets, pipelines, environments.

## Stable Technical Decisions

Decisions that are unlikely to change. Reference ADRs if applicable.
`;
}

function getHandoffTemplate() {
  return `# Session Handoff

Current project/session state for continuity across sessions.

## Objective

What is the current goal or task?

## Completed Work

- 

## Changed Files

| File | Change |
|------|--------|
| | |

## Current State

Describe the current state of the work.

## Verification

What has been verified? What tests pass?

## Decisions

Key decisions made in this session.

## Known Issues

Any known problems or blockers.

## Unfinished Work

What remains to be done?

## Investigations Completed

What has been investigated and resolved.

## Exact Next Steps

1. 
2. 
3. 
`;
}
