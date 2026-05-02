import { describe, it, expect } from 'vitest';
import { GlmClient } from './glm-client.js';

function fakeFetch(impl: (req: { url: string; headers: Record<string, string>; body: string }) => Promise<{ status: number; ok: boolean; statusText: string; json: () => Promise<unknown> }>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = (init?.body ?? '') as string;
    return impl({ url, headers, body });
  }) as unknown as typeof fetch;
}

describe('GlmClient.available', () => {
  it('returns true when GLM_API_KEY is set', () => {
    expect(GlmClient.available({ GLM_API_KEY: 'abc' })).toBe(true);
  });
  it('returns true when ZHIPUAI_API_KEY is set', () => {
    expect(GlmClient.available({ ZHIPUAI_API_KEY: 'abc' })).toBe(true);
  });
  it('returns true when SIFTCODER_GLM_API_KEY is set', () => {
    expect(GlmClient.available({ SIFTCODER_GLM_API_KEY: 'abc' })).toBe(true);
  });
  it('returns false when no key is set', () => {
    expect(GlmClient.available({})).toBe(false);
  });
});

describe('GlmClient.generate', () => {
  it('throws when no API key at construction', () => {
    expect(() => new GlmClient({ env: {}, fetchImpl: fakeFetch(async () => ({ status: 200, ok: true, statusText: 'OK', json: async () => ({}) })) })).toThrow(/no API key/);
  });

  it('posts OpenAI-compatible request with Bearer auth and returns text + token counts', async () => {
    let captured: { url: string; headers: Record<string, string>; body: string } | null = null;
    const client = new GlmClient({
      apiKey: 'test-key',
      model: 'glm-4-flash',
      fetchImpl: fakeFetch(async req => {
        captured = req;
        return {
          status: 200, ok: true, statusText: 'OK',
          json: async () => ({
            choices: [{ message: { role: 'assistant', content: 'hello' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 3 },
          }),
        };
      }),
    });
    const r = await client.generate({ model: 'glm-4-flash', system: 'sys', user: 'hi', maxTokens: 64 });
    expect(r.text).toBe('hello');
    expect(r.tokensIn).toBe(10);
    expect(r.tokensOut).toBe(3);
    expect(captured!.headers['authorization']).toBe('Bearer test-key');
    const body = JSON.parse(captured!.body);
    expect(body.model).toBe('glm-4-flash');
    expect(body.messages[0]).toMatchObject({ role: 'system', content: 'sys' });
    expect(body.messages[1]).toMatchObject({ role: 'user', content: 'hi' });
    expect(body.temperature).toBe(0);
  });

  it('omits system message when not provided', async () => {
    let captured: { body: string } | null = null;
    const client = new GlmClient({
      apiKey: 'k',
      fetchImpl: fakeFetch(async req => {
        captured = req;
        return {
          status: 200, ok: true, statusText: 'OK',
          json: async () => ({ choices: [{ message: { role: 'assistant', content: 'x' } }] }),
        };
      }),
    });
    await client.generate({ model: 'm', user: 'hello', maxTokens: 10 });
    const body = JSON.parse(captured!.body);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe('user');
  });

  it('returns null token counts when usage absent', async () => {
    const client = new GlmClient({
      apiKey: 'k',
      fetchImpl: fakeFetch(async () => ({
        status: 200, ok: true, statusText: 'OK',
        json: async () => ({ choices: [{ message: { role: 'assistant', content: 'x' } }] }),
      })),
    });
    const r = await client.generate({ model: 'm', user: 'hi', maxTokens: 10 });
    expect(r.tokensIn).toBeNull();
    expect(r.tokensOut).toBeNull();
  });

  it('returns empty string when choices is absent', async () => {
    const client = new GlmClient({
      apiKey: 'k',
      fetchImpl: fakeFetch(async () => ({
        status: 200, ok: true, statusText: 'OK',
        json: async () => ({}),
      })),
    });
    const r = await client.generate({ model: 'm', user: 'hi', maxTokens: 10 });
    expect(r.text).toBe('');
  });

  it('retries once on 5xx then succeeds', async () => {
    let calls = 0;
    const client = new GlmClient({
      apiKey: 'k',
      maxRetries: 1,
      fetchImpl: fakeFetch(async () => {
        calls++;
        if (calls === 1) return { status: 503, ok: false, statusText: 'Service Unavailable', json: async () => ({}) };
        return {
          status: 200, ok: true, statusText: 'OK',
          json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }),
        };
      }),
    });
    const r = await client.generate({ model: 'm', user: 'hi', maxTokens: 10 });
    expect(r.text).toBe('ok');
    expect(calls).toBe(2);
  });

  it('throws on API error response', async () => {
    const client = new GlmClient({
      apiKey: 'k',
      maxRetries: 0,
      fetchImpl: fakeFetch(async () => ({
        status: 400, ok: false, statusText: 'Bad Request',
        json: async () => ({ error: { code: 1002, message: 'invalid key' } }),
      })),
    });
    await expect(client.generate({ model: 'm', user: 'hi', maxTokens: 10 }))
      .rejects.toThrow('glm api error: invalid key');
  });

  it('throws after exhausting all retries', async () => {
    const client = new GlmClient({
      apiKey: 'k',
      maxRetries: 1,
      fetchImpl: fakeFetch(async () => ({ status: 500, ok: false, statusText: 'Error', json: async () => ({}) })),
    });
    await expect(client.generate({ model: 'm', user: 'hi', maxTokens: 10 }))
      .rejects.toThrow('glm api 500');
  });
});
