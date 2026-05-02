/**
 * Wire protocol for SiftCoder memory daemon.
 * Length-prefixed JSON over Unix domain socket: 4-byte big-endian uint32 length, then UTF-8 JSON body.
 */

export type RequestKind =
  | 'capture'
  | 'search'
  | 'timeline'
  | 'get'
  | 'ping'
  | 'status'
  | 'shutdown'
  | 'backfill'
  | 'drain'
  | 'why';

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

export interface StatusRequest {
  kind: 'status';
}

export interface ShutdownRequest {
  kind: 'shutdown';
}

export interface BackfillRequest {
  kind: 'backfill';
  /** Source kind. Currently only 'transcripts'. */
  source?: 'transcripts';
  /** Optional cap on number of transcripts to scan (newest first). */
  limit?: number;
  /** Optional cap on frames per transcript. */
  perTranscriptLimit?: number;
  /** If true, scan only this workspace's encoded cwd. Defaults to true. */
  workspaceOnly?: boolean;
}

export interface DrainRequest {
  kind: 'drain';
  batch?: number;
}

export interface WhyRequest {
  kind: 'why';
  nodeKind: string;
  nodeId: string;
  depth?: number;
}

export type Request =
  | CaptureRequest
  | SearchRequest
  | TimelineRequest
  | GetRequest
  | PingRequest
  | StatusRequest
  | ShutdownRequest
  | BackfillRequest
  | DrainRequest
  | WhyRequest;

export interface OkResponse<T = unknown> {
  ok: true;
  data: T;
}

export interface ErrResponse {
  ok: false;
  error: string;
}

export type Response<T = unknown> = OkResponse<T> | ErrResponse;

const MAX_FRAME_BYTES = 16 * 1024 * 1024;

export function encodeFrame(message: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  if (body.length > MAX_FRAME_BYTES) {
    throw new Error(`frame too large: ${body.length} > ${MAX_FRAME_BYTES}`);
  }
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

export class FrameDecoder {
  private buf: Buffer = Buffer.alloc(0);

  push(chunk: Buffer): unknown[] {
    this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);
    const out: unknown[] = [];
    while (this.buf.length >= 4) {
      const len = this.buf.readUInt32BE(0);
      if (len > MAX_FRAME_BYTES) {
        throw new Error(`frame too large: ${len} > ${MAX_FRAME_BYTES}`);
      }
      if (this.buf.length < 4 + len) break;
      const body = this.buf.subarray(4, 4 + len);
      out.push(JSON.parse(body.toString('utf8')));
      this.buf = this.buf.subarray(4 + len);
    }
    return out;
  }
}

export const MAX_FRAME = MAX_FRAME_BYTES;
