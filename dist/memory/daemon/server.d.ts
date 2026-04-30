/**
 * UDS-based RPC server for SiftCoder memory.
 * Each connection: framed Request -> framed Response. Stateless per-connection.
 */
import { Server } from 'node:net';
import { Request, Response } from '../protocol.js';
import { Storage } from '../storage/storage.js';
import { WAL } from './wal.js';
import type { Embedder } from '../embedder.js';
export interface ServerDeps {
    storage: Storage;
    wal: WAL;
    socketPath: string;
    cwd: string;
    embedder?: Embedder | null;
    onShutdown?: () => void;
}
export type Handler = (req: Request) => Promise<Response>;
export declare function buildHandler(deps: Pick<ServerDeps, 'storage' | 'wal' | 'cwd' | 'embedder' | 'onShutdown'>): Handler;
export declare function startServer(deps: ServerDeps): Server;
//# sourceMappingURL=server.d.ts.map