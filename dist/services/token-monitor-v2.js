/**
 * Token Monitor Service v2 (Pure Node.js)
 * Monitors context usage and triggers auto-checkpoints
 * NO Python dependency!
 */
import { TokenCounter } from './token-counter.js';
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
export const DEFAULT_THRESHOLDS = {
    warn: 160_000, // 80% of 200k
    checkpoint: 180_000, // 90%
    critical: 190_000 // 95%
};
export class TokenMonitor {
    stateDir;
    thresholds;
    contextWindow;
    constructor(options) {
        this.stateDir = options?.stateDir || PathUtils.getStateDir();
        this.thresholds = { ...DEFAULT_THRESHOLDS, ...options?.thresholds };
        this.contextWindow = options?.contextWindow || 200_000;
    }
    /**
     * Calculate total session tokens from all state files
     */
    async calculateSessionTokens() {
        try {
            let totalText = '';
            // Files to include in token count
            const filesToCount = [
                'implementation-log.jsonl',
                'session.json',
                'current-task.json',
                'boundaries.json',
                'file-iteration.json'
            ];
            // Read all files
            for (const file of filesToCount) {
                const filePath = PathUtils.join(this.stateDir, file);
                if (await FileUtils.exists(filePath)) {
                    const content = await FileUtils.readFile(filePath);
                    totalText += content + '\n';
                }
            }
            // Count tokens using Node.js tokenizer (no Python!)
            const tokenCount = TokenCounter.count(totalText);
            // Determine status
            const status = this.checkTokenStatus(tokenCount.tokens);
            const thresholdPercent = Math.round((tokenCount.tokens / this.contextWindow) * 100);
            // Generate recommendation
            let recommendation = '';
            switch (status) {
                case 'ok':
                    recommendation = 'Context usage is healthy';
                    break;
                case 'warn':
                    recommendation = 'Consider creating a checkpoint soon';
                    break;
                case 'checkpoint':
                    recommendation = 'Auto-checkpoint should be triggered';
                    break;
                case 'critical':
                    recommendation = 'IMMEDIATE checkpoint required - approaching context limit';
                    break;
            }
            return {
                tokens: tokenCount.tokens,
                characters: tokenCount.characters,
                method: tokenCount.method,
                status,
                threshold_percent: thresholdPercent,
                recommendation
            };
        }
        catch (error) {
            console.error(`Failed to calculate session tokens: ${error.message}`);
            throw error;
        }
    }
    /**
     * Check token status against thresholds
     */
    checkTokenStatus(tokens) {
        if (tokens >= this.thresholds.critical)
            return 'critical';
        if (tokens >= this.thresholds.checkpoint)
            return 'checkpoint';
        if (tokens >= this.thresholds.warn)
            return 'warn';
        return 'ok';
    }
    /**
     * Get recommended action based on token usage
     */
    getRecommendedAction(status) {
        switch (status) {
            case 'critical':
                return 'auto-checkpoint-critical';
            case 'checkpoint':
                return 'auto-checkpoint';
            case 'warn':
                return 'log-warning';
            default:
                return 'continue';
        }
    }
    /**
     * Format token usage for display
     */
    formatTokenUsage(usage) {
        const bar = this.createProgressBar(usage.threshold_percent);
        return `
Token Usage: ${usage.tokens.toLocaleString()} tokens (${usage.threshold_percent}%)
Method: ${usage.method}
Status: ${usage.status.toUpperCase()}
${bar}
${usage.recommendation}
    `.trim();
    }
    /**
     * Create progress bar for token usage
     */
    createProgressBar(percent, width = 40) {
        const filled = Math.round((percent / 100) * width);
        const empty = width - filled;
        let color = '';
        if (percent >= 95) {
            color = '🔴'; // Critical
        }
        else if (percent >= 90) {
            color = '🟠'; // Checkpoint
        }
        else if (percent >= 80) {
            color = '🟡'; // Warning
        }
        else {
            color = '🟢'; // OK
        }
        const bar = color + ' ' + '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
        return bar;
    }
    /**
     * Check if checkpoint is needed
     */
    async shouldCheckpoint() {
        const usage = await this.calculateSessionTokens();
        if (usage.status === 'critical' || usage.status === 'checkpoint') {
            return {
                needed: true,
                reason: usage.status === 'critical' ? 'Critical threshold exceeded' : 'Checkpoint threshold exceeded',
                usage
            };
        }
        return {
            needed: false,
            reason: 'Token usage within acceptable range',
            usage
        };
    }
}
// CLI interface
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
    const command = process.argv[2];
    const monitor = new TokenMonitor();
    (async () => {
        switch (command) {
            case 'check': {
                const usage = await monitor.calculateSessionTokens();
                console.log(monitor.formatTokenUsage(usage));
                break;
            }
            case 'should-checkpoint': {
                const { needed, reason, usage } = await monitor.shouldCheckpoint();
                console.log(JSON.stringify({ needed, reason, usage }, null, 2));
                process.exit(needed ? 0 : 1);
            }
            default:
                console.error(`
Usage: node token-monitor.js <command>

Commands:
  check                  Check current session token usage
  should-checkpoint      Determine if checkpoint is needed

Examples:
  node token-monitor.js check
  node token-monitor.js should-checkpoint
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=token-monitor-v2.js.map