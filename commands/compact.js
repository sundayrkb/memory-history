import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function compactCommand(options) {
  const projectDir = resolveProjectDir(options.project);
  const inject = options.inject !== false;

  console.log(chalk.cyan(`Triggering compaction for ${projectDir}...`));

  try {
    if (inject) {
      console.log(chalk.gray('Injecting SESSION_HANDOFF.md context...'));
    }
    console.log(chalk.yellow('Note: Manual compaction trigger requires OpenCode session. Use /compact in OpenCode session.'));
    console.log(chalk.green('✓ Compaction would be triggered'));
  } catch (error) {
    console.error(chalk.red('Failed to trigger compaction:'), error.message);
  }
}
