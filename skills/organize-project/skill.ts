/**
 * SiftCoder - Organize Project Skill
 *
 * Organizes a project folder into the Sift monorepo structure
 * Usage: /siftcoder:organize-project <folder-path>
 */

import {Tool} from "@modelcontextprotocol/sdk/types.js";

/**
 * Organize a project into the Sift monorepo
 */
export async function organizeProject(folderPath: string) {
  // Resolve absolute path
  let projectPath = folderPath;
  if (!projectPath.startsWith('/')) {
    projectPath = `${process.cwd()}/${folderPath}`;
  }

  // Check if path exists
  try {
    await Deno.stat(projectPath);
  } catch {
    return {
      success: false,
      error: `Directory not found: ${projectPath}`,
    };
  }

  const folderName = projectPath.split('/').filter(Boolean).pop()!;

  // Determine project type and destination
  const { destName, destCategory } = determineProjectType(projectPath, folderName);

  const siftBase = `${process.env.HOME}/Documents/Sift`;
  const destPath = `${siftBase}/${destCategory}/${destName}`;
  const backupPath = `${projectPath.substring(0, projectPath.lastIndexOf('/'))}/_${folderName}`;

  // Check if destination exists
  try {
    await Deno.stat(destPath);
    // Destination exists, need confirmation
    return {
      success: false,
      error: `Destination already exists: ${destPath}`,
      needsConfirmation: true,
      destPath,
    };
  } catch {
    // Doesn't exist, good to continue
  }

  const steps: string[] = [];

  // Step 1: Copy to Sift
  steps.push(`Copying ${folderName} to ${destCategory}/${destName}...`);
  await copyDirectory(projectPath, destPath);
  steps.push(`✓ Copied to ${destPath}`);

  // Step 2: Backup original
  steps.push(`Backing up original to _${folderName}...`);
  await Deno.rename(projectPath, backupPath);
  steps.push(`✓ Backed up to: ${backupPath}`);

  // Step 3: Add to git (optional)
  try {
    const command = new Deno.Command("git", {
      args: ["add", `${destCategory}/${destName}`],
      cwd: siftBase,
    });
    await command.output();
    steps.push(`✓ Added to git`);
  } catch (error) {
    steps.push(`⚠ Git add failed (not a git repo or git error)`);
  }

  return {
    success: true,
    folderName,
    destCategory,
    destName,
    destPath,
    backupPath,
    steps,
    nextSteps: [
      `✓ Project organized in Sift monorepo`,
      `✓ Original backed up with underscore prefix`,
      ``,
      `Next steps:`,
      `  cd ${destPath}`,
      `  git commit -m "Add ${destName}"`,
      `  git push`,
    ],
  };
}

/**
 * Determine project type and destination based on folder name and contents
 */
function determineProjectType(projectPath: string, folderName: string): {
  destName: string;
  destCategory: string;
} {
    const lowerName = folderName.toLowerCase();

    // DevOps Projects
    if (lowerName.includes('sync') || lowerName.includes('git') && lowerName.includes('server')) {
    return { destName: 'SiftSyncServer', destCategory: 'DevOps' };
  }
  if (lowerName.includes('mcp') || lowerName.includes('context') || lowerName.includes('intelligence')) {
    return { destName: 'SiftMCPServer', destCategory: 'DevOps' };
  }
  if (lowerName.includes('marketplace') || lowerName.includes('plugin') && lowerName.includes('distribution')) {
    return { destName: 'LocalMarketplace', destCategory: 'DevOps' };
  }
  if (lowerName.includes('gateway') || lowerName.includes('ai') && lowerName.includes('gateway')) {
    return { destName: 'AIGateway', destCategory: 'DevOps' };
  }

  // Developer Tools
  if (lowerName.includes('claude') && lowerName.includes('plugin')) {
    return { destName: 'ClaudeCodePlugin', destCategory: 'DeveloperTools' };
  }
  if (lowerName.includes('vscode') || lowerName.includes('vs') && lowerName.includes('sift')) {
    return { destName: 'VSCodeSiftCoder', destCategory: 'DeveloperTools' };
  }
  if (lowerName.includes('flow') && lowerName.includes('mason') || lowerName.includes('workflow')) {
    return { destName: 'FlowMason', destCategory: 'DeveloperTools' };
  }

  // AI Projects
  if (lowerName.includes('ai') && lowerName.includes('assistant')) {
    return { destName: 'AIAssistant', destCategory: 'AI' };
  }

  // Web UI
  if (lowerName.includes('web') && lowerName.includes('ui') || lowerName.includes('dashboard')) {
    return { destName: 'SiftDashboard', destCategory: 'WebUI' };
  }
  if (lowerName.includes('website') || lowerName.includes('web') && lowerName.includes('site')) {
    return { destName: 'SiftWebsite', destCategory: 'WebUI' };
  }

  // Documentation
  if (lowerName.includes('spec') || lowerName.includes('specification')) {
    return { destName: 'SpecificationAnalysis', destCategory: 'Documentation' };
  }
  if (lowerName.includes('doc') && (lowerName.includes('plugin') || lowerName.includes('claude'))) {
    return { destName: 'ClaudeCodeDocs', destCategory: 'Documentation' };
  }

  // Default - Unknown type
  return {
    destName: folderName, // Use original name
    destCategory: 'DeveloperTools', // Default to Developer Tools
  };
}

/**
 * Copy a directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  // Create destination directory
  await Deno.mkdir(dest, { recursive: true });

  for await (const entry of Deno.readDir(src)) {
    const srcPath = `${src}/${entry.name}`;
    const destPath = `${dest}/${entry.name}`;

    if (entry.isDirectory) {
      await copyDirectory(srcPath, destPath);
    } else {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

// Skill metadata
const organizeProjectTool: Tool = {
  name: "organize_project",
  description: "Organize a project folder into the Sift monorepo structure",
  inputSchema: {
    type: "object",
    properties: {
      folderPath: {
        type: "string",
        description: "Path to the project folder to organize",
      },
    },
    required: ["folderPath"],
  },
};

export { organizeProjectTool };
