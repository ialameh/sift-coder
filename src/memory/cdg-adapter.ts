/**
 * CDG (ContextDigger) HTTP adapter for SiftCoder Memory.
 *
 * Implements AsyncSymbolExtractor by calling CDG's REST endpoint, which runs real tree-sitter
 * (Python/JS/TS/Apex grammars) plus its own SymbolReference + DependencyEdge index. Falls back to
 * a configured local extractor (regex) on any failure — never blocks the capture path.
 *
 * Activation:
 *   SIFTCODER_CDG_URL=http://127.0.0.1:8080  (or remote)
 *   SIFTCODER_CDG_TOKEN=<api-key>            (optional; included as Bearer when set)
 *
 * Wire shape (POST {url}/v1/symbols):
 *   request:  { path?: string; content: string; language?: string }
 *   response: { symbols: Array<{ kind: string; name: string; line?: number; signature?: string }> }
 *
 * The response mapper is configurable so different CDG versions / future endpoints can be plugged
 * in without rewriting the adapter.
 */
import type { AsyncSymbolExtractor, ExtractOptions, SymbolHit } from './symbols.js';

export interface FetchLike {
  (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }): Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
    text(): Promise<string>;
  }>;
}

export interface CdgAdapterOptions {
  baseUrl: string;
  token?: string;
  endpoint?: string;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  fallback?: AsyncSymbolExtractor | null;
  mapResponse?: (body: unknown) => SymbolHit[];
}

const VALID_KINDS: ReadonlySet<SymbolHit['kind']> = new Set([
  'function', 'class', 'method', 'interface', 'type', 'const',
]);

function defaultMap(body: unknown): SymbolHit[] {
  if (!body || typeof body !== 'object') return [];
  const arr = (body as { symbols?: unknown }).symbols;
  if (!Array.isArray(arr)) return [];
  const out: SymbolHit[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as { kind?: unknown; name?: unknown };
    if (typeof r.name !== 'string' || r.name.length === 0) continue;
    const kindRaw = typeof r.kind === 'string' ? r.kind.toLowerCase() : 'function';
    const kind = VALID_KINDS.has(kindRaw as SymbolHit['kind']) ? (kindRaw as SymbolHit['kind']) : 'function';
    out.push({ kind, name: r.name });
  }
  return out;
}

function languageFor(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
  switch (ext) {
    case '.ts': case '.tsx': return 'typescript';
    case '.js': case '.jsx': case '.mjs': case '.cjs': return 'javascript';
    case '.py': return 'python';
    case '.cls': case '.trigger': return 'apex';
    case '.rs': return 'rust';
    case '.go': return 'go';
    default: return undefined;
  }
}

export class CdgSymbolExtractor implements AsyncSymbolExtractor {
  private readonly cfg: Required<Omit<CdgAdapterOptions, 'token' | 'fallback' | 'fetchImpl' | 'mapResponse'>> & {
    token: string | undefined;
    fallback: AsyncSymbolExtractor | null;
    fetchImpl: FetchLike;
    mapResponse: (body: unknown) => SymbolHit[];
  };

  constructor(opts: CdgAdapterOptions) {
    this.cfg = {
      baseUrl: opts.baseUrl.replace(/\/+$/, ''),
      endpoint: opts.endpoint ?? '/v1/symbols',
      timeoutMs: opts.timeoutMs ?? 1500,
      token: opts.token,
      fallback: opts.fallback ?? null,
      /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
      fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init) as unknown as ReturnType<FetchLike>),
      mapResponse: opts.mapResponse ?? defaultMap,
    };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env, fallback: AsyncSymbolExtractor | null = null): CdgSymbolExtractor | null {
    const url = env['SIFTCODER_CDG_URL'];
    if (!url) return null;
    const token = env['SIFTCODER_CDG_TOKEN'];
    return new CdgSymbolExtractor({ baseUrl: url, token, fallback });
  }

  async extract(code: string, opts: ExtractOptions & { path?: string } = {}): Promise<SymbolHit[]> {
    const max = opts.maxSymbols ?? 32;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.cfg.token) headers['authorization'] = `Bearer ${this.cfg.token}`;
    const body = JSON.stringify({
      path: opts.path,
      content: code,
      language: opts.language ?? languageFor(opts.path),
    });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs);
    try {
      const res = await this.cfg.fetchImpl(this.cfg.baseUrl + this.cfg.endpoint, {
        method: 'POST',
        headers,
        body,
        signal: ctrl.signal,
      });
      if (!res.ok) return await this.fallbackExtract(code, opts);
      const json = await res.json();
      const hits = this.cfg.mapResponse(json);
      return hits.slice(0, max);
    } catch {
      return await this.fallbackExtract(code, opts);
    } finally {
      clearTimeout(timer);
    }
  }

  private async fallbackExtract(code: string, opts: ExtractOptions & { path?: string }): Promise<SymbolHit[]> {
    if (!this.cfg.fallback) return [];
    return this.cfg.fallback.extract(code, opts);
  }
}

/**
 * Wraps a sync SymbolExtractor as an AsyncSymbolExtractor — useful as a fallback for
 * CdgSymbolExtractor without async overhead in the happy path.
 */
export class AsyncFromSync implements AsyncSymbolExtractor {
  constructor(private readonly sync: { extract(code: string, opts?: ExtractOptions): SymbolHit[] }) {}
  async extract(code: string, opts: ExtractOptions = {}): Promise<SymbolHit[]> {
    return this.sync.extract(code, opts);
  }
}
