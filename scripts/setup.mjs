#!/usr/bin/env node
// Interactive setup: probes Ollama, captures Anthropic key, writes ~/.siftcoder/v3/config.json.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const NS = process.env.SIFTCODER_NS || 'v3';
const CONFIG_DIR = path.join(os.homedir(), '.siftcoder', NS);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

async function probeOllama() {
  try {
    const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

export async function run({ nonInteractive = !stdin.isTTY } = {}) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname || path.dirname(new URL(import.meta.url).pathname), '..', 'package.json'), 'utf8'));
  console.log(`SiftCoder v${pkg.version} setup`);
  console.log('='.repeat(`SiftCoder v${pkg.version} setup`.length));

  const rl = nonInteractive ? null : readline.createInterface({ input: stdin, output: stdout });

  const ollama = await probeOllama();
  console.log(`Ollama at http://localhost:11434: ${ollama ? 'reachable ✓' : 'not reachable'}`);

  let anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  if (!anthropicKey && rl) {
    const a = await rl.question('ANTHROPIC_API_KEY (blank to skip): ');
    anthropicKey = a.trim();
  } else if (!anthropicKey && nonInteractive) {
    console.log('ANTHROPIC_API_KEY: not set (non-interactive mode; export the env var to capture)');
  }

  const cfg = {
    siftcoder: {
    namespace: NS,
      memory: {
        drainBackend: ollama ? 'ollama' : anthropicKey ? 'anthropic' : 'sampling',
        embedder: ollama ? 'ollama' : 'deterministic',
      },
      ollama: {
        endpoint: 'http://localhost:11434',
        embedModel: 'nomic-embed-text',
        summarizeModel: 'llama3.2:3b',
      },
      anthropic: { hasKey: Boolean(anthropicKey) },
    },
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  console.log(`\nWrote ${CONFIG_FILE}`);
  console.log(`Recommended drain backend: ${cfg.siftcoder.memory.drainBackend}`);
  console.log(`Recommended embedder:     ${cfg.siftcoder.memory.embedder}`);
  console.log('\nNext: run `siftcoder start` (or restart Claude Code).');
  if (rl) rl.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await run();
}
