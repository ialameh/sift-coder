import { describe, it, expect } from 'vitest';
import { McpSamplingClient, type SamplingRequestParams, type SamplingResponse, type SamplingTransport } from './sampling-client.js';

class FakeTransport implements SamplingTransport {
  calls: SamplingRequestParams[] = [];
  scripted: SamplingResponse[] = [];
  async requestSampling(p: SamplingRequestParams): Promise<SamplingResponse> {
    this.calls.push(p);
    if (this.scripted.length === 0) throw new Error('no script');
    return this.scripted.shift()!;
  }
}

describe('McpSamplingClient', () => {
  it('forwards a ModelRequest as a sampling/createMessage params object', async () => {
    const t = new FakeTransport();
    t.scripted.push({ role: 'assistant', content: { type: 'text', text: 'hi' } });
    const c = new McpSamplingClient(t);
    const r = await c.generate({ model: 'claude-haiku-4-5', system: 'sys', user: 'usr', maxTokens: 128 });
    expect(r.text).toBe('hi');
    expect(r.tokensIn).toBeNull();
    expect(r.tokensOut).toBeNull();
    expect(t.calls[0]!.systemPrompt).toBe('sys');
    expect(t.calls[0]!.messages[0]!.content.text).toBe('usr');
    expect(t.calls[0]!.maxTokens).toBe(128);
    expect(t.calls[0]!.temperature).toBe(0);
    expect(t.calls[0]!.modelPreferences?.hints?.[0]?.name).toBe('claude-haiku-4-5');
  });

  it('returns empty text when the host omits the text field', async () => {
    const t = new FakeTransport();
    t.scripted.push({ role: 'assistant', content: { type: 'text', text: '' } });
    const c = new McpSamplingClient(t);
    const r = await c.generate({ model: 'm', system: '', user: 'u', maxTokens: 32 });
    expect(r.text).toBe('');
  });

  it('coerces missing text to empty string', async () => {
    const t = new FakeTransport();
    t.scripted.push({ role: 'assistant', content: { type: 'text' } as unknown as { type: 'text'; text: string } });
    const c = new McpSamplingClient(t);
    const r = await c.generate({ model: 'm', system: '', user: 'u', maxTokens: 32 });
    expect(r.text).toBe('');
  });

  it('propagates transport errors', async () => {
    const t = new FakeTransport();
    const c = new McpSamplingClient(t);
    await expect(c.generate({ model: 'm', system: '', user: 'u', maxTokens: 32 })).rejects.toThrow();
  });
});
