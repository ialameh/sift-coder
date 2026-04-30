/**
 * Deterministic port selection for the SiftCoder Memory HTTP bridge.
 *
 * Strategy:
 *   1. Honor an explicit `SIFTCODER_HTTP_PORT` (or constructor override). 0 = OS-assigned.
 *   2. Otherwise hash the workspace key into IANA's Dynamic / Private port range
 *      (49152 - 65535), giving a stable per-workspace port across daemon restarts.
 *      This range is reserved for ephemeral / private use, so conflicts with well-known
 *      services are vanishingly unlikely.
 *   3. Caller is expected to attempt to bind, then call `nextCandidate(prev)` on EADDRINUSE
 *      to step linearly with wraparound. After `MAX_RETRIES` failures, fall back to 0.
 *
 * Range size: 65535 - 49152 + 1 = 16,384 ports. Linear retry covers up to MAX_RETRIES of these
 * before giving up to OS-assigned.
 */
import { createHash } from 'node:crypto';
export const PORT_RANGE_LOW = 49152;
export const PORT_RANGE_HIGH = 65535;
export const PORT_RANGE_SIZE = PORT_RANGE_HIGH - PORT_RANGE_LOW + 1;
export const MAX_RETRIES = 64;
export function chooseStablePort(workspaceKey) {
    const h = createHash('sha256').update(workspaceKey).digest();
    const n = h.readUInt32BE(0);
    return PORT_RANGE_LOW + (n % PORT_RANGE_SIZE);
}
export function nextCandidate(prev) {
    if (!Number.isFinite(prev) || prev < PORT_RANGE_LOW || prev > PORT_RANGE_HIGH) {
        return PORT_RANGE_LOW;
    }
    return prev === PORT_RANGE_HIGH ? PORT_RANGE_LOW : prev + 1;
}
export function initialPort(input) {
    if (input.override !== null && input.override !== undefined && input.override !== '') {
        const n = typeof input.override === 'number' ? input.override : parseInt(String(input.override), 10);
        if (Number.isFinite(n) && n >= 0 && n <= 65535) {
            return { port: n, source: 'override' };
        }
    }
    return { port: chooseStablePort(input.workspaceKey), source: 'derived' };
}
//# sourceMappingURL=port.js.map