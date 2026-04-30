/**
 * ModelClient implementation that delegates LLM calls to the MCP host via the
 * `sampling/createMessage` JSON-RPC method. The host (Claude Code) executes the call under its own
 * credentials and billing — no plugin-side API key required.
 *
 * The transport is injected so unit tests can run without a real MCP connection.
 */
import type { ModelClient, ModelRequest, ModelResult } from '../daemon/summarizer.js';

export interface SamplingMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

export interface SamplingRequestParams {
  messages: SamplingMessage[];
  systemPrompt?: string;
  maxTokens: number;
  temperature?: number;
  modelPreferences?: { hints?: Array<{ name?: string }> };
}

export interface SamplingResponse {
  role: 'assistant';
  content: { type: 'text'; text: string };
  model?: string;
  stopReason?: string;
}

export interface SamplingTransport {
  requestSampling(params: SamplingRequestParams): Promise<SamplingResponse>;
}

export class McpSamplingClient implements ModelClient {
  constructor(private readonly transport: SamplingTransport) {}

  async generate(req: ModelRequest): Promise<ModelResult> {
    const res = await this.transport.requestSampling({
      messages: [{ role: 'user', content: { type: 'text', text: req.user } }],
      systemPrompt: req.system,
      maxTokens: req.maxTokens,
      temperature: 0,
      modelPreferences: { hints: [{ name: req.model }] },
    });
    return {
      text: res.content.text ?? '',
      tokensIn: null,
      tokensOut: null,
    };
  }
}
