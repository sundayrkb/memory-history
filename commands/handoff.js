import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot, getProjectConfig } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { appendHandoff } = await import(resolve(SKILL_ROOT, 'src/handoff.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function handoffCommand(options) {
  const projectDir = resolveProjectDir(options.project);
  const config = getProjectConfig(projectDir);

  if (!config.autoUpdateHandoff) {
    console.log(chalk.yellow('⚠ Handoff auto-update is disabled in project config'));
  }

  const entry = {
    timestamp: new Date().toISOString(),
    objective: options.objective,
    completedWork: options.completed || [],
    currentState: options.state,
    nextSteps: options.nextSteps || [],
  };

  const filteredEntry = Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : v !== ''))
  );

  if (Object.keys(filteredEntry).length <= 1) {
    console.log(chalk.red('No handoff data provided. Use --objective, --completed, --state, or --next-steps'));
    return;
  }

  const { appendHandoff: append } = await import(resolve(SKILL_ROOT, 'src/handoff.js'));
  const result = await append(projectDir, filteredEntry);
  if (result) {
    console.log(chalk.green('✓ SESSION_HANDOFF.md updated'));
  } else {
    console.log(chalk.red('Failed to update handoff'));
  }
}
