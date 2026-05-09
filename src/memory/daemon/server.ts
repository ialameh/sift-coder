/**
 * UDS-based RPC server for SiftCoder memory.
 * Each connection: framed Request -> framed Response. Stateless per-connection.
 */
import { createServer, Server, Socket } from 'node:net';
import { unlinkSync, existsSync } from 'node:fs';
import { encodeFrame, FrameDecoder, Request, Response } from '../protocol.js';
import { Storage, hashInput } from '../storage/storage.js';
import { redact } from '../privacy.js';
import { WAL } from './wal.js';
import type { Embedder } from '../embedder.js';
import { hybridSearch } from '../retrieval.js';
import { RegexSymbolExtractor, looksLikeCodePath, type SymbolExtractor, type AsyncSymbolExtractor } from '../symbols.js';
import { approximate } from '../tokens.js';
import { listTranscripts, readTranscript, parseTranscript } from '../replay.js';
import type { Summarizer } from './summarizer.js';
import type { ProvenanceStore } from '../provenance.js';

export interface ServerDeps {
  storage: Storage;
  wal: WAL;
  socketPath: string;
  cwd: string;
  embedder?: Embedder | null;
  symbols?: SymbolExtractor | null;
  asyncSymbols?: AsyncSymbolExtractor | null;
  onShutdown?: () => void;
  summarizer?: Summarizer | null;
  drainBatch?: number;
  drainBackend?: string;
  provenance?: ProvenanceStore | null;
}

const defaultExtractor = new RegexSymbolExtractor();

export interface DrainResult {
  processed: number;
  errors: number;
  pending: number;
  backend: string;
  firstError?: string;
}

/**
 * Returns true if the error is transient and the event should go back into the queue
 * for a later retry rather than being permanently skipped.
 */
export function isRetryableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('rate-limit') ||
    m.includes('429') ||
    m.includes('502') ||
    m.includes('503') ||
    m.includes('504') ||
    m.includes('timeout') ||
    m.includes('etimedout') ||
    m.includes('econnreset') ||
    m.includes('econnrefused') ||
    m.includes('enotfound') ||
    m.includes('socket hang up') ||
    m.includes('overloaded')
  );
}

async function runDrain(
  storage: Storage,
  summarizer: Summarizer,
  embedder: Embedder | null | undefined,
  batch: number,
  backend: string,
): Promise<DrainResult> {
  const events = await storage.claimPending(batch);
  let processed = 0;
  let errors = 0;
  let firstError: string | undefined;
  for (const ev of events) {
    try {
      const r = await summarizer.summarize(ev.id, ev.inputHash, ev.payloadJson, Date.now());
      if (embedder && r.id > 0) {
        const v = await embedder.embed(r.text);
        await storage.putEmbedding(r.id, v);
      }
      await storage.markEventStatus(ev.id, 'summarized');
      processed++;
    } catch (e) {
      const msg = (e as Error).message;
      if (isRetryableError(msg)) {
        await storage.releaseClaimed(ev.id, msg);
      } else {
        await storage.markEventStatus(ev.id, 'skipped');
      }
      errors++;
      if (firstError === undefined) firstError = msg;
    }
  }
  const pending = (await storage.pendingEvents(1)).length;
  return firstError
    ? { processed, errors, pending, backend, firstError }
    : { processed, errors, pending, backend };
}

interface CodePayload {
  payload: Record<string, unknown>;
  path: string;
  code: string;
}

function extractCodePayload(payload: unknown): CodePayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const input = p['tool_input'] as Record<string, unknown> | null | undefined;
  if (!input) return null;
  const path = (input['file_path'] ?? input['path'] ?? input['notebook_path']) as string | undefined;
  if (!looksLikeCodePath(path)) return null;
  const code = (input['content'] ?? input['new_string'] ?? input['file_text']) as string | undefined;
  if (typeof code !== 'string' || code.length === 0) return null;
  return { payload: p, path: path!, code };
}

function annotateSymbols(payload: unknown, extractor: SymbolExtractor): unknown {
  const code = extractCodePayload(payload);
  if (!code) return payload;
  const hits = extractor.extract(code.code);
  if (hits.length === 0) return payload;
  return { ...code.payload, symbols: hits.map(h => `${h.kind}:${h.name}`) };
}

