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

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
export async function collectPermissions(specFile: string): Promise<PermissionManifest> {
  console.error('\n🔍 Analyzing project specification...\n');

  // Read spec file
  const specContent = await fs.readFile(specFile, 'utf-8');

  // Detect project type
  const projectType = detectProjectType();

  // Analyze what will be needed
  const needs = {
    fileOps: true,  // Always needed
    commands: await willNeedCommands(specContent),
    dependencies: await willNeedDependencies(specContent, projectType),
    git: await willNeedGitOperations(specContent),
    apis: await willNeedExternalAPIs(specContent),
    destructive: await willNeedDestructiveOps(specContent)
  };

  console.error('📋 Project Analysis Complete');
  console.error(`   Type: ${projectType}`);
  console.error(`   Estimated Scope: ${estimateScope(specContent)}`);
  console.error('');

  // Ask all permission questions upfront
  const manifest: PermissionManifest = {
    project_root: process.cwd(),
    spec_file: specFile,
    timestamp: new Date().toISOString(),
    permissions: await askOperationalPermissions(needs),
    boundaries: await askBoundaryPermissions(),
    decision_authority: await askDecisionAuthorityPermissions(),
    completion_criteria: await askCompletionCriteria(),
    failure_handling: await askFailureHandling()
  };

  return manifest;
}

/**
 * Detect project type from current directory
 */
function detectProjectType(): string {
  // Check for package.json, requirements.txt, Cargo.toml, etc.
  // For now, return generic
  return 'generic';
}

/**
 * Estimate project scope from spec
 */
function estimateScope(specContent: string): string {
  const lines = specContent.split('\n').length;
  if (lines < 50) return 'small';
  if (lines < 200) return 'medium';
  return 'large';
}

/**
 * Will project need to run commands?
 */
async function willNeedCommands(spec: string): Promise<boolean> {
  return spec.includes('test') || spec.includes('build') || spec.includes('script');
}

/**
 * Will project need dependencies?
 */
async function willNeedDependencies(spec: string, projectType: string): Promise<boolean> {
  return projectType !== 'generic';
}

/**
 * Will project need git operations?
 */
async function willNeedGitOperations(spec: string): Promise<boolean> {
  return spec.includes('commit') || spec.includes('push') || spec.includes('branch');
}

/**
 * Will project need external APIs?
 */
async function willNeedExternalAPIs(spec: string): Promise<boolean> {
  return spec.includes('api') || spec.includes('http') || spec.includes('service');
}

/**
 * Will project need destructive operations?
 */
async function willNeedDestructiveOps(spec: string): Promise<boolean> {
  return spec.includes('delete') || spec.includes('remove') || spec.includes('migrate');
}

/**
 * Ask operational permission questions
 */
async function askOperationalPermissions(needs: any): Promise<PermissionManifest['permissions']> {
  console.error('🔐 Operational Permissions Required:');
  console.error('');
  console.error('The following operations will be performed during autonomous execution:');
  console.error('');

  const permissions = {
    file_operations: needs.fileOps,
    run_commands: needs.commands,
    install_dependencies: needs.dependencies,
    git_operations: needs.git,
    external_apis: needs.apis,
    destructive_operations: needs.destructive
  };

  if (permissions.file_operations) {
    console.error('  ✓ Create, modify, and delete files');
  }
  if (permissions.run_commands) {
    console.error('  ✓ Run shell commands (tests, builds, scripts)');
  }
  if (permissions.install_dependencies) {
    console.error('  ✓ Install project dependencies (npm, pip, cargo, etc.)');
  }
  if (permissions.git_operations) {
    console.error('  ✓ Perform Git operations (commit, push, branches)');
  }
  if (permissions.external_apis) {
    console.error('  ✓ Make external API calls if needed');
  }
  if (permissions.destructive_operations) {
    console.error('  ⚠️  Perform destructive operations (deletes, migrations)');
  }

  console.error('');
  console.error('💡 To approve these permissions, a manifest will be created.');
  console.error('   Review and approve the manifest before autonomous execution begins.');
  console.error('');

  return permissions;
}

/**
 * Ask boundary permission questions
 */
async function askBoundaryPermissions(): Promise<PermissionManifest['boundaries']> {
  console.error('🛡️  Safety Boundaries:');
  console.error('');
  console.error('Default boundaries (will be saved to manifest):');
  console.error('  • Modifiable: Current project directory');
  console.error('  • Protected: node_modules/, .git/, build/, dist/');
  console.error('  • Max file size: 1MB');
  console.error('  • Max execution time: 30 minutes per operation');
  console.error('  • Max memory: 2GB');
  console.error('');
  console.error('💡 These can be adjusted in the manifest before approval.');

  return {
    modifiable_patterns: ['./*'],
    protected_patterns: ['node_modules/*', '.git/*', 'build/*', 'dist/*'],
    max_file_size_mb: 1,
    resource_limits: {
      max_execution_time_minutes: 30,
      max_memory_mb: 2048
    }
  };
}

