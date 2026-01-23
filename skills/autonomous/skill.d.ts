#!/usr/bin/env node
/**
 * SiftCoder Full Autonomous Mode
 *
 * "Fire & Forget" autonomous project completion:
 * 1. Ask ALL permission questions upfront
 * 2. Create permission manifest
 * 3. Run completely autonomously until done
 * 4. Make all technical decisions using best practices
 */
interface PermissionManifest {
    project_root: string;
    spec_file: string;
    timestamp: string;
    permissions: {
        file_operations: boolean;
        run_commands: boolean;
        install_dependencies: boolean;
        git_operations: boolean;
        external_apis: boolean;
        destructive_operations: boolean;
    };
    boundaries: {
        modifiable_patterns: string[];
        protected_patterns: string[];
        max_file_size_mb: number;
        resource_limits: {
            max_execution_time_minutes: number;
            max_memory_mb: number;
        };
    };
    decision_authority: {
        tech_stack_choices: boolean;
        architecture_patterns: boolean;
        library_versions: boolean;
        code_style: boolean;
        testing_approach: boolean;
        error_handling: boolean;
    };
    completion_criteria: {
        all_specs_implemented: boolean;
        all_tests_passing: boolean;
        quality_gates_passing: boolean;
        documentation_complete: boolean;
        buildable_deployable: boolean;
    };
    failure_handling: 'stop' | 'retry' | 'rollback' | 'log_continue';
}
/**
 * Analyze project and collect all permissions needed
 */
export declare function collectPermissions(specFile: string): Promise<PermissionManifest>;
/**
 * Save permission manifest
 */
export declare function saveManifest(manifest: PermissionManifest, filepath: string): Promise<void>;
/**
 * Load permission manifest
 */
export declare function loadManifest(filepath: string): Promise<PermissionManifest>;
/**
 * Check if permission is granted
 */
export declare function hasPermission(manifest: PermissionManifest, permission: keyof PermissionManifest['permissions']): boolean;
/**
 * Check if decision authority is granted
 */
export declare function hasDecisionAuthority(manifest: PermissionManifest, authority: keyof PermissionManifest['decision_authority']): boolean;
export {};
//# sourceMappingURL=skill.d.ts.map