/**
 * Symbol extractor for code payloads. Default implementation is regex-based — fast, no deps,
 * adequate for TS/JS/Python/Go/Rust top-level declarations. The interface allows swapping in a
 * real tree-sitter (WASM) implementation when correctness matters more than startup time.
 *
 * The extractor is idempotent and bounded: at most `maxSymbols` per call to keep payloads small.
 */

export interface ExtractOptions {
  maxSymbols?: number;
  language?: string;
}

export interface SymbolHit {
  kind: 'function' | 'class' | 'method' | 'interface' | 'type' | 'const';
  name: string;
}

export interface SymbolExtractor {
  extract(code: string, opts?: ExtractOptions): SymbolHit[];
}

export interface AsyncSymbolExtractor {
  extract(code: string, opts?: ExtractOptions & { path?: string }): Promise<SymbolHit[]>;
}

const PATTERNS: Array<{ kind: SymbolHit['kind']; re: RegExp }> = [
  { kind: 'function',  re: /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g },
  { kind: 'class',     re: /\b(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g },
  { kind: 'interface', re: /\b(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/g },
  { kind: 'type',      re: /\b(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=/g },
  { kind: 'const',     re: /\b(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\(/g },
  { kind: 'method',    re: /^\s+(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([a-z_$][\w$]*)\s*\(.*\)\s*[:{]/gm },
  { kind: 'function',  re: /\bdef\s+([A-Za-z_][\w]*)\s*\(/g },
  { kind: 'class',     re: /\bclass\s+([A-Za-z_][\w]*)\s*[:(]/g },
  { kind: 'function',  re: /\bfn\s+([A-Za-z_][\w]*)\s*\(/g },
  { kind: 'function',  re: /\bfunc\s+(?:\([^)]*\)\s+)?([A-Za-z_][\w]*)\s*\(/g },
];

const RESERVED = new Set([
  'if', 'else', 'for', 'while', 'switch', 'catch', 'try', 'return', 'throw', 'do',
  'true', 'false', 'null', 'undefined', 'new', 'this', 'super', 'await', 'async',
  'in', 'of', 'is',
]);

export class RegexSymbolExtractor implements SymbolExtractor {
  extract(code: string, opts: ExtractOptions = {}): SymbolHit[] {
    const max = opts.maxSymbols ?? 32;
    const seen = new Set<string>();
    const hits: SymbolHit[] = [];
    for (const { kind, re } of PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(code)) !== null) {
        const name = m[1]!;
        if (RESERVED.has(name)) continue;
        const key = `${kind}:${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ kind, name });
        if (hits.length >= max) return hits;
      }
    }
    return hits;
  }
}

export const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rs', '.go', '.java', '.kt', '.swift',
  '.cs', '.cpp', '.cc', '.c', '.h', '.hpp',
  '.rb', '.php', '.scala',
]);

export function looksLikeCodePath(path: string | undefined | null): boolean {
  if (!path) return false;
  const lower = path.toLowerCase();
  for (const ext of CODE_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

export function symbolList(hits: SymbolHit[]): string {
  if (hits.length === 0) return '';
  return hits.map(h => `${h.kind}:${h.name}`).join(' ');
}
