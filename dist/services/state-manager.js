/**
 * State Manager Service (Converted from bash)
 * Manages plugin state in .claude/siftcoder-state/
 * Cross-platform (Windows, Mac, Linux)
 */
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
export class StateManager {
    stateDir;
    constructor(projectRoot) {
        this.stateDir = PathUtils.getStateDir(projectRoot);
    }
    /**
     * Initialize state directory with default files
     */
    async init() {
        // Create directories
        await FileUtils.mkdir(this.stateDir);
        await FileUtils.mkdir(PathUtils.join(this.stateDir, 'knowledge'));
        await FileUtils.mkdir(PathUtils.join(this.stateDir, 'checkpoints'));
        await FileUtils.mkdir(PathUtils.join(this.stateDir, 'diagrams'));
        // Create features.json if not exists
        const featuresPath = PathUtils.join(this.stateDir, 'features.json');
        if (!await FileUtils.exists(featuresPath)) {
            const defaultFeatures = {
                version: '1.0.0',
                features: {},
                queue: {
                    pending: [],
                    in_progress: [],
                    completed: []
                }
            };
            await FileUtils.writeJSON(featuresPath, defaultFeatures);
        }
        // Create config.json if not exists
        const configPath = PathUtils.join(this.stateDir, 'config.json');
        if (!await FileUtils.exists(configPath)) {
            await FileUtils.writeJSON(configPath, {
                version: '1.0.0',
                initialized_at: new Date().toISOString()
            });
        }
        // Create session.json if not exists
        const sessionPath = PathUtils.join(this.stateDir, 'session.json');
        if (!await FileUtils.exists(sessionPath)) {
            await FileUtils.writeJSON(sessionPath, {
                id: `sess_${Date.now()}`,
                created_at: new Date().toISOString()
            });
        }
    }
    /**
     * Get config value
     */
    async get(key) {
        const configPath = PathUtils.join(this.stateDir, 'config.json');
        if (!await FileUtils.exists(configPath)) {
            return undefined;
        }
        const config = await FileUtils.readJSON(configPath);
        return config[key];
    }
    /**
     * Set config value
     */
    async set(key, value) {
        const configPath = PathUtils.join(this.stateDir, 'config.json');
        let config = {};
        if (await FileUtils.exists(configPath)) {
            config = await FileUtils.readJSON(configPath);
        }
        config[key] = value;
        await FileUtils.writeJSON(configPath, config);
    }
    /**
     * Load features state
     */
    async loadFeatures() {
        const featuresPath = PathUtils.join(this.stateDir, 'features.json');
        if (!await FileUtils.exists(featuresPath)) {
            await this.init();
        }
        return FileUtils.readJSON(featuresPath);
    }
    /**
     * Save features state
     */
    async saveFeatures(features) {
        const featuresPath = PathUtils.join(this.stateDir, 'features.json');
        await FileUtils.writeJSON(featuresPath, features);
    }
    /**
     * Add feature to queue
     */
    async addFeature(feature) {
        const features = await this.loadFeatures();
        const id = `feat-${Date.now()}`;
        const now = new Date().toISOString();
        const newFeature = {
            ...feature,
            id,
            status: 'pending',
            created_at: now,
            updated_at: now
        };
        features.features[id] = newFeature;
        features.queue.pending.push(id);
        await this.saveFeatures(features);
        return id;
    }
    /**
     * Mark feature as complete
     */
    async completeFeature(featureId) {
        const features = await this.loadFeatures();
        if (!features.features[featureId]) {
            throw new Error(`Feature not found: ${featureId}`);
        }
        features.features[featureId].status = 'completed';
        features.features[featureId].updated_at = new Date().toISOString();
        // Move from in_progress to completed
        features.queue.in_progress = features.queue.in_progress.filter(id => id !== featureId);
        if (!features.queue.completed.includes(featureId)) {
            features.queue.completed.push(featureId);
        }
        await this.saveFeatures(features);
    }
    /**
     * Start working on a feature
     */
    async startFeature(featureId) {
        const features = await this.loadFeatures();
        if (!features.features[featureId]) {
            throw new Error(`Feature not found: ${featureId}`);
        }
        features.features[featureId].status = 'in_progress';
        features.features[featureId].updated_at = new Date().toISOString();
        // Move from pending to in_progress
        features.queue.pending = features.queue.pending.filter(id => id !== featureId);
        if (!features.queue.in_progress.includes(featureId)) {
            features.queue.in_progress.push(featureId);
        }
        await this.saveFeatures(features);
    }
    /**
     * Load current task
     */
    async loadCurrentTask() {
        const taskPath = PathUtils.join(this.stateDir, 'current-task.json');
        if (!await FileUtils.exists(taskPath)) {
            return null;
        }
        return FileUtils.readJSON(taskPath);
    }
    /**
     * Save current task
     */
    async saveCurrentTask(task) {
        const taskPath = PathUtils.join(this.stateDir, 'current-task.json');
        await FileUtils.writeJSON(taskPath, {
            ...task,
            updated_at: new Date().toISOString()
        });
    }
    /**
     * Start new task
     */
    async startTask(_mode, feature) {
        const task = {
            feature,
            workflow_phase: 'PLANNING',
            iteration: 1,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await this.saveCurrentTask(task);
    }
    /**
     * Complete current task
     */
    async completeTask() {
        const taskPath = PathUtils.join(this.stateDir, 'current-task.json');
        if (await FileUtils.exists(taskPath)) {
            await FileUtils.deleteFile(taskPath);
        }
    }
    /**
     * Load boundaries
     */
    async loadBoundaries() {
        const boundariesPath = PathUtils.join(this.stateDir, 'boundaries.json');
        if (!await FileUtils.exists(boundariesPath)) {
            return null;
        }
        return FileUtils.readJSON(boundariesPath);
    }
    /**
     * Save boundaries
     */
    async saveBoundaries(boundaries) {
        const boundariesPath = PathUtils.join(this.stateDir, 'boundaries.json');
        await FileUtils.writeJSON(boundariesPath, {
            ...boundaries,
            last_check: new Date().toISOString()
        });
    }
    /**
     * Log event to implementation-log.jsonl
     */
    async log(event, data) {
        const logPath = PathUtils.join(this.stateDir, 'implementation-log.jsonl');
        const entry = {
            timestamp: new Date().toISOString(),
            event,
            data
        };
        await FileUtils.appendFile(logPath, JSON.stringify(entry) + '\n');
    }
    /**
     * Get state directory path
     */
    getStateDir() {
        return this.stateDir;
    }
}
// CLI interface
if (require.main === module) {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    const manager = new StateManager();
    (async () => {
        switch (command) {
            case 'init':
                await manager.init();
                console.log('✓ State initialized');
                break;
            case 'get':
                if (!args[0]) {
                    console.error('Usage: state-manager get <key>');
                    process.exit(1);
                }
                const value = await manager.get(args[0]);
                console.log(JSON.stringify(value, null, 2));
                break;
            case 'set':
                if (!args[0] || !args[1]) {
                    console.error('Usage: state-manager set <key> <value>');
                    process.exit(1);
                }
                await manager.set(args[0], JSON.parse(args[1]));
                console.log('✓ Value set');
                break;
            default:
                console.error(`
Usage: node state-manager.js <command> [args]

Commands:
  init                    - Initialize state directory
  get <key>              - Get config value
  set <key> <value>      - Set config value

Examples:
  node state-manager.js init
  node state-manager.js get agent
  node state-manager.js set agent '"planner"'
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=state-manager.js.map