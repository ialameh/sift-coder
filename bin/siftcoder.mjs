#!/usr/bin/env node
// SiftCoder CLI: setup | start | stop | status | drain | backfill | web | version
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import net from 'node:net';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NS = process.env.SIFTCODER_NS || 'default';

function pkgVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  } catch {
    return 'unknown';
  }
}

function gitToplevel(cwd) {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8').trim() || null;
  } catch {
    return null;
  }
}

function key(dir = process.cwd()) {
  const top = gitToplevel(dir) ?? dir;
  let real;
  try {
    real = fs.realpathSync(top);
  } catch {
    real = path.resolve(top);
  }
  return crypto.createHash('sha256').update(real).digest('hex').slice(0, 12);
}

function paths() {
  const base = path.join(os.homedir(), '.siftcoder', NS);
  const wsKey = key();
  return {
    base,
    run: path.join(base, 'run'),
    workspace: path.join(base, 'workspaces', wsKey),
    sock: path.join(base, 'run', `${wsKey}.sock`),
    pid: path.join(base, 'workspaces', wsKey, 'run.pid'),
    db: path.join(base, 'workspaces', wsKey, 'db.sqlite'),
    httpPort: path.join(base, 'workspaces', wsKey, 'http.port'),
  };
}

function encodeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

function decodeFirstFrame(buffer) {
  if (buffer.length < 4) throw new Error('short response');
  const len = buffer.readUInt32BE(0);
  if (buffer.length < 4 + len) throw new Error('truncated response');
  return JSON.parse(buffer.subarray(4, 4 + len).toString('utf8'));
}

function rpc(req) {
  return new Promise((resolve, reject) => {
    const c = net.createConnection(paths().sock);
    const chunks = [];
    const t = setTimeout(() => {
      c.destroy();
      reject(new Error('timeout'));
    }, 5000);
    c.on('data', (d) => chunks.push(d));
    c.on('end', () => {
      clearTimeout(t);
      try {
        resolve(decodeFirstFrame(Buffer.concat(chunks)));
      } catch (e) {
        reject(e);
      }
    });
    c.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
    c.write(encodeFrame(req));
    c.end();
  });
}

function ensureBuilt() {
  const sentinel = path.join(ROOT, 'dist', 'memory', 'mcp', 'server.js');
  if (fs.existsSync(sentinel)) return;
  console.error('[siftcoder] dist/ missing. Build with:');
  console.error(`  cd ${ROOT} && npm install && npm run build`);
  console.error('Or restart your Claude Code session — the SessionStart hook will auto-build.');
  process.exit(1);
}

async function openStorage() {
  ensureBuilt();
  const p = paths();
  const { Storage } = await import(path.join(ROOT, 'dist', 'memory', 'storage', 'storage.js'));
  fs.mkdirSync(path.dirname(p.db), { recursive: true });
  try {
    const mod = await import('better-sqlite3');
    return new Storage(new mod.default(p.db));
  } catch {
    const wasm = await import(path.join(ROOT, 'dist', 'memory', 'storage', 'wasm-db.js'));
    return new Storage(await wasm.openWasmDatabase(p.db));
  }
}

function dbHandle(storage) {
  return storage.db;
}

function counts(storage) {
  const db = dbHandle(storage);
  const c = (sql) => db.prepare(sql).get().c ?? 0;
  return {
    events: c('SELECT count(*) AS c FROM events'),
    raw: c("SELECT count(*) AS c FROM events WHERE status = 'raw'"),
    summarized: c("SELECT count(*) AS c FROM events WHERE status = 'summarized'"),
    skipped: c("SELECT count(*) AS c FROM events WHERE status = 'skipped'"),
    summaries: c('SELECT count(*) AS c FROM summaries'),
    embeddings: c('SELECT count(*) AS c FROM summary_embeddings'),
  };
}

