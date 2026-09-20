export { loadConfig, getConfig, getProjectConfig, getProjectsRoot, getOpencodeDbPath, getOllamaConfig, getExportConfig, getSyncConfig, getReportConfig, getBootstrapPluginConfig } from './config.js';
export { getDb, getSessions, getSessionMessages, searchSessions, getProjectStats, getRecentActivity, getDbSchema } from './db.js';
export { readHandoff, writeHandoff, appendHandoff, parseHandoff } from './handoff.js';
export { naturalLanguageQuery } from './query.js';
export { Exporter } from './export.js';
export { ReportGenerator } from './report.js';
export { SyncManager } from './sync.js';
export { listProjects, getCurrentProject, switchProject, createProject, initProject, getProjectConfig } from './project.js';
export { PluginManager } from './plugin-manager.js';

export default async function MemoryHistorySkill() {
  return {
    name: 'memory-history',
    description: 'Universal memory/history management for OpenCode projects',
    commands: {
      handoff: 'Update SESSION_HANDOFF.md',
      query: 'Search session history',
      compact: 'Trigger manual compaction',
      status: 'Show memory status',
      init: 'Initialize project context',
      export: 'Export session history',
      report: 'Generate reports',
      sync: 'Sync to external storage',
      plugin: 'Manage bootstrap plugin',
      project: 'Project management'
    }
  };
}