import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { getDb, getSessions, getSessionMessages, getProjectStats } = await import(resolve(SKILL_ROOT, 'src/db.js'));
const { Exporter } = await import(resolve(SKILL_ROOT, 'src/export.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function exportCommand(options) {
  const format = options.format || 'json';
  const projectDir = options.all ? null : resolveProjectDir(options.project);
  const db = getDb();
  const { Exporter } = await import(resolve(SKILL_ROOT, 'src/export.js'));
  const exporter = new Exporter(db, await import(resolve(SKILL_ROOT, 'src/config.js')).then(m => m.getConfig('export')));

  console.log(chalk.cyan(`Exporting ${options.all ? 'all projects' : projectDir} as ${format}...`));

  try {
    let output;
    if (options.all) {
      output = await exporter.exportAllProjects({ format, since: options.since });
    } else {
      output = await exporter.exportProject(projectDir, { format, since: options.since });
    }

    if (options.output) {
      const outputPath = resolve(options.output);
      await import('fs').then(fs => fs.promises.writeFile(outputPath, output));
      console.log(chalk.green(`✓ Exported to ${outputPath}`));
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error(chalk.red('Export failed:'), error.message);
  }
}