/**
 * Ask decision authority permissions
 */
async function askDecisionAuthorityPermissions(): Promise<PermissionManifest['decision_authority']> {
  console.error('');
  console.error('🧠 Decision-Making Authority:');
  console.error('');
  console.error('SiftCoder will autonomously make the following technical decisions:');
  console.error('');
  console.error('  • Tech stack choices (when not specified)');
  console.error('  • Architecture patterns and folder structure');
  console.error('  • Library versions (latest stable unless specified)');
  console.error('  • Code style conventions (when none exist)');
  console.error('  • Testing approach and coverage targets');
  console.error('  • Error handling strategies');
  console.error('');
  console.error('💡 All decisions follow industry best practices.');
  console.error('   Decisions will be logged for review after completion.');

  return {
    tech_stack_choices: true,
    architecture_patterns: true,
    library_versions: true,
    code_style: true,
    testing_approach: true,
    error_handling: true
  };
}

/**
 * Ask completion criteria
 */
async function askCompletionCriteria(): Promise<PermissionManifest['completion_criteria']> {
  console.error('');
  console.error('🏁 Completion Criteria:');
  console.error('');
  console.error('Project will be considered complete when:');
  console.error('');
  console.error('  ✓ All specification items implemented');
  console.error('  ✓ All tests passing');
  console.error('  ✓ Quality gates passing (format, lint, type-check)');
  console.error('  ✓ Documentation complete');
  console.error('  ✓ Project builds successfully');
  console.error('');

  return {
    all_specs_implemented: true,
    all_tests_passing: true,
    quality_gates_passing: true,
    documentation_complete: true,
    buildable_deployable: true
  };
}

/**
 * Ask failure handling preference
 */
async function askFailureHandling(): Promise<PermissionManifest['failure_handling']> {
  console.error('');
  console.error('⚠️  Failure Handling:');
  console.error('');
  console.error('If something goes wrong during autonomous execution:');
  console.error('');
  console.error('  1) Stop and wait for human intervention');
  console.error('  2) Auto-retry with different approach (max 3 attempts)');
  console.error('  3) Rollback to last checkpoint and stop');
  console.error('  4) Log error and continue');
  console.error('');
  console.error('💡 Default: Option 2 (Auto-retry)');
  console.error('   This can be changed in the manifest.');

  return 'retry';
}

/**
 * Save permission manifest
 */
export async function saveManifest(manifest: PermissionManifest, filepath: string): Promise<void> {
  await fs.writeFile(
    filepath,
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
}

/**
 * Load permission manifest
 */
export async function loadManifest(filepath: string): Promise<PermissionManifest> {
  const content = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Check if permission is granted
 */
export function hasPermission(manifest: PermissionManifest, permission: keyof PermissionManifest['permissions']): boolean {
  return manifest.permissions[permission] === true;
}

/**
 * Check if decision authority is granted
 */
export function hasDecisionAuthority(manifest: PermissionManifest, authority: keyof PermissionManifest['decision_authority']): boolean {
  return manifest.decision_authority[authority] === true;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const specFile = process.argv[2];

  if (!specFile) {
    console.error(`
Usage: autonomous <spec-file>

SiftCoder Full Autonomous Mode

1. Analyzes project specification
2. Collects ALL permissions upfront
3. Creates permission manifest
4. Runs completely autonomously until done

Example:
  node skills/autonomous/skill.ts project-spec.md

This will:
  - Analyze the specification
  - Ask all permission questions upfront
  - Create .claude/siftcoder-state/autonomous-manifest.json
  - Wait for your approval
  - Run autonomously until project is complete
    `);
    process.exit(1);
  }

  collectPermissions(specFile)
    .then(async (manifest) => {
      const manifestPath = '.claude/siftcoder-state/autonomous-manifest.json';
      await saveManifest(manifest, manifestPath);

      console.error('');
      console.error('✅ Permission manifest created!');
      console.error(`   Location: ${manifestPath}`);
      console.error('');
      console.error('📝 Next Steps:');
      console.error('   1. Review the manifest file');
      console.error('   2. Approve by running: /siftcoder:autonomous-run');
      console.error('   3. SiftCoder will execute autonomously until completion');
      console.error('');
    })
    .catch(error => {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    });
}
