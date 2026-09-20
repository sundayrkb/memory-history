import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getProjectsRoot } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { listProjects, getCurrentProject, switchProject, createProject } = await import(resolve(SKILL_ROOT, 'src/project.js'));

export async function projectCommand(action, name, options) {
  switch (action) {
    case 'list': {
      const projects = listProjects();
      if (!projects.length) {
        console.log(chalk.yellow('No projects found'));
        return;
      }
      console.log(chalk.bold('\nProjects:\n'));
      for (const p of projects) {
        const marker = p.hasContext ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${marker} ${p.name}  ${chalk.gray(p.path)}`);
      }
      break;
    }
    case 'current': {
      const current = getCurrentProject();
      console.log(chalk.bold('Current:'), current.name);
      console.log('Path:', current.path);
      break;
    }
    case 'switch': {
      if (!name) {
        console.log(chalk.red('Project name required'));
        return;
      }
      const project = await switchProject(name);
      console.log(chalk.green(`Switched to ${project.name}`));
      console.log('Path:', project.path);
      break;
    }
    case 'create': {
      if (!name) {
        console.log(chalk.red('Project name required'));
        return;
      }
      const project = await createProject(name, { force: options.force });
      console.log(chalk.green(`Created project: ${project.name}`));
      console.log('Path:', project.path);
      break;
    }
    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      console.log('Available: list, current, switch, create');
  }
}
