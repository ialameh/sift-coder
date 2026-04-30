import { describe, it, expect } from 'vitest';
import { redactString, redact } from './privacy.js';

describe('redactString', () => {
  it('strips <private> tags including their contents', () => {
    const r = redactString('keep <private>secret</private> tail');
    expect(r.text).toBe('keep [REDACTED:private] tail');
    expect(r.hits['private-tag']).toBe(1);
  });

  it('masks AWS access keys, GitHub tokens, Anthropic and OpenAI keys', () => {
    const input = 'AKIAABCDEFGHIJKLMNOP ghp_' + 'a'.repeat(36) + ' sk-ant-' + 'b'.repeat(30) + ' sk-' + 'c'.repeat(40);
    const r = redactString(input);
    expect(r.text).toContain('[REDACTED:aws]');
    expect(r.text).toContain('[REDACTED:github]');
    expect(r.text).toContain('[REDACTED:anthropic]');
    expect(r.text).toContain('[REDACTED:openai]');
    expect(r.hits['aws-access-key']).toBe(1);
    expect(r.hits['github-token']).toBe(1);
    expect(r.hits['anthropic-key']).toBe(1);
    expect(r.hits['openai-key']).toBe(1);
  });

  it('masks Bearer tokens, JWTs, emails, and phone numbers', () => {
    const r = redactString('Authorization: Bearer abcdefghijklmnopqrstuv eyJabc.eyJdef.ghijkl me@x.io +1 415 555 1212');
    expect(r.text).toMatch(/Bearer \[REDACTED\]/);
    expect(r.text).toContain('[REDACTED:jwt]');
    expect(r.text).toContain('[REDACTED:email]');
    expect(r.text).toContain('[REDACTED:phone]');
    expect(r.hits['bearer-token']).toBe(1);
    expect(r.hits['jwt']).toBe(1);
    expect(r.hits['email']).toBe(1);
    expect(r.hits['phone']).toBe(1);
  });

  it('returns input unchanged when no rule matches', () => {
    const r = redactString('hello world');
    expect(r.text).toBe('hello world');
    expect(r.hits).toEqual({});
  });
});

describe('redact', () => {
  it('walks objects and arrays, redacting strings at any depth', () => {
    const out = redact({
      a: 'foo',
      b: ['plain', 'me@x.io'],
      c: { token: 'AKIAABCDEFGHIJKLMNOP', n: 1 },
    });
    expect(out.value).toEqual({
      a: 'foo',
      b: ['plain', '[REDACTED:email]'],
      c: { token: '[REDACTED:aws]', n: 1 },
    });
    expect(out.hits['aws-access-key']).toBe(1);
    expect(out.hits['email']).toBe(1);
  });

  it('preserves non-string primitives and null', () => {
    const out = redact({ n: 42, b: true, x: null, s: 'plain' });
    expect(out.value).toEqual({ n: 42, b: true, x: null, s: 'plain' });
    expect(out.hits).toEqual({});
  });

  it('redacts a top-level string scalar', () => {
    const out = redact('me@x.io');
    expect(out.value).toBe('[REDACTED:email]');
    expect(out.hits['email']).toBe(1);
  });
});
