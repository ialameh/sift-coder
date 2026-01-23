import { MCPTool } from "../../model/ToolDefinition.js";
/**
 * SiftCoder Prompt Helper Skill
 *
 * Interactive prompt generation helper that guides users through crafting
 * effective prompts for SiftCoder commands.
 */
export interface PromptHelperOptions {
    command?: string;
    existingPrompt?: string;
    context?: Record<string, any>;
    improve?: boolean;
}
export interface PromptHelperResult {
    success: boolean;
    generatedPrompt?: string;
    explanation?: string;
    questionsAsked?: string[];
    nextSteps?: string[];
    improvements?: string[];
    analysis?: string;
    error?: string;
}
/**
 * Generate optimized prompt for SiftCoder command
 *
 * This is an interactive helper that:
 * 1. Asks which command to generate a prompt for
 * 2. Guides through providing necessary details
 * 3. Asks clarifying questions
 * 4. Generates optimized prompt
 * 5. Explains the structure
 */
export declare function generatePrompt(options?: PromptHelperOptions): Promise<PromptHelperResult>;
/**
 * Build prompt for build command
 */
export declare function buildBuildPrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for fix command
 */
export declare function buildFixPrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for test command
 */
export declare function buildTestPrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for document command
 */
export declare function buildDocumentPrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for improve command
 */
export declare function buildImprovePrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for refactor command
 */
export declare function buildRefactorPrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for debug command
 */
export declare function buildDebugPrompt(details: Record<string, any>): Promise<string>;
/**
 * Build prompt for investigate command
 */
export declare function buildInvestigatePrompt(details: Record<string, any>): Promise<string>;
/**
 * Get list of supported commands
 */
export declare function getSupportedCommands(): Array<{
    name: string;
    description: string;
}>;
/**
 * Get questions for a specific command
 */
export declare function getQuestionsForCommand(command: string): string[];
/**
 * Generate explanation for a prompt
 */
export declare function explainPrompt(command: string, details: Record<string, any>): string;
/**
 * Analyze an existing prompt for weaknesses
 */
export declare function analyzePrompt(prompt: string): {
    score: number;
    weaknesses: string[];
    strengths: string[];
    missingElements: string[];
    command: string | null;
};
/**
 * Improve an existing prompt
 */
export declare function improvePrompt(existingPrompt: string, additionalContext?: Record<string, any>): Promise<{
    improved: string;
    analysis: string;
    improvements: string[];
    questions: string[];
}>;
export declare const promptHelperTool: MCPTool;
export declare const toolMetadata: any;
//# sourceMappingURL=skill.d.ts.map