/**
 * CLI surface for SiftCoder memory v2.
 * Used by slash commands (/siftcoder:handoff) to query the per-workspace memory daemon.
 *
 * Subcommands:
 *   search <query> [--k=N]                    Hybrid search; prints JSON {hits: [...]}.
 *   timeline <near-id> [--w=N]                Chronological neighbors.
 *   get <id>[,<id>...]                        Fetch summaries by id.
 *   ping                                      Liveness check; exit 0 if daemon up.
 *   eval [--k=N] [--rerank]                   Self-recall eval over mined golden set.
 *   mine-golden [--max=N]                     Print the mined golden set as JSON.
 *   watch [--limit=N]                         Stream the events table; pretty-printed.
 *   savings [--json]                          Token + context savings report (JSON or pretty).
 *   ab [--turns=N] [--k=K] [--json]           A/B replay: full-history vs memory-backed token cost.
 *   web [--open]                              Print the local web client URL with auth token; --open launches the browser.
 *   replay --session=&lt;id&gt; [--cwd=P]            Replay a Claude Code transcript .jsonl into memory.
 *           [--limit=N] [--dry-run] [--json]   Captures tool_use/tool_result pairs as historical events.
 *   transcripts [--cwd=P] [--limit=N]          List recent CC transcripts; same encoding as --cwd above.
 *   note <text...> [--source=X] [--session=X] Capture a free-text note. Source defaults to "cli".
 *   ingest [--file=P|--stdin] [--tool=X]      Capture a typed event from a file or stdin.
 *                                             [--source=X] [--session=X]
 *
 * Exit codes:
 *   0 success, 1 daemon unreachable, 2 bad args, 3 daemon error.
 */