async function annotateSymbolsAsync(payload: unknown, extractor: AsyncSymbolExtractor): Promise<unknown> {
  const code = extractCodePayload(payload);
  if (!code) return payload;
  const hits = await extractor.extract(code.code, { path: code.path });
  if (hits.length === 0) return payload;
  return { ...code.payload, symbols: hits.map(h => `${h.kind}:${h.name}`) };
}

export type Handler = (req: Request) => Promise<Response>;

export function buildHandler(deps: Pick<ServerDeps, 'storage' | 'wal' | 'cwd' | 'embedder' | 'symbols' | 'asyncSymbols' | 'onShutdown' | 'summarizer' | 'drainBatch' | 'drainBackend' | 'provenance'>): Handler {
  return async (req: Request): Promise<Response> => {
    try {
      switch (req.kind) {
        case 'ping':
          return { ok: true, data: { pong: true } };

        case 'status':
          return { ok: true, data: { cwd: deps.cwd, counts: await deps.storage.counts() } };

        case 'capture': {
          const ts = req.ts ?? Date.now();
          let annotated: unknown;
          if (deps.asyncSymbols) {
            annotated = await annotateSymbolsAsync(req.payload, deps.asyncSymbols);
          } else {
            const extractor = deps.symbols === null ? null : (deps.symbols ?? defaultExtractor);
            annotated = extractor ? annotateSymbols(req.payload, extractor) : req.payload;
          }
          const { value: redactedPayload } = redact(annotated);
          const source = req.source ?? 'claude-code';
          const stamped =
            redactedPayload && typeof redactedPayload === 'object' && !Array.isArray(redactedPayload)
              ? { ...(redactedPayload as Record<string, unknown>), _source: source }
              : { value: redactedPayload, _source: source };
          await deps.storage.ensureSession(req.sessionId, deps.cwd, ts);
          const inputHash = hashInput(stamped);
          deps.wal.append({
            ts,
            sessionId: req.sessionId,
            tool: req.tool,
            inputHash,
            payload: stamped,
          });
          const tokensEst = approximate(JSON.stringify(stamped));
          const id = await deps.storage.recordEvent({
            ts,
            sessionId: req.sessionId,
            tool: req.tool,
            payload: stamped,
            tokensEst,
            ttlMs: req.ttlMs,
          });
          return { ok: true, data: { id, tokensEst } };
        }

        case 'search': {
          const k = req.k ?? 5;
          const embedder = deps.embedder ?? null;
          const hits = await hybridSearch(deps.storage, embedder, req.query, Date.now(), { k });
          return { ok: true, data: { hits } };
        }

        case 'timeline': {
          const rows = await deps.storage.timeline(req.nearId, req.window ?? 10);
          return { ok: true, data: { rows } };
        }

        case 'get': {
          const rows = await deps.storage.getSummariesByIds(req.ids);
          return { ok: true, data: { rows } };
        }

        case 'drain': {
          if (!deps.summarizer) {
            return { ok: false, error: 'no summarizer configured — set GEMINI_API_KEY, ANTHROPIC_API_KEY, or start Ollama' };
          }
          const batch = req.batch ?? deps.drainBatch ?? 16;
          const r = await runDrain(deps.storage, deps.summarizer, deps.embedder, batch, deps.drainBackend ?? 'unknown');
          return { ok: true, data: r };
        }

        case 'claim_for_summary': {
          const events = await deps.storage.claimPending(req.batch ?? 1);
          return {
            ok: true,
            data: {
              events: events.map(e => ({
                id: e.id,
                ts: e.ts,
                sessionId: e.sessionId,
                tool: e.tool,
                inputHash: e.inputHash,
                payloadJson: e.payloadJson,
                tokensEst: e.tokensEst,
              })),
            },
          };
        }

        case 'record_summary': {
          const id = await deps.storage.recordSummary({
            eventId: req.eventId,
            ts: req.ts ?? Date.now(),
            model: req.model,
            promptHash: req.promptHash,
            text: req.text,
            tokensIn: req.tokensIn,
            tokensOut: req.tokensOut,
            confidence: req.confidence,
          });
          if (req.embedding && id > 0 && deps.embedder) {
            const arr = new Float32Array(req.embedding);
            if (arr.length === deps.embedder.dim) {
              await deps.storage.putEmbedding(id, arr);
            }
          } else if (id > 0 && deps.embedder) {
            // Compute server-side if MCP didn't provide one.
            const v = await deps.embedder.embed(req.text);
            await deps.storage.putEmbedding(id, v);
          }
          await deps.storage.markEventStatus(req.eventId, 'summarized');
          return { ok: true, data: { id } };
        }

        case 'release_summary': {
          if (req.terminal) {
            await deps.storage.markEventStatus(req.eventId, 'skipped');
            return { ok: true, data: { status: 'skipped' } };
          }
          const status = await deps.storage.releaseClaimed(req.eventId, req.error);
          return { ok: true, data: { status } };
        }

        case 'cache_get': {
          const cached = await deps.storage.getCachedSummary(req.cacheKey);
          return { ok: true, data: { cached } };
        }

        case 'cache_put': {
          await deps.storage.putCachedSummary(
            req.cacheKey,
            req.text,
            req.tokensIn,
            req.tokensOut,
            req.ts ?? Date.now(),
          );
          return { ok: true, data: { ok: true } };
        }

        case 'prune': {
          const r = await deps.storage.prune({
            maxAgeMs: req.maxAgeMs,
            superseded: req.superseded,
          });
          return { ok: true, data: r };
        }

        case 'retry_skipped': {
          const requeued = await deps.storage.retrySkipped(req.limit);
          return { ok: true, data: { requeued } };
        }

        case 'pin': {
          const ok = await deps.storage.pin(req.summaryId);
          return { ok: true, data: { pinned: ok, summaryId: req.summaryId } };
        }

        case 'unpin': {
          await deps.storage.unpin(req.summaryId);
          return { ok: true, data: { pinned: false, summaryId: req.summaryId } };
        }

        case 'pinned': {
          const rows = await deps.storage.listPinned(req.limit ?? 100);
          const pinned = rows.map(r => ({
            id: r.id,
            eventId: r.eventId,
            ts: new Date(r.ts).toISOString(),
            model: r.model,
            text: r.text.length > 240 ? r.text.slice(0, 240) + '...' : r.text,
            confidence: r.confidence,
          }));
          return { ok: true, data: { pinned } };
        }

        case 'doctor': {
          const r = await deps.storage.doctor();
          if (req.heal && r.vecCardinality.drift > 0) {
            const copied = await deps.storage.backfillVec();
            return { ok: true, data: { ...r, healed: { vecBackfilled: copied } } };
          }
          return { ok: true, data: r };
        }

        case 'sweep_expired': {
          const removed = await deps.storage.sweepExpired(req.now);
          return { ok: true, data: { removed } };
        }

        case 'export': {
          const all: string[] = [];
          for await (const r of deps.storage.exportRows()) {
            all.push(JSON.stringify(r));
          }
          return { ok: true, data: { ndjson: all.join('\n'), records: all.length } };
        }

        case 'import': {
          let inserted = 0;
          let skipped = 0;
          let errors = 0;
          for (const line of req.ndjson.split('\n')) {
            if (!line.trim()) continue;
            try {
              const { table, row } = JSON.parse(line) as { table: string; row: Record<string, unknown> };
              const r = await deps.storage.importRow(table, row);
              if (r === 'inserted') inserted++; else skipped++;
            } catch { errors++; }
          }
          return { ok: true, data: { inserted, skipped, errors } };
        }

        case 'summaries': {
          const limit = req.limit ?? 20;
          const rows = await deps.storage.recentSummaries(limit);
          const summaries = rows.map(r => ({
            id: r.id,
            eventId: r.eventId,
            ts: new Date(r.ts).toISOString(),
            model: r.model,
            text: r.text.length > 240 ? r.text.slice(0, 240) + '...' : r.text,
            confidence: r.confidence,
          }));
          return { ok: true, data: { summaries } };
        }

        case 'why': {
          if (!deps.provenance) return { ok: true, data: { edges: [] } };
          const edges = deps.provenance.trace({ kind: req.nodeKind, id: req.nodeId }, req.depth ?? 4);
          return { ok: true, data: { edges } };
        }

        case 'shutdown': {
          if (deps.onShutdown) deps.onShutdown();
          return { ok: true, data: { stopping: true } };
        }

        case 'backfill': {
          const source = req.source ?? 'transcripts';
          if (source !== 'transcripts') {
            return { ok: false, error: `unsupported backfill source: ${source}` };
          }
          const workspaceOnly = req.workspaceOnly ?? true;
          const transcripts = listTranscripts({
            cwd: workspaceOnly ? deps.cwd : undefined,
            limit: req.limit,
          });
          let scanned = 0;
          let captured = 0;
          let skippedDuplicate = 0;
          let errors = 0;
          let firstError: string | undefined;
          for (const t of transcripts) {
            scanned++;
            let jsonl: string;
            try {
              jsonl = readTranscript(t.path);
            } catch (e) {
              errors++;
              firstError ??= e instanceof Error ? e.message : String(e);
              continue;
            }
            const frames = parseTranscript(jsonl, t.sessionId, { limit: req.perTranscriptLimit });
            for (const f of frames) {
              try {
                let annotated: unknown;
                if (deps.asyncSymbols) {
                  annotated = await annotateSymbolsAsync(f.payload, deps.asyncSymbols);
                } else {
                  const extractor = deps.symbols === null ? null : (deps.symbols ?? defaultExtractor);
                  annotated = extractor ? annotateSymbols(f.payload, extractor) : f.payload;
                }
                const { value: redactedPayload } = redact(annotated);
                const stamped =
                  redactedPayload && typeof redactedPayload === 'object' && !Array.isArray(redactedPayload)
                    ? { ...(redactedPayload as Record<string, unknown>), _source: f.source }
                    : { value: redactedPayload, _source: f.source };
                await deps.storage.ensureSession(f.sessionId, deps.cwd, f.ts);
                const inputHash = hashInput(stamped);
                if (await deps.storage.hasEvent(f.sessionId, inputHash)) {
                  skippedDuplicate++;
                  continue;
                }
                deps.wal.append({
                  ts: f.ts,
                  sessionId: f.sessionId,
                  tool: f.tool,
                  inputHash,
                  payload: stamped,
                });
                const tokensEst = approximate(JSON.stringify(stamped));
                await deps.storage.recordEvent({
                  ts: f.ts,
                  sessionId: f.sessionId,
                  tool: f.tool,
                  payload: stamped,
                  tokensEst,
                });
                captured++;
              } catch (e) {
                errors++;
                firstError ??= e instanceof Error ? e.message : String(e);
              }
            }
          }
          return {
            ok: true,
            data: { source, scanned, captured, skippedDuplicate, errors, ...(firstError ? { firstError } : {}) },
          };
        }
      }
      return { ok: false, error: `unknown request kind: ${(req as { kind: string }).kind}` };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };
}

/* c8 ignore start */
export function startServer(deps: ServerDeps): Server {
  const handler = buildHandler(deps);
  if (existsSync(deps.socketPath)) {
    try { unlinkSync(deps.socketPath); } catch { /* ignore */ }
  }
  // allowHalfOpen: true — prevents Node from auto-closing the write side when the client
  // sends EOF (c.end()). Without this, async handlers (e.g. drain calling Gemini) finish
  // after EOF lands and socket.write() is silently dropped.
  const server = createServer({ allowHalfOpen: true }, (socket: Socket) => {
    const decoder = new FrameDecoder();
    let pending = 0;
    let clientEofSeen = false;

    const maybeClose = () => {
      if (clientEofSeen && pending === 0) socket.end();
    };

    socket.on('data', async (chunk: Buffer) => {
      let frames: unknown[];
      try {
        frames = decoder.push(chunk);
      } catch (err) {
        socket.write(encodeFrame({ ok: false, error: (err as Error).message }));
        socket.end();
        return;
      }
      // Process each completed frame as it lands. Don't end the socket here — the request
      // may arrive split across multiple `data` events (large frames split into multiple
      // OS reads), so any single event might yield zero frames. Closing now would drop the
      // remaining bytes and leave the client with a "short response" error. End only after
      // the client signals EOF via `c.end()` AND every frame received so far has been
      // handled.
      for (const frame of frames) {
        pending++;
        try {
          const res = await handler(frame as Request);
          socket.write(encodeFrame(res));
        } finally {
          pending--;
          maybeClose();
        }
      }
    });
    socket.on('end', () => {
      clientEofSeen = true;
      maybeClose();
    });
    socket.on('error', () => { /* client may drop */ });
  });
  server.listen(deps.socketPath);
  return server;
}
/* c8 ignore stop */