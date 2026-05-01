import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.SIFTCODER_NS;
    delete process.env.SIFTCODER_DRAIN_BACKEND;
    delete process.env.SIFTCODER_EMBEDDER;
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('returns defaults when no overrides', () => {
    const cfg = loadConfig({ pluginRoot: '' });
    expect(cfg.namespace).toBe('default');
    expect(cfg.memory.drainBackend).toBe('auto');
    expect(cfg.memory.embedder).toBe('auto');
    expect(cfg.memory.retrieval.rrfK).toBe(60);
  });

  it('respects env overrides', () => {
    process.env.SIFTCODER_NS = 'test';
    process.env.SIFTCODER_DRAIN_BACKEND = 'ollama';
    process.env.SIFTCODER_EMBEDDER = 'deterministic';
    const cfg = loadConfig({ pluginRoot: '' });
    expect(cfg.namespace).toBe('test');
    expect(cfg.memory.drainBackend).toBe('ollama');
    expect(cfg.memory.embedder).toBe('deterministic');
  });

  it('preserves nested defaults when partially overridden', () => {
    process.env.SIFTCODER_DRAIN_BACKEND = 'anthropic';
    const cfg = loadConfig({ pluginRoot: '' });
    expect(cfg.memory.drainBackend).toBe('anthropic');
    expect(cfg.memory.embedderCascade).toEqual(['ollama', 'cdg', 'deterministic']);
    expect(cfg.memory.decay.halfLifeDays).toBe(7);
  });
});
