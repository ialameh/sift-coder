/**
 * Ollama-backed ModelClient. Local-first summarization: no API key, no host MCP sampling,
 * no Anthropic billing. Targets the Ollama HTTP daemon at http://localhost:11434.
 *
 * Recommended models (small, JSON-friendly):
 *   - llama3.2:3b      ~2GB, ~50 tok/s on M1, good instruction following
 *   - qwen2.5:3b       ~2GB, excellent JSON output
 *   - gemma2:2b        ~1.6GB, fastest
 *
 * Uses Ollama's `format:"json"` constrained-generation mode so the model is forced to emit
 * valid JSON matching the {text, confidence} shape the summarizer expects.
 */
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';

const DEFAULT_HOST = 'http://localhost:11434';

export interface OllamaClientOptions {
  host?: string;
  /** Override default model (one of the small models above). Used as-is. */
  model?: string;
  /** Override fetch for tests. */
  fetchImpl?: typeof fetch;
  /** Connection timeout in ms (default 30s — local model warm-up can be slow on first call). */
  timeoutMs?: number;
}

interface OllamaGenerateResponse {
  model?: string;
  response?: string;
  done?: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

export class OllamaClient implements ModelClient {
  private readonly host: string;
  private readonly modelOverride: string | null;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: OllamaClientOptions = {}) {
    this.host = (opts.host ?? process.env['SIFTCODER_OLLAMA_HOST'] ?? process.env['OLLAMA_HOST'] ?? DEFAULT_HOST).replace(/\/+$/, '');
    this.modelOverride = opts.model ?? process.env['SIFTCODER_OLLAMA_MODEL'] ?? null;
    /* c8 ignore next -- production path uses globalThis.fetch; tests inject */
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  /**
   * Probe the daemon. Returns true if Ollama is reachable at the configured host. Used by
   * the MCP server to auto-select Ollama when no explicit backend is set.
   */
  static async available(opts: OllamaClientOptions = {}): Promise<boolean> {
    const host = (opts.host ?? process.env['SIFTCODER_OLLAMA_HOST'] ?? process.env['OLLAMA_HOST'] ?? DEFAULT_HOST).replace(/\/+$/, '');
    /* c8 ignore next -- prod path uses globalThis.fetch */
    const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    const ctl = new AbortController();
    /* c8 ignore next -- abort fires only on real-network probe timeout; covered by integration */
    const timer = setTimeout(() => ctl.abort(), 1500);
    try {
      const res = await fetchImpl(`${host}/api/tags`, { signal: ctl.signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async generate(req: ModelRequest): Promise<ModelResult> {
    // Ollama's "model" doesn't accept Anthropic model names. Use the override (env or
    // constructor) — fall back to llama3.2:3b which is the most commonly-pulled small model.
    const model = this.modelOverride ?? 'llama3.2:3b';
    const prompt = req.system ? `${req.system}\n\n${req.user}` : req.user;
    const body = JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0, num_predict: req.maxTokens },
    });

    const ctl = new AbortController();
    /* c8 ignore next -- abort fires only on real-network generate timeout; covered by integration */
    const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.host}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: ctl.signal,
      });
      if (!res.ok) {
        throw new Error(`ollama api ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as OllamaGenerateResponse;
      return {
        text: json.response ?? '',
        tokensIn: json.prompt_eval_count ?? null,
        tokensOut: json.eval_count ?? null,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
