export class McpSamplingClient {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    async generate(req) {
        const res = await this.transport.requestSampling({
            messages: [{ role: 'user', content: { type: 'text', text: req.user } }],
            systemPrompt: req.system,
            maxTokens: req.maxTokens,
            temperature: 0,
            modelPreferences: { hints: [{ name: req.model }] },
        });
        return {
            text: res.content.text ?? '',
            tokensIn: null,
            tokensOut: null,
        };
    }
}
//# sourceMappingURL=sampling-client.js.map