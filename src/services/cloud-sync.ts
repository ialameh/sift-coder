/**
 * Cloud Sync Manager Service
 *
 * Manages knowledge synchronization to cloud.
 */

import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
import path from 'path';
import { CloudConfigService } from './cloud-config.js';

export interface SyncStatus {
  configured: boolean;
  connected: boolean;
  lastSync?: string;
  pendingChanges: number;
  conflicts: number;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  error?: string;
}

export class CloudSyncService {
  private stateDir: string;
  private knowledgeDir: string;
  private configService: CloudConfigService;

  constructor(projectRoot?: string) {
    this.stateDir = PathUtils.getStateDir(projectRoot);
    this.knowledgeDir = path.join(this.stateDir, 'knowledge');
    this.configService = new CloudConfigService();
  }

  /**
   * Count entries in knowledge files
   */
  private async countEntries(filePath: string): Promise<number> {
    if (!await FileUtils.exists(filePath)) {
      return 0;
    }

    try {
      const data = await FileUtils.readJSON<any[]>(filePath);
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const config = await this.configService.loadConfig();

    if (!config?.sync?.server_url || !config?.sync?.api_key) {
      throw new Error('Cloud sync not configured');
    }

    const url = `${config.sync.server_url}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.sync.api_key}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Push local knowledge to cloud
   */
  async push(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      pushed: 0,
      pulled: 0,
      conflicts: 0
    };

    try {
      // Count local entries
      const patterns = await this.countEntries(path.join(this.knowledgeDir, 'patterns.json'));
      const gotchas = await this.countEntries(path.join(this.knowledgeDir, 'gotchas.json'));
      const decisions = await this.countEntries(path.join(this.knowledgeDir, 'decisions.json'));

      const payload = {
        machine_id: await this.configService.getOrCreateMachineId(),
        knowledge: {
          patterns: await this.loadKnowledgeFile('patterns.json'),
          gotchas: await this.loadKnowledgeFile('gotchas.json'),
          decisions: await this.loadKnowledgeFile('decisions.json')
        }
      };

      await this.apiRequest('/api/sync/push', 'POST', payload);

      result.success = true;
      result.pushed = patterns + gotchas + decisions;
    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Load knowledge file
   */
  private async loadKnowledgeFile(filename: string): Promise<any[]> {
    const filePath = path.join(this.knowledgeDir, filename);

    if (!await FileUtils.exists(filePath)) {
      return [];
    }

    try {
      return FileUtils.readJSON<any[]>(filePath);
    } catch {
      return [];
    }
  }

  /**
   * Pull and merge cloud knowledge
   */
  async pull(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      pushed: 0,
      pulled: 0,
      conflicts: 0
    };

    try {
      const response = await this.apiRequest(
        `/api/sync/pull?machine_id=${await this.configService.getOrCreateMachineId()}`
      );

      // Merge knowledge
      await this.mergeKnowledge('patterns.json', response.knowledge?.patterns || []);
      await this.mergeKnowledge('gotchas.json', response.knowledge?.gotchas || []);
      await this.mergeKnowledge('decisions.json', response.knowledge?.decisions || []);

      result.success = true;
      result.pulled = (response.knowledge?.patterns?.length || 0) +
                      (response.knowledge?.gotchas?.length || 0) +
                      (response.knowledge?.decisions?.length || 0);
    } catch (error: any) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Merge knowledge from cloud
   */
  private async mergeKnowledge(filename: string, cloudData: any[]): Promise<void> {
    const filePath = path.join(this.knowledgeDir, filename);

    let localData: any[] = [];
    if (await FileUtils.exists(filePath)) {
      localData = await FileUtils.readJSON<any[]>(filePath);
    }

    // Simple merge: append items that don't exist locally
    const localIds = new Set(localData.map((item: any) => item.id));
    const newItems = cloudData.filter(item => !localIds.has(item.id));

    const merged = [...localData, ...newItems];
    await FileUtils.writeJSON(filePath, merged);
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const config = await this.configService.loadConfig();
    const configured = !!(config?.sync?.server_url && config?.sync?.api_key);

    let connected = false;
    if (configured) {
      try {
        await this.apiRequest('/health');
        connected = true;
      } catch {
        connected = false;
      }
    }

    const patterns = await this.countEntries(path.join(this.knowledgeDir, 'patterns.json'));
    const gotchas = await this.countEntries(path.join(this.knowledgeDir, 'gotchas.json'));
    const decisions = await this.countEntries(path.join(this.knowledgeDir, 'decisions.json'));

    return {
      configured,
      connected,
      pendingChanges: patterns + gotchas + decisions,
      conflicts: 0
    };
  }

  /**
   * List pending conflicts
   */
  async listConflicts(): Promise<any[]> {
    // For now, return empty - conflicts would be tracked server-side
    return [];
  }

  /**
   * Enable/disable auto-sync
   */
  async setAutoSync(enabled: boolean): Promise<void> {
    await this.configService.set('sync.auto_sync', enabled);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new CloudSyncService();
  const command = process.argv[2] || 'help';

  (async () => {
    switch (command) {
      case 'push': {
        console.log('Pushing local knowledge to cloud...');
        const result = await service.push();

        if (result.success) {
          console.log(`✓ Pushed ${result.pushed} entries`);
        } else {
          console.error(`✗ Push failed: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'pull': {
        console.log('Pulling cloud knowledge...');
        const result = await service.pull();

        if (result.success) {
          console.log(`✓ Pulled ${result.pulled} entries`);
        } else {
          console.error(`✗ Pull failed: ${result.error}`);
          process.exit(1);
        }
        break;
      }

      case 'status': {
        const status = await service.getStatus();

        console.log('\n📊 Cloud Sync Status\n');
        console.log(`Configured: ${status.configured ? '✓' : '✗'}`);
        console.log(`Connected: ${status.connected ? '✓' : '✗'}`);
        console.log(`Pending changes: ${status.pendingChanges}`);
        console.log(`Conflicts: ${status.conflicts}\n`);
        break;
      }

      case 'auto': {
        const enabled = process.argv[3] === 'on';
        await service.setAutoSync(enabled);
        console.log(`Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
        break;
      }

      case 'conflicts': {
        const conflicts = await service.listConflicts();
        console.log(`Pending conflicts: ${conflicts.length}`);
        if (conflicts.length > 0) {
          console.log(JSON.stringify(conflicts, null, 2));
        }
        break;
      }

      default:
        console.error(`
Usage: cloud-sync.ts <command> [arguments]

Commands:
  push              Push local knowledge to cloud
  pull              Pull and merge cloud knowledge
  status            Show sync status
  auto <on|off>     Enable/disable auto-sync
  conflicts         List pending conflicts

Examples:
  cloud-sync.ts push
  cloud-sync.ts pull
  cloud-sync.ts status
  cloud-sync.ts auto on
        `);
        process.exit(1);
    }
  })().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
