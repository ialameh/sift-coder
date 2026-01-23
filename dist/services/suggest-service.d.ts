/**
 * Suggest Service
 *
 * Analyzes user requests and suggests appropriate SiftCoder commands.
 */
export interface CommandMatch {
    command: string;
    name: string;
    description: string;
    confidence: number;
    reason: string;
    category?: string;
    arguments?: string[];
}
export interface SuggestionResult {
    primary: CommandMatch;
    alternatives: CommandMatch[];
    userIntent: string;
    keywords: string[];
}
export declare class SuggestService {
    private commandsDir;
    private commandCache;
    constructor(rootPath?: string);
    /**
     * Load all command definitions
     */
    private loadCommands;
    /**
     * Analyze user request and suggest commands
     */
    suggestRequest(userRequest: string, context?: {
        currentFile?: string;
        projectType?: string;
        recentCommands?: string[];
    }): Promise<SuggestionResult>;
    /**
     * Analyze the user's request
     */
    private analyzeRequest;
    /**
     * Extract keywords from request
     */
    private extractKeywords;
    /**
     * Determine primary intent
     */
    private determineIntent;
    /**
     * Score a command against the analyzed request
     */
    private scoreCommand;
    /**
     * Extract keywords from a command definition
     */
    private extractCommandKeywords;
    /**
     * Check if command is relevant to current file
     */
    private isRelevantTo;
    /**
     * Get command category
     */
    private getCommandCategory;
    /**
     * Get default suggestion when no match found
     */
    private getDefaultSuggestion;
}
//# sourceMappingURL=suggest-service.d.ts.map