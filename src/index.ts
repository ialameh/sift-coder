/**
 * SiftCoder Core - Pure Node.js Implementation
 * Cross-platform support for Windows, Mac, Linux
 */

// Services
import { TokenCounter } from './services/token-counter.js';
import { TokenMonitor, type TokenUsage, type TokenStatus } from './services/token-monitor-v2.js';
import { StateManager, type Feature, type FeatureQueue, type CurrentTask, type Boundaries } from './services/state-manager.js';
import { BoundaryEnforcer, type BoundaryCheckResult } from './services/boundary-enforcer.js';
import { QualityGates, type QualityResults, type GateResult } from './services/quality-gates.js';
import { AutoCheckpointService } from './services/auto-checkpoint.js';
import { BridgeUtilsService } from './services/bridge-utils.js';
import { ChrootManagerService } from './services/chroot-manager.js';
import { CloudConfigService } from './services/cloud-config.js';
import { CloudSyncService } from './services/cloud-sync.js';
import { ContextDiggerDetectionService } from './services/detect-contextdigger.js';
import { IndexCodebaseService } from './services/index-codebase.js';
import { KnowledgeInjectionService } from './services/inject-knowledge.js';
import { KnowledgeManagerService } from './services/knowledge-manager.js';
import { McpIntegrationService } from './services/mcp-integration.js';
import { ShouldContinueService } from './services/should-continue.js';
import { SyncToGlmService } from './services/sync-to-glm.js';

// Hooks
import { HookManager, type HookContext } from './hooks/hook-manager.js';

// Utils
import { FileUtils } from './utils/file-utils.js';
import { PathUtils } from './utils/path-utils.js';
import { ProcessUtils, type ExecResult } from './utils/process-utils.js';

// Re-export all
export { TokenCounter };
export { TokenMonitor, type TokenUsage, type TokenStatus };
export { StateManager, type Feature, type FeatureQueue, type CurrentTask, type Boundaries };
export { BoundaryEnforcer, type BoundaryCheckResult };
export { QualityGates, type QualityResults, type GateResult };
export { HookManager, type HookContext };
export { FileUtils };
export { PathUtils };
export { ProcessUtils, type ExecResult };
export { AutoCheckpointService };
export { BridgeUtilsService };
export { ChrootManagerService };
export { CloudConfigService };
export { CloudSyncService };
export { ContextDiggerDetectionService };
export { IndexCodebaseService };
export { KnowledgeInjectionService };
export { KnowledgeManagerService };
export { McpIntegrationService };
export { ShouldContinueService };
export { SyncToGlmService };

// Convenience factory functions
export const createStateManager = (projectRoot?: string) => new StateManager(projectRoot);
export const createTokenMonitor = (options?: any) => new TokenMonitor(options);
export const createBoundaryEnforcer = (projectRoot?: string) => new BoundaryEnforcer(projectRoot);
export const createQualityGates = (projectRoot?: string) => new QualityGates(projectRoot);
export const createHookManager = (projectRoot?: string) => new HookManager(projectRoot);
