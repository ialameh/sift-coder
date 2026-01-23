/**
 * SiftCoder - Organize Project Skill
 *
 * Organizes a project folder into the Sift monorepo structure
 * Usage: /siftcoder:organize-project <folder-path>
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * Organize a project into the Sift monorepo
 */
export declare function organizeProject(folderPath: string): Promise<{
    success: boolean;
    error: string;
    needsConfirmation?: undefined;
    destPath?: undefined;
    folderName?: undefined;
    destCategory?: undefined;
    destName?: undefined;
    backupPath?: undefined;
    steps?: undefined;
    nextSteps?: undefined;
} | {
    success: boolean;
    error: string;
    needsConfirmation: boolean;
    destPath: string;
    folderName?: undefined;
    destCategory?: undefined;
    destName?: undefined;
    backupPath?: undefined;
    steps?: undefined;
    nextSteps?: undefined;
} | {
    success: boolean;
    folderName: string;
    destCategory: string;
    destName: string;
    destPath: string;
    backupPath: string;
    steps: string[];
    nextSteps: string[];
    error?: undefined;
    needsConfirmation?: undefined;
}>;
declare const organizeProjectTool: Tool;
export { organizeProjectTool };
//# sourceMappingURL=skill.d.ts.map