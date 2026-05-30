import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'bin/**',
      'hooks/**',
      'monitors/**',
      'src/memory/web/static/**',
      '*.config.js',
    ],
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        AbortSignal: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off',
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        AbortSignal: 'readonly',
        Buffer: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        NodeJS: 'readonly',
        process: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-control-regex': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['src/**/*.test.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
];
