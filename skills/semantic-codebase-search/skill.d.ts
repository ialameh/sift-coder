/**
 * SiftCoder - Semantic Codebase Search Skill
 *
 * Semantic search patterns for understanding codebase meaning and intent
 * Primary value is in SKILL.md documentation
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * Perform semantic search across codebase
 */
export declare function executeSkill(context?: any): Promise<void>;
declare const semanticSearchTool: Tool;
export { semanticSearchTool };
declare const _default: {
    executeSkill: typeof executeSkill;
};
export default _default;
//# sourceMappingURL=skill.d.ts.map