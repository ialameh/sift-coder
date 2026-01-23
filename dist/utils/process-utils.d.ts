/**
 * Cross-platform process utilities
 * Handles command execution on Windows, Mac, Linux
 */
export interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export declare class ProcessUtils {
    /**
     * Execute command (cross-platform)
     * Automatically handles Windows vs Unix differences
     */
    static exec(command: string, options?: {
        cwd?: string;
        timeout?: number;
    }): Promise<ExecResult>;
    /**
     * Spawn process with streaming output
     */
    static spawn(command: string, args: string[], options?: {
        cwd?: string;
        onStdout?: (data: string) => void;
        onStderr?: (data: string) => void;
    }): Promise<number>;
    /**
     * Check if command exists (cross-platform)
     */
    static commandExists(command: string): Promise<boolean>;
    /**
     * Get environment variable with fallback
     */
    static getEnv(key: string, fallback?: string): string | undefined;
    /**
     * Set environment variable
     */
    static setEnv(key: string, value: string): void;
    /**
     * Get platform info
     */
    static getPlatform(): {
        platform: NodeJS.Platform;
        isWindows: boolean;
        isMac: boolean;
        isLinux: boolean;
    };
    /**
     * Exit process with code
     */
    static exit(code?: number): never;
}
//# sourceMappingURL=process-utils.d.ts.map