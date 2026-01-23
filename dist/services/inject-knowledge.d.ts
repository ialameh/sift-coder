/**
 * Knowledge Injection Service
 *
 * SessionStart hook that injects learned patterns into context.
 * Outputs a summary of relevant knowledge for the current project.
 */
export interface KnowledgeSummary {
    patterns: number;
    gotchas: number;
    activeTask?: {
        mode: string;
        phase: string;
    };
}
export declare class KnowledgeInjectionService {
    private stateDir;
    private knowledgeDir;
    constructor(projectRoot?: string);
    /**
     * Generate knowledge summary for session start
     */
    getKnowledgeSummary(): Promise<string>;
    /**
     * Get structured knowledge summary
     */
    getStructuredSummary(): Promise<KnowledgeSummary>;
}
//# sourceMappingURL=inject-knowledge.d.ts.map