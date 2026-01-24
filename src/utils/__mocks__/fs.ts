/**
 * Manual mock for fs functions
 */

import { vi } from 'vitest';

export const existsSync = vi.fn();
export const readFileSync = vi.fn();
export const writeFileSync = vi.fn();
export const mkdirSync = vi.fn();
export const readdirSync = vi.fn();

// Set default return values
existsSync.mockReturnValue(false);
readFileSync.mockReturnValue(JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
writeFileSync.mockReturnValue(undefined);
mkdirSync.mockReturnValue(undefined);
readdirSync.mockReturnValue([]);
