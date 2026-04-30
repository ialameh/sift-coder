/**
 * Daemon entrypoint. Capture + storage + WAL + retrieval only.
 * No LLM calls here — summarization runs out-of-band through the MCP server,
 * which delegates to the host (Claude Code) via sampling. No API key required.
 *
 * Excluded from coverage: wires concrete I/O (fs, net, sqlite). Pure logic is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { workspacePaths, ensureWorkspaceDirs } from '../workspace.js';
import { Storage } from '../storage/storage.js';
import { WAL } from './wal.js';
import { startServer } from './server.js';
import { Consolidator } from './consolidator.js';
import { DeterministicEmbedder } from '../embedder.js';
import { FileSink, Logger } from '../logger.js';
const IDLE_SHUTDOWN_MS = 30 * 60 * 1000;
async function main() {
    const cwd = process.env.SIFTCODER_WORKSPACE_CWD || process.cwd();
    const paths = workspacePaths(cwd);
    ensureWorkspaceDirs(paths);
    if (existsSync(paths.pid)) {
        try {
            unlinkSync(paths.pid);
        }
        catch { /* ignore */ }
    }
    writeFileSync(paths.pid, String(process.pid));
    let Database;
    try {
        const mod = (await import('better-sqlite3'));
        Database = mod.default;
    }
    catch {
        process.stderr.write('siftcoder-mem: better-sqlite3 not installed; daemon exiting\n');
        process.exit(0);
        return;
    }
    const db = new Database(paths.db);
    const storage = new Storage(db);
    const wal = new WAL(paths.wal);
    wal.open();
    let lastClientTs = Date.now();
    let stopping = false;
    const sink = new FileSink(paths.log);
    const logger = new Logger('siftcoder-mem', sink);
    logger.info('daemon booting', { pid: process.pid, key: paths.key });
    const embedder = new DeterministicEmbedder(384);
    const consolidator = new Consolidator(storage);
    consolidator.start();
    const server = startServer({
        embedder,
        storage,
        wal,
        socketPath: paths.socket,
        cwd,
        onShutdown: () => {
            stopping = true;
        },
    });
    server.on('connection', () => {
        lastClientTs = Date.now();
    });
    const idleTimer = setInterval(() => {
        if (stopping || Date.now() - lastClientTs > IDLE_SHUTDOWN_MS) {
            clearInterval(idleTimer);
            shutdown();
        }
    }, 60_000);
    function shutdown() {
        consolidator.stop();
        logger.info('daemon stopping');
        try {
            server.close();
        }
        catch { /* ignore */ }
        try {
            wal.close();
        }
        catch { /* ignore */ }
        try {
            db.close();
        }
        catch { /* ignore */ }
        try {
            unlinkSync(paths.pid);
        }
        catch { /* ignore */ }
        try {
            unlinkSync(paths.socket);
        }
        catch { /* ignore */ }
        process.exit(0);
    }
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
main().catch(err => {
    process.stderr.write(`siftcoder-mem daemon: ${err?.message ?? err}\n`);
    process.exit(1);
});
/* c8 ignore stop */
//# sourceMappingURL=index.js.map