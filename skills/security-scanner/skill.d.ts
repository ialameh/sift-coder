/**
 * SiftCoder - Security Scanner Skill
 *
 * Security scanning patterns and vulnerability detection
 * Primary value is in SKILL.md documentation
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * Scan for security vulnerabilities and best practice violations
 */
export declare function executeSkill(context?: any): Promise<void>;
declare const securityScannerTool: Tool;
export { securityScannerTool };
declare const _default: {
    executeSkill: typeof executeSkill;
};
export default _default;
//# sourceMappingURL=skill.d.ts.map