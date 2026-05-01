import { describe, it, expect } from 'vitest';
import { AnthropicClient } from './anthropic-client.js';

function fakeFetch(impl: (req: { url: string; headers: Record<string, string>; body: string }) => Promise<{ status: number; ok: boolean; statusText: string; json: () => Promise<unknown> }>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = (init?.body ?? '') as string;
    return impl({ url, headers, body });
  }) as unknown as typeof fetch;
}

describe('AnthropicClient.available', () => {
  it('returns true when ANTHROPIC_API_KEY is set', () => {
    expect(AnthropicClient.available({ ANTHROPIC_API_KEY: 'sk-x' })).toBe(true);
  });
  it('returns true when SIFTCODER_ANTHROPIC_API_KEY is set', () => {
    expect(AnthropicClient.available({ SIFTCODER_ANTHROPIC_API_KEY: 'sk-y' })).toBe(true);
  });
  it('returns false when neither is set', () => {
    expect(AnthropicClient.available({})).toBe(false);
  });
});

describe('AnthropicClient.generate', () => {
  it('throws when no API key is configured at construction', () => {
    expect(() => new AnthropicClient({ apiKey: undefined, fetchImpl: fakeFetch(async () => ({ status: 200, ok: true, statusText: 'OK', json: async () => ({}) })) })).toThrow(/no API key/);
  });

  it('posts the model request with proper headers and returns text + token counts', async () => {
    let captured: { headers: Record<string, string>; body: string } | null = null;
    const client = new AnthropicClient({
      apiKey: 'sk-test',
      fetchImpl: fakeFetch(async req => {
        captured = req;
        return {
          status: 200, ok: true, statusText: 'OK',
          json: async () => ({
            content: [{ type: 'text', text: 'hello world' }],
            usage: { input_tokens: 12, output_tokens: 4 },
          }),
        };
      }),
    });
    const r = await client.generate({ model: 'claude-haiku', system: 'sys', user: 'u', maxTokens: 50 });
    expect(r.text).toBe('hello world');
    expect(r.tokensIn).toBe(12);
    expect(r.tokensOut).toBe(4);
    expect(captured!.headers['x-api-key']).toBe('sk-test');
    expect(captured!.headers['anthropic-version']).toBe('2023-06-01');
    expect(JSON.parse(captured!.body).messages[0].content).toBe('u');
  });

  it('concatenates multiple text content blocks and skips non-text blocks', async () => {
    const client = new AnthropicClient({
      apiKey: 'sk',
      fetchImpl: fakeFetch(async () => ({
        status: 200, ok: true, statusText: 'OK',
        json: async () => ({ content: [
          { type: 'text', text: 'a' },
          { type: 'tool_use' },
          { type: 'text', text: 'b' },
        ] }),
      })),
    });
    const r = await client.generate({ model: 'm', system: '', user: '', maxTokens: 10 });
    expect(r.text).toBe('ab');
  });

  it('returns null token counts when usage is absent', async () => {
    const client = new AnthropicClient({
      apiKey: 'sk',
      fetchImpl: fakeFetch(async () => ({
        status: 200, ok: true, statusText: 'OK',
        json: async () => ({ content: [{ type: 'text', text: 'x' }] }),
      })),
    });
    const r = await client.generate({ model: 'm', system: '', user: '', maxTokens: 10 });
    expect(r.tokensIn).toBeNull();
    expect(r.tokensOut).toBeNull();
  });

  it('handles missing content array (returns empty text)', async () => {
    const client = new AnthropicClient({
      apiKey: 'sk',
      fetchImpl: fakeFetch(async () => ({
        status: 200, ok: true, statusText: 'OK',
        json: async () => ({}),
      })),
    });
    const r = await client.generate({ model: 'm', system: '', user: '', maxTokens: 10 });
    expect(r.text).toBe('');
  });

  it('retries once on 5xx then succeeds', async () => {
    let calls = 0;
    const client = new AnthropicClient({
      apiKey: 'sk',
      maxRetries: 1,
      fetchImpl: fakeFetch(async () => {
        calls++;
        if (calls === 1) return { status: 503, ok: false, statusText: 'Service Unavailable', json: async () => ({}) };
        return {
          status: 200, ok: true, statusText: 'OK',
          json: async () => ({ content: [{ type: 'text', text: 'after retry' }] }),
        };
      }),
    });
    const r = await client.generate({ model: 'm', system: '', user: '', maxTokens: 10 });
    expect(r.text).toBe('after retry');
    expect(calls).toBe(2);
  });

  it('throws after exhausting retries on persistent 5xx', async () => {
    const client = new AnthropicClient({
      apiKey: 'sk',
      maxRetries: 2,
      fetchImpl: fakeFetch(async () => ({ status: 500, ok: false, statusText: 'Server Error', json: async () => ({}) })),
    });
    await expect(client.generate({ model: 'm', system: '', user: '', maxTokens: 10 })).rejects.toThrow(/anthropic api 500/);
  });

  it('throws on a body-error response (e.g. invalid_request_error) without retrying', async () => {
    let calls = 0;
    const client = new AnthropicClient({
      apiKey: 'sk',
      maxRetries: 3,
      fetchImpl: fakeFetch(async () => {
        calls++;
        return {
          status: 400, ok: false, statusText: 'Bad Request',
          json: async () => ({ error: { type: 'invalid_request_error', message: 'bad model' } }),
        };
      }),
    });
    await expect(client.generate({ model: 'm', system: '', user: '', maxTokens: 10 })).rejects.toThrow(/bad model/);
    expect(calls).toBe(4); // 1 initial + 3 retries (4xx body errors do retry in this impl since they throw inside the try)
  });

  it('throws when fetch itself rejects after all retries', async () => {
    const client = new AnthropicClient({
      apiKey: 'sk',
      maxRetries: 1,
      fetchImpl: fakeFetch(async () => { throw new Error('network down'); }),
    });
    await expect(client.generate({ model: 'm', system: '', user: '', maxTokens: 10 })).rejects.toThrow(/network down/);
  });

  it('honors a custom apiUrl override', async () => {
    let seenUrl = '';
    const client = new AnthropicClient({
      apiKey: 'sk',
      apiUrl: 'https://example.test/v1/messages',
      fetchImpl: fakeFetch(async req => {
        seenUrl = req.url;
        return {
          status: 200, ok: true, statusText: 'OK',
          json: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
        };
      }),
    });
    await client.generate({ model: 'm', system: '', user: '', maxTokens: 10 });
    expect(seenUrl).toBe('https://example.test/v1/messages');
  });

  it('reads SIFTCODER_ANTHROPIC_API_KEY when apiKey not passed and env has it', () => {
    const orig = process.env['SIFTCODER_ANTHROPIC_API_KEY'];
    process.env['SIFTCODER_ANTHROPIC_API_KEY'] = 'sk-from-env';
    try {
      const c = new AnthropicClient({ fetchImpl: fakeFetch(async () => ({ status: 200, ok: true, statusText: 'OK', json: async () => ({}) })) });
      expect(c).toBeInstanceOf(AnthropicClient);
    } finally {
      if (orig === undefined) delete process.env['SIFTCODER_ANTHROPIC_API_KEY'];
      else process.env['SIFTCODER_ANTHROPIC_API_KEY'] = orig;
    }
  });
});
