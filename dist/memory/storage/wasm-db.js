/**
 * Loads node-sqlite3-wasm and returns a DBHandle-compatible wrapper. Throws if the package
 * is not installed.
 */
export async function openWasmDatabase(path) {
    const raw = await import('node-sqlite3-wasm');
    const Ctor = raw.Database ?? raw.default?.Database;
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