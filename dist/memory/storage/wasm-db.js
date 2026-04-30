/**
 * Loads node-sqlite3-wasm and returns a DBHandle-compatible wrapper. Throws if the package
 * is not installed.
 */
export async function openWasmDatabase(path) {
    let raw;
    try {
        raw = await import('node-sqlite3-wasm');
    }
    catch (e) {
        /* c8 ignore next 5 -- Cache plugin install missing optional dep; bubble up actionable msg */
        throw new Error('WASM SQLite fallback unavailable: node-sqlite3-wasm not installed. ' +
            'Run /siftcoder:mem-check (or `npm install` in the plugin dir) to repair, ' +
            `then retry. Underlying: ${e.message}`);
    }
    /* c8 ignore next -- ESM-CJS interop fallback: node-sqlite3-wasm currently exposes Database as named, but bundlers may move it under default */
    const Ctor = raw.Database ?? raw.default?.Database;
    /* c8 ignore next 3 -- defensive guard for module-shape drift in node-sqlite3-wasm */
    if (typeof Ctor !== 'function') {
        throw new Error('node-sqlite3-wasm: Database constructor not found in module exports');
    }
    const inner = new Ctor(path);
    return wrap(inner);
}
export function wrap(inner) {
    return {
        exec(sql) {
            return inner.exec(sql);
        },
        prepare(sql) {
            const stmt = inner.prepare(sql);
            return {
                run(...params) {
                    const r = stmt.run(params.length > 0 ? params : undefined);
                    return { lastInsertRowid: r.lastInsertRowid };
                },
                get(...params) {
                    return stmt.get(params.length > 0 ? params : undefined);
                },
                all(...params) {
                    return stmt.all(params.length > 0 ? params : undefined);
                },
            };
        },
        close() {
            inner.close();
        },
    };
}
//# sourceMappingURL=wasm-db.js.map