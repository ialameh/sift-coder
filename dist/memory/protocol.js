/**
 * Wire protocol for SiftCoder memory daemon.
 * Length-prefixed JSON over Unix domain socket: 4-byte big-endian uint32 length, then UTF-8 JSON body.
 */
const MAX_FRAME_BYTES = 16 * 1024 * 1024;
export function encodeFrame(message) {
    const body = Buffer.from(JSON.stringify(message), 'utf8');
    if (body.length > MAX_FRAME_BYTES) {
        throw new Error(`frame too large: ${body.length} > ${MAX_FRAME_BYTES}`);
    }
    const header = Buffer.alloc(4);
    header.writeUInt32BE(body.length, 0);
    return Buffer.concat([header, body]);
}
export class FrameDecoder {
    buf = Buffer.alloc(0);
    push(chunk) {
        this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);
        const out = [];
        while (this.buf.length >= 4) {
            const len = this.buf.readUInt32BE(0);
            if (len > MAX_FRAME_BYTES) {
                throw new Error(`frame too large: ${len} > ${MAX_FRAME_BYTES}`);
            }
            if (this.buf.length < 4 + len)
                break;
            const body = this.buf.subarray(4, 4 + len);
            out.push(JSON.parse(body.toString('utf8')));
            this.buf = this.buf.subarray(4 + len);
        }
        return out;
    }
}
export const MAX_FRAME = MAX_FRAME_BYTES;
//# sourceMappingURL=protocol.js.map