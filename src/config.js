import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '../config/default.json');

function expandHome(filepath) {
  if (filepath.startsWith('~/')) {
    return path.join(process.env.HOME, filepath.slice(2));
  }
  return filepath;
}

function loadYamlOrJson(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) {
    return yaml.parse(content);
  }
  return JSON.parse(content);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

let cachedConfig = null;

export function loadConfig() {
  if (cachedConfig) return cachedConfig;

  // Load default config
  const defaultConfig = loadYamlOrJson(DEFAULT_CONFIG_PATH);

  // Load global user config
  const globalConfigPath = expandHome('~/.config/memory-history/config.json');
  let globalConfig = {};
  if (fs.existsSync(globalConfigPath)) {
    globalConfig = loadYamlOrJson(globalConfigPath);
  }

  // Merge default + global
  cachedConfig = deepMerge(defaultConfig, globalConfig);

  // Expand paths
  cachedConfig.projectsRoot = expandHome(cachedConfig.projectsRoot);
  cachedConfig.opencodeDb = expandHome(cachedConfig.opencodeDb);
  cachedConfig.export.outputDir = expandHome(cachedConfig.export.outputDir);
  cachedConfig.report.templateDir = expandHome(cachedConfig.report.templateDir);
  cachedConfig.bootstrapPlugin.path = expandHome(cachedConfig.bootstrapPlugin.path);

  return cachedConfig;
}

export function getConfig(key) {
  const config = loadConfig();
  return key.split('.').reduce((obj, k) => obj?.[k], config);
}

export function getProjectConfig(projectDir) {
  const config = loadConfig();
  const projectConfigPath = path.join(projectDir, '.memory-history.json');
  let projectConfig = {};
  if (fs.existsSync(projectConfigPath)) {
    projectConfig = loadYamlOrJson(projectConfigPath);
  }
  return deepMerge(config, projectConfig);
}

export function resolvePath(p) {
  return expandHome(p);
}

export function getProjectsRoot() {
  return loadConfig().projectsRoot;
}

export function getOpencodeDbPath() {
  return loadConfig().opencodeDb;
}

export function getOllamaConfig() {
  return loadConfig().ollama;
}

export function getExportConfig() {
  return loadConfig().export;
}

export function getSyncConfig() {
  return loadConfig().sync;
}

export function getReportConfig() {
  return loadConfig().report;
}

export function getBootstrapPluginConfig() {
  return loadConfig().bootstrapPlugin;
}

export function clearCache() {
  cachedConfig = null;
}