/**
 * Manual mock for FileUtils with Vitest spies
 * All methods are properly trackable by Vitest
 */
import { vi } from 'vitest';
export const FileUtils = {
    exists: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readJSON: vi.fn(),
    writeJSON: vi.fn(),
    mkdir: vi.fn(),
    appendFile: vi.fn(),
    deleteFile: vi.fn(),
    copyFile: vi.fn(),
    moveFile: vi.fn(),
    glob: vi.fn(),
    stat: vi.fn(),
    listFiles: vi.fn(),
    match: vi.fn()
};
// Set default return values
FileUtils.exists.mockResolvedValue(false);
FileUtils.readFile.mockResolvedValue('');
FileUtils.writeFile.mockResolvedValue(undefined);
FileUtils.readJSON.mockResolvedValue(null);
FileUtils.writeJSON.mockResolvedValue(undefined);
FileUtils.mkdir.mockResolvedValue(undefined);
FileUtils.appendFile.mockResolvedValue(undefined);
FileUtils.deleteFile.mockResolvedValue(undefined);
FileUtils.copyFile.mockResolvedValue(undefined);
FileUtils.moveFile.mockResolvedValue(undefined);
FileUtils.glob.mockResolvedValue([]);
FileUtils.stat.mockResolvedValue({ isFile: () => true });
FileUtils.listFiles.mockResolvedValue([]);
FileUtils.match.mockReturnValue(false);
//# sourceMappingURL=file-utils.js.map