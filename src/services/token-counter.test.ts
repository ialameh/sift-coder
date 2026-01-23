/**
 * TokenCounter Service Tests
 * Tests for token counting functionality
 */

import { TokenCounter, TokenCount } from './token-counter';

// Mock gpt-tokenizer
jest.mock('gpt-tokenizer');
const { encode } = require('gpt-tokenizer');

describe('TokenCounter', () => {
  beforeEach(() => {
    // Default mock: return 1 token per 4 characters
    encode.mockImplementation((text: string) => {
      const numTokens = Math.ceil(text.length / 4);
      return Array(numTokens).fill('mock_token');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('count', () => {
    it('should count tokens in text', () => {
      const text = 'Hello, world!';
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.method).toBe('exact');
      expect(result.characters).toBe(text.length);
    });

    it('should count tokens in empty string', () => {
      const result = TokenCounter.count('');

      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
    });

    it('should count tokens in code', () => {
      const code = 'function test() { return "hello"; }';
      const result = TokenCounter.count(code);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.method).toBe('exact');
      });

    it('should count tokens in large text', () => {
      const text = 'x'.repeat(10000);
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(10000);
    });

    it('should return exact method when using gpt-tokenizer', () => {
      const result = TokenCounter.count('test');

      expect(result.method).toBe('exact');
    });

    it('should fall back to estimation when encoder fails', () => {
      encode.mockImplementation(() => {
        throw new Error('Encoder failed');
      });

      const result = TokenCounter.count('test text');

      expect(result.method).toBe('estimate');
      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(text.length);
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界 🌍';
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(text.length);
    });

    it('should handle newlines and whitespace', () => {
      const text = 'line 1\n\nline 2\t\tline 3\r\nline 4';
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should return TokenCount interface', () => {
      const result = TokenCounter.count('test');

      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('characters');
      expect(typeof result.tokens).toBe('number');
      expect(typeof result.characters).toBe('number');
      expect(['exact', 'estimate']).toContain(result.method);
    });
  });

  describe('estimate', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'x'.repeat(350); // Should be ~100 tokens
      const result = TokenCounter.estimate(text);

      expect(result.tokens).toBe(100);
      expect(result.method).toBe('estimate');
      expect(result.characters).toBe(350);
    });

    it('should use 3.5 characters per token ratio', () => {
      const text = 'x'.repeat(35); // Should be 10 tokens
      const result = TokenCounter.estimate(text);

      expect(result.tokens).toBe(10);
    });

    it('should handle empty string', () => {
      const result = TokenCounter.estimate('');

      expect(result.tokens).toBe(0);
    });

    it('should handle small texts', () => {
      const result = TokenCounter.estimate('hi');

      expect(result.tokens).toBe(1);
    });

    it('should return estimate method', () => {
      const result = TokenCounter.estimate('test');

      expect(result.method).toBe('estimate');
    });
  });

  describe('countSafe', () => {
    it('should count tokens safely', () => {
      const result = TokenCounter.countSafe('test text');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', () => {
      encode.mockImplementation(() => {
        throw new Error('Always fails');
      });

      const result = TokenCounter.countSafe('test');

      expect(result).toBeDefined();
      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should return same result as count when successful', () => {
      const text = 'test text';
      const countResult = TokenCounter.count(text);
      const safeResult = TokenCounter.countSafe(text);

      expect(countResult).toEqual(safeResult);
    });
  });

  describe('countMultiple', () => {
    it('should count tokens in multiple texts', () => {
      const texts = ['hello', 'world', 'test'];
      const result = TokenCounter.countMultiple(texts);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe('hello'.length + 'world'.length + 'test'.length);
    });

    it('should handle empty array', () => {
      const result = TokenCounter.countMultiple([]);

      expect(result.tokens).toBe(0);
      expect(result.characters).toBe(0);
    });

    it('should handle single text in array', () => {
      const texts = ['test'];
      const result = TokenCounter.countMultiple(texts);

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should sum tokens from all texts', () => {
      const text1 = 'hello';
      const text2 = 'world';
      const texts = [text1, text2];

      const count1 = TokenCounter.count(text1);
      const count2 = TokenCounter.count(text2);
      const result = TokenCounter.countMultiple(texts);

      expect(result.tokens).toBe(count1.tokens + count2.tokens);
    });

    it('should use exact method when all counts are exact', () => {
      const texts = ['test1', 'test2', 'test3'];
      const result = TokenCounter.countMultiple(texts);

      expect(result.method).toBe('exact');
    });

    it('should use estimate method when any count is estimate', () => {
      encode.mockImplementationOnce(() => {
        throw new Error('Fail once');
      });

      const texts = ['test1', 'test2'];
      const result = TokenCounter.countMultiple(texts);

      expect(result.method).toBe('estimate');
    });

    it('should handle large number of texts', () => {
      const texts = Array(1000).fill('test text');
      const result = TokenCounter.countMultiple(texts);

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should sum characters correctly', () => {
      const texts = ['abc', 'defgh', 'ijklmno'];
      const result = TokenCounter.countMultiple(texts);

      expect(result.characters).toBe(3 + 5 + 7);
    });
  });

  describe('format', () => {
    it('should format token count for display', () => {
      const count: TokenCount = {
        tokens: 123456,
        method: 'exact',
        characters: 500000
      };

      const formatted = TokenCounter.format(count);

      expect(formatted).toContain('123,456');
      expect(formatted).toContain('tokens');
      expect(formatted).toContain('exact');
    });

    it('should format large token counts', () => {
      const count: TokenCount = {
        tokens: 1234567,
        method: 'exact',
        characters: 5000000
      };

      const formatted = TokenCounter.format(count);

      expect(formatted).toContain('1,234,567');
    });

    it('should format estimate method', () => {
      const count: TokenCount = {
        tokens: 1000,
        method: 'estimate',
        characters: 3500
      };

      const formatted = TokenCounter.format(count);

      expect(formatted).toContain('estimate');
    });

    it('should format small token counts', () => {
      const count: TokenCount = {
        tokens: 5,
        method: 'exact',
        characters: 20
      };

      const formatted = TokenCounter.format(count);

      expect(formatted).toContain('5');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long text', () => {
      const text = 'x'.repeat(1_000_000);
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBe(1_000_000);
    });

    it('should handle text with only whitespace', () => {
      const result = TokenCounter.count('   \n\n\t\t   ');

      expect(result.tokens).toBeGreaterThanOrEqual(0);
    });

    it('should handle text with mixed languages', () => {
      const text = 'Hello 世界 مرحبا Привет';
      const result = TokenCounter.count(text);

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle JSON strings', () => {
      const json = JSON.stringify({ key: 'value', nested: { item: 123 } });
      const result = TokenCounter.count(json);

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle code snippets', () => {
      const code = `
        class Test {
          constructor() {
            this.value = 0;
          }

          method() {
            return this.value;
          }
        }
      `;

      const result = TokenCounter.count(code);

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle markdown', () => {
      const markdown = `
# Heading

## Subheading

- List item 1
- List item 2

\`\`\`javascript
code here
\`\`\`
      `;

      const result = TokenCounter.count(markdown);

      expect(result.tokens).toBeGreaterThan(0);
    });
  });

  describe('Accuracy and consistency', () => {
    it('should return consistent results for same text', () => {
      const text = 'test text';

      const result1 = TokenCounter.count(text);
      const result2 = TokenCounter.count(text);

      expect(result1.tokens).toBe(result2.tokens);
      expect(result1.characters).toBe(result2.characters);
    });

    it('should be deterministic', () => {
      const text = 'deterministic test';
      const results = Array(10).fill(null).map(() => TokenCounter.count(text));

      const uniqueTokens = new Set(results.map(r => r.tokens));
      expect(uniqueTokens.size).toBe(1);
    });

    it('should count proportionally to text length', () => {
      const short = 'x'.repeat(100);
      const long = 'x'.repeat(1000);

      const shortResult = TokenCounter.count(short);
      const longResult = TokenCounter.count(long);

      expect(longResult.tokens).toBeGreaterThan(shortResult.tokens);
    });
  });

  describe('Fallback behavior', () => {
    it('should use estimation when encoder throws', () => {
      encode.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = TokenCounter.count('some text');

      expect(result.method).toBe('estimate');
      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should warn console when falling back', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      encode.mockImplementation(() => {
        throw new Error('Encoder error');
      });

      TokenCounter.count('test');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('gpt-tokenizer failed'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should count large text efficiently', () => {
      const text = 'x'.repeat(100_000);
      const start = Date.now();

      const result = TokenCounter.count(text);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle multiple texts efficiently', () => {
      const texts = Array(1000).fill('test text');
      const start = Date.now();

      const result = TokenCounter.countMultiple(texts);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.tokens).toBeGreaterThan(0);
    });
  });
});
