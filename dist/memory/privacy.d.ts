/**
 * Edge-side redaction. Runs before any persistence.
 * Strips <private>...</private> blocks and masks high-confidence secrets.
 */
export interface RedactionResult {
    text: string;
    hits: Record<string, number>;
}
export declare function redactString(input: string): RedactionResult;
export declare function redact<T>(value: T): {
    value: T;
    hits: Record<string, number>;
};
//# sourceMappingURL=privacy.d.ts.map