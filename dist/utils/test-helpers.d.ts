/**
 * Test Helpers
 * Common utilities and factories for SiftCoder plugin tests
 */
import { Mock } from 'jest-mock';
/**
 * Mock file system helpers
 */
export declare class MockFileSystem {
    private files;
    private directories;
    /**
     * Create a mock file system state
     */
    constructor(initialState?: {
        files?: Record<string, string>;
        directories?: string[];
    });
    /**
     * Add a file to the mock filesystem
     */
    addFile(path: string, content: string): void;
    /**
     * Add a directory to the mock filesystem
     */
    addDirectory(path: string): void;
    /**
     * Get file content
     */
    getFile(path: string): string | undefined;
    /**
     * Check if file exists
     */
    hasFile(path: string): boolean;
    /**
     * Check if directory exists
     */
    hasDirectory(path: string): boolean;
    /**
     * Create fs.promises mock behavior
     */
    createFsPromisesMock(): any;
    /**
     * Reset all mocks
     */
    reset(): void;
}
/**
 * Test data factories
 */
export declare class TestDataFactory {
    /**
     * Create mock feature data
     */
    static createFeature(overrides?: Partial<any>): any;
    /**
     * Create mock boundaries data
     */
    static createBoundaries(overrides?: Partial<any>): any;
    /**
     * Create mock current task data
     */
    static createCurrentTask(overrides?: Partial<any>): any;
    /**
     * Create mock pattern data
     */
    static createPattern(overrides?: Partial<any>): any;
    /**
     * Create mock gotcha data
     */
    static createGotcha(overrides?: Partial<any>): any;
    /**
     * Create mock decision data
     */
    static createDecision(overrides?: Partial<any>): any;
    /**
     * Create mock checkpoint metadata
     */
    static createCheckpoint(overrides?: Partial<any>): any;
}
/**
 * Mock process execution helpers
 */
export declare class MockProcessExecutor {
    private mockCommands;
    /**
     * Register a mock command response
     */
    mockCommand(command: string, response: {
        exitCode: number;
        stdout: string;
        stderr: string;
    }): void;
    /**
     * Create child_process.exec mock
     */
    createExecMock(): any;
    /**
     * Create child_process.spawn mock
     */
    createSpawnMock(): any;
    /**
     * Reset all mocks
     */
    reset(): void;
}
/**
 * Cross-platform test helpers
 */
export declare class CrossPlatformTestHelper {
    /**
     * Get platform-specific paths for testing
     */
    static getPlatformPaths(): {
        win32: {
            sep: string;
            home: string;
            project: string;
            file: string;
            relative: string;
        };
        darwin: {
            sep: string;
            home: string;
            project: string;
            file: string;
            relative: string;
        };
        linux: {
            sep: string;
            home: string;
            project: string;
            file: string;
            relative: string;
        };
    };
    /**
     * Test a callback function with each platform's paths
     */
    static testEachPlatform(callback: (platform: NodeJS.Platform, paths: any) => void | Promise<void>): Promise<void>;
}
/**
 * Assertion helpers
 */
export declare class AssertionHelpers {
    /**
     * Assert that file was written with specific content
     */
    static assertFileWritten(fs: MockFileSystem, path: string, content: string): void;
    /**
     * Assert that file was deleted
     */
    static assertFileDeleted(fs: MockFileSystem, path: string): void;
    /**
     * Assert that directory was created
     */
    static assertDirectoryCreated(fs: MockFileSystem, path: string): void;
    /**
     * Assert that command was executed
     */
    static assertCommandExecuted(execMock: Mock, command: string): void;
}
/**
 * Wait for async operations
 */
export declare function waitFor(ms: number): Promise<void>;
/**
 * Flush all pending promises
 */
export declare function flushPromises(): Promise<void>;
//# sourceMappingURL=test-helpers.d.ts.map