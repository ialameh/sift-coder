#!/usr/bin/env node
/**
 * SiftCoder PostToolUse Hook - Console.log Detection
 *
 * Detects console.log statements in TypeScript/JavaScript files after edits.
 * Provides warnings with line numbers and context to help maintain clean code.
 *
 * SiftCoder Flavor:
 * - Cross-platform file operations
 * - Fast pattern matching with regex
 * - Minimal performance overhead (< 100ms typical)
 * - Clear, actionable warnings
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const CONSOLE_PATTERN = /^\s*console\.(log|debug|info|warn|error|trace)\(/;
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

/**
 * Detect console.log statements in a file
 */
function detectConsoleLogs(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  // Check if file is a TypeScript/JavaScript file
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  if (!FILE_EXTENSIONS.includes(ext)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      if (CONSOLE_PATTERN.test(line)) {
        // Exclude test files and development files
        if (!filePath.includes('/test/') &&
            !filePath.includes('/tests/') &&
            !filePath.includes('.test.') &&
            !filePath.includes('.spec.') &&
            !filePath.includes('/__tests__/') &&
            !line.includes('// eslint-disable') &&
            !line.includes('// keep-console')) {
          matches.push({
            line: index + 1,
            text: line.trim().substring(0, 80) // Truncate long lines
          });
        }
      }
    });

    return matches;
  } catch (error) {
    // Silently skip files that can't be read
    return [];
  }
}

/**
 * Main hook function
 */
async function main() {
  // Get tool input from environment variable
  const toolInputStr = process.env.TOOL_INPUT || '{}';

  try {
    const toolInput = JSON.parse(toolInputStr);

    // Only check Write and Edit tools
    const toolName = process.argv[2] || process.env.TOOL_NAME || '';
    if (!['Write', 'Edit'].includes(toolName)) {
      process.exit(0);
    }

    // Check if file_path exists in tool input
    if (!toolInput.file_path) {
      process.exit(0);
    }

    const matches = detectConsoleLogs(toolInput.file_path);

    if (matches.length > 0) {
      const fileName = toolInput.file_path.split('/').pop();
      console.log(`\n⚠️  [ConsoleLog] Found ${matches.length} console.log${matches.length > 1 ? 's' : ''} in ${fileName}`);
      matches.forEach(m => {
        console.log(`    Line ${m.line}: ${m.text}`);
      });
      console.log('    💡 Tip: Use /debug or the ObservationLogger for structured logging\n');
    }
  } catch (error) {
    // Silently skip parsing errors
  }

  process.exit(0);
}

main().catch(error => {
  // Silent failure - don't break the tool execution
  process.exit(0);
});
