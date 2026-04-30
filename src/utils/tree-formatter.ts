/**
 * Directory tree renderer with box-drawing characters.
 * Ported from V1 dist/utils/tree-formatter.js (originally from gitreverse).
 */

import fs from 'node:fs';
import path from 'node:path';

interface TreeNode {
  name: string;
  isDirectory: boolean;
  children: TreeNode[];
}

export interface FormatOpts {
  depth?: number;
  maxEntries?: number;
  excludePaths?: string[];
  includePaths?: string[];
}

const DEFAULT_EXCLUDES: ReadonlySet<string> = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  '.cache', '.turbo', '.vercel', 'coverage', '.nyc_output',
  '.DS_Store', '.idea', '.vscode',
]);

function newNode(name: string, isDirectory: boolean): TreeNode {
  return { name, isDirectory, children: [] };
}

function addPath(root: TreeNode, relPath: string, isDirectory: boolean): void {
  const parts = relPath.split('/').filter(Boolean);
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const isLast = i === parts.length - 1;
    let child = cur.children.find((c) => c.name === part);
    if (!child) {
      child = newNode(part, !isLast || isDirectory);
      cur.children.push(child);
    }
    cur = child;
  }
}

function sortTree(node: TreeNode): void {
  node.children.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
    return a.isDirectory ? -1 : 1;
  });
  for (const child of node.children) sortTree(child);
}

function treeToString(node: TreeNode, prefix = '', isRoot = true): string {
  sortTree(node);
  let out = '';
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!;
    const isLast = i === node.children.length - 1;
    const childPrefix = isRoot ? '' : `${prefix}${isLast ? '└── ' : '├── '}`;
    const nextPrefix = isRoot ? '' : `${prefix}${isLast ? '    ' : '│   '}`;
    out += `${childPrefix}${child.name}${child.isDirectory ? '/' : ''}\n`;
    if (child.isDirectory && child.children.length > 0) {
      out += treeToString(child, nextPrefix, false);
    }
  }
  return out;
}

export function formatLocalTree(rootPath: string, opts: FormatOpts = {}): string {
  const items: Array<{ relPath: string; isDir: boolean }> = [];
  const maxDepth = opts.depth ?? 1;
  const excludes = new Set([...DEFAULT_EXCLUDES, ...(opts.excludePaths || [])]);
  const includes = opts.includePaths && opts.includePaths.length ? opts.includePaths : null;
  const maxEntries = opts.maxEntries ?? 1000;

  function recurse(absDir: string, relDir: string, depth: number): void {
    if (depth > maxDepth) return;
    if (items.length >= maxEntries) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (items.length >= maxEntries) return;
      if (excludes.has(entry.name)) continue;
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (includes && !includes.some((inc) => rel.startsWith(inc) || inc.startsWith(rel))) continue;
      items.push({ relPath: rel, isDir: entry.isDirectory() });
      if (entry.isDirectory()) {
        recurse(path.join(absDir, entry.name), rel, depth + 1);
      }
    }
  }

  recurse(path.resolve(rootPath), '', 1);

  const root = newNode('', true);
  for (const item of items) addPath(root, item.relPath, item.isDir);
  return treeToString(root).trimEnd();
}

export function formatPathList(items: Array<{ path: string; type: 'file' | 'dir' }>): string {
  const root = newNode('', true);
  for (const item of items) addPath(root, item.path, item.type === 'dir');
  return treeToString(root).trimEnd();
}
