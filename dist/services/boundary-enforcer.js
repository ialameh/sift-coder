/**
 * Boundary Enforcer Service (Converted from bash)
 * Enforces file modification boundaries
 * Cross-platform (Windows, Mac, Linux)
 */
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';
import { StateManager } from './state-manager.js';
export class BoundaryEnforcer {
    stateManager;
    constructor(projectRoot) {
        this.stateManager = new StateManager(projectRoot);
    }
    /**
     * Check if file can be modified
     */
    async checkFile(filePath) {
        const boundaries = await this.stateManager.loadBoundaries();
        // If no boundaries set, allow everything
        if (!boundaries) {
            return {
                allowed: true,
                reason: 'No boundaries configured',
                boundary_type: 'none'
            };
        }
        // Normalize path for cross-platform matching
        const normalizedPath = PathUtils.toUnix(filePath);
        // Check if protected
        const isProtected = boundaries.protected.some(pattern => FileUtils.match(normalizedPath, pattern));
        if (isProtected) {
            return {
                allowed: false,
                reason: `File is protected by boundary: ${filePath}`,
                boundary_type: 'protected'
            };
        }
        // Check if modifiable
        const isModifiable = boundaries.modifiable.some(pattern => FileUtils.match(normalizedPath, pattern));
        if (isModifiable) {
            return {
                allowed: true,
                reason: 'File is within modifiable boundaries',
                boundary_type: 'modifiable'
            };
        }
        // Not explicitly allowed or protected
        // Default behavior: deny if boundaries are set
        return {
            allowed: false,
            reason: 'File is outside defined boundaries',
            boundary_type: 'none'
        };
    }
    /**
     * Check multiple files
     */
    async checkFiles(filePaths) {
        const results = new Map();
        for (const filePath of filePaths) {
            const result = await this.checkFile(filePath);
            results.set(filePath, result);
        }
        return results;
    }
    /**
     * Set boundaries
     */
    async setBoundaries(boundaries) {
        const fullBoundaries = {
            ...boundaries,
            last_check: new Date().toISOString()
        };
        await this.stateManager.saveBoundaries(fullBoundaries);
    }
    /**
     * Add modifiable pattern
     */
    async addModifiable(pattern) {
        const boundaries = await this.stateManager.loadBoundaries();
        if (!boundaries) {
            await this.setBoundaries({
                modifiable: [pattern],
                protected: [],
                blast_radius_verified: false
            });
            return;
        }
        if (!boundaries.modifiable.includes(pattern)) {
            boundaries.modifiable.push(pattern);
            await this.stateManager.saveBoundaries(boundaries);
        }
    }
    /**
     * Add protected pattern
     */
    async addProtected(pattern) {
        const boundaries = await this.stateManager.loadBoundaries();
        if (!boundaries) {
            await this.setBoundaries({
                modifiable: [],
                protected: [pattern],
                blast_radius_verified: false
            });
            return;
        }
        if (!boundaries.protected.includes(pattern)) {
            boundaries.protected.push(pattern);
            await this.stateManager.saveBoundaries(boundaries);
        }
    }
    /**
     * Clear boundaries
     */
    async clearBoundaries() {
        await this.setBoundaries({
            modifiable: [],
            protected: [],
            blast_radius_verified: false
        });
    }
    /**
     * Get current boundaries
     */
    async getBoundaries() {
        return this.stateManager.loadBoundaries();
    }
    /**
     * Verify blast radius
     */
    async verifyBlastRadius(files) {
        const results = await this.checkFiles(files);
        // Check if all files are allowed
        const allAllowed = Array.from(results.values()).every(result => result.allowed);
        if (allAllowed) {
            const boundaries = await this.stateManager.loadBoundaries();
            if (boundaries) {
                boundaries.blast_radius_verified = true;
                await this.stateManager.saveBoundaries(boundaries);
            }
        }
        return allAllowed;
    }
}
// CLI interface
if (require.main === module) {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    const enforcer = new BoundaryEnforcer();
    (async () => {
        switch (command) {
            case 'check':
                if (!args[0]) {
                    console.error('Usage: boundary-enforcer check <file>');
                    process.exit(1);
                }
                const result = await enforcer.checkFile(args[0]);
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.allowed ? 0 : 1);
                break;
            case 'set':
                if (!args[0]) {
                    console.error('Usage: boundary-enforcer set <boundaries-json>');
                    process.exit(1);
                }
                const boundaries = JSON.parse(args[0]);
                await enforcer.setBoundaries(boundaries);
                console.log('✓ Boundaries set');
                break;
            case 'show':
                const current = await enforcer.getBoundaries();
                console.log(JSON.stringify(current, null, 2));
                break;
            case 'clear':
                await enforcer.clearBoundaries();
                console.log('✓ Boundaries cleared');
                break;
            default:
                console.error(`
Usage: node boundary-enforcer.js <command> [args]

Commands:
  check <file>              Check if file can be modified
  set <boundaries-json>     Set boundaries
  show                      Show current boundaries
  clear                     Clear all boundaries

Examples:
  node boundary-enforcer.js check src/index.ts
  node boundary-enforcer.js set '{"modifiable":["src/**"],"protected":[]}'
  node boundary-enforcer.js show
        `);
                process.exit(1);
        }
    })().catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=boundary-enforcer.js.map