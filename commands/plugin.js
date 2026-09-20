import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, '..');

const { getConfig } = await import(resolve(SKILL_ROOT, 'src/config.js'));
const { PluginManager } = await import(resolve(SKILL_ROOT, 'src/plugin-manager.js'));

export async function pluginCommand(action, options) {
  const pluginConfig = getConfig('bootstrapPlugin');
  const manager = new PluginManager(
    pluginConfig.path.replace('project-context-bootstrap.js', 'opencode.jsonc'),
    pluginConfig.path
  );

  switch (action) {
    case 'status': {
      const status = await manager.status();
      console.log(chalk.bold('\nBootstrap Plugin Status:\n'));
      console.log(`  Enabled: ${status.enabled ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`  Plugin exists: ${status.pluginExists ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`  Config valid: ${status.configValid ? chalk.green('Yes') : chalk.red('No')}`);
      break;
    }
    case 'enable': {
      const result = await manager.enable();
      console.log(result ? chalk.green('✓ Plugin enabled') : chalk.red('Failed to enable plugin'));
      break;
    }
    case 'disable': {
      const result = await manager.disable();
      console.log(result ? chalk.green('✓ Plugin disabled') : chalk.red('Failed to disable plugin'));
      break;
    }
    case 'create': {
      const result = await manager.createIfMissing();
      console.log(result ? chalk.green('✓ Plugin created') : chalk.red('Failed to create plugin'));
      break;
    }
    default:
      console.log('Usage: memory-history plugin <enable|disable|status|create>');
  }
}
