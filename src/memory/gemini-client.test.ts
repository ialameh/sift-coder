import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GeminiClient } from './gemini-client.js';

const ORIGINAL = process.env['GEMINI_API_KEY'];
const ORIGINAL_S = process.env['SIFTCODER_GEMINI_API_KEY'];
const ORIGINAL_M = process.env['SIFTCODER_GEMINI_MODEL'];

beforeEach(() => {
  delete process.env['GEMINI_API_KEY'];
  delete process.env['SIFTCODER_GEMINI_API_KEY'];
  delete process.env['SIFTCODER_GEMINI_MODEL'];
});
afterEach(() => {
  if (ORIGINAL !== undefined) process.env['GEMINI_API_KEY'] = ORIGINAL; else delete process.env['GEMINI_API_KEY'];
  if (ORIGINAL_S !== undefined) process.env['SIFTCODER_GEMINI_API_KEY'] = ORIGINAL_S; else delete process.env['SIFTCODER_GEMINI_API_KEY'];
  if (ORIGINAL_M !== undefined) process.env['SIFTCODER_GEMINI_MODEL'] = ORIGINAL_M; else delete process.env['SIFTCODER_GEMINI_MODEL'];
});

function fakeFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    calls.push({ url: u, init });
    const r = handler(u, init);
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      statusText: r.status === 200 ? 'OK' : 'Err',
      json: async () => r.body,
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe('GeminiClient', () => {
  it('reports availability based on env keys', () => {
    expect(GeminiClient.available({})).toBe(false);
    expect(GeminiClient.available({ GEMINI_API_KEY: 'k' })).toBe(true);
    expect(GeminiClient.available({ SIFTCODER_GEMINI_API_KEY: 'k' })).toBe(true);
  });

  it('throws when no API key is configured', () => {
    expect(() => new GeminiClient()).toThrow(/no API key/);
  });

  it('passes the API key via x-goog-api-key header (not the URL)', async () => {
    const { fn, calls } = fakeFetch(() => ({
      status: 200,
      body: {
        candidates: [{ content: { parts: [{ text: '{"text":"ok","confidence":0.9}' }] } }],
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
      },
    }));
    const client = new GeminiClient({ apiKey: 'secret-key', fetchImpl: fn, apiBase: 'https://api.example/v1beta/models' });
    const r = await client.generate({ model: 'gemini-2.0-flash', system: 's', user: 'u', maxTokens: 100 });
    expect(r.text).toBe('{"text":"ok","confidence":0.9}');
    expect(r.tokensIn).toBe(5);
    expect(r.tokensOut).toBe(3);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.example/v1beta/models/gemini-2.0-flash:generateContent');
    expect(calls[0]!.url).not.toContain('key=');
    const headers = calls[0]!.init!.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('secret-key');
  });

  it('retries once on 5xx then surfaces the failure', async () => {
    let attempts = 0;
    const { fn } = fakeFetch(() => {
      attempts++;
      return { status: 500, body: { error: { code: 500, message: 'upstream', status: 'INTERNAL' } } };
    });
    const client = new GeminiClient({ apiKey: 'k', fetchImpl: fn, apiBase: 'https://x', maxRetries: 1 });
    await expect(client.generate({ model: 'm', system: 's', user: 'u', maxTokens: 10 })).rejects.toThrow();
    expect(attempts).toBe(2);
  });

  it('surfaces a 4xx error message verbatim', async () => {
    const { fn } = fakeFetch(() => ({
      status: 429,
      body: { error: { code: 429, message: 'quota exceeded', status: 'RESOURCE_EXHAUSTED' } },
    }));
    const client = new GeminiClient({ apiKey: 'k', fetchImpl: fn, apiBase: 'https://x', maxRetries: 0 });
    await expect(client.generate({ model: 'm', system: 's', user: 'u', maxTokens: 10 })).rejects.toThrow(/quota exceeded/);
  });

  it('honors SIFTCODER_GEMINI_MODEL override', async () => {
    process.env['SIFTCODER_GEMINI_MODEL'] = 'gemini-custom';
    const { fn, calls } = fakeFetch(() => ({
      status: 200,
      body: { candidates: [{ content: { parts: [{ text: 'x' }] } }] },
    }));
    const client = new GeminiClient({ apiKey: 'k', fetchImpl: fn, apiBase: 'https://x' });
    await client.generate({ model: 'unused', system: '', user: 'u', maxTokens: 1 });
    expect(calls[0]!.url).toContain('gemini-custom');
  });
});
