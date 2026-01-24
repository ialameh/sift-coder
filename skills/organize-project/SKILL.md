---
name: organize-project
description: Automatically organize a project folder into the Sift monorepo structure
version: 1.0.0
---

# Organize Project Skill

Automatically organize a project folder into the Sift monorepo structure.

## Description

This skill analyzes a project folder, determines its type, copies it to the appropriate location in the Sift monorepo, and backs up the original with an underscore prefix.

## When to Use

Use this skill when:
- You have a new project to add to the Sift monorepo
- You want to organize existing projects into the proper structure
- You need to back up original project folders

## Instructions

You are the project organizer. Given a folder path, you will:

1. **Resolve Path**
   - Convert relative paths to absolute
   - Verify the directory exists
   - Return error if not found

2. **Determine Project Type**
   Analyze the folder name to determine:
   - Destination name (e.g., SiftSyncServer, ClaudeCodePlugin)
   - Destination category (DevOps, DeveloperTools, AI, WebUI, Documentation)

   Project type detection:
   - **DevOps**: sync, git server, mcp, context, marketplace, gateway
   - **Developer Tools**: claude plugin, vscode, flow, workflow
   - **AI**: ai assistant
   - **Web UI**: web ui, dashboard, website
   - **Documentation**: spec, documentation

3. **Check Destination**
   - Build destination path: `~/Documents/Sift/{category}/{name}`
   - Check if destination already exists
   - Return error with confirmation request if exists

4. **Copy to Sift**
   - Create destination directory
   - Recursively copy all files from source to destination
   - Preserve directory structure

5. **Backup Original**
   - Rename original folder with underscore prefix
   - Original: `project-name`
   - Backup: `_project-name`

6. **Add to Git** (Optional)
   - Run `git add {category}/{name}` in Sift directory
   - Handle non-git repos gracefully

7. **Return Result**
   ```json
   {
     "success": true,
     "folderName": "original-name",
     "destCategory": "DevOps",
     "destName": "SiftSyncServer",
     "destPath": "~/Documents/Sift/DevOps/SiftSyncServer",
     "backupPath": "/path/to/_original-name",
     "steps": ["Step 1...", "Step 2..."],
     "nextSteps": ["cd ~/Documents/Sift/DevOps/SiftSyncServer", "git commit -m 'Add SiftSyncServer'", "git push"]
   }
   ```

## Allowed Tools

- Deno.stat - Check if paths exist
- Deno.mkdir - Create directories
- Deno.readDir - List directory contents
- Deno.copyFile - Copy files
- Deno.rename - Rename/move directories
- Deno.Command - Execute git commands

## Error Handling

1. **Directory Not Found**
   - Return error with clear message
   - Suggest checking path

2. **Destination Exists**
   - Return error with `needsConfirmation: true`
   - Include `destPath` in response
   - Don't proceed without confirmation

3. **Copy Failure**
   - Log which file/folder failed
   - Clean up partial copies
   - Return descriptive error

4. **Git Failure**
   - Treat as warning, not error
   - Continue with completion
   - Include git status in result
