/**
 * Tree Formatter Utility
 *
 * Renders directory trees with box-drawing characters.
 * Two entry points:
 *   - formatLocalTree(rootPath, opts) — walks a local filesystem path
 *   - formatPathList(items, opts)      — formats a pre-collected list of {path,type}
 *
 * Ported from gitreverse (lib/file-tree-formatter.ts), adapted to local fs.
 */
import fs from 'fs';
import path from 'path';

const DEFAULT_EXCLUDES = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', 'out',
    '.cache', '.turbo', '.vercel', 'coverage', '.nyc_output',
    '.DS_Store', '.idea', '.vscode',
]);

function createTreeNode(name, isDirectory) {
    return { name, children: [], isDirectory };
}

function addPathToTree(root, relPath, isDirectory) {
    const parts = relPath.split('/').filter(Boolean);
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        let child = cur.children.find((c) => c.name === part);
        if (!child) {
            child = createTreeNode(part, !isLast || isDirectory);
            cur.children.push(child);
        }
        cur = child;
    }
}

function sortTreeNodes(node) {
    node.children.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
    });
    for (const child of node.children) sortTreeNodes(child);
}

function treeToString(node, prefix = '', isRoot = true) {
    sortTreeNodes(node);
    let out = '';
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
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

function walkLocal(rootPath, opts) {
    const items = [];
    const maxDepth = opts.depth ?? 1;
    const excludes = new Set([...DEFAULT_EXCLUDES, ...(opts.excludePaths || [])]);
    const includes = opts.includePaths && opts.includePaths.length ? opts.includePaths : null;
    const maxEntries = opts.maxEntries ?? 1000;

    function recurse(absDir, relDir, depth) {
        if (depth > maxDepth) return;
        if (items.length >= maxEntries) return;
        let entries;
        try {
            entries = fs.readdirSync(absDir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (items.length >= maxEntries) return;
            if (excludes.has(entry.name)) continue;
            const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
            if (includes && !includes.some((p) => rel === p || rel.startsWith(p + '/') || p.startsWith(rel + '/'))) continue;
            items.push({ path: rel, type: entry.isDirectory() ? 'tree' : 'blob' });
            if (entry.isDirectory()) recurse(path.join(absDir, entry.name), rel, depth + 1);
        }
    }

    recurse(rootPath, '', 1);
    return items;
}

/**
 * Walk a local directory and render as a box-drawing tree.
 * opts: { depth, includePaths, excludePaths, maxEntries, rootLabel }
 */
export function formatLocalTree(rootPath, opts = {}) {
    const items = walkLocal(rootPath, opts);
    const rootLabel = opts.rootLabel || path.basename(path.resolve(rootPath));
    return formatPathList(items, { ...opts, rootLabel });
}

/**
 * Render a pre-collected list of {path, type} entries.
 * opts: { rootLabel, maxDepth, includePaths }
 */
export function formatPathList(items, opts = {}) {
    let filtered = items;
    if (opts.includePaths && opts.includePaths.length) {
        const norm = opts.includePaths.map((p) => (p.endsWith('/') ? p.slice(0, -1) : p));
        filtered = filtered.filter((f) => norm.some((p) => f.path === p || f.path.startsWith(p + '/')));
    }
    if (opts.maxDepth && opts.maxDepth > 0) {
        filtered = filtered.filter((f) => f.path.split('/').length <= opts.maxDepth);
    }
    const root = createTreeNode('root', true);
    for (const f of filtered) addPathToTree(root, f.path, f.type === 'tree');
    const body = treeToString(root).trim();
    const label = opts.rootLabel || '.';
    return `${label}/\n${body}`;
}
