/**
 * Cloud Configuration Manager Service
 *
 * Manages cloud sync configuration.
 */
import { FileUtils } from '../utils/file-utils.js';
import path from 'path';
import os from 'os';
export class CloudConfigService {
    configDir;
    configFile;
    machineIdFile;
    backupFile;
    constructor() {
        this.configDir = this.getConfigDir();
        this.configFile = path.join(this.configDir, 'cloud.json');
        this.machineIdFile = path.join(this.configDir, 'machine-id');
        this.backupFile = path.join(this.configDir, 'cloud.json.backup');
    }
    /**
     * Get config directory based on OS
     */
    getConfigDir() {
        const platform = os.platform();
        if (platform === 'darwin' || platform === 'linux') {
            return path.join(os.homedir(), '.config', 'siftcoder');
        }
        else if (platform === 'win32') {
            return path.join(process.env.APPDATA || '', 'siftcoder');
        }
        return path.join(os.homedir(), '.siftcoder');
    }
    /**
     * Ensure config directory exists
     */
    async ensureConfigDir() {
        await FileUtils.mkdir(this.configDir);
    }
    /**
     * Generate or get machine ID
     */
    async getOrCreateMachineId() {
        await this.ensureConfigDir();
        if (await FileUtils.exists(this.machineIdFile)) {
            return FileUtils.readFile(this.machineIdFile);
        }
        // Generate a simple machine ID
        const id = `manual-${Date.now()}-${process.pid}`;
        await FileUtils.writeFile(this.machineIdFile, id);
        return id;
    }
    /**
     * Mask API key for display
     */
    maskApiKey(key) {
        if (key.length <= 10) {
            return '***';
        }
        return `${key.slice(0, 8)}...${key.slice(-4)}`;
    }
    /**
     * Load configuration
     */
    async loadConfig() {
        if (!await FileUtils.exists(this.configFile)) {
            return null;
        }
        try {
            return FileUtils.readJSON(this.configFile);
        }
        catch {
            return null;
        }
    }
    /**
     * Save configuration
     */
    async saveConfig(config) {
        await this.ensureConfigDir();
        await FileUtils.writeJSON(this.configFile, config);
    }
    /**
     * Get config value
     */
    async get(key) {
        const config = await this.loadConfig();
        if (!config) {
            return undefined;
        }
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
            value = value?.[k];
        }
        return value;
    }
    /**
     * Set config value
     */
    async set(key, value) {
        const config = (await this.loadConfig()) || {};
        const keys = key.split('.');
        let current = config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        await this.saveConfig(config);
    }
    /**
     * Unset config value
     */
    async unset(key) {
        const config = await this.loadConfig();
        if (!config) {
            return;
        }
        const keys = key.split('.');
        let current = config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                return;
            }
            current = current[keys[i]];
        }
        delete current[keys[keys.length - 1]];
        await this.saveConfig(config);
    }
    /**
     * Display current configuration
     */
    async showConfig() {
        const config = await this.loadConfig();
        if (!config) {
            console.log('No configuration found');
            return;
        }
        console.log('\n🌐 Cloud Sync Configuration\n');
        if (config.sync?.server_url) {
            console.log(`Server URL: ${config.sync.server_url}`);
        }
        if (config.sync?.api_key) {
            console.log(`API Key: ${this.maskApiKey(config.sync.api_key)}`);
        }
        if (config.sync?.machine_id) {
            console.log(`Machine ID: ${config.sync.machine_id}`);
        }
        if (config.sync?.machine_name) {
            console.log(`Machine Name: ${config.sync.machine_name}`);
        }
        if (config.sync?.auto_sync !== undefined) {
            console.log(`Auto Sync: ${config.sync.auto_sync ? 'enabled' : 'disabled'}`);
        }
        if (config.sync?.sync_interval) {
            console.log(`Sync Interval: ${config.sync.sync_interval} seconds`);
        }
        console.log('');
    }
    /**
     * Reset configuration
     */
    async resetConfig() {
        if (await FileUtils.exists(this.configFile)) {
            await FileUtils.deleteFile(this.configFile);
        }
        console.log('Configuration reset');
    }
    /**
     * Backup configuration
     */
    async backupConfig() {
        if (await FileUtils.exists(this.configFile)) {
            await FileUtils.copyFile(this.configFile, this.backupFile);
            console.log(`Backup saved to: ${this.backupFile}`);
        }
    }
    /**
     * Test server connection
     */
    async testConnection() {
        const config = await this.loadConfig();
        if (!config?.sync?.server_url || !config?.sync?.api_key) {
            console.log('❌ Configuration incomplete');
            return false;
        }
        try {
            // Simple connection test
            const response = await fetch(`${config.sync.server_url}/health`, {
                headers: {
                    'Authorization': `Bearer ${config.sync.api_key}`
                },
                signal: AbortSignal.timeout(5000)
            });
            if (response.ok) {
                console.log('✅ Connection successful');
                return true;
            }
            else {
                console.log(`❌ Connection failed: ${response.status}`);
                return false;
            }
        }
        catch (error) {
            console.log(`❌ Connection failed: ${error.message}`);
            return false;
        }
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const service = new CloudConfigService();
    const command = process.argv[2] || 'help';
    (async () => {
        switch (command) {
            case 'configure':
                console.log('Interactive configuration not yet implemented');
                console.log('Use "set" commands to configure manually');
                break;
            case 'show':
                await service.showConfig();
                break;
            case 'set': {
                const key = process.argv[3];
                const value = process.argv[4];
                if (!key || !value) {
                    console.error('Usage: cloud-config.ts set <key> <value>');
                    console.error('Example: cloud-config.ts set sync.server_url https://sync.example.com');
                    process.exit(1);
                }
                await service.set(key, value);
                console.log(`✓ Set ${key} = ${value}`);
                break;
            }
            case 'unset': {
                const key = process.argv[3];
                if (!key) {
                    console.error('Usage: cloud-config.ts unset <key>');
                    process.exit(1);
                }
                await service.unset(key);
                console.log(`✓ Unset ${key}`);
                break;
            }
            case 'test':
                await service.testConnection();
                break;
            case 'reset':
                await service.resetConfig();
                break;
            case 'get': {
                const key = process.argv[3];
                if (!key) {
                    console.error('Usage: cloud-config.ts get <key>');
                    process.exit(1);
                }
                const value = await service.get(key);
                console.log(value || '');
                break;
            }
            default:
                console.error(`
Usage: cloud-config.ts <command> [arguments]

Commands:
  configure                Interactive configuration (not yet implemented)
  show                     Display current configuration
  set <key> <value>        Set a config value
  unset <key>              Remove a config value
  get <key>                Get a config value
  test                     Test server connection
  reset                    Reset configuration

Examples:
  cloud-config.ts set sync.server_url https://sync.example.com
  cloud-config.ts set sync.api_key your-api-key
  cloud-config.ts show
  cloud-config.ts test
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=cloud-config.js.map