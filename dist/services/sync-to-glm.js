/**
 * Sync to GLM Service
 *
 * Syncs siftcoder plugin to GLM's cache.
 * GLM uses a separate plugin cache from Claude Code.
 */
import { execSync } from 'child_process';
import { FileUtils } from '../utils/file-utils.js';
import path from 'path';
export class SyncToGlmService {
    siftcoderSource;
    glmCache;
    constructor(siftcoderSource, glmCache) {
        this.siftcoderSource = siftcoderSource || process.cwd();
        this.glmCache = glmCache || path.join(process.env.HOME || '', '.glm/claude/plugins/cache/local-marketplace/siftcoder/0.1.0');
    }
    /**
     * Sync SiftCoder to GLM cache
     */
    async sync() {
        // Check if GLM cache exists
        try {
            execSync(`test -d "${this.glmCache}"`, { stdio: 'ignore' });
        }
        catch {
            return {
                success: false,
                commandsCount: 0,
                agentsCount: 0,
                error: `GLM cache directory not found: ${this.glmCache}`
            };
        }
        try {
            // Sync commands
            const commandsDir = path.join(this.siftcoderSource, 'commands');
            const glmCommandsDir = path.join(this.glmCache, 'commands');
            const commandsFiles = await FileUtils.glob('*.md', commandsDir);
            for (const file of commandsFiles) {
                const src = path.join(commandsDir, file);
                const dest = path.join(glmCommandsDir, file);
                await FileUtils.copyFile(src, dest);
            }
            // Sync agents
            const agentsDir = path.join(this.siftcoderSource, 'agents');
            const glmAgentsDir = path.join(this.glmCache, 'agents');
            let agentsFiles = [];
            try {
                agentsFiles = await FileUtils.glob('*.md', agentsDir);
                for (const file of agentsFiles) {
                    const src = path.join(agentsDir, file);
                    const dest = path.join(glmAgentsDir, file);
                    await FileUtils.copyFile(src, dest);
                }
            }
            catch {
                // Agents directory might not exist
            }
            // Sync documentation
            try {
                await FileUtils.copyFile(path.join(this.siftcoderSource, 'README.md'), path.join(this.glmCache, 'README.md'));
            }
            catch {
                // README might not exist
            }
            try {
                await FileUtils.copyFile(path.join(this.siftcoderSource, 'REDBOOK.md'), path.join(this.glmCache, 'REDBOOK.md'));
            }
            catch {
                // REDBOOK might not exist
            }
            // Sync skills if they exist
            const skillsDir = path.join(this.siftcoderSource, 'skills');
            const glmSkillsDir = path.join(this.glmCache, 'skills');
            try {
                const skillFiles = await FileUtils.glob('*', path.join(skillsDir, '*'));
                for (const file of skillFiles) {
                    const src = path.join(skillsDir, path.basename(file));
                    const dest = path.join(glmSkillsDir, path.basename(file));
                    await FileUtils.copyFile(src, dest);
                }
            }
            catch {
                // Skills directory might not exist
            }
            return {
                success: true,
                commandsCount: commandsFiles.length,
                agentsCount: agentsFiles.length
            };
        }
        catch (error) {
            return {
                success: false,
                commandsCount: 0,
                agentsCount: 0,
                error: error.message
            };
        }
    }
    /**
     * Print sync report
     */
    async syncAndReport() {
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║     Syncing SiftCoder to GLM Cache     ║');
        console.log('╚════════════════════════════════════════╝\n');
        const result = await this.sync();
        if (!result.success) {
            console.log(`Warning: ${result.error}`);
            console.log('\nMake sure siftcoder is installed in GLM:');
            console.log('  glm');
            console.log('  /plugin install siftcoder@local-marketplace');
            return;
        }
        console.log(`\x1b[32mSyncing commands...\x1b[0m`);
        console.log(`  ✓ ${result.commandsCount} commands synced`);
        console.log(`\x1b[32mSyncing agents...\x1b[0m`);
        console.log(`  ✓ ${result.agentsCount} agents synced`);
        console.log(`\x1b[32mSyncing documentation...\x1b[0m`);
        console.log(`  ✓ Documentation synced`);
        console.log('\n\x1b[32m════════════════════════════════════════\x1b[0m');
        console.log('\x1b[32m  Sync complete!\x1b[0m');
        console.log('\x1b[32m════════════════════════════════════════\x1b[0m\n');
        console.log(`Commands in GLM cache: ${result.commandsCount}\n`);
        console.log('\x1b[33mIMPORTANT: Restart GLM for changes to take effect\x1b[0m');
        console.log('  1. Close current GLM session (Ctrl+C or /exit)');
        console.log('  2. Start fresh: glm\n');
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const service = new SyncToGlmService();
    service.syncAndReport().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=sync-to-glm.js.map