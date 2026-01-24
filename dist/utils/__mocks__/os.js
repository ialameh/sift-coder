/**
 * Manual mock for os module
 */
import { vi } from 'vitest';
export const homedir = vi.fn();
export const platform = vi.fn();
// Set default return values
homedir.mockReturnValue('/home/test');
platform.mockReturnValue('linux');
//# sourceMappingURL=os.js.map