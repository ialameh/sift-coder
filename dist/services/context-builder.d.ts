#!/usr/bin/env node
/**
 * SiftCoder Context Builder
 *
 * Builds multi-agent context from previous sessions for injection at session start.
 *
 * SiftCoder Flavor:
 * - Multi-agent summaries (what each agent learned)
 * - Quality trends (improving/regressing)
 * - Workflow state (phase, iteration, next action)
 * - Boundary state (modifiable/protected files)
 * - Token economics (efficiency, discovery tokens)
 */
/**
 * Inject context for session start
 */
export declare function injectContext(): Promise<void>;
//# sourceMappingURL=context-builder.d.ts.map