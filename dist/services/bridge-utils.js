/**
 * Bridge Utilities Service
 *
 * Provides helper functions for cross-codebase integration.
 * Used by the bridge command.
 */
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
export class BridgeUtilsService {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
    }
    /**
     * Detect project type from directory structure and files
     */
    async detectProjectType(dir) {
        const targetDir = dir || this.projectRoot;
        // Check for package.json
        const packageJsonPath = PathUtils.join(targetDir, 'package.json');
        if (await FileUtils.exists(packageJsonPath)) {
            const packageJson = await FileUtils.readJSON(packageJsonPath);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            // Check for frontend frameworks
            const frontendFrameworks = ['react', 'vue', 'angular', 'svelte'];
            const backendFrameworks = ['express', 'fastify', 'koa', 'nestjs'];
            const fullstackFrameworks = ['next', 'nuxt', 'sveltekit', 'remix'];
            const depsKeys = Object.keys(deps);
            if (depsKeys.some(d => fullstackFrameworks.some(f => d.includes(f)))) {
                return 'fullstack';
            }
            if (depsKeys.some(d => frontendFrameworks.some(f => d.includes(f)))) {
                return 'frontend';
            }
            if (depsKeys.some(d => backendFrameworks.some(f => d.includes(f)))) {
                return 'backend';
            }
        }
        // Check for Python backend
        const pythonFiles = ['requirements.txt', 'pyproject.toml', 'manage.py'];
        for (const file of pythonFiles) {
            if (await FileUtils.exists(PathUtils.join(targetDir, file))) {
                return 'backend';
            }
        }
        // Check for Go backend
        if (await FileUtils.exists(PathUtils.join(targetDir, 'go.mod'))) {
            return 'backend';
        }
        // Check for Java backend
        const javaFiles = ['pom.xml', 'build.gradle'];
        for (const file of javaFiles) {
            if (await FileUtils.exists(PathUtils.join(targetDir, file))) {
                return 'backend';
            }
        }
        // Check for Ruby backend
        if (await FileUtils.exists(PathUtils.join(targetDir, 'Gemfile'))) {
            return 'backend';
        }
        return 'unknown';
    }
    /**
     * Extract technology stack from directory
     */
    async extractTechStack(dir) {
        const targetDir = dir || this.projectRoot;
        const stack = {};
        const packageJsonPath = PathUtils.join(targetDir, 'package.json');
        if (await FileUtils.exists(packageJsonPath)) {
            const packageJson = await FileUtils.readJSON(packageJsonPath);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            // Detect language
            if (await FileUtils.exists(PathUtils.join(targetDir, 'tsconfig.json'))) {
                stack.language = 'TypeScript';
            }
            else {
                stack.language = 'JavaScript';
            }
            // Detect frameworks
            const frameworkPatterns = ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'express', 'fastify', 'nestjs'];
            const frameworks = Object.keys(deps).filter(d => frameworkPatterns.some(f => d.includes(f)));
            stack.frameworks = frameworks;
            // Detect build tool
            const buildTools = [
                { file: 'vite.config.js', name: 'Vite' },
                { file: 'vite.config.ts', name: 'Vite' },
                { file: 'webpack.config.js', name: 'Webpack' },
                { file: 'next.config.js', name: 'Next.js' }
            ];
            for (const tool of buildTools) {
                if (await FileUtils.exists(PathUtils.join(targetDir, tool.file))) {
                    stack.buildTool = tool.name;
                    break;
                }
            }
        }
        return stack;
    }
    /**
     * Extract API endpoints from codebase
     */
    async extractApiEndpoints(_dir) {
        const endpoints = [];
        // For now, return empty - would need parsing logic for different frameworks
        return endpoints;
    }
    /**
     * Find entry points in the project
     */
    async findEntryPoints(dir) {
        const targetDir = dir || this.projectRoot;
        const entryPoints = [];
        const commonEntryPoints = [
            'src/index.ts',
            'src/index.js',
            'src/main.ts',
            'src/main.js',
            'src/app.ts',
            'src/app.js',
            'index.ts',
            'index.js',
            'server.ts',
            'server.js',
            'app.ts',
            'app.js'
        ];
        for (const entry of commonEntryPoints) {
            const fullPath = PathUtils.join(targetDir, entry);
            if (await FileUtils.exists(fullPath)) {
                entryPoints.push(entry);
            }
        }
        return entryPoints;
    }
    /**
     * Get project structure summary
     */
    async getProjectStructure(dir) {
        const structure = {};
        const extensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java'];
        for (const ext of extensions) {
            try {
                const files = await FileUtils.glob(`**/*.${ext}`, dir || this.projectRoot);
                structure[ext] = files.length;
            }
            catch {
                structure[ext] = 0;
            }
        }
        return structure;
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const service = new BridgeUtilsService();
    const command = process.argv[2] || 'help';
    (async () => {
        switch (command) {
            case 'detect-type': {
                const type = await service.detectProjectType();
                console.log(JSON.stringify({ type }, null, 2));
                break;
            }
            case 'tech-stack': {
                const stack = await service.extractTechStack();
                console.log(JSON.stringify(stack, null, 2));
                break;
            }
            case 'entry-points': {
                const points = await service.findEntryPoints();
                console.log(JSON.stringify(points, null, 2));
                break;
            }
            case 'structure': {
                const structure = await service.getProjectStructure();
                console.log(JSON.stringify(structure, null, 2));
                break;
            }
            default:
                console.error(`
Usage: bridge-utils.ts <command> [arguments]

Commands:
  detect-type      Detect project type
  tech-stack       Extract technology stack
  entry-points     Find entry points
  structure        Get project structure summary
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=bridge-utils.js.map