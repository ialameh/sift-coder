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

interface DBHandleProvenance {
  prepare(sql: string): {
    run(...p: unknown[]): { lastInsertRowid: number | bigint };
    get(...p: unknown[]): unknown;
    all(...p: unknown[]): unknown[];
  };
}

export class ProvenanceStore {
  constructor(private readonly storage: Storage) {}

  private get db(): DBHandleProvenance {
    return (this.storage as unknown as { ['db']: DBHandleProvenance })['db'];
  }

  addEdge(input: AddEdgeInput): number {
    const ts = input.ts ?? Date.now();
    const conf = input.confidence ?? 1.0;
    const source = input.source ?? 'siftcoder';
    const meta = input.meta ? JSON.stringify(input.meta) : null;
    const result = this.db.prepare(
      `INSERT INTO provenance_edges (ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(ts, input.from.kind, input.from.id, input.to.kind, input.to.id, input.edgeType, conf, source, meta);
    return Number(result.lastInsertRowid);
  }

  outgoing(node: NodeRef, edgeType?: EdgeType): Edge[] {
    const sql = edgeType
      ? `SELECT * FROM provenance_edges WHERE from_kind = ? AND from_id = ? AND edge_type = ? ORDER BY ts DESC`
      : `SELECT * FROM provenance_edges WHERE from_kind = ? AND from_id = ? ORDER BY ts DESC`;
    const rows = edgeType
      ? this.db.prepare(sql).all(node.kind, node.id, edgeType) as Array<Record<string, unknown>>
      : this.db.prepare(sql).all(node.kind, node.id) as Array<Record<string, unknown>>;
    return rows.map(rowToEdge);
  }

  incoming(node: NodeRef, edgeType?: EdgeType): Edge[] {
    const sql = edgeType
      ? `SELECT * FROM provenance_edges WHERE to_kind = ? AND to_id = ? AND edge_type = ? ORDER BY ts DESC`
      : `SELECT * FROM provenance_edges WHERE to_kind = ? AND to_id = ? ORDER BY ts DESC`;
    const rows = edgeType
      ? this.db.prepare(sql).all(node.kind, node.id, edgeType) as Array<Record<string, unknown>>
      : this.db.prepare(sql).all(node.kind, node.id) as Array<Record<string, unknown>>;
    return rows.map(rowToEdge);
  }

  /**
   * BFS from `node` following outgoing edges up to `maxDepth`. Returns a flat list of edges in
   * traversal order so the caller can render a causal chain.
   */
  trace(node: NodeRef, maxDepth = 4): Edge[] {
    const seen = new Set<string>([nodeKey(node)]);
    const out: Edge[] = [];
    let frontier: NodeRef[] = [node];
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
      const next: NodeRef[] = [];
      for (const n of frontier) {
        for (const e of this.outgoing(n)) {
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
        prov.addEdge({
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
        prov.addEdge({
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
