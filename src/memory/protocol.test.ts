import { describe, it, expect } from 'vitest';
import { encodeFrame, FrameDecoder, MAX_FRAME } from './protocol.js';

describe('encodeFrame', () => {
  it('encodes a small message with a 4-byte big-endian length prefix', () => {
    const buf = encodeFrame({ a: 1 });
    const len = buf.readUInt32BE(0);
    expect(len).toBe(buf.length - 4);
    expect(JSON.parse(buf.subarray(4).toString('utf8'))).toEqual({ a: 1 });
  });

  it('throws when the encoded body exceeds MAX_FRAME', () => {
    const big = 'x'.repeat(MAX_FRAME + 1);
    expect(() => encodeFrame({ s: big })).toThrow(/frame too large/);
  });
});

describe('FrameDecoder', () => {
  it('decodes a single frame split across multiple chunks', () => {
    const dec = new FrameDecoder();
    const frame = encodeFrame({ kind: 'ping' });
    expect(dec.push(frame.subarray(0, 2))).toEqual([]);
    expect(dec.push(frame.subarray(2, 5))).toEqual([]);
    expect(dec.push(frame.subarray(5))).toEqual([{ kind: 'ping' }]);
  });

  it('decodes multiple frames in a single chunk', () => {
    const dec = new FrameDecoder();
    const a = encodeFrame({ a: 1 });
    const b = encodeFrame({ b: 2 });
    expect(dec.push(Buffer.concat([a, b]))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('throws when a frame header advertises a length above MAX_FRAME', () => {
    const dec = new FrameDecoder();
    const header = Buffer.alloc(4);
    header.writeUInt32BE(MAX_FRAME + 1, 0);
    expect(() => dec.push(header)).toThrow(/frame too large/);
  });

  it('returns no frames when given zero data', () => {
    const dec = new FrameDecoder();
    expect(dec.push(Buffer.alloc(0))).toEqual([]);
  });
});
