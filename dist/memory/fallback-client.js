export class FallbackModelClient {
    primary;
    secondary;
    consecutiveFailures = 0;
    stickUntil = 0;
    failuresBeforeStick;
    stickWindowMs;
    onFallback;
    now;
    constructor(primary, secondary, opts = {}) {
        this.primary = primary;
        this.secondary = secondary;
        this.failuresBeforeStick = opts.failuresBeforeStick ?? 3;
        this.stickWindowMs = opts.stickWindowMs ?? 60_000;
        this.onFallback = opts.onFallback ?? (() => undefined);
        this.now = opts.now ?? Date.now;
    }
    async generate(req) {
        if (this.now() < this.stickUntil) {
            return this.secondary.generate(req);
        }
        try {
            const r = await this.primary.generate(req);
            this.consecutiveFailures = 0;
            return r;
        }
        catch (e) {
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= this.failuresBeforeStick) {
                this.stickUntil = this.now() + this.stickWindowMs;
            }
            this.onFallback(e, req);
            return this.secondary.generate(req);
        }
    }
}
//# sourceMappingURL=fallback-client.js.map