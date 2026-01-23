/**
 * Codebase Indexer Service
 *
 * Builds vector index for semantic search.
 * Simplified Node.js version (without external dependencies like LanceDB/Ollama).
 */
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
import { glob } from 'glob';
export class IndexCodebaseService {
    projectRoot;
    indexDir;
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        const stateDir = PathUtils.getStateDir(projectRoot);
        this.indexDir = PathUtils.join(stateDir, 'vector-index');
    }
    /**
     * Initialize index directory
     */
    async init() {
        await FileUtils.mkdir(this.indexDir);
        await FileUtils.mkdir(PathUtils.join(this.indexDir, 'cache'));
    }
    /**
     * Find all code files
     */
    async findCodeFiles(searchPath = '.') {
        const extensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp'];
        const patterns = extensions.map(ext => `${searchPath}/**/*.${ext}`);
        const files = [];
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: this.projectRoot,
                ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
                absolute: false
            });
            for (const file of matches) {
                const fullPath = PathUtils.join(this.projectRoot, file);
                const ext = file.split('.').pop() || '';
                try {
                    const stat = await FileUtils.stat(fullPath);
                    files.push({
                        path: fullPath,
                        relativePath: file,
                        language: this.getLanguage(ext),
                        size: stat.size,
                        lastModified: stat.mtime
                    });
                }
                catch {
                    // File might not be accessible
                }
            }
        }
        return files;
    }
    /**
     * Get language from extension
     */
    getLanguage(ext) {
        const languageMap = {
            'ts': 'TypeScript',
            'tsx': 'TypeScript JSX',
            'js': 'JavaScript',
            'jsx': 'JavaScript JSX',
            'py': 'Python',
            'go': 'Go',
            'rs': 'Rust',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'h': 'C Header',
            'hpp': 'C++ Header'
        };
        return languageMap[ext] || ext.toUpperCase();
    }
    /**
     * Index codebase
     */
    async index(searchPath = '.') {
        await this.init();
        console.log('🏗️  SiftCoder Vector Index Builder');
        console.log('================================\n');
        const files = await this.findCodeFiles(searchPath);
        const result = {
            totalFiles: files.length,
            indexedFiles: 0,
            errors: [],
            languages: {}
        };
        console.log(`📊 Found ${files.length} code files\n`);
        // Count languages
        for (const file of files) {
            result.languages[file.language] = (result.languages[file.language] || 0) + 1;
        }
        // Save file list index
        const indexFile = PathUtils.join(this.indexDir, 'file-index.json');
        await FileUtils.writeJSON(indexFile, {
            files,
            indexedAt: new Date().toISOString(),
            totalFiles: files.length,
            languages: result.languages
        });
        result.indexedFiles = files.length;
        console.log('✅ Index created successfully\n');
        console.log('Language breakdown:');
        Object.entries(result.languages)
            .sort(([, a], [, b]) => b - a)
            .forEach(([lang, count]) => console.log(`  ${lang}: ${count}`));
        return result;
    }
    /**
     * Get stored index
     */
    async getIndex() {
        const indexFile = PathUtils.join(this.indexDir, 'file-index.json');
        if (!await FileUtils.exists(indexFile)) {
            return null;
        }
        return FileUtils.readJSON(indexFile);
    }
    /**
     * Search files by pattern
     */
    async searchFiles(query) {
        const index = await this.getIndex();
        if (!index) {
            return [];
        }
        const lowerQuery = query.toLowerCase();
        return index.files.filter(f => f.relativePath.toLowerCase().includes(lowerQuery) ||
            f.language.toLowerCase().includes(lowerQuery));
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const service = new IndexCodebaseService();
    const command = process.argv[2] || 'index';
    (async () => {
        switch (command) {
            case 'index': {
                const path = process.argv[3] || '.';
                await service.index(path);
                break;
            }
            case 'search': {
                const query = process.argv[3];
                if (!query) {
                    console.error('Usage: index-codebase.ts search <query>');
                    process.exit(1);
                }
                const results = await service.searchFiles(query);
                console.log(`Found ${results.length} files:\n`);
                results.forEach(f => console.log(`  ${f.relativePath} (${f.language})`));
                break;
            }
            case 'stats': {
                const index = await service.getIndex();
                if (!index) {
                    console.log('No index found. Run "index-codebase.ts index" first.');
                    process.exit(1);
                }
                const languages = {};
                index.files.forEach(f => {
                    languages[f.language] = (languages[f.language] || 0) + 1;
                });
                console.log(`Index created at: ${index.indexedAt}`);
                console.log(`Total files: ${index.files.length}\n`);
                console.log('Languages:');
                Object.entries(languages)
                    .sort(([, a], [, b]) => b - a)
                    .forEach(([lang, count]) => console.log(`  ${lang}: ${count}`));
                break;
            }
            default:
                console.error(`
Usage: index-codebase.ts <command> [arguments]

Commands:
  index [path]    Index the codebase
  search <query>  Search indexed files
  stats           Show index statistics
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=index-codebase.js.map