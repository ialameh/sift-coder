import { describe, it, expect, beforeEach } from 'vitest';
import { Summarizer, parseModelOutput, type ModelClient, type ModelRequest, type ModelResult } from './summarizer.js';
import { Storage, type DBHandle } from '../storage/storage.js';

class FakeDB implements DBHandle {
  cache = new Map<string, { text: string; tokens_in: number | null; tokens_out: number | null }>();
  summaries: Array<Record<string, unknown>> = [];
  private nextId = 1;

  exec(): void { /* noop */ }
  loadExtension(): void { throw new Error('no'); }

  prepare(sql: string) {
    const stmt = sql.trim();
    if (stmt.startsWith('SELECT text, tokens_in, tokens_out FROM summary_cache')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: (k: unknown) => this.cache.get(k as string),
        all: () => [],
      };
    }
    if (stmt.startsWith('INSERT OR REPLACE INTO summary_cache')) {
      return {
        run: (k: unknown, t: unknown, ti: unknown, to: unknown) => {
          this.cache.set(k as string, { text: t as string, tokens_in: ti as number | null, tokens_out: to as number | null });
          return { lastInsertRowid: 0 };
        },
        get: () => undefined,
        all: () => [],
      };
    }
    if (stmt.startsWith('INSERT INTO summaries')) {
      return {
        run: (...args: unknown[]) => {
          this.summaries.push({ id: this.nextId, args });
          return { lastInsertRowid: this.nextId++ };
        },
        get: () => undefined,
        all: () => [],
      };
    }
    return {
      run: () => ({ lastInsertRowid: 0 }),
      get: () => undefined,
      all: () => [],
    };
  }
}

class FakeClient implements ModelClient {
  calls: ModelRequest[] = [];
  scripted: ModelResult[] = [];
  async generate(req: ModelRequest): Promise<ModelResult> {
    this.calls.push(req);
    if (this.scripted.length === 0) throw new Error('no script left');
    return this.scripted.shift()!;
  }
}

let db: FakeDB;
let storage: Storage;
let client: FakeClient;
let sum: Summarizer;
beforeEach(async () => {
  db = new FakeDB();
  storage = await Storage.init(db);
  client = new FakeClient();
  sum = new Summarizer(storage, client, { confidenceThreshold: 0.6 });
});

describe('parseModelOutput', () => {
  it('parses well-formed JSON', () => {
    expect(parseModelOutput('{"text":"hi","confidence":0.8}')).toEqual({ text: 'hi', confidence: 0.8 });
  });

  it('extracts JSON when wrapped in prose', () => {
    expect(parseModelOutput('prefix {"text":"x","confidence":0.4} suffix')).toEqual({ text: 'x', confidence: 0.4 });
  });

  it('falls back when no braces present', () => {
    expect(parseModelOutput('plain text')).toEqual({ text: 'plain text', confidence: 0.5 });
  });

  it('falls back when JSON is malformed', () => {
    const r = parseModelOutput('{not json');
    expect(r.confidence).toBe(0.5);
  });

  it('clamps confidence to [0, 1]', () => {
    expect(parseModelOutput('{"text":"x","confidence":2}').confidence).toBe(1);
    expect(parseModelOutput('{"text":"x","confidence":-3}').confidence).toBe(0);
    expect(parseModelOutput('{"text":"x","confidence":"NaN"}').confidence).toBe(0.5);
    expect(parseModelOutput(`{"text":"x","confidence":${NaN}}`).confidence).toBe(0.5);
  });

  it('keeps original trimmed text when text field missing', () => {
    const r = parseModelOutput('{"confidence":0.9}');
    expect(r.text).toBe('{"confidence":0.9}');
    expect(r.confidence).toBe(0.9);
  });
});

describe('Summarizer.summarize', () => {
  it('uses Haiku and stops when confidence meets threshold', async () => {
    client.scripted.push({ text: '{"text":"good","confidence":0.8}', tokensIn: 10, tokensOut: 5 });
    const res = await sum.summarize(1, 'h1', 'user', 100);
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]!.model).toContain('haiku');
    expect(res.cached).toBe(false);
    expect(res.confidence).toBe(0.8);
  });

  it('escalates to Sonnet when Haiku confidence is below threshold', async () => {
    client.scripted.push({ text: '{"text":"weak","confidence":0.3}', tokensIn: 1, tokensOut: 1 });
    client.scripted.push({ text: '{"text":"strong","confidence":0.9}', tokensIn: 2, tokensOut: 2 });
    const res = await sum.summarize(1, 'h1', 'user', 100);
    expect(client.calls).toHaveLength(2);
    expect(client.calls[1]!.model).toContain('sonnet');
    expect(res.text).toBe('strong');
  });

  it('returns the cached Haiku result on second call without calling the model', async () => {
    client.scripted.push({ text: '{"text":"good","confidence":0.8}', tokensIn: 10, tokensOut: 5 });
    await sum.summarize(1, 'h1', 'user', 100);
    const second = await sum.summarize(2, 'h1', 'user', 200);
    expect(second.cached).toBe(true);
    expect(client.calls).toHaveLength(1);
  });

  it('reuses cached Sonnet output when only Sonnet is cached and Haiku escalates', async () => {
    const systemHash = (await import('./summarizer.js')).Summarizer.promptHash(
      `You compress tool-call observations into one-sentence durable memories for a coding assistant.
Output JSON only: {"text": string, "confidence": number 0..1}.
- text: <= 240 chars, concrete, contains the key fact (file path, function name, decision, error message).
- confidence: how useful this will be to recall later. 0 = trivial/no signal, 1 = critical decision or unique knowledge.
Skip fluff. No pronouns. No hedging.`
    );
    const sonnetKey = storage.cacheKey('claude-sonnet-4-6', systemHash, 'h1');
    storage.putCachedSummary(sonnetKey, '{"text":"presaved","confidence":0.95}', 9, 9, 0);
    client.scripted.push({ text: '{"text":"weak","confidence":0.3}', tokensIn: 1, tokensOut: 1 });
    const r = await sum.summarize(1, 'h1', 'user', 100);
    expect(client.calls.filter(c => c.model.includes('sonnet'))).toHaveLength(0);
    expect(r.text).toBe('presaved');
  });

  it('promptHash is stable for an unchanged system prompt', () => {
    expect(Summarizer.promptHash('x')).toBe(Summarizer.promptHash('x'));
    expect(Summarizer.promptHash('x')).not.toBe(Summarizer.promptHash('y'));
  });

  it('uses default models and threshold when no options are given', async () => {
    const s = new Summarizer(storage, client);
    client.scripted.push({ text: '{"text":"ok","confidence":0.9}', tokensIn: 1, tokensOut: 1 });
    const r = await s.summarize(1, 'h', 'u', 1);
    expect(r.model).toContain('haiku');
    expect(client.calls[0]!.maxTokens).toBe(256);
  });

  it('respects a custom confidence threshold and model overrides', async () => {
    const s2 = new Summarizer(storage, client, {
      confidenceThreshold: 0.9,
      haikuModel: 'h-x', sonnetModel: 's-x', maxTokens: 64,
    });
    client.scripted.push({ text: '{"text":"mid","confidence":0.7}', tokensIn: 1, tokensOut: 1 });
    client.scripted.push({ text: '{"text":"hi","confidence":0.95}', tokensIn: 1, tokensOut: 1 });
    const res = await s2.summarize(1, 'h', 'u', 1);
    expect(client.calls.map(c => c.model)).toEqual(['h-x', 's-x']);
    expect(client.calls[0]!.maxTokens).toBe(64);
    expect(res.text).toBe('hi');
  });
});
