/**
 * Knowledge Manager Service
 *
 * Manages the knowledge base: patterns, gotchas, and decisions.
 * Used by commands and agents to store/retrieve learned information.
 */
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
export class KnowledgeManagerService {
    knowledgeDir;
    constructor(projectRoot) {
        const stateDir = PathUtils.getStateDir(projectRoot);
        this.knowledgeDir = PathUtils.join(stateDir, 'knowledge');
    }
    /**
     * Initialize knowledge directory
     */
    async init() {
        await FileUtils.mkdir(this.knowledgeDir);
        // Initialize empty files if they don't exist
        const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
        const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
        const decisionsFile = PathUtils.join(this.knowledgeDir, 'decisions.json');
        if (!await FileUtils.exists(patternsFile)) {
            await FileUtils.writeJSON(patternsFile, []);
        }
        if (!await FileUtils.exists(gotchasFile)) {
            await FileUtils.writeJSON(gotchasFile, []);
        }
        if (!await FileUtils.exists(decisionsFile)) {
            await FileUtils.writeJSON(decisionsFile, []);
        }
    }
    /**
     * Add a pattern
     */
    async addPattern(pattern) {
        await this.init();
        const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
        const patterns = await FileUtils.readJSON(patternsFile);
        const id = `pattern-${patterns.length + 1}`;
        const newPattern = {
            id,
            ...pattern,
            addedAt: new Date().toISOString()
        };
        patterns.push(newPattern);
        await FileUtils.writeJSON(patternsFile, patterns);
        return id;
    }
    /**
     * Add a gotcha
     */
    async addGotcha(gotcha) {
        await this.init();
        const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
        const gotchas = await FileUtils.readJSON(gotchasFile);
        const id = `gotcha-${gotchas.length + 1}`;
        const newGotcha = {
            id,
            ...gotcha,
            addedAt: new Date().toISOString()
        };
        gotchas.push(newGotcha);
        await FileUtils.writeJSON(gotchasFile, gotchas);
        return id;
    }
    /**
     * Add a decision
     */
    async addDecision(decision) {
        await this.init();
        const decisionsFile = PathUtils.join(this.knowledgeDir, 'decisions.json');
        const decisions = await FileUtils.readJSON(decisionsFile);
        const id = `decision-${decisions.length + 1}`;
        const newDecision = {
            id,
            ...decision,
            addedAt: new Date().toISOString()
        };
        decisions.push(newDecision);
        await FileUtils.writeJSON(decisionsFile, decisions);
        return id;
    }
    /**
     * Get all patterns
     */
    async getPatterns() {
        const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
        if (!await FileUtils.exists(patternsFile)) {
            return [];
        }
        return FileUtils.readJSON(patternsFile);
    }
    /**
     * Get all gotchas
     */
    async getGotchas() {
        const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
        if (!await FileUtils.exists(gotchasFile)) {
            return [];
        }
        return FileUtils.readJSON(gotchasFile);
    }
    /**
     * Get all decisions
     */
    async getDecisions() {
        const decisionsFile = PathUtils.join(this.knowledgeDir, 'decisions.json');
        if (!await FileUtils.exists(decisionsFile)) {
            return [];
        }
        return FileUtils.readJSON(decisionsFile);
    }
    /**
     * Search patterns by title
     */
    async searchPatterns(query) {
        const patterns = await this.getPatterns();
        const lowerQuery = query.toLowerCase();
        return patterns.filter(p => p.title.toLowerCase().includes(lowerQuery) ||
            (p.usage && p.usage.toLowerCase().includes(lowerQuery)));
    }
    /**
     * Search gotchas by issue
     */
    async searchGotchas(query) {
        const gotchas = await this.getGotchas();
        const lowerQuery = query.toLowerCase();
        return gotchas.filter(g => g.issue.toLowerCase().includes(lowerQuery) ||
            (g.fix && g.fix.toLowerCase().includes(lowerQuery)));
    }
}
// CLI interface
// Check if this file is being run directly (CLI mode)
const isMainModule = process.argv[1]?.endsWith('/knowledge-manager.js') ||
    process.argv[1]?.endsWith('knowledge-manager.js') ||
    process.argv[1]?.endsWith('\\knowledge-manager.js');
if (isMainModule) {
    const service = new KnowledgeManagerService();
    const command = process.argv[2] || 'help';
    (async () => {
        switch (command) {
            case 'add-pattern': {
                const title = process.argv[3];
                const source = process.argv[4];
                const usage = process.argv[5];
                const example = process.argv[6];
                if (!title) {
                    console.error('Usage: knowledge-manager.ts add-pattern <title> [source] [usage] [example]');
                    process.exit(1);
                }
                const id = await service.addPattern({ title, source, usage, example });
                console.log(`Added pattern: ${id} - ${title}`);
                break;
            }
            case 'add-gotcha': {
                const issue = process.argv[3];
                const fix = process.argv[4];
                const context = process.argv[5];
                if (!issue) {
                    console.error('Usage: knowledge-manager.ts add-gotcha <issue> [fix] [context]');
                    process.exit(1);
                }
                const id = await service.addGotcha({ issue, fix, context });
                console.log(`Added gotcha: ${id} - ${issue}`);
                break;
            }
            case 'list-patterns': {
                const patterns = await service.getPatterns();
                console.log(JSON.stringify(patterns, null, 2));
                break;
            }
            case 'list-gotchas': {
                const gotchas = await service.getGotchas();
                console.log(JSON.stringify(gotchas, null, 2));
                break;
            }
            case 'list-decisions': {
                const decisions = await service.getDecisions();
                console.log(JSON.stringify(decisions, null, 2));
                break;
            }
            default:
                console.error(`
Usage: knowledge-manager.ts <command> [arguments]

Commands:
  add-pattern <title> [source] [usage] [example]  Add a pattern
  add-gotcha <issue> [fix] [context]              Add a gotcha
  list-patterns                                   List all patterns
  list-gotchas                                    List all gotchas
  list-decisions                                  List all decisions
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=knowledge-manager.js.map