/* c8 ignore start */
import { workspacePaths } from './workspace.js';
import { MemoryClient } from './client.js';
import type { Request } from './protocol.js';

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] ?? '';
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const a of argv.slice(1)) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) flags[a.slice(2, eq)] = a.slice(eq + 1);
      else flags[a.slice(2)] = 'true';
    } else {
      positional.push(a);
    }
  }
  return { command, positional, flags };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
  const paths = workspacePaths(cwd);
  const client = new MemoryClient({ socketPath: paths.socket, timeoutMs: 3000 });

  let req: Request;
  switch (args.command) {
    case 'ping':
      req = { kind: 'ping' };
      break;
    case 'search': {
      const query = args.positional.join(' ').trim();
      if (!query) { process.stderr.write('search: query required\n'); process.exit(2); }
      req = { kind: 'search', query, k: parseIntFlag(args.flags['k'], 5) };
      break;
    }
    case 'timeline': {
      const nearId = Number(args.positional[0]);
      if (!Number.isFinite(nearId)) { process.stderr.write('timeline: numeric near-id required\n'); process.exit(2); }
      req = { kind: 'timeline', nearId, window: parseIntFlag(args.flags['w'], 10) };
      break;
    }
    case 'get': {
      const ids = (args.positional[0] ?? '').split(',').map(s => Number(s.trim())).filter(Number.isFinite);
      if (ids.length === 0) { process.stderr.write('get: comma-separated ids required\n'); process.exit(2); }
      req = { kind: 'get', ids };
      break;
    }
    case 'eval':
    case 'mine-golden':
    case 'watch':
    case 'savings':
    case 'ab':
      await runLocal(args, paths.db, paths.key, cwd);
      return;
    case 'web':
      await runWeb(args, paths.root);
      return;
    case 'note': {
      const text = args.positional.join(' ').trim();
      if (!text) { process.stderr.write('note: text required\n'); process.exit(2); }
      req = {
        kind: 'capture',
        sessionId: args.flags['session'] ?? 'note',
        tool: 'Note',
        payload: { text },
        source: args.flags['source'] ?? 'cli',
        ts: Date.now(),
      };
      break;
    }
    case 'replay':
    case 'transcripts':
      await runReplay(args, paths.socket);
      return;
    case 'ingest': {
      const filePath = args.flags['file'];
      const useStdin = args.flags['stdin'] === 'true' || !filePath;
      const tool = args.flags['tool'] ?? 'Ingest';
      const source = args.flags['source'] ?? 'cli-ingest';
      const sessionId = args.flags['session'] ?? `ingest-${Date.now()}`;
      const content = await readContent(filePath, useStdin);
      if (!content) { process.stderr.write('ingest: empty input\n'); process.exit(2); }
      req = {
        kind: 'capture',
        sessionId,
        tool,
        payload: {
          content,
          ...(filePath ? { file_path: filePath } : {}),
        },
        source,
        ts: Date.now(),
      };
      break;
    }
    default:
      process.stderr.write(`unknown command: ${args.command}\nusage: siftcoder-mem <ping|search|timeline|get|eval|mine-golden|watch|note|ingest> ...\n`);
      process.exit(2);
      return;
  }

  try {
    const res = await client.send(req);
    process.stdout.write(JSON.stringify(res) + '\n');
    process.exit(res.ok ? 0 : 3);
  } catch (err) {
    process.stderr.write(`siftcoder-mem cli: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

async function runLocal(args: ParsedArgs, dbPath: string, workspaceKey: string, cwd: string): Promise<void> {
  const { Storage } = await import('./storage/storage.js');
  const { DeterministicEmbedder } = await import('./embedder.js');
  const { existsSync } = await import('node:fs');
  if (!existsSync(dbPath)) {
    const json = args.flags['json'] === 'true';
    const msg = {
      ok: false,
      error: 'no-data',
      data: {
        workspaceKey,
        cwd,
        dbPath,
        hint: 'Memory has not captured anything for this workspace yet. Open Claude Code in this directory or run /siftcoder:memory:backfill.',
      },
    };
    if (json) process.stdout.write(JSON.stringify(msg) + '\n');
    else process.stderr.write(`siftcoder-mem cli: no DB for workspace ${workspaceKey} (${cwd}).\n  Hint: ${msg.data.hint}\n`);
    process.exit(json ? 0 : 4);
  }
  let db: ConstructorParameters<typeof Storage>[0];
  try {
    const Database = (await import('better-sqlite3' as string)).default as new (path: string) => unknown;
    db = new Database(dbPath) as ConstructorParameters<typeof Storage>[0];
  } catch {
    const { openWasmDatabase } = await import('./storage/wasm-db.js');
    db = await openWasmDatabase(dbPath) as ConstructorParameters<typeof Storage>[0];
  }
  const storage = new Storage(db);
  const embedder = new DeterministicEmbedder(384);
  const banner = `workspace: ${workspaceKey}  (${cwd})\n`;

  if (args.command === 'mine-golden') {
    const { mineGolden } = await import('./eval-mine.js');
    const items = mineGolden(storage, { maxItems: parseIntFlag(args.flags['max'], 200) });
    process.stdout.write(JSON.stringify({ ok: true, data: { items } }) + '\n');
    process.exit(0);
  }
  if (args.command === 'eval') {
    const { mineGolden } = await import('./eval-mine.js');
    const { evaluate } = await import('./eval.js');
    const golden = await mineGolden(storage);
    const k = parseIntFlag(args.flags['k'], 5);
    const useRerank = args.flags['rerank'] === 'true';
    const report = await evaluate(storage, embedder, golden, k, Date.now(), { decayTauMs: 1e15, rerank: useRerank });
    const summary = { k: report.k, recallAtK: report.recallAtK, mrr: report.mrr, golden: golden.length };
    process.stdout.write(JSON.stringify({ ok: true, data: summary }) + '\n');
    process.exit(0);
  }
  if (args.command === 'watch') {
    const { renderWatchSnapshot } = await import('./tui.js');
    const limit = parseIntFlag(args.flags['limit'], 20);
    process.stdout.write(renderWatchSnapshot(storage, { limit }));
    process.exit(0);
  }
  if (args.command === 'ab') {
    const { AbHarness, renderAb } = await import('./ab.js');
    const turns = parseIntFlag(args.flags['turns'], 100);
    const k = parseIntFlag(args.flags['k'], 5);
    const r = await new AbHarness(storage, embedder).run({ turns, memoryK: k });
    if (args.flags['json'] === 'true') {
      process.stdout.write(JSON.stringify({ ok: true, data: { workspaceKey, cwd, ...r } }) + '\n');
    } else {
      process.stdout.write(banner + renderAb(r));
    }
    process.exit(0);
  }
  if (args.command === 'savings') {
    const { computeSavings, renderSavings } = await import('./metrics.js');
    const report = await computeSavings(storage);
    report.workspace.dbPath = dbPath;
    if (args.flags['json'] === 'true') {
      process.stdout.write(JSON.stringify({ ok: true, data: { workspaceKey, cwd, ...report } }) + '\n');
    } else {
      process.stdout.write(banner + renderSavings(report));
    }
    process.exit(0);
  }
}

function parseIntFlag(v: string | undefined, def: number): number {
  if (v === undefined) return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

async function runReplay(args: ParsedArgs, socketPath: string): Promise<void> {
  const { parseTranscript, locateTranscript, listTranscripts, readTranscript } = await import('./replay.js');

  if (args.command === 'transcripts') {
    const cwd = args.flags['cwd'];
    const limit = parseIntFlag(args.flags['limit'], 20);
    const list = listTranscripts({ cwd, limit });
    process.stdout.write(JSON.stringify({ ok: true, data: { transcripts: list } }) + '\n');
    process.exit(0);
  }

  const sessionId = args.flags['session'];
  if (!sessionId) {
    process.stderr.write('replay: --session=<id> required\n');
    process.exit(2);
    return;
  }
  const cwd = args.flags['cwd'];
  const path = locateTranscript(sessionId, cwd);
  if (!path) {
    process.stderr.write(`replay: transcript not found for session ${sessionId}\n`);
    process.exit(2);
    return;
  }
  const limit = parseIntFlag(args.flags['limit'], 0);
  const content = readTranscript(path);
  const frames = parseTranscript(content, sessionId, { limit: limit > 0 ? limit : undefined });
  if (args.flags['dry-run'] === 'true') {
    process.stdout.write(JSON.stringify({ ok: true, data: { frames: frames.length, sample: frames.slice(0, 3) } }) + '\n');
    process.exit(0);
  }
  const { MemoryClient } = await import('./client.js');
  const client = new MemoryClient({ socketPath, timeoutMs: 5000 });
  let sent = 0;
  let errors = 0;
  for (const f of frames) {
    try {
      const res = await client.send({
        kind: 'capture',
        sessionId: f.sessionId,
        tool: f.tool,
        payload: f.payload,
        ts: f.ts,
        source: f.source,
      });
      if (res.ok) sent++;
      else errors++;
    } catch {
      errors++;
    }
  }
  const summary = { transcript: path, parsed: frames.length, sent, errors };
  if (args.flags['json'] === 'true') {
    process.stdout.write(JSON.stringify({ ok: true, data: summary }) + '\n');
  } else {
    process.stdout.write(`replay: ${path}\n  parsed=${frames.length}  sent=${sent}  errors=${errors}\n`);
  }
  process.exit(0);
}

async function runWeb(args: ParsedArgs, workspaceRoot: string): Promise<void> {
  const { existsSync, readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { homedir } = await import('node:os');
  const { spawn } = await import('node:child_process');

  const portFile = join(workspaceRoot, 'http.port');
  if (!existsSync(portFile)) {
    process.stderr.write(
      'web: HTTP bridge is not running for this workspace.\n' +
      '  enable it: stop the daemon, then re-spawn with SIFTCODER_HTTP=1 in env.\n' +
      '  example:\n' +
      '    kill $(cat ~/.siftcoder/workspaces/<key>/run.pid)\n' +
      '    SIFTCODER_HTTP=1 node ${CLAUDE_PLUGIN_ROOT}/dist/memory/daemon/index.js &\n'
    );
    process.exit(2);
  }
  const port = readFileSync(portFile, 'utf8').trim();
  const tokenPath = join(homedir(), '.siftcoder', 'auth.token');
  if (!existsSync(tokenPath)) {
    process.stderr.write('web: auth token not found at ' + tokenPath + '\n');
    process.exit(2);
  }
  const token = readFileSync(tokenPath, 'utf8').trim();
  const url = `http://127.0.0.1:${port}/?token=${encodeURIComponent(token)}`;

  if (args.flags['open'] === 'true') {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
    process.stdout.write(`opened ${url}\n`);
  } else {
    process.stdout.write(`${url}\n`);
  }
  process.exit(0);
}

async function readContent(filePath: string | undefined, useStdin: boolean): Promise<string> {
  if (filePath) {
    const { readFileSync } = await import('node:fs');
    return readFileSync(filePath, 'utf8');
  }
  if (useStdin) {
    return new Promise<string>(resolve => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => { data += chunk; });
      process.stdin.on('end', () => resolve(data));
    });
  }
  return '';
}

main().catch(err => {
  process.stderr.write(`siftcoder-mem cli: ${err?.message ?? err}\n`);
  process.exit(1);
});
/* c8 ignore stop */
