import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { getDb, getSessions, getProjectStats } = await import(resolve(SKILL_ROOT, 'src/db.js'));
const { readHandoff } = await import(resolve(SKILL_ROOT, 'src/handoff.js'));
const { ReportGenerator } = await import(resolve(SKILL_ROOT, 'src/report.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function reportCommand(options) {
  const type = options.type || 'summary';
  const projectDir = resolveProjectDir(options.project);
  const db = getDb();
  const { ReportGenerator } = await import(resolve(SKILL_ROOT, 'src/report.js'));
  const generator = new ReportGenerator(db, await import(resolve(SKILL_ROOT, 'src/config.js')).then(m => m.getConfig('report')));

  console.log(chalk.cyan(`Generating ${type} report for ${projectDir}...`));

  try {
    const report = await generator.generate(projectDir, type, { template: options.template });

    if (options.output) {
      const outputPath = resolve(options.output);
      await import('fs').then(fs => fs.promises.writeFile(outputPath, report));
      console.log(chalk.green(`✓ Report saved to ${outputPath}`));
    } else {
      console.log(report);
    }
  } catch (error) {
    console.error(chalk.red('Report generation failed:'), error.message);
  }
}
