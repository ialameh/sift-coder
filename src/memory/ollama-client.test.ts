import { describe, it, expect } from 'vitest';
import { OllamaClient } from './ollama-client.js';

interface FakeResponse { ok: boolean; status: number; statusText: string; json: () => Promise<unknown>; }
function fakeFetch(impl: (req: { url: string; method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<FakeResponse>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    return impl({
      url: String(input),
      method: init?.method,
      headers: init?.headers as Record<string, string> | undefined,
      body: init?.body as string | undefined,
      signal: init?.signal as AbortSignal | undefined,
    });
  }) as unknown as typeof fetch;
}

describe('OllamaClient.available', () => {
  it('returns true when /api/tags responds 200', async () => {
    const fetchImpl = fakeFetch(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) }));
    expect(await OllamaClient.available({ fetchImpl })).toBe(true);
  });

  it('returns false when daemon is unreachable', async () => {
    const fetchImpl = fakeFetch(async () => { throw new Error('ECONNREFUSED'); });
    expect(await OllamaClient.available({ fetchImpl })).toBe(false);
  });

  it('returns false on non-200 response', async () => {
    const fetchImpl = fakeFetch(async () => ({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) }));
    expect(await OllamaClient.available({ fetchImpl })).toBe(false);
  });

  it('honors a custom host', async () => {
    let seen = '';
    const fetchImpl = fakeFetch(async req => { seen = req.url; return { ok: true, status: 200, statusText: 'OK', json: async () => ({}) }; });
    await OllamaClient.available({ fetchImpl, host: 'http://192.168.1.10:11434' });
    expect(seen).toBe('http://192.168.1.10:11434/api/tags');
  });

  it('strips trailing slash from host', async () => {
    let seen = '';
    const fetchImpl = fakeFetch(async req => { seen = req.url; return { ok: true, status: 200, statusText: 'OK', json: async () => ({}) }; });
    await OllamaClient.available({ fetchImpl, host: 'http://localhost:11434/' });
    expect(seen).toBe('http://localhost:11434/api/tags');
  });
});

describe('OllamaClient.generate', () => {
  it('posts to /api/generate with model + prompt + format=json + stream=false', async () => {
    let captured: { url: string; body: string } | null = null;
    const client = new OllamaClient({
      model: 'llama3.2:3b',
      fetchImpl: fakeFetch(async req => {
        captured = { url: req.url, body: req.body ?? '' };
        return { ok: true, status: 200, statusText: 'OK', json: async () => ({ response: '{"text":"x","confidence":0.8}', prompt_eval_count: 10, eval_count: 6 }) };
      }),
    });
    const r = await client.generate({ model: 'ignored', system: 'sys', user: 'u', maxTokens: 40 });
    expect(r.text).toBe('{"text":"x","confidence":0.8}');
    expect(r.tokensIn).toBe(10);
    expect(r.tokensOut).toBe(6);
    expect(captured!.url).toBe('http://localhost:11434/api/generate');
    const sentBody = JSON.parse(captured!.body) as { model: string; prompt: string; stream: boolean; format: string };
    expect(sentBody.model).toBe('llama3.2:3b');
    expect(sentBody.prompt).toBe('sys\n\nu');
    expect(sentBody.stream).toBe(false);
    expect(sentBody.format).toBe('json');
  });

  it('uses user only when system is empty', async () => {
    let body = '';
    const client = new OllamaClient({
      model: 'llama3.2:3b',
      fetchImpl: fakeFetch(async req => {
        body = req.body ?? '';
        return { ok: true, status: 200, statusText: 'OK', json: async () => ({ response: 'r' }) };
      }),
    });
    await client.generate({ model: 'm', system: '', user: 'just-user', maxTokens: 10 });
    expect(JSON.parse(body).prompt).toBe('just-user');
  });

  it('falls back to llama3.2:3b when no model override is configured', async () => {
    let sentModel = '';
    const client = new OllamaClient({
      fetchImpl: fakeFetch(async req => {
        sentModel = JSON.parse(req.body ?? '{}').model;
        return { ok: true, status: 200, statusText: 'OK', json: async () => ({ response: 'r' }) };
      }),
    });
    await client.generate({ model: 'ignored', system: '', user: 'u', maxTokens: 10 });
    expect(sentModel).toBe('llama3.2:3b');
  });

  it('reads SIFTCODER_OLLAMA_MODEL from env when no constructor override', async () => {
    const orig = process.env['SIFTCODER_OLLAMA_MODEL'];
    process.env['SIFTCODER_OLLAMA_MODEL'] = 'qwen2.5:3b';
    try {
      let sentModel = '';
      const client = new OllamaClient({
        fetchImpl: fakeFetch(async req => {
          sentModel = JSON.parse(req.body ?? '{}').model;
          return { ok: true, status: 200, statusText: 'OK', json: async () => ({ response: 'r' }) };
        }),
      });
      await client.generate({ model: 'ignored', system: '', user: 'u', maxTokens: 10 });
      expect(sentModel).toBe('qwen2.5:3b');
    } finally {
      if (orig === undefined) delete process.env['SIFTCODER_OLLAMA_MODEL'];
      else process.env['SIFTCODER_OLLAMA_MODEL'] = orig;
    }
  });

  it('throws on non-OK HTTP response', async () => {
    const client = new OllamaClient({
      fetchImpl: fakeFetch(async () => ({ ok: false, status: 503, statusText: 'unavailable', json: async () => ({}) })),
    });
    await expect(client.generate({ model: 'm', system: '', user: 'u', maxTokens: 10 })).rejects.toThrow(/ollama api 503/);
  });

  it('returns null token counts when daemon omits usage', async () => {
    const client = new OllamaClient({
      fetchImpl: fakeFetch(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({ response: 'r' }) })),
    });
    const r = await client.generate({ model: 'm', system: '', user: 'u', maxTokens: 10 });
    expect(r.tokensIn).toBeNull();
    expect(r.tokensOut).toBeNull();
  });

  it('returns empty text when response field is missing', async () => {
    const client = new OllamaClient({
      fetchImpl: fakeFetch(async () => ({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) })),
    });
    const r = await client.generate({ model: 'm', system: '', user: 'u', maxTokens: 10 });
    expect(r.text).toBe('');
  });
});
