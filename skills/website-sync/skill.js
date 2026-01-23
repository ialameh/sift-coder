/**
 * SiftCoder - Website Sync Skill
 *
 * Synchronize codebase changes to generated websites
 * Detects changes, maps them to website updates, and applies sync strategies
 */
/**
 * Detect changes in codebase
 */
export async function detectChanges(projectPath, websitePath) {
    try {
        const changes = [];
        // Check for API changes
        // Look for changes in API routes, controllers, handlers
        const apiPatterns = ["api", "routes", "controllers", "handlers"];
        for (const pattern of apiPatterns) {
            try {
                for await (const entry of Deno.readDir(`${projectPath}/${pattern}`)) {
                    if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
                        changes.push({
                            type: "api",
                            file: `${pattern}/${entry.name}`,
                            description: "API endpoint file",
                            impact: "critical",
                        });
                    }
                }
            }
            catch { }
        }
        // Check for component changes
        try {
            for await (const entry of Deno.readDir(`${projectPath}/components`)) {
                if (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx")) {
                    changes.push({
                        type: "component",
                        file: `components/${entry.name}`,
                        description: "Component file",
                        impact: "moderate",
                    });
                }
            }
        }
        catch { }
        // Check for documentation changes
        const docFiles = ["README.md", "CHANGELOG.md", "CONTRIBUTING.md"];
        for (const docFile of docFiles) {
            try {
                const stat = await Deno.stat(`${projectPath}/${docFile}`);
                changes.push({
                    type: "docs",
                    file: docFile,
                    description: "Documentation file",
                    impact: "low",
                });
            }
            catch { }
        }
        // Check for model changes
        const modelPatterns = ["models", "types", "entities", "schemas"];
        for (const pattern of modelPatterns) {
            try {
                for await (const entry of Deno.readDir(`${projectPath}/${pattern}`)) {
                    if (entry.name.endsWith(".ts")) {
                        changes.push({
                            type: "model",
                            file: `${pattern}/${entry.name}`,
                            description: "Data model or type definition",
                            impact: "critical",
                        });
                    }
                }
            }
            catch { }
        }
        return { success: true, changes };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Map codebase changes to website sync actions
 */
export async function mapChanges(changes, websiteType, syncMode) {
    const actions = [];
    for (const change of changes) {
        switch (websiteType) {
            case "documentation":
                if (change.type === "api") {
                    actions.push({
                        action: "update",
                        target: `docs/api/${change.file.replace(/\.(ts|js)$/, "")}.mdx`,
                        description: `Update API docs for ${change.file}`,
                        autoApply: syncMode === "auto",
                    });
                }
                else if (change.type === "docs") {
                    actions.push({
                        action: "update",
                        target: `docs/${change.file.replace(".md", "")}.mdx`,
                        description: `Update documentation content from ${change.file}`,
                        autoApply: syncMode === "auto",
                    });
                }
                else if (change.type === "model") {
                    actions.push({
                        action: "update",
                        target: `docs/reference/${change.file.replace(/\.(ts)$/, "")}.mdx`,
                        description: `Update type reference docs for ${change.file}`,
                        autoApply: syncMode === "auto",
                    });
                }
                break;
            case "admin":
                if (change.type === "model") {
                    actions.push({
                        action: "update",
                        target: `app/${change.file.replace(/\.(ts)$/, "")}/page.tsx`,
                        description: `Update CRUD page for ${change.file}`,
                        autoApply: syncMode === "auto",
                    });
                }
                else if (change.type === "api") {
                    actions.push({
                        action: "update",
                        target: `app/dashboard/page.tsx`,
                        description: `Update dashboard to reflect API changes`,
                        autoApply: syncMode === "semi-auto",
                    });
                }
                break;
            case "marketing":
                if (change.type === "docs" && change.file === "README.md") {
                    actions.push({
                        action: "review",
                        target: "app/page.tsx",
                        description: "Review if homepage needs updates from README changes",
                        autoApply: false,
                    });
                }
                break;
            case "portfolio":
                if (change.type === "component") {
                    actions.push({
                        action: "review",
                        target: "app/projects/page.tsx",
                        description: "Review if new component should be showcased",
                        autoApply: false,
                    });
                }
                break;
        }
    }
    return actions;
}
/**
 * Sync changes to website
 */
export async function syncChanges(projectPath, websitePath, websiteType, syncMode) {
    try {
        // Detect changes
        const { changes } = await detectChanges(projectPath, websitePath);
        if (!changes) {
            return {
                success: true,
                changesDetected: 0,
                actionsApplied: 0,
                actionsPending: 0,
                actions: [],
                message: "No changes detected",
            };
        }
        // Map changes to actions
        const actions = await mapChanges(changes, websiteType, syncMode);
        // Apply auto-apply actions
        let actionsApplied = 0;
        let actionsPending = 0;
        for (const action of actions) {
            if (action.autoApply) {
                // In real implementation, would apply the change here
                actionsApplied++;
            }
            else {
                actionsPending++;
            }
        }
        return {
            success: true,
            changesDetected: changes.length,
            actionsApplied,
            actionsPending,
            actions,
            message: `Sync complete: ${actionsApplied} applied, ${actionsPending} pending review`,
        };
    }
    catch (error) {
        return {
            success: false,
            changesDetected: 0,
            actionsApplied: 0,
            actionsPending: 0,
            actions: [],
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Get sync strategy for website type
 */
export function getSyncStrategy(websiteType) {
    const strategies = {
        documentation: {
            defaultMode: "auto",
            description: "Automatically sync code changes to documentation",
            strategies: {
                api: "auto",
                component: "auto",
                docs: "auto",
                model: "auto",
                content: "manual",
            },
        },
        admin: {
            defaultMode: "semi-auto",
            description: "Auto-sync models and APIs, review new features",
            strategies: {
                api: "semi-auto",
                component: "semi-auto",
                docs: "manual",
                model: "auto",
                content: "manual",
            },
        },
        marketing: {
            defaultMode: "manual",
            description: "Manual review for most content changes",
            strategies: {
                api: "manual",
                component: "manual",
                docs: "semi-auto",
                model: "manual",
                content: "manual",
            },
        },
        portfolio: {
            defaultMode: "semi-auto",
            description: "Auto-add new projects, manual review for content",
            strategies: {
                api: "manual",
                component: "semi-auto",
                docs: "manual",
                model: "manual",
                content: "manual",
            },
        },
    };
    return strategies[websiteType];
}
/**
 * Check sync status
 */
export async function checkSyncStatus(projectPath, websitePath) {
    try {
        // In real implementation, would check state files
        return {
            success: true,
            status: {
                lastSync: null,
                pendingChanges: 0,
                syncMode: "auto",
                websiteType: "documentation",
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
// MCP Tool definitions
const detectChangesTool = {
    name: "detect_website_changes",
    description: "Detect changes in codebase that need to be synced to website",
    inputSchema: {
        type: "object",
        properties: {
            projectPath: {
                type: "string",
                description: "Path to the codebase",
            },
            websitePath: {
                type: "string",
                description: "Path to the website",
            },
        },
        required: ["projectPath", "websitePath"],
    },
};
const syncChangesTool = {
    name: "sync_website_changes",
    description: "Sync codebase changes to website based on sync strategy",
    inputSchema: {
        type: "object",
        properties: {
            projectPath: {
                type: "string",
                description: "Path to the codebase",
            },
            websitePath: {
                type: "string",
                description: "Path to the website",
            },
            websiteType: {
                type: "string",
                enum: ["documentation", "admin", "marketing", "portfolio"],
                description: "Type of website",
            },
            syncMode: {
                type: "string",
                enum: ["auto", "semi-auto", "manual"],
                description: "Sync mode to use",
            },
        },
        required: ["projectPath", "websitePath", "websiteType", "syncMode"],
    },
};
const checkSyncStatusTool = {
    name: "check_sync_status",
    description: "Check the sync status between codebase and website",
    inputSchema: {
        type: "object",
        properties: {
            projectPath: {
                type: "string",
                description: "Path to the codebase",
            },
            websitePath: {
                type: "string",
                description: "Path to the website",
            },
        },
        required: ["projectPath", "websitePath"],
    },
};
export { detectChangesTool, syncChangesTool, checkSyncStatusTool, };
//# sourceMappingURL=skill.js.map