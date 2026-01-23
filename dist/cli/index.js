#!/usr/bin/env node
/**
 * SiftCoder CLI
 * Cross-platform command-line interface
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { StateManager } from '../services/state-manager.js';
import { TokenMonitor } from '../services/token-monitor-v2.js';
import { BoundaryEnforcer } from '../services/boundary-enforcer.js';
import { QualityGates } from '../services/quality-gates.js';
import { HookManager } from '../hooks/hook-manager.js';
const program = new Command();
program
    .name('siftcoder')
    .description('Cross-platform autonomous multi-agent coding workflows')
    .version('2.0.0');
// State management commands
program
    .command('init')
    .description('Initialize siftcoder state directory')
    .action(async () => {
    const manager = new StateManager();
    await manager.init();
    console.log(chalk.green('✓ SiftCoder initialized'));
});
program
    .command('status')
    .description('Show current state')
    .action(async () => {
    const manager = new StateManager();
    const task = await manager.loadCurrentTask();
    const features = await manager.loadFeatures();
    console.log(chalk.bold('\n📊 SiftCoder Status\n'));
    if (task) {
        console.log(chalk.yellow('Current Task:'));
        console.log(`  Feature: ${task.feature || 'None'}`);
        console.log(`  Phase: ${task.workflow_phase || 'Unknown'}`);
        console.log(`  Agent: ${task.agent || 'Unknown'}`);
    }
    else {
        console.log(chalk.gray('No active task'));
    }
    console.log(chalk.yellow('\nFeature Queue:'));
    console.log(`  Completed: ${features.queue.completed.length}`);
    console.log(`  In Progress: ${features.queue.in_progress.length}`);
    console.log(`  Pending: ${features.queue.pending.length}`);
});
// Token monitoring commands
program
    .command('tokens')
    .description('Check token usage')
    .action(async () => {
    const monitor = new TokenMonitor();
    const usage = await monitor.calculateSessionTokens();
    console.log('\n' + monitor.formatTokenUsage(usage));
});
// Boundary commands
program
    .command('boundaries')
    .description('Show current boundaries')
    .action(async () => {
    const enforcer = new BoundaryEnforcer();
    const boundaries = await enforcer.getBoundaries();
    if (!boundaries) {
        console.log(chalk.gray('No boundaries configured'));
        return;
    }
    console.log(chalk.bold('\n🛡️  Boundaries\n'));
    console.log(chalk.green('Modifiable:'));
    boundaries.modifiable.forEach(pattern => console.log(`  ${pattern}`));
    if (boundaries.protected.length > 0) {
        console.log(chalk.red('\nProtected:'));
        boundaries.protected.forEach(pattern => console.log(`  ${pattern}`));
    }
    console.log(`\nVerified: ${boundaries.blast_radius_verified ? '✅' : '❌'}`);
});
// Quality gates commands
program
    .command('quality')
    .description('Run quality gates')
    .action(async () => {
    const gates = new QualityGates();
    console.log(chalk.bold('\n🔍 Running Quality Gates...\n'));
    const results = await gates.runAll();
    console.log(gates.formatResults(results));
    process.exit(results.overall_passed ? 0 : 1);
});
// Hook commands
program
    .command('hooks:register')
    .description('Register siftcoder hooks')
    .action(async () => {
    const hookManager = new HookManager();
    await hookManager.registerHooks();
    console.log(chalk.green('✓ Hooks registered'));
});
// Error handling
program.exitOverride();
try {
    program.parse();
}
catch (error) {
    if (error.code === 'commander.help') {
        // Help was requested, exit normally
        process.exit(0);
    }
    else if (error.code === 'commander.version') {
        // Version was requested, exit normally
        process.exit(0);
    }
    else {
        console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
        process.exit(1);
    }
}
//# sourceMappingURL=index.js.map