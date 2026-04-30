/**
 * Pure web router for the SiftCoder Memory HTTP bridge.
 *
 * No Node HTTP types in the public surface — takes a `WebRequest` shape and returns a
 * `WebResponse`. The HTTP bridge in daemon/http-bridge.ts adapts node:http to this. Keeps the
 * router 100% testable without spinning up a server.
 *
 * Routes:
 *   POST /                  legacy RPC: forwards to dispatch handler (for memory client compat)
 *   GET  /api/health        backend + key + counts
 *   GET  /api/savings       full savings report
 *   GET  /api/events?limit  recent events tail
 *   GET  /api/summaries?limit  recent summaries tail
 *   POST /api/search        { query, k }
 *   POST /api/timeline      { nearId, window }
 *   POST /api/get           { ids: number[] }
 *   POST /api/why           { kind, id, depth }
 *   POST /api/ab            { turns, k }
 *   GET  /                  index.html (web client SPA)
 *   GET  /app.js, /style.css static assets
 *
 * Auth: every /api route requires a Bearer token. Static assets (/, /app.js, /style.css) are
 * also gated so a browser opened with `?token=...` can pass the token through fetch headers.
 */
import type { Storage } from '../storage/storage.js';
import type { Embedder } from '../embedder.js';
import type { ProvenanceStore } from '../provenance.js';
import type { Request, Response } from '../protocol.js';
export interface WebRequest {
    method: string;
    path: string;
    query: Record<string, string>;
    authorization: string | undefined;
    body: string;
}
export interface WebResponse {
    status: number;
    headers: Record<string, string>;
    body: string | Buffer;
}
export interface WebDeps {
    storage: Storage;
    embedder: Embedder | null;
    provenance: ProvenanceStore | null;
    authToken: string;
    /** Optional handler for legacy `POST /` RPC endpoint. */
    rpc?: (req: Request) => Promise<Response>;
    /** Static asset reader; receives a logical path like 'index.html' and returns body or null. */
    staticAsset?: (name: string) => {
        body: Buffer;
        type: string;
    } | null;
    backend: 'native' | 'wasm';
    workspaceKey: string;
}
export declare function route(req: WebRequest, deps: WebDeps): Promise<WebResponse>;
//# sourceMappingURL=router.d.ts.map