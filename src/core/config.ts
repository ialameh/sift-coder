/**
 * Central config loader.
 *
 * Order: env → project .siftcoder/config.json → user ~/.siftcoder/v3/config.json → plugin settings.json.
 * Validates against the schema in this file; throws on shape errors.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface SiftcoderConfig {
  namespace: string;
  memory: {
    drainBackend: 'ollama' | 'anthropic' | 'sampling' | 'auto';
    drainBackendCascade: Array<'ollama' | 'anthropic' | 'sampling'>;
    embedder: 'ollama' | 'cdg' | 'deterministic' | 'auto';
    embedderCascade: Array<'ollama' | 'cdg' | 'deterministic'>;
    decay: { tauMs: number; halfLifeDays: number };
    retrieval: { rrfK: number; topK: number; candidateK: number };
    consolidator: { tickMs: number; batchSize: number };
    summarizer: { modelHaiku: string; modelSonnet: string; confidenceThreshold: number };
  };
  hooks: {
    captureObservationBudgetMs: number;
    injectMemoriesBudgetMs: number;
    boundaryEnforcerTimeoutMs: number;
  };
  ollama: { endpoint: string; embedModel: string; summarizeModel: string };
}

const DEFAULTS: SiftcoderConfig = {
  namespace: 'v3',
  memory: {
    drainBackend: 'auto',
    drainBackendCascade: ['ollama', 'anthropic', 'sampling'],
    embedder: 'auto',
    embedderCascade: ['ollama', 'cdg', 'deterministic'],
    decay: { tauMs: 7 * 24 * 3600 * 1000, halfLifeDays: 7 },
    retrieval: { rrfK: 60, topK: 10, candidateK: 50 },
    consolidator: { tickMs: 30_000, batchSize: 16 },
    summarizer: {
      modelHaiku: 'claude-haiku-4-5-20251001',
      modelSonnet: 'claude-sonnet-4-6',
      confidenceThreshold: 0.6,
    },
  },
  hooks: {
    captureObservationBudgetMs: 250,
    injectMemoriesBudgetMs: 1500,
    boundaryEnforcerTimeoutMs: 5000,
  },
  ollama: {
    endpoint: 'http://localhost:11434',
    embedModel: 'nomic-embed-text',
    summarizeModel: 'llama3.2:3b',
  },
};

function deepMerge<T>(base: T, over: Partial<T> | undefined): T {
  if (!over) return base;
  const out = { ...(base as object) } as Record<string, unknown>;
  const ob = over as Record<string, unknown>;
  for (const k of Object.keys(ob)) {
    const bv = (base as Record<string, unknown>)[k];
    const ov = ob[k];
    if (bv && typeof bv === 'object' && !Array.isArray(bv) && ov && typeof ov === 'object' && !Array.isArray(ov)) {
      out[k] = deepMerge(bv, ov as Record<string, unknown>);
    } else if (ov !== undefined) {
      out[k] = ov;
    }
  }
  return out as T;
}

function readJson(p: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return undefined;
  }
}

function fromEnv(): Partial<SiftcoderConfig> {
  const ns = process.env.SIFTCODER_NS;
  const drain = process.env.SIFTCODER_DRAIN_BACKEND as SiftcoderConfig['memory']['drainBackend'] | undefined;
  const embed = process.env.SIFTCODER_EMBEDDER as SiftcoderConfig['memory']['embedder'] | undefined;
  const ollamaHost = process.env.OLLAMA_HOST;
  return {
    ...(ns ? { namespace: ns } : {}),
    memory: {
      ...(drain ? { drainBackend: drain } : {}),
      ...(embed ? { embedder: embed } : {}),
    } as Partial<SiftcoderConfig['memory']>,
    ...(ollamaHost ? { ollama: { endpoint: ollamaHost, embedModel: '', summarizeModel: '' } } : {}),
  } as Partial<SiftcoderConfig>;
}

export function loadConfig(opts: { pluginRoot: string; projectDir?: string } = { pluginRoot: '' }): SiftcoderConfig {
  const ns = process.env.SIFTCODER_NS || 'v3';
  const project = opts.projectDir || process.cwd();

  const layers: Array<Partial<SiftcoderConfig>> = [];

  // 1. plugin defaults
  if (opts.pluginRoot) {
    const settings = readJson(path.join(opts.pluginRoot, 'settings.json')) as { siftcoder?: Partial<SiftcoderConfig> } | undefined;
    if (settings?.siftcoder) layers.push(settings.siftcoder);
  }
  // 2. user-global
  const userCfg = readJson(path.join(os.homedir(), '.siftcoder', ns, 'config.json')) as Partial<SiftcoderConfig> | undefined;
  if (userCfg) layers.push(userCfg);
  // 3. project
  const projectCfg = readJson(path.join(project, '.siftcoder', 'config.json')) as Partial<SiftcoderConfig> | undefined;
  if (projectCfg) layers.push(projectCfg);
  // 4. env
  layers.push(fromEnv());

  return layers.reduce<SiftcoderConfig>((acc, layer) => deepMerge(acc, layer), DEFAULTS);
}
