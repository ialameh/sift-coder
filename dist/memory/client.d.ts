import { Request, Response } from './protocol.js';
export interface ClientOptions {
    socketPath: string;
    timeoutMs?: number;
}
export declare class MemoryClient {
    private readonly opts;
    constructor(opts: ClientOptions);
    send<T = unknown>(req: Request): Promise<Response<T>>;
    /** Fire-and-forget capture; returns once the daemon has acknowledged the WAL append. */
    capture(sessionId: string, tool: string, payload: unknown): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map