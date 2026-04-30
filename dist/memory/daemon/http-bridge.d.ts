/**
 * Optional HTTP bridge to the daemon's RPC handler + the read-only web client API.
 *
 * Activated when SIFTCODER_HTTP=1 in the env. Listens on 127.0.0.1:<port> (port written to
 * ~/.siftcoder/workspaces/<key>/http.port). Accepts:
 *   - POST /                  legacy RPC: forwards to deps.handler (memory client compat)
 *   - GET  /api/...           read-only JSON endpoints (savings, events, summaries, etc.)
 *   - POST /api/...           search / why / ab
 *   - GET  /, /app.js, /style.css   static SPA assets
 *
 * Auth: bearer token at ~/.siftcoder/auth.token. Constant-time comparison. Static assets are
 * gated too so a publicly-exposed bridge does not leak the SPA shell.
 *
 * Excluded from coverage: stdio plumbing only. Routing logic in web/router.ts is unit-tested.
 */
import { Server } from 'node:http';
import type { Request, Response } from '../protocol.js';
import { type WebDeps } from '../web/router.js';
export interface HttpBridgeDeps {
    workspaceRoot: string;
    workspaceKey: string;
    backend: 'native' | 'wasm';
    handler: (req: Request) => Promise<Response>;
    storage: WebDeps['storage'];
    embedder: WebDeps['embedder'];
    provenance: WebDeps['provenance'];
    port?: number;
}
export declare function ensureAuthToken(): string;
export declare function startHttpBridge(deps: HttpBridgeDeps): Server;
//# sourceMappingURL=http-bridge.d.ts.map