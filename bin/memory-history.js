#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

// Add skill root to module resolution paths
process.env.NODE_PATH = [process.env.NODE_PATH, SKILL_ROOT].filter(Boolean).join(':');

const program = new Command();

program
  .name('memory-history')
  .description('Universal memory/history management for OpenCode projects')
  .version('1.0.0');

// Lazy-load commands to avoid import issues
function loadCommand(name) {
  return import(resolve(SKILL_ROOT, `commands/${name}.js`));
}

program
  .command('handoff')
  .description('Update SESSION_HANDOFF.md')
  .option('--objective <text>', 'Session objective')
  .option('--completed <items...>', 'Completed work items')
  .option('--state <text>', 'Current state')
  .option('--next-steps <items...>', 'Next steps')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--append', 'Append to existing handoff (default)')
  .action(async (options) => {
    const { handoffCommand } = await loadCommand('handoff');
    await handoffCommand(options);
  });

program
  .command('query')
  .description('Search session history')
  .argument('<topic>', 'Search topic')
  .option('--sql', 'Use raw SQL query instead of natural language')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--all', 'Search across all projects')
  .option('--limit <number>', 'Max results (default: 50)')
  .option('--format <type>', 'Output format: json|table|md (default: table)')
  .option('--since <timestamp>', 'Search since timestamp (ms)')
  .option('--until <timestamp>', 'Search until timestamp (ms)')
  .action(async (topic, options) => {
    const { queryCommand } = await loadCommand('query');
    await queryCommand(topic, options);
  });

program
  .command('compact')
  .description('Trigger manual compaction')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--inject', 'Inject SESSION_HANDOFF.md context (default: true)')
  .option('--force', 'Force compaction even if not needed')
  .action(async (options) => {
    const { compactCommand } = await loadCommand('compact');
    await compactCommand(options);
  });

program
  .command('status')
  .description('Show memory/history status')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--verbose', 'Show detailed info')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const { statusCommand } = await loadCommand('status');
    await statusCommand(options);
  });

program
  .command('init')
  .description('Initialize project context files')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--force', 'Overwrite existing files')
  .option('--template <name>', 'Template to use')
  .action(async (options) => {
    const { initCommand } = await loadCommand('init');
    await initCommand(options);
  });

program
  .command('export')
  .description('Export session history')
  .option('--format <type>', 'Output format: json|md|csv (default: json)')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--all', 'Export all projects')
  .option('--output <path>', 'Output file path')
  .option('--since <timestamp>', 'Export since timestamp')
  .option('--compress', 'Compress output (gzip)')
  .action(async (options) => {
    const { exportCommand } = await loadCommand('export');
    await exportCommand(options);
  });

program
  .command('report')
  .description('Generate reports')
  .option('--type <type>', 'Report type: summary|detailed|activity (default: summary)')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--output <path>', 'Output file path')
  .option('--template <path>', 'Custom Handlebars template')
  .action(async (options) => {
    const { reportCommand } = await loadCommand('report');
    await reportCommand(options);
  });

program
  .command('sync')
  .description('Sync to external storage')
  .option('--target <type>', 'Target: gist|file')
  .option('--project <path>', 'Project directory (default: current)')
  .option('--config <path>', 'Sync config file')
  .option('--dry-run', 'Show what would be synced without syncing')
  .action(async (options) => {
    const { syncCommand } = await loadCommand('sync');
    await syncCommand(options);
  });

program
  .command('plugin')
  .description('Manage bootstrap plugin')
  .argument('<action>', 'Action: enable|disable|status|create')
  .action(async (action) => {
    const { pluginCommand } = await loadCommand('plugin');
    await pluginCommand(action);
  });

program
  .command('project')
  .description('Project management')
  .argument('<action>', 'Action: switch|list|current|create')
  .argument('[name]', 'Project name (for switch/create)')
  .action(async (action, name) => {
    const { projectCommand } = await loadCommand('project');
    await projectCommand(action, name);
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}
