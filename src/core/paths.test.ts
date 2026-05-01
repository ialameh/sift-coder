import { describe, it, expect } from 'vitest';
import { resolvePaths, workspaceKey } from './paths.js';

describe('paths', () => {
  it('workspaceKey is deterministic', () => {
    const a = workspaceKey('/foo/bar');
    const b = workspaceKey('/foo/bar');
    expect(a).toBe(b);
    expect(a).toHaveLength(12);
  });

  it('workspaceKey differs for different dirs', () => {
    expect(workspaceKey('/a')).not.toBe(workspaceKey('/b'));
  });

  it('resolvePaths produces ns-scoped tree', () => {
    const p = resolvePaths({ ns: 'default', projectDir: '/test/project' });
    expect(p.base).toContain('/.siftcoder/default');
    expect(p.run).toContain('/.siftcoder/default/run');
    expect(p.sock).toMatch(/run\/[a-f0-9]{12}\.sock$/);
    expect(p.db).toMatch(/workspaces\/[a-f0-9]{12}\/memory\.db$/);
  });

  it('respects ns override', () => {
    const p = resolvePaths({ ns: 'custom', projectDir: '/x' });
    expect(p.base).toContain('/.siftcoder/custom');
  });
});
