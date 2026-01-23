/**
 * TokenMonitor Service Tests
 * Tests for token usage monitoring and checkpoint triggers
 */

import { TokenMonitor, TokenThresholds, TokenUsage, TokenStatus, DEFAULT_THRESHOLDS } from './token-monitor-v2';

// Mock dependencies with proper structure
jest.mock('../utils/path-utils.js', () => ({
  PathUtils: {
    getStateDir: jest.fn(() => '/test/state'),
    join: jest.fn((...args: string[]) => args.join('/'))
  }
}));

jest.mock('../utils/file-utils.js', () => ({
  FileUtils: {
    exists: jest.fn(),
    readFile: jest.fn(),
    readJSON: jest.fn(),
    writeJSON: jest.fn()
  }
}));

jest.mock('./token-counter.js', () => ({
  TokenCounter: {
    count: jest.fn((text: string) => ({
      tokens: Math.ceil(text.length / 4),
      method: 'exact',
      characters: text.length
    }))
  }
}));

const FileUtils = require('../utils/file-utils.js').FileUtils;
const PathUtils = require('../utils/path-utils.js').PathUtils;
const TokenCounter = require('./token-counter.js').TokenCounter;

describe('TokenMonitor', () => {
  let tokenMonitor: TokenMonitor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup PathUtils mock
    PathUtils.getStateDir.mockReturnValue('/test/state');
    PathUtils.join.mockImplementation((...args: string[]) => args.join('/'));

    // Setup FileUtils mock
    FileUtils.exists.mockResolvedValue(false);
    FileUtils.readFile.mockResolvedValue('');
    FileUtils.readJSON.mockResolvedValue({});
    FileUtils.writeJSON.mockResolvedValue(undefined);

    // Setup TokenCounter mock
    TokenCounter.count.mockImplementation((text: string) => ({
      tokens: Math.ceil(text.length / 4),
      method: 'exact',
      characters: text.length
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      tokenMonitor = new TokenMonitor();

      expect(tokenMonitor).toBeInstanceOf(TokenMonitor);
    });

    it('should initialize with custom state directory', () => {
      tokenMonitor = new TokenMonitor({ stateDir: '/custom/state' });

      expect(tokenMonitor).toBeInstanceOf(TokenMonitor);
    });

    it('should initialize with custom thresholds', () => {
      const customThresholds: Partial<TokenThresholds> = {
        warn: 100_000,
        checkpoint: 150_000,
        critical: 180_000
      };

      tokenMonitor = new TokenMonitor({ thresholds: customThresholds });

      expect(tokenMonitor).toBeInstanceOf(TokenMonitor);
    });

    it('should initialize with custom context window', () => {
      tokenMonitor = new TokenMonitor({ contextWindow: 100_000 });

      expect(tokenMonitor).toBeInstanceOf(TokenMonitor);
    });

    it('should merge custom thresholds with defaults', () => {
      const customThresholds: Partial<TokenThresholds> = {
        warn: 100_000
      };

      tokenMonitor = new TokenMonitor({ thresholds: customThresholds });

      // Should use custom warn, but default others
      expect(tokenMonitor).toBeInstanceOf(TokenMonitor);
    });
  });

  describe('calculateSessionTokens', () => {
    it('should calculate tokens from all state files', async () => {
      FileUtils.exists.mockImplementation((path: string) => {
        return path.includes('implementation-log') ||
               path.includes('session.json') ||
               path.includes('current-task.json');
      });

      FileUtils.readFile.mockResolvedValue('log content\n');

      tokenMonitor = new TokenMonitor();
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.tokens).toBeGreaterThan(0);
      expect(result.characters).toBeGreaterThan(0);
      expect(result.method).toBe('exact');
    });

    it('should return ok status when tokens low', async () => {
      FileUtils.exists.mockResolvedValue(false);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.status).toBe('ok');
      expect(result.recommendation).toBe('Context usage is healthy');
    });

    it('should return warn status when tokens at warning threshold', async () => {
      // Create content that would exceed warning threshold
      const largeContent = 'x'.repeat(170_000 * 4); // ~170k tokens

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(largeContent);

      // Override token counter to return specific token count
      TokenCounter.count.mockReturnValue({
        tokens: 170_000,
        method: 'exact',
        characters: largeContent.length
      });

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.status).toBe('warn');
      expect(result.recommendation).toBe('Consider creating a checkpoint soon');
    });

    it('should return checkpoint status when tokens at checkpoint threshold', async () => {
      const largeContent = 'x'.repeat(185_000 * 4); // ~185k tokens

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(largeContent);

      // Override token counter to return specific token count
      TokenCounter.count.mockReturnValue({
        tokens: 185_000,
        method: 'exact',
        characters: largeContent.length
      });

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.status).toBe('checkpoint');
      expect(result.recommendation).toBe('Auto-checkpoint should be triggered');
    });

    it('should return critical status when tokens at critical threshold', async () => {
      const largeContent = 'x'.repeat(195_000 * 4); // ~195k tokens

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(largeContent);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.status).toBe('critical');
      expect(result.recommendation).toBe('IMMEDIATE checkpoint required - approaching context limit');
    });

    it('should calculate threshold percentage correctly', async () => {
      const content = 'x'.repeat(100_000 * 4); // 100k tokens

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(content);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.threshold_percent).toBe(50);
    });

    it('should handle missing files gracefully', async () => {
      FileUtils.exists.mockResolvedValue(false);

      tokenMonitor = new TokenMonitor();
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.tokens).toBe(0);
      expect(result.status).toBe('ok');
    });

    it('should include all relevant state files', async () => {
      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue('content');

      tokenMonitor = new TokenMonitor();
      await tokenMonitor.calculateSessionTokens();

      const filesToCheck = [
        'implementation-log.jsonl',
        'session.json',
        'current-task.json',
        'boundaries.json',
        'file-iteration.json'
      ];

      filesToCheck.forEach(file => {
        expect(FileUtils.exists).toHaveBeenCalledWith(
          expect.stringContaining(file)
        );
      });
    });

    it('should handle empty files', async () => {
      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue('');

      tokenMonitor = new TokenMonitor();
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.tokens).toBe(0);
    });
  });

  describe('checkTokenStatus', () => {
    it('should return ok status for low token count', () => {
      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });

      const status = tokenMonitor.checkTokenStatus(100_000);

      expect(status).toBe('ok');
    });

    it('should return warn status at warning threshold', () => {
      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });

      const status = tokenMonitor.checkTokenStatus(165_000);

      expect(status).toBe('warn');
    });

    it('should return checkpoint status at checkpoint threshold', () => {
      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });

      const status = tokenMonitor.checkTokenStatus(185_000);

      expect(status).toBe('checkpoint');
    });

    it('should return critical status at critical threshold', () => {
      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });

      const status = tokenMonitor.checkTokenStatus(195_000);

      expect(status).toBe('critical');
    });

    it('should respect custom thresholds', () => {
      const customThresholds: Partial<TokenThresholds> = {
        warn: 50_000,
        checkpoint: 75_000,
        critical: 90_000
      };

      tokenMonitor = new TokenMonitor({
        thresholds: customThresholds,
        contextWindow: 100_000
      });

      expect(tokenMonitor.checkTokenStatus(60_000)).toBe('warn');
      expect(tokenMonitor.checkTokenStatus(80_000)).toBe('checkpoint');
      expect(tokenMonitor.checkTokenStatus(95_000)).toBe('critical');
    });
  });

  describe('getRecommendedAction', () => {
    it('should return continue for ok status', () => {
      tokenMonitor = new TokenMonitor();

      const action = tokenMonitor.getRecommendedAction('ok');

      expect(action).toBe('continue');
    });

    it('should return log-warning for warn status', () => {
      tokenMonitor = new TokenMonitor();

      const action = tokenMonitor.getRecommendedAction('warn');

      expect(action).toBe('log-warning');
    });

    it('should return auto-checkpoint for checkpoint status', () => {
      tokenMonitor = new TokenMonitor();

      const action = tokenMonitor.getRecommendedAction('checkpoint');

      expect(action).toBe('auto-checkpoint');
    });

    it('should return auto-checkpoint-critical for critical status', () => {
      tokenMonitor = new TokenMonitor();

      const action = tokenMonitor.getRecommendedAction('critical');

      expect(action).toBe('auto-checkpoint-critical');
    });
  });

  describe('formatTokenUsage', () => {
    it('should format token usage for display', () => {
      tokenMonitor = new TokenMonitor();

      const usage: TokenUsage = {
        tokens: 123456,
        characters: 500000,
        method: 'exact',
        status: 'ok',
        threshold_percent: 61,
        recommendation: 'Context usage is healthy'
      };

      const formatted = tokenMonitor.formatTokenUsage(usage);

      expect(formatted).toContain('123,456');
      expect(formatted).toContain('61%');
      expect(formatted).toContain('exact');
      expect(formatted).toContain('OK');
      expect(formatted).toContain('Context usage is healthy');
    });

    it('should include progress bar', () => {
      tokenMonitor = new TokenMonitor();

      const usage: TokenUsage = {
        tokens: 100_000,
        characters: 400_000,
        method: 'exact',
        status: 'ok',
        threshold_percent: 50,
        recommendation: 'OK'
      };

      const formatted = tokenMonitor.formatTokenUsage(usage);

      expect(formatted).toContain('█');
      expect(formatted).toContain('░');
    });
  });

  describe('shouldCheckpoint', () => {
    it('should return false when token usage is low', async () => {
      FileUtils.exists.mockResolvedValue(false);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.shouldCheckpoint();

      expect(result.needed).toBe(false);
      expect(result.reason).toBe('Token usage within acceptable range');
      expect(result.usage.status).toBe('ok');
    });

    it('should return true when checkpoint threshold exceeded', async () => {
      const largeContent = 'x'.repeat(185_000 * 4);

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(largeContent);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.shouldCheckpoint();

      expect(result.needed).toBe(true);
      expect(result.reason).toBe('Checkpoint threshold exceeded');
      expect(result.usage.status).toBe('checkpoint');
    });

    it('should return true when critical threshold exceeded', async () => {
      const largeContent = 'x'.repeat(195_000 * 4);

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(largeContent);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.shouldCheckpoint();

      expect(result.needed).toBe(true);
      expect(result.reason).toBe('Critical threshold exceeded');
      expect(result.usage.status).toBe('critical');
    });

    it('should return usage information', async () => {
      const content = 'x'.repeat(50_000 * 4);

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(content);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.shouldCheckpoint();

      expect(result.usage).toBeDefined();
      expect(result.usage.tokens).toBeGreaterThan(0);
      expect(result.usage.threshold_percent).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle file read errors', async () => {
      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockRejectedValue(new Error('Read failed'));

      tokenMonitor = new TokenMonitor();

      await expect(tokenMonitor.calculateSessionTokens()).rejects.toThrow('Read failed');
    });

    it('should handle token counter errors', async () => {
      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue('content');
      TokenCounter.count = jest.fn().mockImplementation(() => {
        throw new Error('Counter failed');
      });

      tokenMonitor = new TokenMonitor();

      await expect(tokenMonitor.calculateSessionTokens()).rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large files', async () => {
      const hugeContent = 'x'.repeat(10_000_000); // 10MB

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(hugeContent);

      tokenMonitor = new TokenMonitor();
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle zero token count', async () => {
      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue('');

      tokenMonitor = new TokenMonitor();
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.tokens).toBe(0);
      expect(result.status).toBe('ok');
    });

    it('should handle context window at 100%', async () => {
      const fullContent = 'x'.repeat(200_000 * 4);

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(fullContent);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.threshold_percent).toBeGreaterThanOrEqual(100);
      expect(result.status).toBe('critical');
    });

    it('should handle context window overflow', async () => {
      const overflowContent = 'x'.repeat(250_000 * 4);

      FileUtils.exists.mockResolvedValue(true);
      FileUtils.readFile.mockResolvedValue(overflowContent);

      tokenMonitor = new TokenMonitor({ contextWindow: 200_000 });
      const result = await tokenMonitor.calculateSessionTokens();

      expect(result.threshold_percent).toBeGreaterThan(100);
      expect(result.status).toBe('critical');
    });
  });

  describe('Custom thresholds', () => {
    it('should use custom thresholds for status checking', () => {
      const customThresholds: Partial<TokenThresholds> = {
        warn: 100,
        checkpoint: 150,
        critical: 180
      };

      tokenMonitor = new TokenMonitor({
        thresholds: customThresholds,
        contextWindow: 200
      });

      expect(tokenMonitor.checkTokenStatus(90)).toBe('ok');
      expect(tokenMonitor.checkTokenStatus(120)).toBe('warn');
      expect(tokenMonitor.checkTokenStatus(160)).toBe('checkpoint');
      expect(tokenMonitor.checkTokenStatus(190)).toBe('critical');
    });

    it('should handle partial threshold overrides', () => {
      tokenMonitor = new TokenMonitor({
        thresholds: { warn: 100_000 },
        contextWindow: 200_000
      });

      // Should use custom warn, default checkpoint and critical
      expect(tokenMonitor.checkTokenStatus(150_000)).toBe('checkpoint');
      expect(tokenMonitor.checkTokenStatus(185_000)).toBe('critical');
    });
  });

  describe('Progress bar', () => {
    it('should show green bar for ok status', () => {
      tokenMonitor = new TokenMonitor();

      const usage: TokenUsage = {
        tokens: 50_000,
        characters: 200_000,
        method: 'exact',
        status: 'ok',
        threshold_percent: 25,
        recommendation: 'OK'
      };

      const formatted = tokenMonitor.formatTokenUsage(usage);

      expect(formatted).toContain('🟢');
    });

    it('should show yellow bar for warn status', () => {
      tokenMonitor = new TokenMonitor();

      const usage: TokenUsage = {
        tokens: 170_000,
        characters: 680_000,
        method: 'exact',
        status: 'warn',
        threshold_percent: 85,
        recommendation: 'Warning'
      };

      const formatted = tokenMonitor.formatTokenUsage(usage);

      expect(formatted).toContain('🟡');
    });

    it('should show orange bar for checkpoint status', () => {
      tokenMonitor = new TokenMonitor();

      const usage: TokenUsage = {
        tokens: 185_000,
        characters: 740_000,
        method: 'exact',
        status: 'checkpoint',
        threshold_percent: 92,
        recommendation: 'Checkpoint'
      };

      const formatted = tokenMonitor.formatTokenUsage(usage);

      expect(formatted).toContain('🟠');
    });

    it('should show red bar for critical status', () => {
      tokenMonitor = new TokenMonitor();

      const usage: TokenUsage = {
        tokens: 195_000,
        characters: 780_000,
        method: 'exact',
        status: 'critical',
        threshold_percent: 97,
        recommendation: 'Critical'
      };

      const formatted = tokenMonitor.formatTokenUsage(usage);

      expect(formatted).toContain('🔴');
    });
  });
});
