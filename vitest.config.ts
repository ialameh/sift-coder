import { defineConfig } from 'vitest/config';

export default defineConfig({
  testEnvironment: 'node',
  include: ['src/**/*.{test,spec}.{ts,tsx}'],
  exclude: ['node_modules', 'dist'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    include: ['src/**/*.ts'],
    exclude: [
      'src/**/*.d.ts',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/cli/**',
      'dist/**'
    ],
    all: true,
    lines: 100,
    functions: 100,
    branches: 100,
    statements: 100
  },
  testTimeout: 30000,
  reporters: ['verbose', 'json'],
  outputFile: {
    json: './test-results.json'
  }
});
