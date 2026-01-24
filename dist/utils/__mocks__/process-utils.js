/**
 * Manual mock for ProcessUtils with Vitest spies
 */
import { vi } from 'vitest';
export const ProcessUtils = {
    exec: vi.fn(),
    commandExists: vi.fn(),
    getPlatform: vi.fn(),
    setEnv: vi.fn(),
    getEnv: vi.fn(),
    exit: vi.fn(),
    spawn: vi.fn(),
    fork: vi.fn()
};
// Set default return values
ProcessUtils.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
ProcessUtils.commandExists.mockResolvedValue(true);
ProcessUtils.getPlatform.mockReturnValue({
    platform: 'linux',
    isWindows: false,
    isMac: false,
    isLinux: true
});
ProcessUtils.setEnv.mockResolvedValue(undefined);
ProcessUtils.getEnv.mockReturnValue(undefined);
ProcessUtils.exit.mockReturnValue(undefined);
ProcessUtils.spawn.mockReturnValue({ on: vi.fn(), kill: vi.fn() });
ProcessUtils.fork.mockReturnValue({ on: vi.fn(), kill: vi.fn() });
//# sourceMappingURL=process-utils.js.map