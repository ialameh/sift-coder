/**
 * Zhipu AI GLM client implementing ModelClient.
 *
 * Default and first in the drain-backend cascade. glm-4-flash is free
 * (10M tokens/month) with no per-day hard cap, making it more reliable than
 * Gemini's exhaustible free tier.
 *
 * Uses the OpenAI-compatible endpoint at open.bigmodel.cn — no SDK required.
 * Default model: glm-4-flash. Override via SIFTCODER_GLM_MODEL.
 * API key: GLM_API_KEY or ZHIPUAI_API_KEY (or SIFTCODER_GLM_API_KEY to scope budget).
 */
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-4.5-air';

export interface GlmClientOptions {
  apiKey?: string;
  model?: string;
  /** Override fetch for tests. */
  fetchImpl?: typeof fetch;
  /** Retry on 5xx / network errors. Default 1. */
  maxRetries?: number;
  /** Override base URL for tests. */
  apiUrl?: string;
  /** Override process.env for tests (key resolution). */
  env?: NodeJS.ProcessEnv;
}

interface GlmMessage {
  role: string;
  content: string;
}

interface GlmResponse {
  choices?: Array<{ message?: GlmMessage; finish_reason?: string }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { code: string | number; message: string };
}

export class GlmClient implements ModelClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private readonly apiUrl: string;

  constructor(opts: GlmClientOptions = {}) {
    const env = opts.env ?? process.env;
    const key = opts.apiKey
      ?? env['SIFTCODER_GLM_API_KEY']
      ?? env['GLM_API_KEY']
      ?? env['ZHIPUAI_API_KEY'];
    if (!key) {
      throw new Error('GlmClient: no API key (set GLM_API_KEY or ZHIPUAI_API_KEY)');
    }
    this.apiKey = key;
    this.model = opts.model ?? process.env['SIFTCODER_GLM_MODEL'] ?? DEFAULT_MODEL;
    /* c8 ignore next -- production path uses globalThis.fetch; tests always inject fetchImpl */
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.maxRetries = opts.maxRetries ?? 1;
    this.apiUrl = opts.apiUrl ?? API_URL;
  }

  static available(env: NodeJS.ProcessEnv = process.env): boolean {
    return Boolean(
      env['SIFTCODER_GLM_API_KEY'] || env['GLM_API_KEY'] || env['ZHIPUAI_API_KEY'],
    );
  }

  async generate(req: ModelRequest): Promise<ModelResult> {
    const messages: GlmMessage[] = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.user });

    const body = JSON.stringify({
      model: this.model,
      messages,
      max_tokens: req.maxTokens,
      temperature: 0,
    });

    let attempt = 0;
    let lastErr: Error | null = null;
    while (attempt <= this.maxRetries) {
      try {
        const res = await this.fetchImpl(this.apiUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${this.apiKey}`,
          },
          body,
        });
        if (res.status >= 500) {
          lastErr = new Error(`glm api ${res.status}`);
          attempt++;
          continue;
        }
        const json = (await res.json()) as GlmResponse;
        if (!res.ok || json.error) {
          throw new Error(`glm api error: ${json.error?.message ?? res.statusText}`);
        }
        const text = json.choices?.[0]?.message?.content ?? '';
        return {
          text,
          tokensIn: json.usage?.prompt_tokens ?? null,
          tokensOut: json.usage?.completion_tokens ?? null,
        };
      } catch (e) {
        lastErr = e as Error;
        attempt++;
      }
    }
    /* c8 ignore next */
    throw lastErr ?? new Error('glm api: unknown error');
  }
}
