/**
 * Workspace identity + path resolution.
 * Workspace key = first 12 hex of SHA-256 over the realpath of the git toplevel (or cwd if not a repo).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
export function gitToplevel(cwd) {
    try {
        const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        /* c8 ignore next -- empty git output is defensive; in practice rev-parse either succeeds or throws */
        return out.toString('utf8').trim() || null;
    }
    catch {
        return null;
    }
}
export function workspaceKey(cwd) {
    const top = gitToplevel(cwd) ?? cwd;
    let real;
    try {
        real = realpathSync(top);
    }
    catch {
        real = resolve(top);
    }
    return createHash('sha256').update(real).digest('hex').slice(0, 12);
}
export function workspacePaths(cwd, home = homedir()) {
    const key = workspaceKey(cwd);
    const root = join(home, '.siftcoder', 'workspaces', key);
    const runDir = join(home, '.siftcoder', 'run');
    const logDir = join(home, '.siftcoder', 'logs');
    return {
        key,
        root,
        db: join(root, 'db.sqlite'),
        wal: join(root, 'wal.ndjson'),
        pid: join(root, 'run.pid'),
        socket: join(runDir, `${key}.sock`),
        log: join(logDir, `${key}.ndjson`),
    };
}
export function ensureWorkspaceDirs(paths) {
    mkdirSync(paths.root, { recursive: true });
    mkdirSync(join(paths.socket, '..'), { recursive: true });
    mkdirSync(join(paths.log, '..'), { recursive: true });
}
//# sourceMappingURL=workspace.js.map