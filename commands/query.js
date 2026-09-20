import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig, getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { searchSessions, getDb } = await import(resolve(SKILL_ROOT, 'src/db.js'));
const { naturalLanguageQuery } = await import(resolve(SKILL_ROOT, 'src/query.js'));

function resolveProjectDir(projectArg) {
  const projectsRoot = getProjectsRoot();
  if (!projectArg) return process.cwd();
  if (path.isAbsolute(projectArg)) return projectArg;
  return path.join(getProjectsRoot(), projectArg);
}

export async function queryCommand(topic, options) {
  const projectDir = options.all ? null : resolveProjectDir(options.project);
  const format = options.format || 'table';
  const limit = options.limit || 50;

  if (!topic) {
    console.log(chalk.red('Topic required'));
    return;
  }

  let results;
  if (options.sql) {
    results = await searchSessions(topic, projectDir, { limit });
  } else {
    results = await naturalLanguageQuery(topic, projectDir, { limit });
  }

  if (!results.length) {
    console.log(chalk.yellow('No results found'));
    return;
  }

  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (format === 'md') {
    printMarkdown(results);
    return;
  }

  printTable(results);
}

function printTable(results) {
  console.log('\n');
  for (const r of results) {
    const date = new Date(r.time_created).toLocaleString();
    const dir = r.directory?.split('/').pop() || 'unknown';
    console.log(chalk.cyan(`${r.id}`));
    console.log(`  ${chalk.bold(r.title || 'Untitled')}  ${chalk.gray(date)}`);
    console.log(`  ${chalk.gray(dir)}`);
    if (r.message_content) {
      const preview = r.message_content.slice(0, 120).replace(/\n/g, ' ');
      console.log(`  ${chalk.gray(preview)}...`);
    }
    console.log('');
  }
  console.log(chalk.gray(`Total: ${results.length} results`));
}

function printMarkdown(results) {
  console.log('# Search Results\n');
  for (const r of results) {
    const date = new Date(r.time_created).toLocaleString();
    const dir = r.directory?.split('/').pop() || 'unknown';
    console.log(`## ${r.title || 'Untitled'} (${date})`);
    console.log(`**Project:** ${dir}  \n**Session:** ${r.id}\n`);
    if (r.message_content) {
      console.log(r.message_content.slice(0, 500) + (r.message_content.length > 500 ? '...' : ''));
    }
    console.log('\n---\n');
  }
}
