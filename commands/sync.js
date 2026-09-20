import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { Exporter } = await import(resolve(SKILL_ROOT, 'src/export.js'));
const { SyncManager } = await import(resolve(SKILL_ROOT, 'src/sync.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function syncCommand(options) {
  const syncConfig = getConfig('sync');
  const projectDir = options.all ? null : resolveProjectDir(options.project);

  if (!syncConfig.enabled && !options.target) {
    console.log(chalk.yellow('Sync not configured. Use --target gist|file or enable in config.'));
    return;
  }

  const targets = options.target ? [options.target] : syncConfig.targets;
  const db = getDb();
  const { Exporter } = await import(resolve(SKILL_ROOT, 'src/export.js'));
  const exporter = new Exporter(db, await import(resolve(SKILL_ROOT, 'src/config.js')).then(m => m.getConfig('export')));
  const { SyncManager } = await import(resolve(SKILL_ROOT, 'src/sync.js'));
  const syncer = new SyncManager({ ...syncConfig, targets });

  console.log(chalk.cyan(`Syncing ${projectDir} to ${targets.join(', ')}...`));

  if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN - No actual sync will occur'));
    const data = await exporter.exportProject(projectDir, { format: 'json' });
    console.log(`Would export ${JSON.parse(data).sessionCount} sessions`);
    return;
  }

  try {
    const data = await exporter.exportProject(projectDir, { format: 'json' });
    const results = await syncer.sync(data, targets);

    for (const r of results) {
      if (r.success) {
        console.log(chalk.green(`✓ Synced to ${r.target}: ${r.url || r.path}`));
      } else {
        console.error(chalk.red(`✗ Failed ${r.target}: ${r.error}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('Sync failed:'), error.message);
  }
}

const { getDb } = await import(resolve(SKILL_ROOT, 'src/db.js'));
