import fs from 'fs';
import path from 'path';

const TEMPLATE = `# Session Handoff

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

function getHandoffPath(projectDir) {
  return path.join(projectDir, 'SESSION_HANDOFF.md');
}

export function readHandoff(projectDir) {
  const filePath = getHandoffPath(projectDir);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function writeHandoff(projectDir, content) {
  const filePath = getHandoffPath(projectDir);
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

export function appendHandoff(projectDir, entry) {
  const filePath = getHandoffPath(projectDir);
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : TEMPLATE;

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const lines = [`\n## Session Update — ${timestamp}\n`];

  if (entry.objective) lines.push(`**Objective:** ${entry.objective}\n`);
  if (entry.completedWork?.length) {
    lines.push('**Completed Work:**');
    for (const w of entry.completedWork) lines.push(`- ${w}`);
    lines.push('');
  }
  if (entry.currentState) lines.push(`**Current State:** ${entry.currentState}\n`);
  if (entry.nextSteps?.length) {
    lines.push('**Exact Next Steps:**');
    for (let i = 0; i < entry.nextSteps.length; i++) lines.push(`${i + 1}. ${entry.nextSteps[i]}`);
    lines.push('');
  }

  const updateEntry = lines.join('\n');

  // Find the template end marker and insert before it
  const insertMarker = '## Exact Next Steps';
  const idx = content.lastIndexOf(insertMarker);
  if (idx >= 0) {
    // Find the end of the template section (after the numbered list)
    const afterMarker = content.indexOf('\n\n', idx);
    if (afterMarker >= 0) {
      content = content.slice(0, afterMarker + 2) + updateEntry + content.slice(afterMarker + 2);
    } else {
      content += updateEntry;
    }
  } else {
    content += updateEntry;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

export function parseHandoff(content) {
  const sections = {};
  const lines = content.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = match[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  return sections;
}