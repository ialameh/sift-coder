/**
 * Summarizer cascade: Haiku-first, escalate to Sonnet when self-eval confidence < threshold.
 * Content-hash cache (model || prompt_hash || input_hash) guarantees identical re-runs are zero-cost.
 *
 * The Anthropic SDK is called via a small interface so unit tests can inject a fake.
 */
import { createHash } from 'node:crypto';
import { Storage } from '../storage/storage.js';

export interface ModelClient {
  generate(req: ModelRequest): Promise<ModelResult>;
}

export interface ModelRequest {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
}

export interface ModelResult {
  text: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

export interface SummarizerOptions {
  haikuModel?: string;
  sonnetModel?: string;
  confidenceThreshold?: number;
  maxTokens?: number;
}

const DEFAULT_HAIKU = 'claude-haiku-4-5-20251001';
const DEFAULT_SONNET = 'claude-sonnet-4-6';

const SYSTEM = `You compress tool-call observations into one-sentence durable memories for a coding assistant.
Output JSON only: {"text": string, "confidence": number 0..1}.
- text: <= 240 chars, concrete, contains the key fact (file path, function name, decision, error message).
- confidence: how useful this will be to recall later. 0 = trivial/no signal, 1 = critical decision or unique knowledge.
Skip fluff. No pronouns. No hedging.`;

export class Summarizer {
  private readonly haiku: string;
  private readonly sonnet: string;
  private readonly threshold: number;
  private readonly maxTokens: number;

  constructor(
    private readonly storage: Storage,
    private readonly client: ModelClient,
    opts: SummarizerOptions = {}
  ) {
    this.haiku = opts.haikuModel ?? DEFAULT_HAIKU;
    this.sonnet = opts.sonnetModel ?? DEFAULT_SONNET;
    this.threshold = opts.confidenceThreshold ?? 0.6;
    this.maxTokens = opts.maxTokens ?? 256;
  }

  static promptHash(system: string): string {
    return createHash('sha256').update(system).digest('hex');
  }

  async summarize(
    eventId: number,
    inputHash: string,
    user: string,
    ts: number
  ): Promise<{ id: number; text: string; model: string; confidence: number; cached: boolean }> {
    const systemHash = Summarizer.promptHash(SYSTEM);

    const haikuKey = this.storage.cacheKey(this.haiku, systemHash, inputHash);
    const cachedHaiku = this.storage.getCachedSummary(haikuKey);
    if (cachedHaiku) {
      const parsed = parseModelOutput(cachedHaiku.text);
      const id = this.storage.recordSummary({
        eventId,
        ts,
        model: this.haiku,
        promptHash: systemHash,
        text: parsed.text,
        tokensIn: cachedHaiku.tokensIn,
        tokensOut: cachedHaiku.tokensOut,
        confidence: parsed.confidence,
      });
      return { id, text: parsed.text, model: this.haiku, confidence: parsed.confidence, cached: true };
    }

    const haiku = await this.client.generate({
      model: this.haiku,
      system: SYSTEM,
      user,
      maxTokens: this.maxTokens,
    });
    this.storage.putCachedSummary(haikuKey, haiku.text, haiku.tokensIn, haiku.tokensOut, ts);
    const haikuParsed = parseModelOutput(haiku.text);

    if (haikuParsed.confidence >= this.threshold) {
      const id = this.storage.recordSummary({
        eventId,
        ts,
        model: this.haiku,
        promptHash: systemHash,
        text: haikuParsed.text,
        tokensIn: haiku.tokensIn,
        tokensOut: haiku.tokensOut,
        confidence: haikuParsed.confidence,
      });
      return { id, text: haikuParsed.text, model: this.haiku, confidence: haikuParsed.confidence, cached: false };
    }

    const sonnetKey = this.storage.cacheKey(this.sonnet, systemHash, inputHash);
    const cachedSonnet = this.storage.getCachedSummary(sonnetKey);
    let sonnetText: string;
    let sonnetTokensIn: number | null;
    let sonnetTokensOut: number | null;
    if (cachedSonnet) {
      sonnetText = cachedSonnet.text;
      sonnetTokensIn = cachedSonnet.tokensIn;
      sonnetTokensOut = cachedSonnet.tokensOut;
    } else {
      const sonnet = await this.client.generate({
        model: this.sonnet,
        system: SYSTEM,
        user,
        maxTokens: this.maxTokens,
      });
      sonnetText = sonnet.text;
      sonnetTokensIn = sonnet.tokensIn;
      sonnetTokensOut = sonnet.tokensOut;
      this.storage.putCachedSummary(sonnetKey, sonnetText, sonnetTokensIn, sonnetTokensOut, ts);
    }
    const sonnetParsed = parseModelOutput(sonnetText);
    const id = this.storage.recordSummary({
      eventId,
      ts,
      model: this.sonnet,
      promptHash: systemHash,
      text: sonnetParsed.text,
      tokensIn: sonnetTokensIn,
      tokensOut: sonnetTokensOut,
      confidence: sonnetParsed.confidence,
    });
    return { id, text: sonnetParsed.text, model: this.sonnet, confidence: sonnetParsed.confidence, cached: false };
  }
}

export function parseModelOutput(raw: string): { text: string; confidence: number } {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    const slice = trimmed.slice(jsonStart, jsonEnd + 1);
    try {
      const obj = JSON.parse(slice) as { text?: unknown; confidence?: unknown };
      const text = typeof obj.text === 'string' ? obj.text : trimmed;
      const conf = typeof obj.confidence === 'number' ? obj.confidence : 0.5;
      return { text, confidence: clamp01(conf) };
    } catch {
      // fall through
    }
  }
  return { text: trimmed, confidence: 0.5 };
}

function clamp01(n: number): number {
  /* c8 ignore next -- JSON cannot encode NaN; defensive guard */
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
