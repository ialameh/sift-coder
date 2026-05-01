/**
 * Edge-side redaction. Runs before any persistence.
 * Strips <private>...</private> blocks and masks high-confidence secrets.
 */

const PRIVATE_TAG = /<private>[\s\S]*?<\/private>/g;

interface RedactionRule {
  name: string;
  pattern: RegExp;
  mask: string;
}

const RULES: RedactionRule[] = [
  { name: 'aws-access-key',  pattern: /\bAKIA[0-9A-Z]{16}\b/g,                              mask: '[REDACTED:aws]' },
  { name: 'github-token',    pattern: /\bghp_[A-Za-z0-9]{36}\b/g,                           mask: '[REDACTED:github]' },
  { name: 'anthropic-key',   pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,                     mask: '[REDACTED:anthropic]' },
  { name: 'openai-key',      pattern: /\bsk-[A-Za-z0-9]{32,}\b/g,                           mask: '[REDACTED:openai]' },
  { name: 'bearer-token',    pattern: /\b[Bb]earer\s+[A-Za-z0-9._~+/=-]{20,}/g,             mask: 'Bearer [REDACTED]' },
  { name: 'jwt',             pattern: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, mask: '[REDACTED:jwt]' },
  { name: 'email',           pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, mask: '[REDACTED:email]' },
  { name: 'phone',           pattern: /\b\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, mask: '[REDACTED:phone]' },
];

export interface RedactionResult {
  text: string;
  hits: Record<string, number>;
}

export function redactString(input: string): RedactionResult {
  const hits: Record<string, number> = {};
  let text = input.replace(PRIVATE_TAG, () => {
    hits['private-tag'] = (hits['private-tag'] ?? 0) + 1;
    return '[REDACTED:private]';
  });
  for (const rule of RULES) {
    text = text.replace(rule.pattern, () => {
      hits[rule.name] = (hits[rule.name] ?? 0) + 1;
      return rule.mask;
    });
  }
  return { text, hits };
}

export function redact<T>(value: T): { value: T; hits: Record<string, number> } {
  const totalHits: Record<string, number> = {};
  const merge = (h: Record<string, number>) => {
    for (const k of Object.keys(h)) totalHits[k] = (totalHits[k] ?? 0) + h[k]!;
  };
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const r = redactString(v);
      merge(r.hits);
      return r.text;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v !== null && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) out[k] = walk(val);
      return out;
    }
    return v;
  };
  return { value: walk(value) as T, hits: totalHits };
}
