import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot, getProjectConfig } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { getProjectStats, getRecentActivity } = await import(resolve(SKILL_ROOT, 'src/db.js'));
const { readHandoff } = await import(resolve(SKILL_ROOT, 'src/handoff.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(projectsRoot, projectArg);
}

export async function statusCommand(options) {
  const projectDir = resolveProjectDir(options.project);
  const config = getProjectConfig(projectDir);

  console.log(chalk.bold.cyan('\n=== Memory History Status ===\n'));

  console.log(chalk.bold('Project:'), path.basename(projectDir));
  console.log('Path:', projectDir);

  const stats = getProjectStats(projectDir);
  if (stats && stats.session_count > 0) {
    console.log(chalk.bold('\nSessions:'));
    console.log(`  Count: ${stats.session_count}`);
    console.log(`  Messages: ${stats.message_count || 0}`);
    console.log(`  Tokens: ${(stats.total_tokens || 0).toLocaleString()}`);
    console.log(`  Cost: $${(stats.total_cost || 0).toFixed(4)}`);
    console.log(`  First: ${stats.first_session ? new Date(stats.first_session).toLocaleString() : 'N/A'}`);
    console.log(`  Last: ${stats.last_session ? new Date(stats.last_session).toLocaleString() : 'N/A'}`);
  } else {
    console.log(chalk.yellow('\nNo sessions found for this project'));
  }

  const { readHandoff } = await import(resolve(SKILL_ROOT, 'src/handoff.js'));
  const handoff = readHandoff(projectDir);
  if (handoff) {
    const updates = (handoff.match(/## Session Update/g) || []).length;
    console.log(chalk.bold('\nSESSION_HANDOFF.md:'), 'Exists', updates > 0 ? `(${updates} updates)` : '');
  } else {
    console.log(chalk.yellow('\nSESSION_HANDOFF.md:'), 'Not found');
  }

  console.log(chalk.bold('\nConfig:'));
  console.log(`  Auto-update handoff: ${config.autoUpdateHandoff ? 'enabled' : 'disabled'}`);
  console.log(`  Compaction context injection: ${config.compactionContextInjection ? 'enabled' : 'disabled'}`);

  if (options.verbose) {
    const recent = getRecentActivity(24);
    if (recent.length) {
      console.log(chalk.bold('\nRecent Activity (24h):'));
      for (const r of recent.slice(0, 5)) {
        const date = new Date(r.time_created).toLocaleString();
        console.log(`  ${date} - ${r.title} (${r.tokens} tokens, $${r.cost.toFixed(4)})`);
      }
    }
  }

  const pluginConfig = getConfig('bootstrapPlugin');
  console.log(chalk.bold('\nBootstrap Plugin:'));
  console.log(`  Path: ${pluginConfig.path}`);
  console.log(`  Auto-create: ${pluginConfig.autoCreate ? 'enabled' : 'disabled'}`);

  if (options.json) {
    console.log(JSON.stringify({ projectDir, stats, config }, null, 2));
  }
}
