/**
 * Cloud Configuration Manager Service
 *
 * Manages cloud sync configuration.
 */
export interface CloudConfig {
    sync?: {
        server_url?: string;
        api_key?: string;
        machine_id?: string;
        machine_name?: string;
        auto_sync?: boolean;
        sync_interval?: number;
    };
}
export declare class CloudConfigService {
    private configDir;
    private configFile;
    private machineIdFile;
    private backupFile;
    constructor();
    /**
     * Get config directory based on OS
     */
    private getConfigDir;
    /**
     * Ensure config directory exists
     */
    private ensureConfigDir;
    /**
     * Generate or get machine ID
     */
    getOrCreateMachineId(): Promise<string>;
    /**
     * Mask API key for display
     */
    private maskApiKey;
    /**
     * Load configuration
     */
    loadConfig(): Promise<CloudConfig | null>;
    /**
     * Save configuration
     */
    saveConfig(config: CloudConfig): Promise<void>;
    /**
     * Get config value
     */
    get(key: string): Promise<string | undefined>;
    /**
     * Set config value
     */
    set(key: string, value: any): Promise<void>;
    /**
     * Unset config value
     */
    unset(key: string): Promise<void>;
    /**
     * Display current configuration
     */
    showConfig(): Promise<void>;
    /**
     * Reset configuration
     */
    resetConfig(): Promise<void>;
    /**
     * Backup configuration
     */
    backupConfig(): Promise<void>;
    /**
     * Test server connection
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=cloud-config.d.ts.map