async function drain(batch) {
  const storage = await openStorage();
  const { Summarizer } = await import(path.join(ROOT, 'dist', 'memory', 'daemon', 'summarizer.js'));
  const { DeterministicEmbedder } = await import(path.join(ROOT, 'dist', 'memory', 'embedder.js'));
  const { OllamaClient } = await import(path.join(ROOT, 'dist', 'memory', 'ollama-client.js'));
  const { AnthropicClient } = await import(path.join(ROOT, 'dist', 'memory', 'anthropic-client.js'));

  let modelClient;
  let backend;
  if (await OllamaClient.available()) {
    modelClient = new OllamaClient();
    backend = 'ollama';
  } else if (AnthropicClient.available(process.env)) {
    modelClient = new AnthropicClient();
    backend = 'anthropic';
  } else {
    throw new Error('no drain backend available: start Ollama or set ANTHROPIC_API_KEY');
  }

  const summarizer = new Summarizer(storage, modelClient);
  const embedder = new DeterministicEmbedder(384);
  const events = storage.pendingEvents(batch);
  let processed = 0;
  let errors = 0;
  let firstError;
  for (const ev of events) {
    try {
      const r = await summarizer.summarize(ev.id, ev.inputHash, ev.payloadJson, Date.now());
      storage.putEmbedding(r.id, await embedder.embed(r.text));
      storage.markEventStatus(ev.id, 'summarized');
      processed++;
    } catch (e) {
      storage.markEventStatus(ev.id, 'skipped');
      errors++;
      firstError ??= e.message;
    }
  }
  return { backend, processed, errors, pending: storage.pendingEvents(1).length, ...(firstError ? { firstError } : {}) };
}

const cmd = process.argv[2];
const args = process.argv.slice(3);

switch (cmd) {
  case 'version':
    console.log(`siftcoder v${pkgVersion()}`);
    break;
  case 'start': {
    const p = paths();
    fs.mkdirSync(p.run, { recursive: true });
    fs.mkdirSync(p.workspace, { recursive: true });
    const child = spawn(
      'node',
      [path.join(ROOT, 'dist', 'memory', 'daemon', 'index.js')],
      { detached: true, stdio: 'ignore', env: { ...process.env, SIFTCODER_NS: NS, SIFTCODER_WORKSPACE_CWD: process.cwd() } },
    );
    child.unref();
    fs.writeFileSync(p.pid, String(child.pid));
    console.log(`daemon started pid=${child.pid} sock=${p.sock}`);
    break;
  }
  case 'stop': {
    try {
      const pid = parseInt(fs.readFileSync(paths().pid, 'utf8'), 10);
      process.kill(pid);
      console.log(`stopped pid=${pid}`);
    } catch (e) {
      console.error(`stop failed: ${e.message}`);
    }
    break;
  }
  case 'status': {
    const storage = await openStorage();
    let daemon = 'unreachable';
    try {
      const r = await rpc({ kind: 'ping' });
      daemon = r.ok ? 'running' : 'error';
    } catch {
      daemon = 'unreachable';
    }
    console.log(JSON.stringify({ daemon, namespace: NS, workspace: key(), socket: paths().sock, counts: counts(storage) }, null, 2));
    break;
  }
  case 'drain': {
    const batch = parseInt(args[0] || '32', 10);
    const r = await drain(batch);
    console.log(JSON.stringify(r, null, 2));
    break;
  }
  case 'backfill': {
    const r = await rpc('backfill', { source: args[0] || 'transcripts' });
    console.log(JSON.stringify(r, null, 2));
    break;
  }
  case 'web': {
    const portFile = paths().httpPort;
    if (!fs.existsSync(portFile)) {
      console.error('web bridge not active yet; start the daemon and ensure SIFTCODER_NO_HTTP is not 1');
      process.exit(1);
    }
    const port = fs.readFileSync(portFile, 'utf8').trim();
    console.log(`http://127.0.0.1:${port}`);
    break;
  }
  case 'setup': {
    const setup = await import(path.join(ROOT, 'scripts', 'setup.mjs'));
    await setup.run();
    break;
  }
  default:
    console.log(`siftcoder v${pkgVersion()}
Usage:
  siftcoder version
  siftcoder setup           one-time interactive setup
  siftcoder start           spawn daemon (detached)
  siftcoder stop            stop daemon
  siftcoder status          daemon health + counts
  siftcoder drain [batch]   force-drain pending events
  siftcoder backfill        backfill memory from past transcripts
  siftcoder web             print web UI URL
`);
}
