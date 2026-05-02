/**
 * Google Gemini generateContent API client implementing ModelClient.
 *
 * Selected first in the drain-backend cascade when GEMINI_API_KEY (or
 * SIFTCODER_GEMINI_API_KEY) is present. Uses the v1beta REST endpoint with
 * no SDK dependency — only Node 18+ global fetch required.
 *
 * Default model: gemini-2.0-flash (fast, cheap, strong instruction-following).
 * Override via SIFTCODER_GEMINI_MODEL env var.
 */
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export interface GeminiClientOptions {
  apiKey?: string;
  model?: string;
  /** Override fetch for tests. */
  fetchImpl?: typeof fetch;
  /** Retry on 5xx / network errors. Default 1 (single retry). */
  maxRetries?: number;
  /** Override base URL for tests. */
  apiBase?: string;
}

interface GeminiPart {
  text?: string;
}
interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}
interface GeminiCandidate {
  content?: GeminiContent;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { code: number; message: string; status: string };
}

export class GeminiClient implements ModelClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private readonly apiBase: string;

  constructor(opts: GeminiClientOptions = {}) {
    const key = opts.apiKey ?? process.env['SIFTCODER_GEMINI_API_KEY'] ?? process.env['GEMINI_API_KEY'];
    if (!key) {
      throw new Error('GeminiClient: no API key (set SIFTCODER_GEMINI_API_KEY or GEMINI_API_KEY)');
    }
    this.apiKey = key;
    this.model = opts.model ?? process.env['SIFTCODER_GEMINI_MODEL'] ?? DEFAULT_MODEL;
    /* c8 ignore next -- production path uses globalThis.fetch; tests always inject fetchImpl */
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.maxRetries = opts.maxRetries ?? 1;
    this.apiBase = opts.apiBase ?? API_BASE;
  }

  static available(env: NodeJS.ProcessEnv = process.env): boolean {
    return Boolean(env['SIFTCODER_GEMINI_API_KEY'] || env['GEMINI_API_KEY']);
  }

  async generate(req: ModelRequest): Promise<ModelResult> {
    const model = this.model;
    const url = `${this.apiBase}/${model}:generateContent?key=${this.apiKey}`;

    const body = JSON.stringify({
      systemInstruction: req.system ? { parts: [{ text: req.system }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: req.user }] }],
      generationConfig: {
        maxOutputTokens: req.maxTokens,
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    let attempt = 0;
    let lastErr: Error | null = null;
    while (attempt <= this.maxRetries) {
      try {
        const res = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
        if (res.status >= 500) {
          lastErr = new Error(`gemini api ${res.status}`);
          attempt++;
          continue;
        }
        const json = (await res.json()) as GeminiResponse;
        if (!res.ok || json.error) {
          throw new Error(`gemini api error: ${json.error?.message ?? res.statusText}`);
        }
        const text = (json.candidates?.[0]?.content?.parts ?? [])
          .map(p => p.text ?? '')
          .join('');
        return {
          text,
          tokensIn: json.usageMetadata?.promptTokenCount ?? null,
          tokensOut: json.usageMetadata?.candidatesTokenCount ?? null,
        };
      } catch (e) {
        lastErr = e as Error;
        attempt++;
      }
    }
    /* c8 ignore next -- while-loop guarantees at least one assignment to lastErr before throw */
    throw lastErr ?? new Error('gemini api: unknown error');
  }
}
