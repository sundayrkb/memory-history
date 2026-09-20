import fs from 'fs';
import path from 'path';
import { Octokit } from 'octokit';

export class SyncManager {
  constructor(config) {
    this.config = config;
    this.gistId = config.gistId;
    this.gistToken = config.gistToken || process.env.GITHUB_TOKEN;
    this.filePath = config.filePath || '~/memory-history-sync.json';
  }

  async sync(data, targets = ['file']) {
    const results = [];
    for (const target of targets) {
      try {
        if (target === 'gist') {
          results.push(await this._syncToGist(data));
        } else if (target === 'file') {
          results.push(await this._syncToFile(data));
        } else {
          results.push({ target, success: false, error: `Unknown target: ${target}` });
        }
      } catch (error) {
        results.push({ target, success: false, error: error.message });
      }
    }
    return results;
  }

  async _syncToGist(data) {
    if (!this.gistToken) {
      return { target: 'gist', success: false, error: 'GitHub token not configured (GITHUB_TOKEN env var)' };
    }

    const octokit = new Octokit({ auth: this.gistToken });
    const filename = `memory-history-${new Date().toISOString().split('T')[0]}.json`;
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    try {
      if (this.gistId) {
        await octokit.rest.gists.update({
          gist_id: this.gistId,
          files: { [filename]: { content } }
        });
        return { target: 'gist', success: true, url: `https://gist.github.com/${this.gistId}` };
      } else {
        const response = await octokit.rest.gists.create({
          public: false,
          files: { [filename]: { content } }
        });
        this.gistId = response.data.id;
        return { target: 'gist', success: true, url: response.data.html_url, gistId: this.gistId };
      }
    } catch (error) {
      return { target: 'gist', success: false, error: error.message };
    }
  }

  async _syncToFile(data) {
    const filePath = path.resolve(data.filePath || '~/memory-history-sync.json');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');

    return { target: 'file', success: true, path: filePath };
  }
}