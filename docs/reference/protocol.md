# Wire protocol

SiftCoder's daemon speaks one protocol on its Unix domain socket. Length-prefixed JSON, request-response, single-frame per connection. Source-of-truth: `src/memory/protocol.ts`.

## Frame format

Every frame on the wire:

```
+---------+----------------------------------+
|  len    |  body                            |
| 4 bytes |  <len> bytes UTF-8 JSON          |
+---------+----------------------------------+
```

- `len` is a **4-byte big-endian unsigned 32-bit integer** — the byte length of the body that follows.
- The body is a single UTF-8 JSON value (object, in practice).
- Maximum frame: `16 * 1024 * 1024` bytes (16 MiB). Larger frames throw on encode and on decode.

`encodeFrame()` builds the buffer:

```ts
const body = Buffer.from(JSON.stringify(message), 'utf8');
const header = Buffer.alloc(4);
header.writeUInt32BE(body.length, 0);
return Buffer.concat([header, body]);
```

`FrameDecoder` is a stateful chunk-accumulator — push bytes in, get whole frames out, partial reads buffered.

Each connection is one-shot: client opens, writes one request frame, reads one response frame, closes. The daemon doesn't multiplex connections.

## Request types

The discriminant is the `kind` field. The full union from `protocol.ts`:

```ts
type Request =
  | CaptureRequest
  | SearchRequest
  | TimelineRequest
  | GetRequest
  | PingRequest
  | StatusRequest
  | ShutdownRequest
  | BackfillRequest;
```

### `CaptureRequest`

```ts
interface CaptureRequest {
  kind: 'capture';
  sessionId: string;
  tool: string;
  payload: unknown;
  ts?: number;
  source?: string;  // free-form: "claude-code", "cli", "vscode", "github", ...
}
```

| Field | Required | Meaning |
|---|---|---|
| `kind` | yes | Literal `"capture"`. |
| `sessionId` | yes | Claude Code session id, used for grouping events. |
| `tool` | yes | Tool name — `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`, `Notification`, etc. |
| `payload` | yes | The redacted tool payload (full body after secret-stripping). |
| `ts` | no | Unix milliseconds. Defaults to server-side `Date.now()`. |
| `source` | no | Provenance label — defaults to `"claude-code"` for hook captures. |

Sent by `hooks/post-tool-use/capture-observation.mjs` and `hooks/notification/pin-incident.mjs`.

### `SearchRequest`

```ts
interface SearchRequest {
  kind: 'search';
  query: string;
  k?: number;  // default 10
}
```

Hybrid BM25 + vector retrieval, RRF-fused, time-decayed. Returns top-`k` summaries.

### `TimelineRequest`

```ts
interface TimelineRequest {
  kind: 'timeline';
  nearId: number;
  window?: number;  // default 10
}
```

Returns `window` summaries before and after the row with `nearId`, in chronological order.

### `GetRequest`

```ts
interface GetRequest {
  kind: 'get';
  ids: number[];
}
```

Fetch full summary rows by primary keys.

### `PingRequest`

```ts
interface PingRequest { kind: 'ping'; }
```

Liveness check. Daemon replies with `{ ok: true, data: { ... } }` immediately.

### `StatusRequest`

```ts
interface StatusRequest { kind: 'status'; }
```

Returns counts and config snapshot. Used by `siftcoder info`.

### `BackfillRequest`

```ts
interface BackfillRequest {
  kind: 'backfill';
  source?: 'transcripts';
  limit?: number;
  perTranscriptLimit?: number;
  workspaceOnly?: boolean;  // default true
}
```

Replays past Claude Code transcripts into memory. Long-running — clients should use a timeout of ≥5 minutes.

### `ShutdownRequest`

```ts
interface ShutdownRequest { kind: 'shutdown'; }
```

Graceful daemon stop. Daemon flushes WAL, closes the database, exits.

## Response types

```ts
interface OkResponse<T>  { ok: true;  data: T; }
interface ErrResponse    { ok: false; error: string; }
type     Response<T>    = OkResponse<T> | ErrResponse;
```

The daemon always answers with one of these. The client checks `ok` and reads either `data` or `error`. There is no error-code field — `error` is a human-readable string.

Examples of `data` shapes by request:

