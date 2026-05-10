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

export type EdgeType =
  | 'causes'
  | 'caused_by'
  | 'derives_from'
  | 'contradicts'
  | 'edits'
  | 'references'
  | 'calls'
  | 'imports'
  | 'extends'
  | 'implements'
  | 'instantiates'
  | 'similar_to';

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

export class ProvenanceStore {
  constructor(private readonly storage: Storage) {}

  async addEdge(input: AddEdgeInput): Promise<number> {
    return this.storage.addProvenanceEdge({
      ts: input.ts ?? Date.now(),
      fromKind: input.from.kind,
      fromId: input.from.id,
      toKind: input.to.kind,
      toId: input.to.id,
      edgeType: input.edgeType,
      confidence: input.confidence ?? 1.0,
      source: input.source ?? 'siftcoder',
      metaJson: input.meta ? JSON.stringify(input.meta) : null,
    });
  }

  async outgoing(node: NodeRef, edgeType?: EdgeType): Promise<Edge[]> {
    const rows = await this.storage.outgoingProvenance(node.kind, node.id, edgeType);
    return rows.map(rowToEdge);
  }

  async incoming(node: NodeRef, edgeType?: EdgeType): Promise<Edge[]> {
    const rows = await this.storage.incomingProvenance(node.kind, node.id, edgeType);
    return rows.map(rowToEdge);
  }

  /**
   * BFS from `node` following outgoing edges up to `maxDepth`. Returns a flat list of edges in
   * traversal order so the caller can render a causal chain.
   */
  async trace(node: NodeRef, maxDepth = 4): Promise<Edge[]> {
    const seen = new Set<string>([nodeKey(node)]);
    const out: Edge[] = [];
    let frontier: NodeRef[] = [node];
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
      const next: NodeRef[] = [];
      for (const n of frontier) {
        for (const e of await this.outgoing(n)) {
          out.push(e);
          const key = nodeKey(e.to);
          if (!seen.has(key)) {
            seen.add(key);
            next.push(e.to);
          }
        }
      }
      frontier = next;
    }
    return out;
  }

  /**
   * Bidirectional BFS yielding a connected subgraph (deduped node + edge lists) around `node`.
   * Direction `'both'` follows incoming and outgoing edges; `'out'` and `'in'` restrict.
   * Edge cap protects against pathological hubs (file-of-files, etc.) — once we've collected
   * `maxEdges` edges, we stop extending. Returns the seed node even when isolated.
   */
  async subgraph(node: NodeRef, opts: {
    maxDepth?: number;
    direction?: 'out' | 'in' | 'both';
    edgeType?: EdgeType;
    maxEdges?: number;
  } = {}): Promise<{ nodes: NodeRef[]; edges: Edge[] }> {
    const maxDepth = opts.maxDepth ?? 2;
    const direction = opts.direction ?? 'both';
    const maxEdges = opts.maxEdges ?? 200;
    const seen = new Set<string>([nodeKey(node)]);
    const edgeIds = new Set<number>();
    const nodes: NodeRef[] = [node];
    const edges: Edge[] = [];
    let frontier: NodeRef[] = [node];
    for (let depth = 0; depth < maxDepth && frontier.length > 0 && edges.length < maxEdges; depth++) {
      const next: NodeRef[] = [];
      for (const n of frontier) {
        const adjacent: Edge[] = [];
        if (direction !== 'in') adjacent.push(...await this.outgoing(n, opts.edgeType));
        if (direction !== 'out') adjacent.push(...await this.incoming(n, opts.edgeType));
        for (const e of adjacent) {
          if (edges.length >= maxEdges) break;
          if (edgeIds.has(e.id)) continue;
          edgeIds.add(e.id);
          edges.push(e);
          const other = nodeKey(e.from) === nodeKey(n) ? e.to : e.from;
          const key = nodeKey(other);
          if (!seen.has(key)) {
            seen.add(key);
            nodes.push(other);
            next.push(other);
          }
        }
      }
      frontier = next;
    }
    return { nodes, edges };
  }

  /**
   * Shortest path between two nodes using bidirectional BFS over the (treated-as-undirected)
   * provenance graph. Returns the edges in source→target order, or null if no path exists
   * within `maxDepth`. Each step picks the lowest-id matching edge to keep results
   * deterministic.
   *
   * Why undirected: "how is X connected to Y" is rarely about edge direction; the user wants to
   * know if a connection *exists*. Direction is preserved in the returned Edge records so the
   * caller can render arrows correctly.
   */
  async shortestPath(from: NodeRef, to: NodeRef, maxDepth = 6): Promise<Edge[] | null> {
    const fromKey = nodeKey(from);
    const toKey = nodeKey(to);
    if (fromKey === toKey) return [];
    const parent = new Map<string, { prevKey: string; edge: Edge } | null>();
    parent.set(fromKey, null);
    let frontier: NodeRef[] = [from];
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
      const next: NodeRef[] = [];
      for (const n of frontier) {
        const adjacent: Edge[] = [
          ...await this.outgoing(n),
          ...await this.incoming(n),
        ];
        for (const e of adjacent) {
          const otherKey = nodeKey(e.from) === nodeKey(n) ? nodeKey(e.to) : nodeKey(e.from);
          if (parent.has(otherKey)) continue;
          parent.set(otherKey, { prevKey: nodeKey(n), edge: e });
          if (otherKey === toKey) {
            // Walk parent chain from target back to source, then reverse.
            const path: Edge[] = [];
            let cursor = toKey;
            while (cursor !== fromKey) {
              const link = parent.get(cursor)!;
              if (link === null) break;
              path.push(link.edge);
              cursor = link.prevKey;
            }
            return path.reverse();
          }
          const otherNode = nodeKey(e.from) === nodeKey(n) ? e.to : e.from;
          next.push(otherNode);
        }
      }
      frontier = next;
    }
    return null;
  }

  /**
   * Top hub nodes by total degree. `kind` filters to a single node kind ("file", "summary",
   * "symbol", etc.) — useful when you want "most-edited files" rather than mixed-kind hubs.
   */
  async topHubs(limit = 20, kind?: string): Promise<Array<{
    node: NodeRef; degree: number; outDegree: number; inDegree: number;
  }>> {
    const rows = await this.storage.topProvenanceDegree(limit, kind);
    return rows.map(r => ({
      node: { kind: r.kind, id: r.id },
      degree: r.degree,
      outDegree: r.outDegree,
      inDegree: r.inDegree,
    }));
  }
}

