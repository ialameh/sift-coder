/**
 * Wire protocol for SiftCoder memory daemon.
 * Length-prefixed JSON over Unix domain socket: 4-byte big-endian uint32 length, then UTF-8 JSON body.
 */
export type RequestKind = 'capture' | 'search' | 'timeline' | 'get' | 'ping' | 'shutdown';
export interface CaptureRequest {
    kind: 'capture';
    sessionId: string;
    tool: string;
    payload: unknown;
    ts?: number;
    /** Free-form provenance label: "claude-code", "cli", "vscode", "github", "slack", ... */
    source?: string;
}
export interface SearchRequest {
    kind: 'search';
    query: string;
    k?: number;
}
export interface TimelineRequest {
    kind: 'timeline';
    nearId: number;
    window?: number;
}
export interface GetRequest {
    kind: 'get';
    ids: number[];
}
export interface PingRequest {
    kind: 'ping';
}
export interface ShutdownRequest {
    kind: 'shutdown';
}
export type Request = CaptureRequest | SearchRequest | TimelineRequest | GetRequest | PingRequest | ShutdownRequest;
export interface OkResponse<T = unknown> {
    ok: true;
    data: T;
}
export interface ErrResponse {
    ok: false;
    error: string;
}
export type Response<T = unknown> = OkResponse<T> | ErrResponse;
export declare function encodeFrame(message: unknown): Buffer;
export declare class FrameDecoder {
    private buf;
    push(chunk: Buffer): unknown[];
}
export declare const MAX_FRAME: number;
//# sourceMappingURL=protocol.d.ts.map