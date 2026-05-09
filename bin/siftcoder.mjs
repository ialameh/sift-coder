#!/usr/bin/env node
// SiftCoder CLI: setup | start | stop | status | drain | backfill | web | version | check | list
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

/**
 * Open storage using the backend resolver.
 * Returns { storage, backend, dbPath } where storage is an ready Storage instance.
 */
async function openStorage() {
  ensureBuilt();
  const p = paths();
  fs.mkdirSync(path.dirname(p.db), { recursive: true });
  const { openStorage: resolve } = await import(path.join(ROOT, 'dist', 'memory', 'storage', 'open.js'));
  const { Storage } = await import(path.join(ROOT, 'dist', 'memory', 'storage', 'storage.js'));
  const { db, backend, dbPath } = await resolve({ dbPath: p.db });
  const storage = await Storage.init(db);
  return { storage, backend, dbPath };
}

async function getCountsFromDaemon() {
  try {
    const r = await rpc({ kind: 'status' });
    if (r.ok) return { daemon: 'running', counts: r.data.counts };
    return { daemon: 'error', counts: null };
  } catch {
    return { daemon: 'unreachable', counts: null };
  }
}

async function getCountsFromStorage(storage) {
  const c = await storage.counts();
  return c;
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
    const { daemon, counts: countsData } = await getCountsFromDaemon();
    if (!countsData) {
      try {
        const { storage, backend } = await openStorage();
        const c = await getCountsFromStorage(storage);
        await storage.close();
        console.log(JSON.stringify({ daemon, namespace: NS, workspace: key(), socket: paths().sock, backend, counts: c }, null, 2));
        break;
      } catch { /* db not initialized */ }
    }
    console.log(JSON.stringify({ daemon, namespace: NS, workspace: key(), socket: paths().sock, counts: countsData }, null, 2));
    break;
  }
  case 'drain': {
    const batch = parseInt(args[0] || '32', 10);
    // If daemon is running, route through it
    try {
      const ping = await rpc({ kind: 'ping' }, 2000);
      if (ping.ok) {
        const r = await rpc({ kind: 'drain', batch }, batch * 10_000);
        if (!r.ok) throw new Error(r.error);
        console.log(JSON.stringify(r.data, null, 2));
        break;
      }
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED') && !e.message.includes('timeout')) {
        throw e;
      }
      // Fall through to local drain
    }
    // Local drain
    const { storage } = await openStorage();
    const { Summarizer } = await import(path.join(ROOT, 'dist', 'memory', 'daemon', 'summarizer.js'));
    const { DeterministicEmbedder } = await import(path.join(ROOT, 'dist', 'memory', 'embedder.js'));
    const { GlmClient } = await import(path.join(ROOT, 'dist', 'memory', 'glm-client.js'));
    const { GeminiClient } = await import(path.join(ROOT, 'dist', 'memory', 'gemini-client.js'));
    const { OllamaClient } = await import(path.join(ROOT, 'dist', 'memory', 'ollama-client.js'));
    const { AnthropicClient } = await import(path.join(ROOT, 'dist', 'memory', 'anthropic-client.js'));
    let modelClient = null;
    let drainBackend = 'none';
    if (GlmClient.available(process.env)) {
      modelClient = new GlmClient(); drainBackend = 'glm';
    } else if (GeminiClient.available(process.env)) {
      modelClient = new GeminiClient(); drainBackend = 'gemini';
    } else if (await OllamaClient.available()) {
      modelClient = new OllamaClient(); drainBackend = 'ollama';
    } else if (AnthropicClient.available(process.env)) {
      modelClient = new AnthropicClient(); drainBackend = 'anthropic';
    }
    if (!modelClient) throw new Error('no drain backend: set GLM_API_KEY, GEMINI_API_KEY, start Ollama, or set ANTHROPIC_API_KEY');
    const summarizer = new Summarizer(storage, modelClient);
    const embedder = new DeterministicEmbedder(384);
    const events = await storage.claimPending(batch);
    const isRetryable = (msg) => {
      const m = msg.toLowerCase();
      return /(quota|rate.?limit|429|502|503|504|timeout|etimedout|econnreset|econnrefused|enotfound|socket hang up|overloaded)/.test(m);
    };
    let processed = 0, errors = 0, firstError;
    for (const ev of events) {
      try {
        const r = await summarizer.summarize(ev.id, ev.inputHash, ev.payloadJson, Date.now());
        if (r.id > 0) await storage.putEmbedding(r.id, await embedder.embed(r.text));
        await storage.markEventStatus(ev.id, 'summarized');
        processed++;
      } catch (e) {
        if (isRetryable(e.message)) {
          await storage.releaseClaimed(ev.id, e.message);
        } else {
          await storage.markEventStatus(ev.id, 'skipped');
        }
        errors++;
        firstError ??= e.message;
      }
    }
    const pending = (await storage.pendingEvents(1)).length;
    await storage.close();
    console.log(JSON.stringify({ backend: drainBackend, processed, errors, pending, ...(firstError ? { firstError } : {}) }, null, 2));
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

    const { daemon: daemonState, counts: daemonCounts } = await getCountsFromDaemon();
    let pid = null, uptimeSec = null, daemonBackend = null;
    try {
      pid = parseInt(fs.readFileSync(p.pid, 'utf8').trim(), 10);
      const stat = fs.statSync(p.pid);
      uptimeSec = Math.max(0, Math.round((Date.now() - stat.mtimeMs) / 1000));
      try { process.kill(pid, 0); } catch { pid = null; uptimeSec = null; }
    } catch { /* no pid file */ }

    // Query daemon for backend when running
    if (daemonState === 'running') {
      try {
        const r = await rpc({ kind: 'status' }, 2000);
        if (r.ok && r.data?.backend) daemonBackend = r.data.backend;
      } catch { /* ignore */ }
    }

    let glm = false, ollama = false, anthropic = false;
    try {
      ensureBuilt();
      const { GlmClient } = await import(path.join(ROOT, 'dist', 'memory', 'glm-client.js'));
      const { OllamaClient } = await import(path.join(ROOT, 'dist', 'memory', 'ollama-client.js'));
      const { AnthropicClient } = await import(path.join(ROOT, 'dist', 'memory', 'anthropic-client.js'));
      glm = GlmClient.available(process.env);
      ollama = await OllamaClient.available().catch(() => false);
      anthropic = AnthropicClient.available(process.env);
    } catch { /* dist may be missing */ }

    let dbCounts = null, dbSizeBytes = null, storageBackend = null;
    if (daemonState === 'running' && daemonCounts) {
      dbCounts = daemonCounts;
      storageBackend = daemonBackend;
      try { dbSizeBytes = fs.statSync(p.db).size; } catch { /* ignore */ }
    } else {
      try {
        const { storage, backend } = await openStorage();
        dbCounts = await getCountsFromStorage(storage);
        storageBackend = backend;
        try { dbSizeBytes = fs.statSync(p.db).size; } catch { /* ignore */ }
        await storage.close();
      } catch { /* db not initialized */ }
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
      daemon: { state: daemonState, pid, uptimeSec },
      storageBackend,
      backends: { glm, ollama, anthropic },
      ...(dbCounts ? { counts: dbCounts } : {}),
      ...(dbSizeBytes !== null ? { dbSizeBytes } : {}),
      ...(webUrl ? { webUrl } : {}),
    };

    if (wantJson) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      const fmtUptime = (s) => { if (s == null) return 'n/a'; if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`; return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; };
      const fmtBytes = (b) => { if (b == null) return 'n/a'; if (b < 1024) return `${b} B`; if (b < 1024*1024) return `${(b/1024).toFixed(1)} KiB`; if (b < 1024*1024*1024) return `${(b/1024/1024).toFixed(1)} MiB`; return `${(b/1024/1024/1024).toFixed(2)} GiB`; };
      const lines = [];
      lines.push(`siftcoder v${info.siftcoder.version}${info.siftcoder.pluginManifestVersion && info.siftcoder.pluginManifestVersion !== info.siftcoder.version ? ` (plugin manifest: v${info.siftcoder.pluginManifestVersion})` : ''}`);
      lines.push('');
      lines.push(`runtime     node ${info.runtime.node} ${info.runtime.platform}/${info.runtime.arch}`);
      lines.push(`install     ${info.install.root}`);
      lines.push(`namespace   ${info.namespace}`);
      lines.push(`workspace   ${info.workspace.key}  cwd=${info.workspace.cwd}`);
      if (info.workspace.gitToplevel) lines.push(`            git=${info.workspace.gitToplevel}`);
      lines.push('');
      lines.push(`daemon      ${info.daemon.state}${info.daemon.pid ? `  pid=${info.daemon.pid}  uptime=${fmtUptime(info.daemon.uptimeSec)}` : ''}`);
      lines.push(`socket      ${info.paths.socket}`);
      lines.push(`db          ${info.paths.db}${info.dbSizeBytes != null ? `  (${fmtBytes(info.dbSizeBytes)})` : ''}`);
      if (info.storageBackend) lines.push(`storage     ${info.storageBackend}`);
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
  case 'check': {
    try {
      const r = await rpc({ kind: 'ping' }, 2000);
      if (r.ok) { console.log(JSON.stringify({ ok: true, daemon: 'running' }, null, 2)); break; }
    } catch { /* daemon not reachable */ }
    // Auto-start daemon
    const p = paths();
    fs.mkdirSync(p.run, { recursive: true });
    fs.mkdirSync(p.workspace, { recursive: true });
    const child = spawn(process.execPath, [path.join(ROOT, 'dist', 'memory', 'daemon', 'index.js')], { detached: true, stdio: 'ignore', env: { ...process.env, SIFTCODER_NS: NS, SIFTCODER_WORKSPACE_CWD: process.cwd() } });
    child.unref();
    fs.writeFileSync(p.pid, String(child.pid));
    // Wait for socket
    const deadline = Date.now() + 3000;
    let socketUp = false;
    while (Date.now() < deadline) {
      if (fs.existsSync(p.sock)) { socketUp = true; break; }
      await new Promise(r => setTimeout(r, 100));
    }
    if (socketUp) {
      console.log(JSON.stringify({ ok: true, daemon: 'started', pid: child.pid, socket: p.sock }, null, 2));
    } else {
      console.log(JSON.stringify({ ok: false, daemon: 'spawned', pid: child.pid, socket: p.sock, error: 'socket did not appear within 3s' }, null, 2));
    }
    break;
  }
  case 'list': {
    const limit = parseInt(args[0] || '20', 10);
    // Try daemon first; if unreachable, fall back to local direct query
    try {
      const r = await rpc({ kind: 'summaries', limit }, 5000);
      if (r.ok && r.data?.summaries) {
        console.log(JSON.stringify({ ok: true, summaries: r.data.summaries }, null, 2));
        break;
      }
    } catch { /* fall through to local */ }
    // Local fallback: open SQLite and query recent summaries directly
    try {
      const { storage } = await openStorage();
      const rows = await storage.recentSummaries(limit);
      await storage.close();
      const summaries = rows.map(row => ({
        id: row.id,
        ts: new Date(row.ts).toISOString(),
        model: row.model,
        text: row.text.length > 120 ? row.text.slice(0, 120) + '...' : row.text,
      }));
      console.log(JSON.stringify({ ok: true, summaries }, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
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
  siftcoder check               verify daemon reachable; auto-start if not
  siftcoder list [N]            list recent summaries (default 20)
  siftcoder setup               one-time interactive setup
  siftcoder start               spawn daemon (detached)
  siftcoder stop                stop daemon
  siftcoder status              daemon health + counts
  siftcoder drain [batch]       force-drain pending events
  siftcoder backfill            backfill memory from past transcripts
  siftcoder web                 print web UI URL
`);
}