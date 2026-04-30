export declare const PORT_RANGE_LOW = 49152;
export declare const PORT_RANGE_HIGH = 65535;
export declare const PORT_RANGE_SIZE: number;
export declare const MAX_RETRIES = 64;
export interface PortChoice {
    port: number;
    source: 'override' | 'derived' | 'random';
}
export declare function chooseStablePort(workspaceKey: string): number;
export declare function nextCandidate(prev: number): number;
export interface PickPortInput {
    workspaceKey: string;
    override?: string | number | null | undefined;
}
export declare function initialPort(input: PickPortInput): PortChoice;
//# sourceMappingURL=port.d.ts.map