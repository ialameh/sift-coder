/**
 * Provenance graph layer.
 *
 * Typed, confidence-scored edges between memory nodes. Replaces the flat `supersedes` table with
 * a richer relation set (causes, derives_from, contradicts, edits, references, calls, imports).
 * Supports BFS traversal so the agent can answer "why is this in context?" with a real causal
 * chain rather than a flat search hit.
 *
 * Node identity is `(kind, id)` so multiple node types can coexist in the same graph:
 *   summary:42, event:17, file:/repo/auth.ts, decision:choose-jwt, symbol:fn:authenticateUser
 *
 * Optional CDG sync ingests `DependencyEdge` and `SymbolReference` records as `imports`/`calls`
 * edges with `source = 'cdg'` and `confidence` derived from CDG's own scoring.
 */
import type { Storage } from './storage/storage.js';
import type { FetchLike } from './cdg-adapter.js';
export type EdgeType = 'causes' | 'caused_by' | 'derives_from' | 'contradicts' | 'edits' | 'references' | 'calls' | 'imports' | 'extends' | 'implements' | 'instantiates' | 'similar_to';
export interface NodeRef {
    kind: string;
    id: string;
}
export interface Edge {
    id: number;
    ts: number;
    from: NodeRef;
    to: NodeRef;
    edgeType: EdgeType;
    confidence: number;
    source: string;
    meta: Record<string, unknown> | null;
}
export interface AddEdgeInput {
    from: NodeRef;
    to: NodeRef;
    edgeType: EdgeType;
    confidence?: number;
    source?: string;
    meta?: Record<string, unknown>;
    ts?: number;
}
export declare class ProvenanceStore {
    private readonly storage;
    constructor(storage: Storage);
    private get db();
    addEdge(input: AddEdgeInput): number;
    outgoing(node: NodeRef, edgeType?: EdgeType): Edge[];
    incoming(node: NodeRef, edgeType?: EdgeType): Edge[];
    /**
     * BFS from `node` following outgoing edges up to `maxDepth`. Returns a flat list of edges in
     * traversal order so the caller can render a causal chain.
     */
    trace(node: NodeRef, maxDepth?: number): Edge[];
}
/**
 * Pulls dependency edges and symbol references from CDG and writes them as provenance edges.
 * Wire shape (POST {baseUrl}/v1/dependencies):
 *   { edges: [{ from_path, to_path, edge_type, confidence }] }
 *   { references: [{ from_symbol, to_symbol, ref_type, confidence }] }
 */
export interface CdgSyncOptions {
    baseUrl: string;
    token?: string;
    endpoint?: string;
    fetchImpl?: FetchLike;
}
export declare function ingestFromCdg(prov: ProvenanceStore, opts: CdgSyncOptions): Promise<{
    edges: number;
    references: number;
}>;
//# sourceMappingURL=provenance.d.ts.map