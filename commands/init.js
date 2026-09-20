import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { initProject } = await import(resolve(SKILL_ROOT, 'src/project.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function initCommand(options) {
  const projectDir = resolveProjectDir(options.project);
  const config = await import(resolve(SKILL_ROOT, 'src/config.js')).then(m => m.getConfig('bootstrapPlugin'));

  console.log(chalk.cyan(`Initializing project: ${projectDir}`));

  const result = await initProject(projectDir, { force: options.force, template: options.template });

  if (result.created.length) {
    console.log(chalk.green('\nCreated:'));
    for (const f of result.created) console.log(`  ${f}`);
  }
  if (result.existed.length) {
    console.log(chalk.yellow('\nAlready existed:'));
    for (const f of result.existed) console.log(`  ${f}`);
  }

  if (config.autoCreate) {
    console.log(chalk.cyan('\nEnsuring bootstrap plugin...'));
  }

  console.log(chalk.green('\n✓ Project initialized'));
}
