/**
 * Manual mock for glob package
 */

import { vi } from 'vitest';

export const glob = vi.fn();

// Set default return value
glob.mockResolvedValue([]);
