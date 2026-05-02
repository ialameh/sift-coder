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

function rpc(req, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const c = net.createConnection(paths().sock);
    const chunks = [];
    const t = setTimeout(() => {
      c.destroy();
      reject(new Error('timeout'));
    }, timeoutMs);
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
  // If daemon is running, route through it — it owns the model client and the DB lock.
  try {
    const ping = await rpc({ kind: 'ping' });
    if (ping.ok) {
      const r = await rpc({ kind: 'drain', batch });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    }
  } catch (e) {
    if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED') && !e.message.includes('timeout')) {
      throw e;
    }
    // Socket unreachable — daemon not running, fall through to local drain.
  }

  // Local drain: daemon is not running, safe to open DB directly.
  const storage = await openStorage();
  const { Summarizer } = await import(path.join(ROOT, 'dist', 'memory', 'daemon', 'summarizer.js'));
  const { DeterministicEmbedder } = await import(path.join(ROOT, 'dist', 'memory', 'embedder.js'));
  const { GlmClient } = await import(path.join(ROOT, 'dist', 'memory', 'glm-client.js'));
  const { GeminiClient } = await import(path.join(ROOT, 'dist', 'memory', 'gemini-client.js'));
  const { OllamaClient } = await import(path.join(ROOT, 'dist', 'memory', 'ollama-client.js'));
  const { AnthropicClient } = await import(path.join(ROOT, 'dist', 'memory', 'anthropic-client.js'));

  let modelClient;
  let backend;
  if (GlmClient.available(process.env)) {
    modelClient = new GlmClient();
    backend = 'glm';
  } else if (GeminiClient.available(process.env)) {
    modelClient = new GeminiClient();
    backend = 'gemini';
  } else if (await OllamaClient.available()) {
    modelClient = new OllamaClient();
    backend = 'ollama';
  } else if (AnthropicClient.available(process.env)) {
    modelClient = new AnthropicClient();
    backend = 'anthropic';
  } else {
    throw new Error('no drain backend available: set GLM_API_KEY, GEMINI_API_KEY, start Ollama, or set ANTHROPIC_API_KEY');
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
    let daemon = 'unreachable';
    let countsData = null;
    try {
      const r = await rpc({ kind: 'status' });
      daemon = r.ok ? 'running' : 'error';
      countsData = r.ok ? r.data.counts : null;
    } catch {
      daemon = 'unreachable';
    }
    // Only open DB directly when daemon isn't holding the lock.
    if (!countsData) {
      try {
        const storage = await openStorage();
        countsData = counts(storage);
      } catch { /* db not yet initialized */ }
    }
    console.log(JSON.stringify({ daemon, namespace: NS, workspace: key(), socket: paths().sock, counts: countsData }, null, 2));
    break;
  }
  case 'drain': {
    const batch = parseInt(args[0] || '32', 10);
    const r = await drain(batch);
    console.log(JSON.stringify(r, null, 2));
    break;
  }
  case 'backfill': {
    const r = await rpc({ kind: 'backfill', source: args[0] || 'transcripts' }, 300000);
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
  case 'info': {
    const wantJson = args.includes('--json');
    const p = paths();
    const pluginManifestPath = path.join(ROOT, '.claude-plugin', 'plugin.json');
    let pluginManifestVersion = null;
    try { pluginManifestVersion = JSON.parse(fs.readFileSync(pluginManifestPath, 'utf8')).version ?? null; } catch { /* ignore */ }

    let daemonState = 'unreachable';
    let daemonData = null;
    try {
      const r = await rpc({ kind: 'status' });
      daemonState = r.ok ? 'running' : 'error';
      daemonData = r.ok ? r.data : { error: r.error };
    } catch (e) {
      daemonState = 'unreachable';
      daemonData = { error: e.message };
    }

    let pid = null;
    let uptimeSec = null;
    try {
      pid = parseInt(fs.readFileSync(p.pid, 'utf8').trim(), 10);
      const stat = fs.statSync(p.pid);
      uptimeSec = Math.max(0, Math.round((Date.now() - stat.mtimeMs) / 1000));
      try { process.kill(pid, 0); } catch { pid = null; uptimeSec = null; }
    } catch { /* no pid file or process gone */ }

    let glm = false;
    let ollama = false;
    let anthropic = false;
    try {
      ensureBuilt();
      const { GlmClient } = await import(path.join(ROOT, 'dist', 'memory', 'glm-client.js'));
      const { OllamaClient } = await import(path.join(ROOT, 'dist', 'memory', 'ollama-client.js'));
      const { AnthropicClient } = await import(path.join(ROOT, 'dist', 'memory', 'anthropic-client.js'));
      glm = GlmClient.available(process.env);
      ollama = await OllamaClient.available().catch(() => false);
      anthropic = AnthropicClient.available(process.env);
    } catch { /* dist may be missing pre-build */ }

    let dbCounts = null;
    let dbSizeBytes = null;
    // Prefer counts from the running daemon (avoids opening DB while it holds the lock).
    if (daemonState === 'running' && daemonData?.counts) {
      dbCounts = daemonData.counts;
      try { dbSizeBytes = fs.statSync(p.db).size; } catch { /* ignore */ }
    } else {
      try {
        const storage = await openStorage();
        dbCounts = counts(storage);
        try { dbSizeBytes = fs.statSync(p.db).size; } catch { /* ignore */ }
      } catch { /* db not initialized yet */ }
    }

    let webUrl = null;
    try {
      if (fs.existsSync(p.httpPort)) webUrl = `http://127.0.0.1:${fs.readFileSync(p.httpPort, 'utf8').trim()}`;
    } catch { /* ignore */ }

    const info = {
      siftcoder: { version: pkgVersion(), pluginManifestVersion },
      runtime: { node: process.version, platform: process.platform, arch: process.arch },
      install: { root: ROOT },
      namespace: NS,
      workspace: { key: key(), cwd: process.cwd(), gitToplevel: gitToplevel(process.cwd()) },
      paths: { base: p.base, socket: p.sock, db: p.db, pid: p.pid, httpPortFile: p.httpPort },
      daemon: { state: daemonState, pid, uptimeSec, data: daemonData },
      backends: { glm, ollama, anthropic },
      ...(dbCounts ? { counts: dbCounts } : {}),
      ...(dbSizeBytes !== null ? { dbSizeBytes } : {}),
      ...(webUrl ? { webUrl } : {}),
    };

    if (wantJson) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      const fmtUptime = (s) => {
        if (s == null) return 'n/a';
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
        return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
      };
      const fmtBytes = (b) => {
        if (b == null) return 'n/a';
        if (b < 1024) return `${b} B`;
        if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KiB`;
        if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MiB`;
        return `${(b / 1024 / 1024 / 1024).toFixed(2)} GiB`;
      };
      const lines = [];
      lines.push(`siftcoder v${info.siftcoder.version}` + (info.siftcoder.pluginManifestVersion && info.siftcoder.pluginManifestVersion !== info.siftcoder.version ? ` (plugin manifest: v${info.siftcoder.pluginManifestVersion})` : ''));
      lines.push('');
      lines.push(`runtime     node ${info.runtime.node} ${info.runtime.platform}/${info.runtime.arch}`);
      lines.push(`install     ${info.install.root}`);
      lines.push(`namespace   ${info.namespace}`);
      lines.push(`workspace   ${info.workspace.key}  cwd=${info.workspace.cwd}`);
      if (info.workspace.gitToplevel) lines.push(`            git=${info.workspace.gitToplevel}`);
      lines.push('');
      lines.push(`daemon      ${info.daemon.state}` + (info.daemon.pid ? `  pid=${info.daemon.pid}  uptime=${fmtUptime(info.daemon.uptimeSec)}` : ''));
      lines.push(`socket      ${info.paths.socket}`);
      lines.push(`db          ${info.paths.db}` + (info.dbSizeBytes != null ? `  (${fmtBytes(info.dbSizeBytes)})` : ''));
      if (info.webUrl) lines.push(`web         ${info.webUrl}`);
      lines.push('');
      lines.push(`backends    glm=${info.backends.glm ? 'configured' : 'no key'}  ollama=${info.backends.ollama ? 'up' : 'down'}  anthropic=${info.backends.anthropic ? 'configured' : 'no key'}`);
      if (info.counts) {
        const c = info.counts;
        lines.push(`counts      events=${c.events}  raw=${c.raw}  summarized=${c.summarized}  skipped=${c.skipped}  summaries=${c.summaries}  embeddings=${c.embeddings}`);
      }
      console.log(lines.join('\n'));
    }
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
  siftcoder version             print version only
  siftcoder info [--json]       full runtime details (version, daemon, paths, backends, counts)
  siftcoder setup               one-time interactive setup
  siftcoder start               spawn daemon (detached)
  siftcoder stop                stop daemon
  siftcoder status              daemon health + counts
  siftcoder drain [batch]       force-drain pending events
  siftcoder backfill            backfill memory from past transcripts
  siftcoder web                 print web UI URL
`);
}
