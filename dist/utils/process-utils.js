/**
 * Cross-platform process utilities
 * Handles command execution on Windows, Mac, Linux
 */
import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(execCallback);
export class ProcessUtils {
    /**
     * Execute command (cross-platform)
     * Automatically handles Windows vs Unix differences
     */
    static async exec(command, options) {
        try {
            const { stdout, stderr } = await execPromise(command, {
                cwd: options?.cwd,
                timeout: options?.timeout || 30000,
                maxBuffer: 10 * 1024 * 1024, // 10MB
                windowsHide: true
            });
            return {
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                exitCode: 0
            };
        }
        catch (error) {
            return {
                stdout: error.stdout?.toString() || '',
                stderr: error.stderr?.toString() || error.message,
                exitCode: error.code || 1
            };
        }
    }
    /**
     * Spawn process with streaming output
     */
    static spawn(command, args, options) {
        return new Promise((resolve, reject) => {
            // Handle Windows vs Unix shell
            const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
            const shellArgs = process.platform === 'win32'
                ? ['/c', command, ...args]
                : ['-c', `${command} ${args.join(' ')}`];
            const child = spawn(shell, shellArgs, {
                cwd: options?.cwd,
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
            });
            if (options?.onStdout) {
                child.stdout?.on('data', (data) => {
                    options.onStdout(data.toString());
                });
            }
            if (options?.onStderr) {
                child.stderr?.on('data', (data) => {
                    options.onStderr(data.toString());
                });
            }
            child.on('close', (code) => {
                resolve(code || 0);
            });
            child.on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * Check if command exists (cross-platform)
     */
    static async commandExists(command) {
        const checkCommand = process.platform === 'win32'
            ? `where ${command}`
            : `which ${command}`;
        try {
            const result = await this.exec(checkCommand);
            return result.exitCode === 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get environment variable with fallback
     */
    static getEnv(key, fallback) {
        return process.env[key] || fallback;
    }
    /**
     * Set environment variable
     */
    static setEnv(key, value) {
        process.env[key] = value;
    }
    /**
     * Get platform info
     */
    static getPlatform() {
        const platform = process.platform;
        return {
            platform,
            isWindows: platform === 'win32',
            isMac: platform === 'darwin',
            isLinux: platform === 'linux'
        };
    }
    /**
     * Exit process with code
     */
    static exit(code = 0) {
        process.exit(code);
    }
}
//# sourceMappingURL=process-utils.js.map