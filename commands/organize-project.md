---
description: Organize a project folder into the Sift monorepo structure
argument-hint: <folder-path>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# SiftCoder Organize Project

Organizing project: **$ARGUMENTS**

## Process

I'll organize this project into the Sift monorepo by:

1. **Analyzing the project** - Determine its type and proper location
2. **Copying to Sift** - Place it in the correct category folder
3. **Backing up original** - Rename with underscore prefix
4. **Adding to git** - Stage the new files

## Project Detection

The command automatically detects project type from folder name:

- **DevOps**: SiftSyncServer, SiftMCPServer, LocalMarketplace, AIGateway
- **Developer Tools**: ClaudeCodePlugin, VSCodeSiftCoder, FlowMason
- **AI**: AIAssistant
- **Web UI**: SiftDashboard, SiftWebsite
- **Documentation**: SpecificationAnalysis, ClaudeCodeDocs

## What Happens

Given a project at `/path/to/my-project`:

1. Copy to `~/Documents/Sift/{Category}/{ProjectName}/`
2. Rename original to `/path/to/_my-project`
3. Add new files to git (staged, not committed)

## Examples

```bash
# Organize sync server
/siftcoder:organize-project ~/Documents/siftcoder-sync-server

# Organize with relative path
/siftcoder:organize-project ./my-new-project

# Organize from anywhere
/siftcoder:organize-project ~/projects/ai-assistant
```

## After Organization

Once organized, you can:

```bash
cd ~/Documents/Sift/{Category}/{ProjectName}
git commit -m "Add {ProjectName}"
git push
```

## Notes

- **Original files are kept** with underscore prefix (_project-name)
- **Git is not committed automatically** - only staged
- **Destination must not exist** - you'll get an error if it does
- **Large files are ignored** - per .gitignore configuration

---

## Now: Organizing Project

Reading project folder at: **$ARGUMENTS**