function rowToEdge(r: Record<string, unknown>): Edge {
  return {
    id: r['id'] as number,
    ts: r['ts'] as number,
    from: { kind: r['from_kind'] as string, id: r['from_id'] as string },
    to: { kind: r['to_kind'] as string, id: r['to_id'] as string },
    edgeType: r['edge_type'] as EdgeType,
    confidence: r['confidence'] as number,
    source: r['source'] as string,
    meta: r['meta_json'] ? JSON.parse(r['meta_json'] as string) as Record<string, unknown> : null,
  };
}

function nodeKey(n: NodeRef): string {
  return `${n.kind}:${n.id}`;
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

export async function ingestFromCdg(prov: ProvenanceStore, opts: CdgSyncOptions): Promise<{ edges: number; references: number }> {
  const headers: Record<string, string> = {};
  if (opts.token) headers['authorization'] = `Bearer ${opts.token}`;
  /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
  const fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init) as unknown as ReturnType<FetchLike>);
  const url = opts.baseUrl.replace(/\/+$/, '') + (opts.endpoint ?? '/v1/dependencies');
  let edges = 0;
  let references = 0;
  try {
    const res = await fetchImpl(url, { method: 'GET', headers });
    if (!res.ok) return { edges, references };
    const body = await res.json() as { edges?: unknown; references?: unknown };
    if (Array.isArray(body.edges)) {
      for (const raw of body.edges) {
        if (!raw || typeof raw !== 'object') continue;
        const r = raw as { from_path?: unknown; to_path?: unknown; edge_type?: unknown; confidence?: unknown };
        if (typeof r.from_path !== 'string' || typeof r.to_path !== 'string') continue;
        const edgeType = mapEdgeType(typeof r.edge_type === 'string' ? r.edge_type : 'imports');
        await prov.addEdge({
          from: { kind: 'file', id: r.from_path },
          to: { kind: 'file', id: r.to_path },
          edgeType,
          confidence: clamp01(Number(r.confidence)),
          source: 'cdg',
        });
        edges++;
      }
    }
    if (Array.isArray(body.references)) {
      for (const raw of body.references) {
        if (!raw || typeof raw !== 'object') continue;
        const r = raw as { from_symbol?: unknown; to_symbol?: unknown; ref_type?: unknown; confidence?: unknown };
        if (typeof r.from_symbol !== 'string' || typeof r.to_symbol !== 'string') continue;
        const edgeType = mapEdgeType(typeof r.ref_type === 'string' ? r.ref_type : 'references');
        await prov.addEdge({
          from: { kind: 'symbol', id: r.from_symbol },
          to: { kind: 'symbol', id: r.to_symbol },
          edgeType,
          confidence: clamp01(Number(r.confidence)),
          source: 'cdg',
        });
        references++;
      }
    }
  } catch {
    /* swallow */
  }
  return { edges, references };
}

function mapEdgeType(raw: string): EdgeType {
  const t = raw.toLowerCase();
  const valid: ReadonlyArray<EdgeType> = [
    'causes', 'caused_by', 'derives_from', 'contradicts', 'edits',
    'references', 'calls', 'imports', 'extends', 'implements', 'instantiates', 'similar_to',
  ];
  return (valid as ReadonlyArray<string>).includes(t) ? (t as EdgeType) : 'references';
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 1.0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}