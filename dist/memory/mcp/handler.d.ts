/**
 * Pure MCP request handler for SiftCoder memory.
 * Tools: mem_search, mem_timeline, mem_get, mem_drain.
 *
 * Each tool call optionally drains a small batch of pending (un-summarized) events through
 * sampling — the host LLM does the work, no plugin-side API key.
 *
 * stdio plumbing lives in server.ts; this file exposes a pure async dispatch function for unit tests.
 */
import type { MemoryClient } from '../client.js';
import type { Summarizer } from '../daemon/summarizer.js';
import type { Storage } from '../storage/storage.js';
import type { Embedder } from '../embedder.js';
import type { ProvenanceStore } from '../provenance.js';
export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: number | string;
    method: string;
    params?: unknown;
}
export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id?: number | string;
    result?: unknown;
    error?: {
        code: number;
        message: string;
    };
}
export interface HandlerDeps {
    client: MemoryClient;
    storage?: Storage | null;
    summarizer?: Summarizer | null;
    embedder?: Embedder | null;
    provenance?: ProvenanceStore | null;
    drainBatch?: number;
}
export declare const TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
            };
            k: {
                type: string;
                default: number;
            };
            near_id?: undefined;
            window?: undefined;
            ids?: undefined;
            batch?: undefined;
            kind?: undefined;
            id?: undefined;
            depth?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            near_id: {
                type: string;
            };
            window: {
                type: string;
                default: number;
            };
            query?: undefined;
            k?: undefined;
            ids?: undefined;
            batch?: undefined;
            kind?: undefined;
            id?: undefined;
            depth?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            ids: {
                type: string;
                items: {
                    type: string;
                };
            };
            query?: undefined;
            k?: undefined;
            near_id?: undefined;
            window?: undefined;
            batch?: undefined;
            kind?: undefined;
            id?: undefined;
            depth?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            batch: {
                type: string;
                default: number;
            };
            query?: undefined;
            k?: undefined;
            near_id?: undefined;
            window?: undefined;
            ids?: undefined;
            kind?: undefined;
            id?: undefined;
            depth?: undefined;
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            kind: {
                type: string;
            };
            id: {
                type: string;
            };
            depth: {
                type: string;
                default: number;
            };
            query?: undefined;
            k?: undefined;
            near_id?: undefined;
            window?: undefined;
            ids?: undefined;
            batch?: undefined;
        };
        required: string[];
    };
})[];
export interface DrainResult {
    processed: number;
    errors: number;
    pending: number;
}
export declare function drain(deps: HandlerDeps, batch: number): Promise<DrainResult>;
export declare function dispatch(req: JsonRpcRequest, deps: HandlerDeps): Promise<JsonRpcResponse>;
//# sourceMappingURL=handler.d.ts.map