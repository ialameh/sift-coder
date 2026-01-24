/**
 * Documentation Service - Automatic Documentation Generation
 *
 * Generates documentation from code including contributor guides, runbooks,
 * and architecture diagrams (codemaps).
 *
 * SiftCoder Flavor:
 * - Cross-platform file operations
 * - Markdown documentation generation
 * - Architecture diagram support
 * - CLI and module interfaces
 */
import { FileUtils } from '../utils/file-utils.js';
import { ProcessUtils } from '../utils/process-utils.js';
import { existsSync, readFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { glob } from 'glob';
/**
 * Documentation Service for automated documentation generation
 */
export class DocService {
    projectRoot;
    config;
    constructor(projectRoot, config) {
        this.projectRoot = projectRoot || process.cwd();
        this.config = {
            outputDir: config?.outputDir || 'docs',
            includePatterns: config?.includePatterns || ['src/**/*.ts', 'src/**/*.tsx'],
            excludePatterns: config?.excludePatterns || ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
            generateCodemaps: config?.generateCodemaps ?? true
        };
    }
    /**
     * Generate all documentation
     */
    async generateDocs() {
        console.log('\n📚 Generating documentation...\n');
        await FileUtils.mkdir(join(this.projectRoot, this.config.outputDir));
        // Generate different types of docs
        await this.generateContributorGuide();
        await this.generateRunbook();
        await this.generateAPIDocumentation();
        if (this.config.generateCodemaps) {
            await this.updateCodemaps();
        }
        console.log('\n✅ Documentation generated successfully\n');
    }
    /**
     * Generate contributor guide
     */
    async generateContributorGuide() {
        console.log('  → Generating contributor guide...');
        await this.extractPackageInfo();
        const scripts = await this.extractScripts();
        const setup = await this.generateSetupInstructions();
        const content = `
# Contributor Guide

## Quick Start

${setup}

## Available Scripts

${scripts}

## Project Structure

${this.generateProjectStructure()}

## Development Workflow

1. Install dependencies: \`npm install\`
2. Make changes
3. Run tests: \`npm test\`
4. Build project: \`npm run build\`
5. Submit PR

## Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add tests for new features
- Update documentation

## Getting Help

- Check existing documentation
- Review code comments
- Ask in project discussions
`;
        const outputPath = join(this.projectRoot, this.config.outputDir, 'CONTRIBUTING.md');
        await FileUtils.writeFile(outputPath, content.trim());
        console.log(`    ✅ ${relative(this.projectRoot, outputPath)}`);
    }
    /**
     * Extract package information
     */
    async extractPackageInfo() {
        try {
            const pkgPath = join(this.projectRoot, 'package.json');
            if (existsSync(pkgPath)) {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                return `
**Project:** ${pkg.name || 'Unnamed'}
**Version:** ${pkg.version || '0.0.0'}
**Description:** ${pkg.description || 'No description'}
`;
            }
        }
        catch {
            // Fall through
        }
        return '\n';
    }
    /**
     * Extract scripts from package.json
     */
    async extractScripts() {
        try {
            const pkgPath = join(this.projectRoot, 'package.json');
            if (existsSync(pkgPath)) {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                const scripts = pkg.scripts || {};
                let output = '| Script | Description |\n';
                output += '|--------|-------------|\n';
                Object.entries(scripts).forEach(([name, command]) => {
                    output += `| \`npm run ${name}\` | \`${command}\` |\n`;
                });
                return output;
            }
        }
        catch {
            // Fall through
        }
        return 'No scripts found in package.json\n';
    }
    /**
     * Generate setup instructions
     */
    async generateSetupInstructions() {
        const hasNodeModules = existsSync(join(this.projectRoot, 'node_modules'));
        let instructions = '### Prerequisites\n\n';
        instructions += '- Node.js 18+ and npm\n';
        instructions += '- Git\n\n';
        instructions += '### Setup\n\n';
        instructions += '```bash\n';
        instructions += '# Clone repository\n';
        instructions += 'git clone <repo-url>\n';
        instructions += 'cd <project-dir>\n\n';
        if (!hasNodeModules) {
            instructions += '# Install dependencies\n';
            instructions += 'npm install\n\n';
        }
        instructions += '# Start development\n';
        instructions += 'npm run dev\n';
        instructions += '```\n';
        return instructions;
    }
    /**
     * Generate project structure
     */
    generateProjectStructure() {
        return `
\`\`\`
src/
├── components/    # UI components
├── services/      # Business logic
├── utils/         # Utilities
├── types/         # Type definitions
└── index.ts       # Entry point
tests/             # Test files
docs/              # Documentation
\`\`\`
`;
    }
    /**
     * Generate runbook
     */
    async generateRunbook() {
        console.log('  → Generating runbook...');
        const commonTasks = await this.generateCommonTasks();
        const troubleshooting = await this.generateTroubleshooting();
        const content = `
# Runbook

## Common Tasks

${commonTasks}

## Troubleshooting

${troubleshooting}

## Deployment

### Production Deploy
\`\`\`bash
npm run build
npm run deploy
\`\`\`

### Rollback
\`\`\`bash
npm run rollback
\`\`\`

## Maintenance

- Update dependencies: \`npm update\`
- Security audit: \`npm audit\`
- Clean build: \`npm run clean\`
`;
        const outputPath = join(this.projectRoot, this.config.outputDir, 'RUNBOOK.md');
        await FileUtils.writeFile(outputPath, content.trim());
        console.log(`    ✅ ${relative(this.projectRoot, outputPath)}`);
    }
    /**
     * Generate common tasks section
     */
    async generateCommonTasks() {
        return `
### Running Tests
\`\`\`bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
\`\`\`

### Building
\`\`\`bash
# Development build
npm run build:dev

# Production build
npm run build

# Clean build
npm run clean && npm run build
\`\`\`

### Linting
\`\`\`bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
\`\`\`

### Type Checking
\`\`\`bash
npm run type-check
\`\`\`
`;
    }
    /**
     * Generate troubleshooting section
     */
    async generateTroubleshooting() {
        return `
### Build fails
- Check Node.js version: \`node --version\`
- Clear node_modules: \`rm -rf node_modules && npm install\`
- Clear build cache: \`npm run clean\`

### Tests fail
- Check test environment setup
- Verify database connection (if applicable)
- Run with verbose output: \`npm test -- --verbose\`

### Linting errors
- Auto-fix: \`npm run lint:fix\`
- Check .eslintrc configuration
- Update dependencies if needed

### Type errors
- Run \`npm run type-check\` for details
- Check tsconfig.json configuration
- Ensure all types are imported
`;
    }
    /**
     * Generate API documentation
     */
    async generateAPIDocumentation() {
        console.log('  → Generating API documentation...');
        // Scan for exported functions and classes
        const apiDocs = await this.extractAPIDocs();
        const content = `
# API Documentation

## Services

${apiDocs}

## Types

See \`src/types/\` for type definitions.

## Utilities

See \`src/utils/\` for utility functions.
`;
        const outputPath = join(this.projectRoot, this.config.outputDir, 'API.md');
        await FileUtils.writeFile(outputPath, content.trim());
        console.log(`    ✅ ${relative(this.projectRoot, outputPath)}`);
    }
    /**
     * Extract API documentation from source files
     */
    async extractAPIDocs() {
        const files = await glob('src/**/*.ts', {
            cwd: this.projectRoot,
            ignore: ['**/*.test.ts', '**/*.spec.ts']
        });
        let output = '';
        for (const filePath of files) {
            try {
                const content = await FileUtils.readFile(filePath);
                // Extract exported classes and functions
                const exports = this.extractExports(content, filePath);
                if (exports.length > 0) {
                    output += `\n### ${filePath}\n\n`;
                    exports.forEach(exp => {
                        output += `#### \`${exp.name}\`\n\n`;
                        if (exp.comment) {
                            output += `${exp.comment}\n\n`;
                        }
                        output += `**Type:** ${exp.type}\n\n`;
                    });
                }
            }
            catch {
                // Skip files that can't be read
            }
        }
        return output || 'No API documentation found.\n';
    }
    /**
     * Extract exports from file content
     */
    extractExports(content, _file) {
        const exports = [];
        // Extract class exports
        const classMatches = content.matchAll(/export\s+class\s+(\w+)/g);
        for (const match of classMatches) {
            exports.push({ name: match[1], type: 'class' });
        }
        // Extract function exports
        const funcMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
        for (const match of funcMatches) {
            exports.push({ name: match[1], type: 'function' });
        }
        // Extract const exports (possible functions)
        const constMatches = content.matchAll(/export\s+const\s+(\w+)/g);
        for (const match of constMatches) {
            exports.push({ name: match[1], type: 'const' });
        }
        return exports;
    }
    /**
     * Update codemaps (architecture diagrams)
     */
    async updateCodemaps() {
        console.log('  → Generating codemaps...');
        const codemapsDir = join(this.projectRoot, this.config.outputDir, 'codemaps');
        await FileUtils.mkdir(codemapsDir);
        // Scan source files
        const files = await this.scanSourceFiles();
        const architecture = await this.buildArchitectureGraph(files);
        // Generate different views
        await this.generateServiceView(architecture, codemapsDir);
        await this.generateDependencyGraph(architecture, codemapsDir);
        await this.generateComponentTree(architecture, codemapsDir);
        console.log('    ✅ Codemaps generated');
    }
    /**
     * Scan source files for information
     */
    async scanSourceFiles() {
        const files = new Map();
        const sourceFiles = await glob(this.config.includePatterns[0], {
            cwd: this.projectRoot,
            ignore: this.config.excludePatterns
        });
        for (const file of sourceFiles) {
            const filePath = join(this.projectRoot, file);
            try {
                const content = await FileUtils.readFile(filePath);
                const lines = content.split('\n').length;
                files.set(file, {
                    path: file,
                    lines,
                    functions: (content.match(/\b(function|const|class)\b/g) || []).length,
                    imports: this.extractImports(content),
                    exports: this.extractExports(content, file).map(e => e.name)
                });
            }
            catch {
                // Skip files that can't be read
            }
        }
        return files;
    }
    /**
     * Extract imports from content
     */
    extractImports(content) {
        const imports = [];
        const matches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
        for (const match of matches) {
            imports.push(match[1]);
        }
        return imports;
    }
    /**
     * Build architecture graph
     */
    async buildArchitectureGraph(files) {
        const nodes = new Map();
        files.forEach((info, path) => {
            const name = path.split('/').pop()?.replace(/\.(ts|tsx)$/, '') || path;
            nodes.set(path, {
                id: path,
                name,
                type: this.categorizeFile(path, info),
                file: path,
                dependencies: info.imports.filter(imp => imp.startsWith('.')),
                dependents: []
            });
        });
        // Link dependents
        nodes.forEach((node, path) => {
            node.dependencies.forEach(dep => {
                const resolvedDep = this.resolveImportPath(path, dep);
                if (nodes.has(resolvedDep)) {
                    nodes.get(resolvedDep).dependents.push(path);
                }
            });
        });
        return nodes;
    }
    /**
     * Categorize file by type
     */
    categorizeFile(path, _info) {
        if (path.includes('/services/'))
            return 'service';
        if (path.includes('/components/'))
            return 'component';
        if (path.includes('/utils/'))
            return 'utility';
        return 'module';
    }
    /**
     * Resolve import path
     */
    resolveImportPath(fromFile, importPath) {
        const fromDir = dirname(fromFile);
        const resolved = join(fromDir, importPath);
        return resolved.replace(/\.(ts|tsx)$/, '').replace(/\/index$/, '');
    }
    /**
     * Generate service view
     */
    async generateServiceView(architecture, outputDir) {
        const services = Array.from(architecture.values()).filter(n => n.type === 'service');
        let content = '# Service Architecture\n\n';
        content += '## Services\n\n';
        services.forEach(service => {
            content += `### ${service.name}\n\n`;
            content += `**File:** \`${service.file}\`\n\n`;
            content += `**Dependencies:** ${service.dependencies.length}\n`;
            content += `**Dependents:** ${service.dependents.length}\n\n`;
        });
        await FileUtils.writeFile(join(outputDir, 'services.md'), content);
    }
    /**
     * Generate dependency graph
     */
    async generateDependencyGraph(architecture, outputDir) {
        let content = '# Dependency Graph\n\n';
        content += '```mermaid\ngraph TD\n';
        architecture.forEach((node) => {
            node.dependencies.forEach(dep => {
                content += `  ${node.id.replace(/\W/g, '_')} --> ${dep.replace(/\W/g, '_')}\n`;
            });
        });
        content += '```\n';
        await FileUtils.writeFile(join(outputDir, 'dependencies.md'), content);
    }
    /**
     * Generate component tree
     */
    async generateComponentTree(architecture, outputDir) {
        const components = Array.from(architecture.values()).filter(n => n.type === 'component');
        let content = '# Component Tree\n\n';
        components.forEach(component => {
            content += `- ${component.name}\n`;
            component.dependencies.forEach(dep => {
                content += `  - ${dep}\n`;
            });
        });
        await FileUtils.writeFile(join(outputDir, 'components.md'), content);
    }
    /**
     * CLI interface
     */
    static async main() {
        const service = new DocService();
        const command = process.argv[2];
        switch (command) {
            case 'generate': {
                await service.generateDocs();
                break;
            }
            case 'contributor': {
                await service.generateContributorGuide();
                break;
            }
            case 'runbook': {
                await service.generateRunbook();
                break;
            }
            case 'api': {
                await service.generateAPIDocumentation();
                break;
            }
            case 'codemaps': {
                await service.updateCodemaps();
                break;
            }
            default:
                console.error(`
📚 Documentation Service - Automatic Documentation Generation

Usage: doc-service <command> [options]

Commands:
  generate      Generate all documentation
  contributor   Generate contributor guide
  runbook       Generate runbook
  api           Generate API documentation
  codemaps      Generate architecture codemaps

Examples:
  doc-service generate
  doc-service contributor
  doc-service codemaps
        `);
                ProcessUtils.exit(1);
        }
    }
}
// CLI interface
if (process.argv[1]?.endsWith('doc-service.js')) {
    DocService.main().catch(error => {
        console.error('Error:', error.message);
        ProcessUtils.exit(1);
    });
}
//# sourceMappingURL=doc-service.js.map