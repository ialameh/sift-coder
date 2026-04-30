import { describe, it, expect } from 'vitest';
import { RegexSymbolExtractor, looksLikeCodePath, symbolList } from './symbols.js';

const x = new RegexSymbolExtractor();

describe('RegexSymbolExtractor', () => {
  it('extracts TypeScript function and class declarations', () => {
    const code = `
      export async function handleAuth(req: Request) {}
      function login() {}
      class UserController {}
      export class AuthService {}
    `;
    const hits = x.extract(code);
    expect(hits).toEqual(expect.arrayContaining([
      { kind: 'function', name: 'handleAuth' },
      { kind: 'function', name: 'login' },
      { kind: 'class', name: 'UserController' },
      { kind: 'class', name: 'AuthService' },
    ]));
  });

  it('extracts interfaces, types, and arrow-function consts', () => {
    const code = `
      export interface Session { id: string }
      export type Token = string;
      export const fetchUser = async (id: string) => null;
    `;
    const hits = x.extract(code);
    expect(hits).toEqual(expect.arrayContaining([
      { kind: 'interface', name: 'Session' },
      { kind: 'type', name: 'Token' },
      { kind: 'const', name: 'fetchUser' },
    ]));
  });

  it('extracts Python def and class', () => {
    const code = `
      def handle_auth(req):
          pass
      class UserController:
          pass
    `;
    const hits = x.extract(code);
    expect(hits.find(h => h.name === 'handle_auth')).toBeTruthy();
    expect(hits.find(h => h.name === 'UserController')).toBeTruthy();
  });

  it('extracts Rust fn and Go func', () => {
    const code = `
      fn handle_auth() {}
      func HandleAuth(w http.ResponseWriter, r *http.Request) {}
    `;
    const hits = x.extract(code);
    expect(hits.find(h => h.name === 'handle_auth')).toBeTruthy();
    expect(hits.find(h => h.name === 'HandleAuth')).toBeTruthy();
  });

  it('drops reserved keywords masquerading as identifiers', () => {
    expect(x.extract('def if(): pass')).toEqual([]);
    expect(x.extract('function while() {}')).toEqual([]);
  });

  it('deduplicates repeated symbols', () => {
    const code = `function foo() {}\nfunction foo() {}`;
    const hits = x.extract(code);
    expect(hits.filter(h => h.name === 'foo')).toHaveLength(1);
  });

  it('honors maxSymbols', () => {
    const code = Array.from({ length: 50 }, (_, i) => `function fn${i}() {}`).join('\n');
    expect(x.extract(code, { maxSymbols: 5 })).toHaveLength(5);
  });

  it('returns empty list for prose with no code', () => {
    expect(x.extract('this is a paragraph with no symbols.')).toEqual([]);
  });
});

describe('looksLikeCodePath', () => {
  it('matches common code extensions', () => {
    expect(looksLikeCodePath('src/foo.ts')).toBe(true);
    expect(looksLikeCodePath('/abs/x.py')).toBe(true);
    expect(looksLikeCodePath('main.RS')).toBe(true);
  });
  it('rejects non-code extensions', () => {
    expect(looksLikeCodePath('README.md')).toBe(false);
    expect(looksLikeCodePath('image.png')).toBe(false);
    expect(looksLikeCodePath('data.json')).toBe(false);
  });
  it('handles null and undefined inputs', () => {
    expect(looksLikeCodePath(null)).toBe(false);
    expect(looksLikeCodePath(undefined)).toBe(false);
    expect(looksLikeCodePath('')).toBe(false);
  });
});

describe('symbolList', () => {
  it('formats hits as kind:name space-separated', () => {
    expect(symbolList([
      { kind: 'function', name: 'a' },
      { kind: 'class', name: 'B' },
    ])).toBe('function:a class:B');
  });
  it('returns empty string for no hits', () => {
    expect(symbolList([])).toBe('');
  });
});
