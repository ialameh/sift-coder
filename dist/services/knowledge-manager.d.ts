/**
 * Knowledge Manager Service
 *
 * Manages the knowledge base: patterns, gotchas, and decisions.
 * Used by commands and agents to store/retrieve learned information.
 */
export interface Pattern {
    id: string;
    title: string;
    source?: string;
    usage?: string;
    example?: string;
    addedAt: string;
}
export interface Gotcha {
    id: string;
    issue: string;
    fix?: string;
    context?: string;
    addedAt: string;
}
export interface Decision {
    id: string;
    title: string;
    decision: string;
    rationale?: string;
    addedAt: string;
}
export declare class KnowledgeManagerService {
    private knowledgeDir;
    constructor(projectRoot?: string);
    /**
     * Initialize knowledge directory
     */
    init(): Promise<void>;
    /**
     * Add a pattern
     */
    addPattern(pattern: Omit<Pattern, 'id' | 'addedAt'>): Promise<string>;
    /**
     * Add a gotcha
     */
    addGotcha(gotcha: Omit<Gotcha, 'id' | 'addedAt'>): Promise<string>;
    /**
     * Add a decision
     */
    addDecision(decision: Omit<Decision, 'id' | 'addedAt'>): Promise<string>;
    /**
     * Get all patterns
     */
    getPatterns(): Promise<Pattern[]>;
    /**
     * Get all gotchas
     */
    getGotchas(): Promise<Gotcha[]>;
    /**
     * Get all decisions
     */
    getDecisions(): Promise<Decision[]>;
    /**
     * Search patterns by title
     */
    searchPatterns(query: string): Promise<Pattern[]>;
    /**
     * Search gotchas by issue
     */
    searchGotchas(query: string): Promise<Gotcha[]>;
}
//# sourceMappingURL=knowledge-manager.d.ts.map