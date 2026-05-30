import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// vitest runs from the repo root.
const dir = join(process.cwd(), 'skills', 'salesforce');

describe('salesforce skills are path-scoped', () => {
  const names = readdirSync(dir);

  it('has the expected family present', () => {
    expect(names.length).toBeGreaterThanOrEqual(11);
  });

  for (const name of readdirSync(dir)) {
    it(`${name} declares a non-empty paths: frontmatter`, () => {
      const front = readFileSync(join(dir, name, 'SKILL.md'), 'utf8').split('---')[1] ?? '';
      const m = front.match(/^paths:\s*(.+)$/m);
      expect(m, `${name} is missing a paths: key`).toBeTruthy();
      expect(m![1].trim().length).toBeGreaterThan(0);
    });
  }
});
