/**
 * Manual mock for FileUtils with Vitest spies
 * All methods are properly trackable by Vitest
 */
export declare const FileUtils: {
    exists: import("vitest").Mock<import("@vitest/spy").Procedure>;
    readFile: import("vitest").Mock<import("@vitest/spy").Procedure>;
    writeFile: import("vitest").Mock<import("@vitest/spy").Procedure>;
    readJSON: import("vitest").Mock<import("@vitest/spy").Procedure>;
    writeJSON: import("vitest").Mock<import("@vitest/spy").Procedure>;
    mkdir: import("vitest").Mock<import("@vitest/spy").Procedure>;
    appendFile: import("vitest").Mock<import("@vitest/spy").Procedure>;
    deleteFile: import("vitest").Mock<import("@vitest/spy").Procedure>;
    copyFile: import("vitest").Mock<import("@vitest/spy").Procedure>;
    moveFile: import("vitest").Mock<import("@vitest/spy").Procedure>;
    glob: import("vitest").Mock<import("@vitest/spy").Procedure>;
    stat: import("vitest").Mock<import("@vitest/spy").Procedure>;
    listFiles: import("vitest").Mock<import("@vitest/spy").Procedure>;
    match: import("vitest").Mock<import("@vitest/spy").Procedure>;
};
//# sourceMappingURL=file-utils.d.ts.map