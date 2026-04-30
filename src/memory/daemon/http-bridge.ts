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
/* istanbul ignore file */
/* c8 ignore start */
import { createServer, Server, IncomingMessage, ServerResponse } from 'node:http';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { Request, Response } from '../protocol.js';
import { route, type WebDeps, type WebRequest } from '../web/router.js';
import { initialPort, nextCandidate, MAX_RETRIES } from '../web/port.js';

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

const TOKEN_PATH = join(homedir(), '.siftcoder', 'auth.token');
const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '..', 'web', 'static');

const STATIC_TYPES: Record<string, string> = {
  'index.html': 'text/html; charset=utf-8',
  'app.js': 'application/javascript; charset=utf-8',
  'style.css': 'text/css; charset=utf-8',
};

export function ensureAuthToken(): string {
  if (!existsSync(TOKEN_PATH)) {
    mkdirSync(dirname(TOKEN_PATH), { recursive: true });
    const tok = randomBytes(32).toString('hex');
    writeFileSync(TOKEN_PATH, tok, { mode: 0o600 });
    return tok;
  }
  return readFileSync(TOKEN_PATH, 'utf8').trim();
}

function staticAsset(name: string): { body: Buffer; type: string } | null {
  const path = join(STATIC_DIR, name);
  if (!existsSync(path)) return null;
  return { body: readFileSync(path), type: STATIC_TYPES[name] ?? 'application/octet-stream' };
}

async function readBody(req: IncomingMessage): Promise<string> {
  let body = '';
  req.setEncoding('utf8');
  for await (const chunk of req) body += chunk;
  return body;
}

function parseQuery(url: string): Record<string, string> {
  const q: Record<string, string> = {};
  const i = url.indexOf('?');
  if (i < 0) return q;
  for (const pair of url.slice(i + 1).split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    q[decodeURIComponent(k!)] = decodeURIComponent(v);
  }
  return q;
}

function pathOf(url: string): string {
  const i = url.indexOf('?');
  return i < 0 ? url : url.slice(0, i);
}

export function startHttpBridge(deps: HttpBridgeDeps): Server {
  const token = ensureAuthToken();

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';
    const webReq: WebRequest = {
      method: req.method ?? 'GET',
      path: pathOf(url),
      query: parseQuery(url),
      authorization: typeof req.headers['authorization'] === 'string' ? req.headers['authorization'] : undefined,
      body: await readBody(req),
    };
    const webDeps: WebDeps = {
      storage: deps.storage,
      embedder: deps.embedder,
      provenance: deps.provenance,
      authToken: token,
      rpc: deps.handler,
      staticAsset,
      backend: deps.backend,
      workspaceKey: deps.workspaceKey,
    };
    const out = await route(webReq, webDeps);
    res.writeHead(out.status, out.headers);
    res.end(out.body);
  });

  const choice = initialPort({
    workspaceKey: deps.workspaceKey,
    override: deps.port ?? process.env['SIFTCODER_HTTP_PORT'],
  });
  let candidate = choice.port;
  let retries = 0;

  function bind(port: number) {
    server.listen(port, '127.0.0.1');
  }

  server.on('listening', () => {
    const addr = server.address();
    if (addr && typeof addr === 'object') {
      writeFileSync(join(deps.workspaceRoot, 'http.port'), String(addr.port));
    }
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code !== 'EADDRINUSE') return;
    if (choice.source === 'override') {
      // User pinned a specific port and it's taken. Fall back to OS-assigned to keep working.
      bind(0);
      return;
    }
    if (retries >= MAX_RETRIES) {
      bind(0);
      return;
    }
    retries++;
    candidate = nextCandidate(candidate);
    bind(candidate);
  });

  bind(candidate);
  return server;
}
/* c8 ignore stop */
