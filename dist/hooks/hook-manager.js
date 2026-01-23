/**
 * Hook Manager (Converted from bash hooks)
 * Manages session-start and post-tool-use hooks
 * Cross-platform (Windows, Mac, Linux)
 */
import { StateManager } from '../services/state-manager.js';
import { PathUtils } from '../utils/path-utils.js';
import { FileUtils } from '../utils/file-utils.js';
export class HookManager {
    stateManager;
    constructor(projectRoot) {
        this.stateManager = new StateManager(projectRoot);
    }
    /**
     * Execute session-start hook
     * Injects context at session start
     */
    async onSessionStart() {
        try {
            // Initialize state if needed
            await this.stateManager.init();
            // Load or create session
            const stateDir = this.stateManager.getStateDir();
            const sessionPath = PathUtils.join(stateDir, 'session.json');
            let session;
            if (await FileUtils.exists(sessionPath)) {
                session = await FileUtils.readJSON(sessionPath);
            }
            else {
                session = {
                    id: `sess_${Date.now()}`,
                    created_at: new Date().toISOString()
                };
                await FileUtils.writeJSON(sessionPath, session);
            }
            // Log session start
            await this.stateManager.log('session_start', {
                session_id: session.id,
                timestamp: new Date().toISOString()
            });
            console.error(`✓ Session initialized: ${session.id}`);
        }
        catch (error) {
            console.error(`⚠️  Session start hook failed: ${error.message}`);
            // Don't fail the session if hook fails
        }
    }
    /**
     * Execute post-tool-use hook
     * Captures observations after tool use
     */
    async onPostToolUse(context) {
        try {
            // Only capture observations for specific tools
            const capturableTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];
            if (!context.toolName || !capturableTools.includes(context.toolName)) {
                return; // Skip observation
            }
            // Get current workflow context
            const currentTask = await this.stateManager.loadCurrentTask();
            // Log observation
            await this.stateManager.log('tool_use', {
                tool: context.toolName,
                agent: context.agent || currentTask?.agent || 'unknown',
                feature: currentTask?.feature,
                workflow_phase: currentTask?.workflow_phase,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            // Silently fail - don't block tool execution
            console.error(`⚠️  Observation capture failed: ${error.message}`);
        }
    }
    /**
     * Register all hooks
     */
    async registerHooks() {
        // In Claude Code, hooks are registered via hooks/ directory
        // This method ensures state directory is initialized
        await this.stateManager.init();
    }
}
// CLI interface for hook execution
if (require.main === module) {
    const hookType = process.argv[2];
    const manager = new HookManager();
    (async () => {
        switch (hookType) {
            case 'session-start':
                await manager.onSessionStart();
                break;
            case 'post-tool-use': {
                const toolName = process.argv[3];
                const toolInput = process.argv[4] ? JSON.parse(process.argv[4]) : undefined;
                await manager.onPostToolUse({
                    toolName,
                    toolInput
                });
                break;
            }
            default:
                console.error(`
Usage: node hook-manager.js <hook-type> [args]

Hook Types:
  session-start                          Execute session start hook
  post-tool-use <tool-name> [input]      Execute post-tool-use hook

Examples:
  node hook-manager.js session-start
  node hook-manager.js post-tool-use Read
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Hook error:', error.message);
        // Don't fail - hooks should be non-blocking
        process.exit(0);
    });
}
//# sourceMappingURL=hook-manager.js.map