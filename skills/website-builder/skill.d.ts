/**
 * SiftCoder - Website Builder Skill
 *
 * Build beautiful, modern websites from your codebase or from scratch
 * Supports: Documentation, Admin Dashboard, Marketing, Portfolio
 * Frameworks: Next.js, Nuxt, SvelteKit
 * UI: shadcn/ui components with Tailwind CSS
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
/**
 * Website type options
 */
export type WebsiteType = "documentation" | "admin" | "marketing" | "portfolio";
/**
 * Framework options
 */
export type Framework = "nextjs" | "nuxt" | "sveltekit";
/**
 * Website build options
 */
export interface WebsiteBuildOptions {
    type: WebsiteType;
    framework: Framework;
    outputDir: string;
    styling?: {
        colorScheme?: "light" | "dark" | "auto";
        typography?: string;
        primaryColor?: string;
    };
    features?: {
        search?: boolean;
        analytics?: boolean;
        auth?: boolean;
        blog?: boolean;
        contactForm?: boolean;
        versioning?: boolean;
    };
    deployment?: {
        platform?: "vercel" | "netlify" | "cloudflare" | "github-pages" | "custom";
        domain?: string;
    };
}
/**
 * Codebase analysis result
 */
export interface CodebaseAnalysis {
    framework: Framework | null;
    language: string;
    components: number;
    apis: number;
    dataModels: number;
    documentation: boolean;
    features: string[];
    recommendedType: WebsiteType;
    recommendedFramework: Framework;
}
/**
 * Build a website from options
 */
export declare function buildWebsite(options: WebsiteBuildOptions): Promise<{
    success: boolean;
    message: string;
    websitePath?: string;
    steps?: string[];
    error?: string;
}>;
/**
 * Analyze codebase for website generation
 */
export declare function analyzeCodebase(projectPath: string): Promise<{
    success: boolean;
    analysis?: CodebaseAnalysis;
    error?: string;
}>;
/**
 * Recommend website type based on codebase analysis
 */
export declare function recommendWebsiteType(analysis: CodebaseAnalysis): Promise<{
    recommended: WebsiteType;
    confidence: number;
    reasoning: string;
    alternatives: Array<{
        type: WebsiteType;
        reason: string;
    }>;
}>;
/**
 * Select framework based on project and preferences
 */
export declare function selectFramework(projectPath: string, userPreference?: Framework): Promise<{
    recommended: Framework;
    reasoning: string;
    compatibility: string[];
}>;
/**
 * Generate website components from codebase
 */
export declare function generateComponents(projectPath: string, websiteType: WebsiteType, framework: Framework): Promise<{
    success: boolean;
    components?: string[];
    message: string;
}>;
/**
 * Deploy website to platform
 */
export declare function deployWebsite(websitePath: string, platform: string): Promise<{
    success: boolean;
    message: string;
    url?: string;
    steps?: string[];
}>;
declare const buildWebsiteTool: Tool;
declare const analyzeCodebaseTool: Tool;
declare const generateComponentsTool: Tool;
declare const deployWebsiteTool: Tool;
export { buildWebsiteTool, analyzeCodebaseTool, generateComponentsTool, deployWebsiteTool, };
//# sourceMappingURL=skill.d.ts.map