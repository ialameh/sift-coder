/**
 * Learning Service - Continuous Pattern Extraction
 *
 * Extracts reusable patterns from development work and maintains a knowledge base.
 * Supports error resolution, debugging, workarounds, and best practices.
 *
 * SiftCoder Flavor:
 * - Cross-platform file operations
 * - JSON-based pattern storage
 * - Search and retrieval functionality
 * - CLI and module interfaces
 */
import { FileUtils } from '../utils/file-utils.js';
import { ProcessUtils } from '../utils/process-utils.js';
import { join } from 'path';
/**
 * Learning Service for pattern extraction and knowledge management
 */
export class LearningService {
    projectRoot;
    stateDir;
    patternsFile;
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        this.stateDir = join(this.projectRoot, '.claude', 'siftcoder-state');
        this.patternsFile = join(this.stateDir, 'knowledge', 'patterns.json');
    }
    /**
     * Extract a pattern from session data
     */
    async extractPattern(name, category, problem, solution, options) {
        const pattern = {
            id: this.generatePatternId(name),
            name,
            category,
            problem,
            solution,
            tags: options?.tags || this.extractTags(problem + ' ' + solution),
            code_example: options?.code_example,
            context: options?.context,
            created_at: new Date().toISOString(),
            times_used: 0
        };
        return pattern;
    }
    /**
     * Save pattern to knowledge base
     */
    async savePattern(pattern) {
        await FileUtils.mkdir(join(this.stateDir, 'knowledge'));
        const patterns = await this.loadPatterns();
        // Check if pattern already exists
        const existingIndex = patterns.findIndex(p => p.id === pattern.id);
        if (existingIndex >= 0) {
            // Update existing pattern
            patterns[existingIndex] = {
                ...patterns[existingIndex],
                ...pattern,
                updated_at: new Date().toISOString()
            };
        }
        else {
            // Add new pattern
            patterns.push(pattern);
        }
        await FileUtils.writeJSON(this.patternsFile, patterns);
        console.log(`✅ Pattern saved: ${pattern.name}`);
    }
    /**
     * Load all patterns from knowledge base
     */
    async loadPatterns() {
        try {
            if (await FileUtils.exists(this.patternsFile)) {
                return await FileUtils.readJSON(this.patternsFile);
            }
        }
        catch (error) {
            // Return empty array on error
        }
        return [];
    }
    /**
     * Search patterns by query
     */
    async searchPatterns(query) {
        const patterns = await this.loadPatterns();
        const lowerQuery = query.toLowerCase();
        return patterns.filter(p => {
            return p.name.toLowerCase().includes(lowerQuery) ||
                p.problem.toLowerCase().includes(lowerQuery) ||
                p.solution.toLowerCase().includes(lowerQuery) ||
                p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
                (p.context && p.context.toLowerCase().includes(lowerQuery));
        });
    }
    /**
     * Search patterns by category
     */
    async searchByCategory(category) {
        const patterns = await this.loadPatterns();
        return patterns.filter(p => p.category === category);
    }
    /**
     * Search patterns by tag
     */
    async searchByTag(tag) {
        const patterns = await this.loadPatterns();
        const lowerTag = tag.toLowerCase();
        return patterns.filter(p => p.tags.some(t => t.toLowerCase().includes(lowerTag)));
    }
    /**
     * Get pattern by ID
     */
    async getPattern(id) {
        const patterns = await this.loadPatterns();
        return patterns.find(p => p.id === id) || null;
    }
    /**
     * Delete pattern by ID
     */
    async deletePattern(id) {
        const patterns = await this.loadPatterns();
        const filtered = patterns.filter(p => p.id !== id);
        if (filtered.length < patterns.length) {
            await FileUtils.writeJSON(this.patternsFile, filtered);
            console.log(`✅ Pattern deleted: ${id}`);
            return true;
        }
        return false;
    }
    /**
     * List all patterns
     */
    async listPatterns() {
        return this.loadPatterns();
    }
    /**
     * Suggest patterns based on current context
     */
    async suggestPatterns(context) {
        const patterns = await this.loadPatterns();
        const suggestions = [];
        const lowerContext = context.toLowerCase();
        const contextWords = lowerContext.split(/\s+/).filter(w => w.length > 3);
        patterns.forEach(pattern => {
            let score = 0;
            // Check name match
            if (lowerContext.includes(pattern.name.toLowerCase())) {
                score += 10;
            }
            // Check problem match
            if (pattern.problem.toLowerCase().includes(lowerContext)) {
                score += 5;
            }
            // Check tag matches
            pattern.tags.forEach(tag => {
                if (lowerContext.includes(tag.toLowerCase())) {
                    score += 3;
                }
            });
            // Check word matches
            contextWords.forEach(word => {
                if (pattern.name.toLowerCase().includes(word))
                    score += 1;
                if (pattern.problem.toLowerCase().includes(word))
                    score += 1;
            });
            // Boost frequently used patterns
            score += (pattern.times_used || 0) * 0.5;
            if (score > 0) {
                suggestions.push({ pattern, score });
            }
        });
        // Sort by score and return top matches
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => {
            s.pattern.times_used = (s.pattern.times_used || 0) + 1;
            return s.pattern;
        });
    }
    /**
     * Evaluate session for extractable patterns
     */
    async evaluateSession(sessionData) {
        console.log('\n🧠 [Learning] Evaluating session for patterns...\n');
        // Check for error patterns
        if (sessionData.errors_encountered.length > 0) {
            console.log(`📋 Found ${sessionData.errors_encountered.length} errors - pattern candidates`);
            sessionData.errors_encountered.forEach(error => {
                console.log(`   - ${error.substring(0, 80)}...`);
            });
        }
        // Check if session suggests new patterns
        const context = [
            ...sessionData.errors_encountered,
            ...sessionData.commands_run
        ].join(' ');
        const relatedPatterns = await this.suggestPatterns(context);
        if (relatedPatterns.length > 0) {
            console.log(`\n💡 Related patterns found: ${relatedPatterns.length}`);
            relatedPatterns.forEach(p => {
                console.log(`   - ${p.name} [${p.category}]`);
            });
        }
        else {
            console.log('\n💡 No related patterns found');
        }
        console.log('\n💡 To save a pattern from this session:');
        console.log('   /learn "pattern name" "category" "problem" "solution"\n');
        return relatedPatterns;
    }
    /**
     * Generate pattern ID from name
     */
    generatePatternId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
    /**
     * Extract tags from text
     */
    extractTags(text) {
        const tags = [];
        const lowerText = text.toLowerCase();
        // Common technology tags
        const techTags = ['typescript', 'javascript', 'react', 'vue', 'angular', 'node', 'express', 'mongodb', 'postgresql', 'redis', 'aws', 'docker', 'kubernetes', 'graphql', 'rest', 'api'];
        techTags.forEach(tag => {
            if (lowerText.includes(tag)) {
                tags.push(tag);
            }
        });
        // Common concept tags
        const conceptTags = ['async', 'promise', 'error', 'exception', 'validation', 'authentication', 'authorization', 'testing', 'debugging', 'performance', 'security', 'database', 'cache', 'logging'];
        conceptTags.forEach(tag => {
            if (lowerText.includes(tag)) {
                tags.push(tag);
            }
        });
        return tags;
    }
    /**
     * Format pattern for display
     */
    formatPattern(pattern) {
        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 ${pattern.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️  Category: ${pattern.category}
📅 Created: ${pattern.created_at}
${pattern.updated_at ? `✏️  Updated: ${pattern.updated_at}` : ''}

❓ Problem:
${pattern.problem}

✅ Solution:
${pattern.solution}

${pattern.code_example ? `💻 Code Example:\n${pattern.code_example}\n` : ''}${pattern.tags.length > 0 ? `🏷️  Tags: ${pattern.tags.join(', ')}` : ''}
`;
    }
    /**
     * CLI interface
     */
    static async main() {
        const service = new LearningService();
        const command = process.argv[2];
        switch (command) {
            case 'extract': {
                const name = process.argv[3];
                const category = (process.argv[4] || 'best_practice');
                const problem = process.argv[5];
                const solution = process.argv[6];
                if (!name || !problem || !solution) {
                    console.error('Usage: learning-service extract <name> <category> <problem> <solution>');
                    ProcessUtils.exit(1);
                }
                const pattern = await service.extractPattern(name, category, problem, solution);
                await service.savePattern(pattern);
                break;
            }
            case 'save': {
                // Save from JSON string
                const jsonStr = process.argv[3];
                if (!jsonStr) {
                    console.error('Usage: learning-service save \'<pattern-json>\'');
                    ProcessUtils.exit(1);
                }
                const pattern = JSON.parse(jsonStr);
                await service.savePattern(pattern);
                break;
            }
            case 'search': {
                const query = process.argv[3] || '';
                const patterns = await service.searchPatterns(query);
                console.log(`\n🔍 Found ${patterns.length} patterns matching "${query}"\n`);
                patterns.forEach(p => console.log(service.formatPattern(p)));
                break;
            }
            case 'list': {
                const patterns = await service.listPatterns();
                console.log(`\n📚 Knowledge Base: ${patterns.length} patterns\n`);
                patterns.forEach(p => {
                    console.log(`  ${p.name} [${p.category}]`);
                    console.log(`    ${p.problem.substring(0, 60)}...\n`);
                });
                break;
            }
            case 'get': {
                const id = process.argv[3];
                if (!id) {
                    console.error('Usage: learning-service get <pattern-id>');
                    ProcessUtils.exit(1);
                }
                const pattern = await service.getPattern(id);
                if (pattern) {
                    console.log(service.formatPattern(pattern));
                }
                else {
                    console.log(`❌ Pattern not found: ${id}`);
                }
                break;
            }
            case 'delete': {
                const id = process.argv[3];
                if (!id) {
                    console.error('Usage: learning-service delete <pattern-id>');
                    ProcessUtils.exit(1);
                }
                const deleted = await service.deletePattern(id);
                if (!deleted) {
                    console.log(`❌ Pattern not found: ${id}`);
                    ProcessUtils.exit(1);
                }
                break;
            }
            case 'category': {
                const category = (process.argv[3] || 'best_practice');
                const patterns = await service.searchByCategory(category);
                console.log(`\n📚 ${category}: ${patterns.length} patterns\n`);
                patterns.forEach(p => console.log(service.formatPattern(p)));
                break;
            }
            case 'suggest': {
                const context = process.argv.slice(3).join(' ');
                if (!context) {
                    console.error('Usage: learning-service suggest <context>');
                    ProcessUtils.exit(1);
                }
                const patterns = await service.suggestPatterns(context);
                console.log(`\n💡 Suggested patterns (${patterns.length}):\n`);
                patterns.forEach(p => {
                    console.log(`  ${p.name} [${p.category}]`);
                    console.log(`    ${p.problem.substring(0, 60)}...\n`);
                });
                break;
            }
            default:
                console.error(`
🧠 Learning Service - Pattern Extraction & Knowledge Base

Usage: learning-service <command> [options]

Commands:
  extract <name> <category> <problem> <solution>
                            Extract and save a pattern
                            category: error_resolution | debugging | workaround |
                                      best_practice | refactoring | architecture

  save '<pattern-json>'     Save pattern from JSON string

  search <query>            Search patterns by text
  list                      List all patterns
  get <pattern-id>          Get pattern by ID
  delete <pattern-id>       Delete pattern by ID
  category <category>       List patterns by category
  suggest <context>         Suggest patterns based on context

Examples:
  learning-service extract "Supabase Auth Error" error_resolution \\
    "User not found error in Supabase auth" \\
    "Check if user exists before auth"

  learning-service search "supabase"
  learning-service category error_resolution
  learning-service suggest "typescript async promise error"
        `);
                ProcessUtils.exit(1);
        }
    }
}
// CLI interface
if (process.argv[1]?.endsWith('learning-service.js')) {
    LearningService.main().catch(error => {
        console.error('Error:', error.message);
        ProcessUtils.exit(1);
    });
}
//# sourceMappingURL=learning-service.js.map