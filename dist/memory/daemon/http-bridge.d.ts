/**
 * Optional HTTP bridge to the same daemon handler. Activated when SIFTCODER_HTTP=1 in the env.
 * Listens on 127.0.0.1:<port> (port written to ~/.siftcoder/workspaces/<key>/http.port). Accepts
 * POST / with bearer token auth (token at ~/.siftcoder/auth.token, generated on first start).
 *
 * Same Request/Response protocol as the UDS path. Enables browser extensions, IDE plugins, and
 * cross-process ingestion (Linear webhooks, git hooks, CI/CD) to write into memory.
 *
 * Excluded from coverage: integration plumbing (real HTTP). Pure logic in handler is unit-tested.
 */
import { Server } from 'node:http';
import type { Request, Response } from '../protocol.js';
export interface HttpBridgeDeps {
    workspaceRoot: string;
    handler: (req: Request) => Promise<Response>;
    port?: number;
}
export declare function ensureAuthToken(): string;
export declare function startHttpBridge(deps: HttpBridgeDeps): Server;
//# sourceMappingURL=http-bridge.d.ts.map