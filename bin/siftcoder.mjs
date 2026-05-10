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
    const pending = await storage.countByStatus('raw');
    await storage.close();
    console.log(JSON.stringify({ backend: drainBackend, processed, errors, pending, ...(firstError ? { firstError } : {}) }, null, 2));
    break;
  }
  case 'backfill': {
    const r = await rpc({ kind: 'backfill', source: args[0] || 'transcripts' }, 300000);
    console.log(JSON.stringify(r, null, 2));
    break;
  }
  case 'prune': {
    // Optional --days N or --superseded flags. Default: drop skipped events older than 7 days.
    let days = 7;
    let superseded = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--days') days = parseInt(args[++i] ?? '7', 10);
      else if (args[i] === '--superseded') superseded = true;
    }
    const maxAgeMs = days * 24 * 60 * 60 * 1000;
    try {
      const r = await rpc({ kind: 'prune', maxAgeMs, superseded }, 60000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.prune({ maxAgeMs, superseded });
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: r }, null, 2));
    break;
  }
  case 'retry': {
    const limit = args[0] ? parseInt(args[0], 10) : undefined;
    try {
      const r = await rpc({ kind: 'retry_skipped', limit }, 30000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const requeued = await storage.retrySkipped(limit);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { requeued } }, null, 2));
    break;
  }
  case 'pin': {
    const id = parseInt(args[0] ?? '0', 10);
    if (!id) { console.error('usage: siftcoder pin <summaryId>'); process.exit(1); }
    try {
      const r = await rpc({ kind: 'pin', summaryId: id }, 5000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const ok = await storage.pin(id);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { pinned: ok, summaryId: id } }, null, 2));
    break;
  }
  case 'unpin': {
    const id = parseInt(args[0] ?? '0', 10);
    if (!id) { console.error('usage: siftcoder unpin <summaryId>'); process.exit(1); }
    try {
      const r = await rpc({ kind: 'unpin', summaryId: id }, 5000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    await storage.unpin(id);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { pinned: false, summaryId: id } }, null, 2));
    break;
  }
  case 'pinned': {
    const limit = parseInt(args[0] ?? '100', 10);
    try {
      const r = await rpc({ kind: 'pinned', limit }, 5000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const rows = await storage.listPinned(limit);
    await storage.close();
    const pinned = rows.map(r => ({
      id: r.id,
      ts: new Date(r.ts).toISOString(),
      text: r.text.length > 240 ? r.text.slice(0, 240) + '...' : r.text,
    }));
    console.log(JSON.stringify({ ok: true, data: { pinned } }, null, 2));
    break;
  }
  case 'doctor': {
    const heal = args.includes('--heal');
    let report;
    try {
      const r = await rpc({ kind: 'doctor', heal }, 60000);
      if (r.ok) report = r.data;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    if (!report) {
      const { storage } = await openStorage();
      report = await storage.doctor();
      await storage.close();
    }
    // Render as a checklist; JSON via --json.
    if (args.includes('--json')) {
      console.log(JSON.stringify({ ok: true, data: report }, null, 2));
    } else {
      const tick = (b) => b ? '✓' : '✗';
      const lines = [];
      lines.push(`integrity   ${tick(report.integrity === 'ok')} ${report.integrity}`);
      lines.push(`orphans     summaries=${report.orphanSummaries} embeddings=${report.orphanEmbeddings} provenance=${report.orphanProvenance}`);
      lines.push(`vec0        embeddings=${report.vecCardinality.embeddings} vec=${report.vecCardinality.vec} drift=${report.vecCardinality.drift}`);
      lines.push(`pinned      ${report.pinned}`);
      const c = report.counts;
      lines.push(`counts      events=${c.events} raw=${c.raw} summarized=${c.summarized} skipped=${c.skipped} summaries=${c.summaries} embeddings=${c.embeddings} superseded=${c.superseded}`);
      if (report.healed) lines.push(`healed      vecBackfilled=${report.healed.vecBackfilled}`);
      console.log(lines.join('\n'));
    }
    break;
  }
  case 'export': {
    const target = args[0];
    if (!target) { console.error('usage: siftcoder export <file.ndjson>'); process.exit(1); }
    let r;
    try {
      r = await rpc({ kind: 'export', all: true }, 120000);
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    if (r?.ok) {
      fs.writeFileSync(target, r.data.ndjson + '\n');
      console.log(JSON.stringify({ ok: true, file: target, records: r.data.records }, null, 2));
      break;
    }
    // Local fallback
    const { storage } = await openStorage();
    const lines = [];
    for await (const row of storage.exportRows()) lines.push(JSON.stringify(row));
    await storage.close();
    fs.writeFileSync(target, lines.join('\n') + '\n');
    console.log(JSON.stringify({ ok: true, file: target, records: lines.length }, null, 2));
    break;
  }
  case 'import': {
    const source = args[0];
    if (!source || !fs.existsSync(source)) { console.error(`usage: siftcoder import <file.ndjson>`); process.exit(1); }
    const ndjson = fs.readFileSync(source, 'utf8');
    try {
      const r = await rpc({ kind: 'import', ndjson }, 300000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    let inserted = 0, skipped = 0, errors = 0;
    for (const line of ndjson.split('\n')) {
      if (!line.trim()) continue;
      try {
        const { table, row } = JSON.parse(line);
        const r = await storage.importRow(table, row);
        if (r === 'inserted') inserted++; else skipped++;
      } catch { errors++; }
    }
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { inserted, skipped, errors } }, null, 2));
    break;
  }
  case 'federate-search': case 'fsearch': {
    const query = args.filter(a => !a.startsWith('--')).join(' ');
    if (!query) { console.error('usage: siftcoder federate-search <query> [--k N] [--prefix X] [--max-ws N]'); process.exit(1); }
    const kIdx = args.indexOf('--k');
    const k = kIdx >= 0 ? parseInt(args[kIdx + 1] ?? '5', 10) : 5;
    const pIdx = args.indexOf('--prefix');
    const prefix = pIdx >= 0 ? args[pIdx + 1] : undefined;
    const mIdx = args.indexOf('--max-ws');
    const maxWs = mIdx >= 0 ? parseInt(args[mIdx + 1] ?? '0', 10) : undefined;
    try {
      const r = await rpc({ kind: 'federate_search', query, k, workspacePrefix: prefix, maxWorkspaces: maxWs }, 60000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    console.error('federate-search requires the daemon to be running');
    process.exit(1);
  }
  case 'symbol-search': case 'sym': {
    const query = args.filter(a => !a.startsWith('--')).join(' ');
    if (!query) { console.error('usage: siftcoder symbol-search <kind:name | term> [--k N]'); process.exit(1); }
    const kIdx = args.indexOf('--k');
    const k = kIdx >= 0 ? parseInt(args[kIdx + 1] ?? '10', 10) : 10;
    try {
      const r = await rpc({ kind: 'symbol_search', query, k }, 30000);
      if (r.ok && !args.includes('--json')) {
        for (const h of r.data.hits ?? []) {
          const text = h.text ? (h.text.length > 100 ? h.text.slice(0, 100) + '...' : h.text) : '(no summary yet)';
          console.log(`#${h.eventId}  [${h.tool}]  ${h.symbols.join(', ')}  → ${text}`);
        }
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const rows = await storage.symbolSearch(query, k);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { hits: rows } }, null, 2));
    break;
  }
  case 'watch': {
    // Live TUI loop: poll stats every 2s, print compact one-line update. Ctrl+C to exit.
    const interval = parseInt(args[0] ?? '2', 10) * 1000;
    const tty = process.stdout.isTTY;
    const tick = async () => {
      try {
        const r = await rpc({ kind: 'stats', windowMs: 60_000 }, 5000);
        if (r.ok) {
          const d = r.data;
          const c = d.counts;
          const line = `[${new Date().toISOString().slice(11,19)}] events=${c.events} raw=${c.raw} sum=${c.summarized} skip=${c.skipped} | ev/m=${d.throughput.eventsPerMin.toFixed(1)} sm/m=${d.throughput.summariesPerMin.toFixed(1)} | eta=${d.backlog.etaSec ?? '-'}s | cache=${(d.cacheHitRate*100).toFixed(0)}%`;
          if (tty) process.stdout.write('\r\x1b[K' + line); else console.log(line);
        }
      } catch (e) {
        process.stderr.write(`\nwatch err: ${e.message}\n`);
      }
    };
    await tick();
    const t = setInterval(tick, interval);
    process.on('SIGINT', () => { clearInterval(t); process.stdout.write('\n'); process.exit(0); });
    // Keep alive forever (until SIGINT).
    await new Promise(() => {});
    break;
  }
  case 'auth-token': {
    const tokenPath = path.join(os.homedir(), '.siftcoder', 'auth.token');
    if (args[0] === '--rotate') {
      const tok = crypto.randomBytes(32).toString('hex');
      fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
      fs.writeFileSync(tokenPath, tok, { mode: 0o600 });
      console.log(JSON.stringify({ ok: true, rotated: true, token: tok }, null, 2));
    } else if (fs.existsSync(tokenPath)) {
      console.log(fs.readFileSync(tokenPath, 'utf8').trim());
    } else {
      console.error('no token yet — start the daemon first (siftcoder check)');
      process.exit(1);
    }
    break;
  }
  case 'compact': {
    const ageDays = args.includes('--cache-days') ? parseInt(args[args.indexOf('--cache-days') + 1] ?? '30', 10) : 30;
    try {
      const r = await rpc({ kind: 'compact', cacheMaxAgeMs: ageDays * 24 * 60 * 60 * 1000 }, 120000);
      if (r.ok && !args.includes('--json')) {
        const d = r.data;
        const fmt = (b) => b == null ? 'n/a' : (b < 1024*1024 ? (b/1024).toFixed(1)+' KiB' : (b/1024/1024).toFixed(2)+' MiB');
        console.log(`cache pruned   ${d.cachePruned}`);
        console.log(`embeddings     dropped=${d.embeddingsDropped}`);
        console.log(`fts rebuilt    ${d.ftsRebuilt}`);
        console.log(`vacuum         ${d.vacuumed} (${fmt(d.sizeBefore)} → ${fmt(d.sizeAfter)})`);
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.compact({ cacheMaxAgeMs: ageDays * 24 * 60 * 60 * 1000 });
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: r }, null, 2));
    break;
  }
  case 'patterns': {
    const minIdx = args.indexOf('--min');
    const min = minIdx >= 0 ? parseInt(args[minIdx + 1] ?? '3', 10) : 3;
    try {
      const r = await rpc({ kind: 'patterns', minRepeats: min, limit: 25 }, 30000);
      if (r.ok && !args.includes('--json')) {
        for (const p of r.data.patterns ?? []) {
          console.log(`x${p.occurrences}  sessions=${p.distinctSessions}  tools=${p.tools.join(',')}  hash=${p.inputHash.slice(0,12)}…  sample=#${p.sampleEventId}`);
        }
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.patterns(min);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { patterns: r } }, null, 2));
    break;
  }
  case 'sessions': {
    const lIdx = args.indexOf('--limit');
    const limit = lIdx >= 0 ? parseInt(args[lIdx + 1] ?? '20', 10) : 20;
    try {
      const r = await rpc({ kind: 'sessions', limit }, 30000);
      if (r.ok && !args.includes('--json')) {
        for (const s of r.data.sessions ?? []) {
          const short = s.sessionId.length > 36 ? s.sessionId.slice(0, 8) : s.sessionId;
          console.log(`${short}  events=${s.eventCount}  ${s.firstTs.slice(0,16)} → ${s.lastTs.slice(0,16)}  ${s.cwd ?? ''}`);
        }
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.listSessions(limit);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { sessions: r } }, null, 2));
    break;
  }
  case 'dashboard': {
    try {
      const r = await rpc({ kind: 'dashboard' }, 30000);
      if (r.ok && !args.includes('--json')) {
        const d = r.data;
        const c = d.stats.counts;
        const tp = d.stats.throughput;
        console.log('siftcoder mem dashboard');
        console.log('━'.repeat(50));
        console.log(`counts      events=${c.events} raw=${c.raw} sum=${c.summarized} skip=${c.skipped}`);
        console.log(`throughput  ${tp.eventsPerMin.toFixed(1)} ev/min  ${tp.summariesPerMin.toFixed(1)} sm/min`);
        console.log(`backlog     ${d.stats.backlog.pending} pending  eta ${d.stats.backlog.etaSec ?? '-'}s`);
        console.log(`cache       hitRate ${(d.stats.cacheHitRate*100).toFixed(0)}%`);
        const dr = d.doctor;
        console.log(`health      integrity=${dr.integrity}  orphans=${dr.orphanSummaries+dr.orphanEmbeddings+dr.orphanProvenance}  vec0 drift=${dr.vecCardinality.drift}  pinned=${dr.pinned}`);
        console.log(`top tools   ${d.stats.topTools.slice(0,5).map(t => t.tool+'='+t.count).join(', ')}`);
        if (d.pinned.length > 0) {
          console.log('\npinned (top 5):');
          for (const p of d.pinned.slice(0, 5)) console.log(`  #${p.id}  ${p.text.slice(0, 80)}`);
        }
        if (d.patterns.length > 0) {
          console.log('\npatterns (recurring):');
          for (const p of d.patterns.slice(0, 5)) console.log(`  x${p.occurrences}  sessions=${p.distinctSessions}  tools=${p.tools.join(',')}`);
        }
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    console.error('dashboard requires the daemon');
    process.exit(1);
  }
  case 'graph-subgraph': {
    // siftcoder graph-subgraph <kind> <id> [--depth N] [--direction out|in|both] [--edge-type T] [--max-edges N] [--json]
    const [kind, id] = args.slice(1, 3);
    if (!kind || !id) {
      console.error('usage: siftcoder graph-subgraph <kind> <id> [--depth N] [--direction out|in|both] [--edge-type T] [--max-edges N] [--json]');
      process.exit(1);
    }
    const depthIdx = args.indexOf('--depth');
    const dirIdx = args.indexOf('--direction');
    const etIdx = args.indexOf('--edge-type');
    const meIdx = args.indexOf('--max-edges');
    const r = await rpc({
      kind: 'graph_subgraph',
      nodeKind: kind,
      nodeId: id,
      maxDepth: depthIdx >= 0 ? parseInt(args[depthIdx + 1] ?? '2', 10) : 2,
      direction: dirIdx >= 0 ? args[dirIdx + 1] : 'both',
      edgeType: etIdx >= 0 ? args[etIdx + 1] : undefined,
      maxEdges: meIdx >= 0 ? parseInt(args[meIdx + 1] ?? '200', 10) : 200,
    }, 30000);
    if (r.ok && !args.includes('--json')) {
      console.log(`subgraph: ${r.data.nodes.length} nodes, ${r.data.edges.length} edges`);
      for (const e of r.data.edges) {
        console.log(`  ${e.from.kind}:${e.from.id}  --[${e.edgeType}]-->  ${e.to.kind}:${e.to.id}`);
      }
    } else {
      console.log(JSON.stringify(r, null, 2));
    }
    break;
  }
  case 'graph-path': {
    // siftcoder graph-path <fromKind> <fromId> <toKind> <toId> [--depth N] [--json]
    const [fk, fi, tk, ti] = args.slice(1, 5);
    if (!fk || !fi || !tk || !ti) {
      console.error('usage: siftcoder graph-path <fromKind> <fromId> <toKind> <toId> [--depth N] [--json]');
      process.exit(1);
    }
    const dIdx = args.indexOf('--depth');
    const r = await rpc({
      kind: 'graph_path',
      fromKind: fk,
      fromId: fi,
      toKind: tk,
      toId: ti,
      maxDepth: dIdx >= 0 ? parseInt(args[dIdx + 1] ?? '6', 10) : 6,
    }, 30000);
    if (r.ok && !args.includes('--json')) {
      if (r.data.path === null) {
        console.log('no path within max depth');
      } else if (r.data.path.length === 0) {
        console.log('source equals target');
      } else {
        for (const e of r.data.path) {
          console.log(`  ${e.from.kind}:${e.from.id}  --[${e.edgeType}]-->  ${e.to.kind}:${e.to.id}`);
        }
      }
    } else {
      console.log(JSON.stringify(r, null, 2));
    }
    break;
  }
  case 'graph-hubs': {
    // siftcoder graph-hubs [--limit N] [--kind file|symbol|...] [--json]
    const lIdx = args.indexOf('--limit');
    const kIdx = args.indexOf('--kind');
    const r = await rpc({
      kind: 'graph_hubs',
      limit: lIdx >= 0 ? parseInt(args[lIdx + 1] ?? '20', 10) : 20,
      nodeKind: kIdx >= 0 ? args[kIdx + 1] : undefined,
    }, 15000);
    if (r.ok && !args.includes('--json')) {
      for (const h of r.data.hubs ?? []) {
        console.log(`  deg=${h.degree}  out=${h.outDegree}  in=${h.inDegree}  ${h.node.kind}:${h.node.id}`);
      }
    } else {
      console.log(JSON.stringify(r, null, 2));
    }
    break;
  }
  case 'capture': {
    // Used by `siftcoder hooks install` PostToolUse hook — receives JSON payload via stdin
    // and forwards to the daemon as a capture RPC. Falls back to direct Storage write when
    // the daemon is unreachable so a transient daemon-down doesn't lose the event.
    let session, tool, ttlMs;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--session') session = args[++i];
      else if (args[i] === '--tool') tool = args[++i];
      else if (args[i] === '--ttl-ms') ttlMs = parseInt(args[++i] ?? '0', 10);
    }
    const usePayloadStdin = args.includes('--payload-stdin');
    let payload = {};
    if (usePayloadStdin) {
      try {
        const raw = fs.readFileSync(0, 'utf8');
        payload = raw ? JSON.parse(raw) : {};
      } catch { /* ignore malformed stdin */ }
    } else {
      const pIdx = args.indexOf('--payload');
      if (pIdx >= 0) {
        try { payload = JSON.parse(args[pIdx + 1] ?? '{}'); } catch { /* ignore */ }
      }
    }
    const req = {
      kind: 'capture',
      sessionId: session ?? 'cli',
      tool: tool ?? 'CliCapture',
      payload,
      source: 'cli',
      ...(ttlMs && ttlMs > 0 ? { ttlMs } : {}),
    };
    try {
      const r = await rpc(req, 5000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const id = await storage.recordEvent({
      ts: Date.now(),
      sessionId: req.sessionId,
      tool: req.tool,
      payload: req.payload,
      ...(ttlMs && ttlMs > 0 ? { ttlMs } : {}),
    });
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: { id, fallback: 'local' } }, null, 2));
    break;
  }
  case 'maintenance': case 'gc': {
    // One-shot nightly: sweep_expired + compact + auto_pin_patterns. Cheap; safe to cron.
    const out = {};
    try {
      const sweep = await rpc({ kind: 'sweep_expired' }, 30000);
      out.swept = sweep.ok ? sweep.data.removed : 'err';
      const compact = await rpc({ kind: 'compact' }, 120000);
      out.compact = compact.ok ? compact.data : 'err';
      const min = args.includes('--auto-pin') ? 3 : null;
      if (min !== null) {
        const pin = await rpc({ kind: 'auto_pin_patterns', minRepeats: min }, 60000);
        out.autoPin = pin.ok ? pin.data : 'err';
      }
      console.log(JSON.stringify({ ok: true, data: out }, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    console.error('maintenance requires the daemon');
    process.exit(1);
  }
  case 'session-digest': case 'digest': {
    const sessionId = args.find(a => !a.startsWith('--'));
    if (!sessionId) { console.error('usage: siftcoder session-digest <session-id> [--limit N]'); process.exit(1); }
    const lIdx = args.indexOf('--limit');
    const limit = lIdx >= 0 ? parseInt(args[lIdx + 1] ?? '50', 10) : 50;
    try {
      const r = await rpc({ kind: 'session_digest', sessionId, limit }, 30000);
      if (r.ok && !args.includes('--json')) {
        const d = r.data;
        console.log(`session ${d.sessionId}  summaries=${d.summaryCount}/${d.eventCount} events  ${d.firstTs ?? '?'} → ${d.lastTs ?? '?'}\n`);
        console.log(d.text);
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.sessionDigest(sessionId, limit);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: r }, null, 2));
    break;
  }
  case 'auto-pin-patterns': {
    const minIdx = args.indexOf('--min');
    const min = minIdx >= 0 ? parseInt(args[minIdx + 1] ?? '3', 10) : 3;
    try {
      const r = await rpc({ kind: 'auto_pin_patterns', minRepeats: min }, 30000);
      console.log(JSON.stringify(r, null, 2));
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.autoPinPatterns(min);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: r }, null, 2));
    break;
  }
  case 'hooks': {
    // Bootstrap a settings.json snippet that hooks PostToolUse → mem_capture for each tool.
    // Writes to .claude/settings.local.json under the current cwd.
    const sub = args[0];
    if (sub !== 'install' && sub !== 'show') {
      console.error('usage: siftcoder hooks <install|show>');
      process.exit(1);
    }
    const sessionEnv = '${CLAUDE_SESSION_ID:-cli}';
    const captureCmd = `node ${path.join(ROOT, 'bin', 'siftcoder.mjs')} capture --session "${sessionEnv}" --tool "$CLAUDE_TOOL" --payload-stdin || true`;
    const snippet = {
      hooks: {
        PostToolUse: [{
          matcher: 'Write|Edit|Bash|Read|Grep|Glob',
          hooks: [{
            type: 'command',
            command: `jq -c '{ tool_input, tool_response }' | ${captureCmd}`,
          }],
        }],
      },
    };
    if (sub === 'show') {
      console.log(JSON.stringify(snippet, null, 2));
      break;
    }
    // install: merge into .claude/settings.local.json under cwd
    const settingsPath = path.join(process.cwd(), '.claude', 'settings.local.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    let existing = {};
    if (fs.existsSync(settingsPath)) {
      try { existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { existing = {}; }
    }
    existing.hooks = existing.hooks ?? {};
    existing.hooks.PostToolUse = existing.hooks.PostToolUse ?? [];
    // Skip if already installed (matcher + command match)
    const already = existing.hooks.PostToolUse.some(h =>
      h.matcher === snippet.hooks.PostToolUse[0].matcher &&
      h.hooks?.some(x => x.command === snippet.hooks.PostToolUse[0].hooks[0].command)
    );
    if (!already) {
      existing.hooks.PostToolUse.push(snippet.hooks.PostToolUse[0]);
    }
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2));
    console.log(JSON.stringify({ ok: true, file: settingsPath, alreadyInstalled: already }, null, 2));
    break;
  }
  case 'context-budget': case 'ctx': {
    const tokIdx = args.indexOf('--max-tokens');
    const maxTokens = tokIdx >= 0 ? parseInt(args[tokIdx + 1] ?? '4000', 10) : 4000;
    const query = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--max-tokens').join(' ');
    if (!query) { console.error('usage: siftcoder context-budget <query> [--max-tokens N]'); process.exit(1); }
    try {
      const r = await rpc({ kind: 'context_budget', query, maxTokens }, 30000);
      if (r.ok && !args.includes('--json')) {
        console.log(`tokens used ${r.data.tokensUsed} / ${r.data.tokensBudget}\n`);
        for (const h of r.data.hits ?? []) {
          const txt = h.text.length > 120 ? h.text.slice(0, 120) + '...' : h.text;
          console.log(`#${h.id}  ${h.score.toFixed(4)}  [${h.tool ?? '?'}]  (${h.tokens}t)  ${txt}`);
        }
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    console.error('context-budget requires the daemon');
    process.exit(1);
  }
  case 'stats': {
    const w = args.includes('--day') ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    try {
      const r = await rpc({ kind: 'stats', windowMs: w }, 30000);
      if (r.ok && !args.includes('--json')) {
        const d = r.data;
        const lines = [];
        const c = d.counts;
        lines.push(`counts      events=${c.events} raw=${c.raw} summarized=${c.summarized} skipped=${c.skipped} summaries=${c.summaries}`);
        lines.push(`throughput  events/min=${d.throughput.eventsPerMin.toFixed(2)} summaries/min=${d.throughput.summariesPerMin.toFixed(2)} (window=${(d.throughput.windowMs/60000).toFixed(0)}m)`);
        lines.push(`backlog     pending=${d.backlog.pending} eta=${d.backlog.etaSec ? d.backlog.etaSec + 's' : 'n/a (no drain throughput)'}`);
        lines.push(`cache       hitRate=${(d.cacheHitRate * 100).toFixed(1)}%`);
        lines.push(`top tools   ${d.topTools.slice(0,5).map(t => t.tool + '=' + t.count).join(', ')}`);
        console.log(lines.join('\n'));
      } else {
        console.log(JSON.stringify(r, null, 2));
      }
      break;
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    const { storage } = await openStorage();
    const r = await storage.stats(w);
    await storage.close();
    console.log(JSON.stringify({ ok: true, data: r }, null, 2));
    break;
  }
  case 'search': {
    const query = args.filter(a => !a.startsWith('--')).join(' ');
    if (!query) { console.error('usage: siftcoder search <query> [--k N]'); process.exit(1); }
    const kIdx = args.indexOf('--k');
    const k = kIdx >= 0 ? parseInt(args[kIdx + 1] ?? '5', 10) : 5;
    try {
      const r = await rpc({ kind: 'search', query, k }, 30000);
      if (r.ok) {
        if (args.includes('--json')) {
          console.log(JSON.stringify(r.data, null, 2));
        } else {
          for (const h of r.data.hits ?? []) {
            const snip = h.text.length > 120 ? h.text.slice(0, 120) + '...' : h.text;
            console.log(`#${h.id}  ${(h.score ?? 0).toFixed(4)}  [${h.tool ?? '?'}]  ${snip}`);
          }
        }
        break;
      }
    } catch (e) {
      if (e.message && !e.message.includes('ENOENT') && !e.message.includes('ECONNREFUSED')) throw e;
    }
    console.error('search requires the daemon to be running');
    process.exit(1);
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
  siftcoder prune [--days N] [--superseded]  drop skipped events older than N days; --superseded also drops dedup losers
  siftcoder retry [N]           re-queue skipped events for another drain pass (optionally first N)
  siftcoder pin <summaryId>     mark a summary as user-curated (exempt from supersede, decay-resistant)
  siftcoder unpin <summaryId>   remove the curation mark
  siftcoder pinned [N]          list the most-recently pinned summaries (default 100)
  siftcoder doctor [--json] [--heal]  health check; --heal repairs vec0 drift
  siftcoder export <file>       dump events + summaries + embeddings + provenance to ndjson
  siftcoder import <file>       load an ndjson snapshot (idempotent, INSERT OR IGNORE)
  siftcoder search <query> [--k N] [--json]  hybrid search via the daemon
  siftcoder federate-search <query> [--k N] [--prefix X] [--max-ws N]  cross-workspace federated search
  siftcoder symbol-search <kind:name | term> [--k N] [--json]  match events by extracted symbol
  siftcoder stats [--day] [--json]  throughput + backlog ETA + cache hit rate + top tools
  siftcoder watch [interval-s]  live one-line dashboard (default 2s); Ctrl+C to exit
  siftcoder context-budget <query> [--max-tokens N]  greedy fill: top-ranked summaries under a token cap
  siftcoder compact [--cache-days N]  storage hygiene: VACUUM + cache prune + FTS rebuild
  siftcoder patterns [--min N]  recurring input_hash buckets across sessions
  siftcoder session-digest <id> [--limit N]  concat session summaries into one text digest
  siftcoder auto-pin-patterns [--min N]  pin every summary belonging to a recurring pattern
  siftcoder hooks <install|show>  manage PostToolUse capture hook in .claude/settings.local.json
  siftcoder capture --session ID --tool T (--payload-stdin | --payload JSON)  push a capture into the daemon
  siftcoder maintenance [--auto-pin]  nightly: sweep_expired + compact (+ optional auto-pin patterns)
  siftcoder dashboard [--json]  one-shot combined view (stats + doctor + pinned + patterns)
  siftcoder sessions [--limit N] [--json]  list session ids with first/last ts + event count
  siftcoder auth-token [--rotate]  print (or rotate) the web UI bearer token
  siftcoder web                 print web UI URL
`);
}