| Request | `data` shape |
|---|---|
| `ping` | `{ pid, uptimeMs }` |
| `status` | `{ counts: { events, raw, summarized, ... }, namespace, workspace, backends, config }` |
| `capture` | `{ id }` — the inserted event id |
| `search` | `{ hits: [{ id, summaryId, text, score, ts, ... }] }` |
| `timeline` | `{ before: [...], near: {...}, after: [...] }` |
| `get` | `{ summaries: [...] }` |
| `backfill` | `{ scanned, captured, skipped }` |
| `shutdown` | `{ ok }` |

## Worked example: a capture frame

A `Read` tool call on `/etc/hosts` with session id `s_42`:

```json
{
  "kind": "capture",
  "sessionId": "s_42",
  "tool": "Read",
  "payload": { "file_path": "/etc/hosts" },
  "ts": 1714688532000,
  "source": "claude-code"
}
```

Stringified, that body is 134 bytes. The 4-byte big-endian header is `00 00 00 86` (134 decimal = `0x86`). The full frame on the wire:

```
header:  00 00 00 86
body:    7B 22 6B 69 6E 64 22 3A 22 63 61 70 74 75 72 65   {"kind":"capture
         22 2C 22 73 65 73 73 69 6F 6E 49 64 22 3A 22 73   ","sessionId":"s
         5F 34 32 22 2C 22 74 6F 6F 6C 22 3A 22 52 65 61   _42","tool":"Rea
         64 22 2C 22 70 61 79 6C 6F 61 64 22 3A 7B 22 66   d","payload":{"f
         69 6C 65 5F 70 61 74 68 22 3A 22 2F 65 74 63 2F   ile_path":"/etc/
         68 6F 73 74 73 22 7D 2C 22 74 73 22 3A 31 37 31   hosts"},"ts":171
         34 36 38 38 35 33 32 30 30 30 2C 22 73 6F 75 72   4688532000,"sour
         63 65 22 3A 22 63 6C 61 75 64 65 2D 63 6F 64 65   ce":"claude-code
         22 7D                                             "}
```

(Total wire length: `4 + 134 = 138` bytes.)

The daemon writes back:

```json
{ "ok": true, "data": { "id": 8413 } }
```

Header `00 00 00 22` (34 bytes). Body:

```
7B 22 6F 6B 22 3A 74 72 75 65 2C 22 64 61 74 61   {"ok":true,"data
22 3A 7B 22 69 64 22 3A 38 34 31 33 7D 7D         ":{"id":8413}}
```

## Reference encoders/decoders

JavaScript (one-shot):

```js
function encodeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(body.length, 0);
  return Buffer.concat([header, body]);
}

function decodeFirstFrame(buffer) {
  if (buffer.length < 4) throw new Error('short response');
  const len = buffer.readUInt32BE(0);
  if (buffer.length < 4 + len) throw new Error('truncated response');
  return JSON.parse(buffer.subarray(4, 4 + len).toString('utf8'));
}
```

Python (sketch):

```python
import struct, json, socket

def call(sock_path, request, timeout=5.0):
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.settimeout(timeout)
    s.connect(sock_path)
    body = json.dumps(request).encode('utf-8')
    s.sendall(struct.pack('>I', len(body)) + body)
    header = b''
    while len(header) < 4:
        header += s.recv(4 - len(header))
    n = struct.unpack('>I', header)[0]
    body = b''
    while len(body) < n:
        body += s.recv(n - len(body))
    return json.loads(body)
```

## Limits + invariants

- **Max frame**: `16 MiB` — encode and decode both throw beyond this.
- **One frame per connection**: don't pipeline. Open, send, read, close.
- **No partial decoding for the client**: the server sends one complete frame; clients should accumulate until `4 + len(header)` bytes are present.
- **JSON requires UTF-8**: the daemon assumes UTF-8 for the body. Latin-1 will corrupt non-ASCII strings.
- **Big-endian length**: the most common bug in third-party clients is little-endian length. Always `writeUInt32BE` / `readUInt32BE`.

## Where this is used

- Hooks → daemon: `capture` (and a `Notification` capture from `pin-incident`).
- CLI → daemon: `ping`, `status`, `backfill`, `shutdown`.
- MCP server → daemon: `search`, `timeline`, `get` (and a small `drain` is implemented client-side rather than as a kind).
- Web bridge: same socket, same frames; HTTP is just a thin translation layer.
