/**
 * Global Jest Setup
 * Configures mocks and test environment for SiftCoder plugin tests
 */

import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs', () => {
  const actual = jest.requireActual('fs') as any;
  const mockFs = {
    ...actual,
    promises: {
      access: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      mkdir: jest.fn(),
      readdir: jest.fn(),
      stat: jest.fn(),
      unlink: jest.fn(),
      copyFile: jest.fn(),
      rename: jest.fn(),
      appendFile: jest.fn(),
    },
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
  };
  return mockFs;
});

// Mock fs/promises
jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises');
  return {
    ...actual,
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    copyFile: jest.fn(),
    rename: jest.fn(),
    appendFile: jest.fn(),
  };
});

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn(),
}));

// Mock glob
jest.mock('glob', () => ({
  glob: jest.fn(),
}));

// Mock gpt-tokenizer
jest.mock('gpt-tokenizer', () => ({
  encode: jest.fn((text: string) => {
    // Simple mock: return array with one token per 4 characters
    const numTokens = Math.ceil(text.length / 4);
    return Array(numTokens).fill('mock_token');
  }),
}));

// Mock process.env for consistent testing
const originalEnv = { ...process.env };

beforeEach(() => {
  // Reset process.env before each test
  process.env = { ...originalEnv };
  // Set up default test environment variables
  process.env.CLAUDE_PROJECT_DIR = '/test/project';
  process.env.HOME = '/test/home';
  process.env.APPDATA = '/test/appdata';
});

afterEach(() => {
  // Clean up any process.env modifications
  process.env = { ...originalEnv };
  jest.clearAllMocks();
});

// Set global test timeout
jest.setTimeout(30000);

// Suppress console.error during tests (unless debugging)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Only suppress in test mode
  if (!process.env.DEBUG_TESTS) {
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
