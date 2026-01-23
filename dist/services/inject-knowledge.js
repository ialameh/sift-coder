/**
 * Knowledge Injection Service
 *
 * SessionStart hook that injects learned patterns into context.
 * Outputs a summary of relevant knowledge for the current project.
 */
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
export class KnowledgeInjectionService {
    stateDir;
    knowledgeDir;
    constructor(projectRoot) {
        this.stateDir = PathUtils.getStateDir(projectRoot);
        this.knowledgeDir = PathUtils.join(this.stateDir, 'knowledge');
    }
    /**
     * Generate knowledge summary for session start
     */
    async getKnowledgeSummary() {
        // Check if state exists
        if (!await FileUtils.exists(this.stateDir)) {
            return '';
        }
        const output = [];
        // Check for patterns
        const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
        if (await FileUtils.exists(patternsFile)) {
            const patterns = await FileUtils.readJSON(patternsFile);
            if (Array.isArray(patterns) && patterns.length > 0) {
                output.push(`[siftcoder] Loaded ${patterns.length} code patterns from previous sessions.`);
            }
        }
        // Check for gotchas
        const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
        if (await FileUtils.exists(gotchasFile)) {
            const gotchas = await FileUtils.readJSON(gotchasFile);
            if (Array.isArray(gotchas) && gotchas.length > 0) {
                output.push(`[siftcoder] Loaded ${gotchas.length} known gotchas from previous sessions.`);
            }
        }
        // Check for active task
        const currentTaskFile = PathUtils.join(this.stateDir, 'current-task.json');
        if (await FileUtils.exists(currentTaskFile)) {
            const task = await FileUtils.readJSON(currentTaskFile);
            if (task.mode && task.phase) {
                output.push(`[siftcoder] Active task: ${task.mode} (phase: ${task.phase}). Use /siftcoder:status for details.`);
            }
        }
        return output.join('\n');
    }
    /**
     * Get structured knowledge summary
     */
    async getStructuredSummary() {
        const summary = {
            patterns: 0,
            gotchas: 0
        };
        // Check for patterns
        const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
        if (await FileUtils.exists(patternsFile)) {
            const patterns = await FileUtils.readJSON(patternsFile);
            summary.patterns = Array.isArray(patterns) ? patterns.length : 0;
        }
        // Check for gotchas
        const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
        if (await FileUtils.exists(gotchasFile)) {
            const gotchas = await FileUtils.readJSON(gotchasFile);
            summary.gotchas = Array.isArray(gotchas) ? gotchas.length : 0;
        }
        // Check for active task
        const currentTaskFile = PathUtils.join(this.stateDir, 'current-task.json');
        if (await FileUtils.exists(currentTaskFile)) {
            const task = await FileUtils.readJSON(currentTaskFile);
            if (task.mode && task.phase) {
                summary.activeTask = {
                    mode: task.mode,
                    phase: task.phase
                };
            }
        }
        return summary;
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const service = new KnowledgeInjectionService();
    service.getKnowledgeSummary().then(output => {
        if (output) {
            console.log(output);
        }
        process.exit(0);
    }).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=inject-knowledge.js.map