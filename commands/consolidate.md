# /siftcoder:consolidate - Markdown File Consolidator

**Consolidate multiple markdown files into one with auto-generated table of contents.**

## Usage

```bash
/siftcoder:consolidate [pattern] [options]
```

## Arguments
- `$ARGUMENTS` - File pattern, file names, or consolidation method

## Examples

```bash
# Consolidate all markdown files in current directory
/siftcoder:consolidate *.md

# Consolidate specific files
/siftcoder:consolidate file1.md file2.md file3.md

# Consolidate by pattern
/siftcoder:consolidate "chapter-*.md" --into book.md

# Consolidate with backup (rename old files with _ prefix)
/siftcoder:consolidate *.md --backup

# Consolidate with custom intro
/siftcoder:consolidate *.md --intro "This document contains all project documentation"
```

## Instructions

You are a **File Consolidator** that merges multiple markdown files into a single comprehensive document.

---

## Phase 1: File Discovery

### Step 1: Identify Files to Consolidate

```bash
# Method 1: Explicit file names
files=("$@")

# Method 2: Pattern matching
if [[ "$1" == *"*"* ]]; then
  files=($(ls $1))
fi

# Method 3: Directory scan
if [ "$1" == "." ] || [ "$1" == "./" ]; then
  files=($(find . -maxdepth 1 -name "*.md" | sort))
fi

echo "📄 Found ${#files[@]} files to consolidate"
```

### Step 2: Sort Files (if needed)

```bash
# Sort alphabetically
sorted_files=($(for f in "${files[@]}"; do echo "$f"; done | sort))

# Or sort by modification time
sorted_files=($(for f in "${files[@]}"; do echo "$(stat -f %m "$f") $f"; done | sort -n | cut -d' ' -f2-))
```

---

## Phase 2: Consolidation

### Step 1: Generate Table of Contents

```markdown
# Table of Contents

1. [Section 1](#section-1) - [file1.md](#file1md)
2. [Section 2](#section-2) - [file2.md](#file2md)
3. [Section 3](#section-3) - [file3.md](#file3md)

---

```

### Step 2: Process Each File

```bash
output_file="consolidated.md"

# Add intro (if provided)
if [ -n "$intro" ]; then
  echo "# $intro" > "$output_file"
  echo "" >> "$output_file"
fi

# Add table of contents
echo "## Table of Contents" >> "$output_file"
echo "" >> "$output_file"

for file in "${sorted_files[@]}"; do
  # Extract title
  title=$(grep -m 1 "^# " "$file" | sed 's/^# //')

  # Add to TOC
  echo "- [$title](#$slug) - [$file]($slug)" >> "$output_file"
done

echo "" >> "$output_file"
echo "---" >> "$output_file"
echo "" >> "$output_file"

# Concatenate files
for file in "${sorted_files[@]}"; do
  # Add file separator
  echo "## $file" >> "$output_file"
  echo "" >> "$output_file"

  # Add file contents
  cat "$file" >> "$output_file"

  # Add separator between files
  echo "" >> "$output_file"
  echo "---" >> "$output_file"
  echo "" >> "$output_file"
done
```

### Step 3: Backup Original Files (optional)

```bash
if [ "$backup" = true ]; then
  echo "📦 Backing up original files..."

  for file in "${sorted_files[@]}"; do
    # Rename with _ prefix
    backup_name="_$(basename "$file")"
    mv "$file" "$(dirname "$file")/$backup_name"
    echo "  Backed up: $file → $backup_name"
  done
fi
```

---

## Phase 3: Output

### Example Output

```bash
$ /siftcoder:consolidate chapter-*.md --into book.md

📄 Found 5 files to consolidate

Processing:
  ✓ chapter-1-intro.md
  ✓ chapter-2-setup.md
  ✓ chapter-3-development.md
  ✓ chapter-4-testing.md
  ✓ chapter-5-deployment.md

📝 Created: book.md
  - 5 chapters
  - 1,250 lines
  - ~50,000 words

Backup: Skipped (use --backup to backup originals)

Summary:
  Consolidated 5 markdown files into book.md
  Auto-generated table of contents
  Preserved all formatting and structure
```

---

## Consolidation Methods

### Method 1: Pattern-Based

```bash
# All markdown files
/siftcoder:consolidate "*.md"

# All chapters
/siftcoder:consolidate "chapter-*.md"

# All documentation
/siftcoder:consolidate "docs/*.md"
```

### Method 2: Explicit Files

```bash
# Specific files in specific order
/siftcoder:consolidate intro.md features.md api.md deployment.md
```

### Method 3: Directory-Based

```bash
# All files in directory
/siftcoder:consolidate ./docs

# Recursive
/siftcoder:consolidate ./docs --recursive
```

---

## Output Options

### Default Output

```bash
/siftcoder:consolidate *.md
# Creates: consolidated.md
```

### Custom Output Filename

```bash
/siftcoder:consolidate *.md --into my-document.md
```

### With Backup

```bash
/siftcoder:consolidate *.md --backup
# Renames originals with _ prefix
# file1.md → _file1.md
```

### With Intro

```bash
/siftcoder:consolidate *.md --intro "Complete Project Documentation"
```

---

## Integration

### With `/siftcoder:document`

```bash
# First generate documentation
/siftcoder:document architecture

# Then consolidate
/siftcoder:consolidate docs/*.md --into complete-docs.md
```

### With `/siftcoder:build`

```bash
# Build project
/siftcoder:build spec.md

# Consolidate generated docs
/siftcoder:consolidate **/*.md --into project-guide.md
```

---

## Tips & Hints

```
CONSOLIDATION STRATEGIES

By topic:
  → Group related files
  → Example: /siftcoder:consolidate auth-*.md user-*.md

By type:
  → Group by documentation type
  → Example: /siftcoder:consolidate */README.md

Chronological:
  → Sort by date or version
  → Example: /siftcoder:consolidate --sort=date changelog-*.md

ORGANIZATION

Add structure:
  → /siftcoder:consolidate --with-toc
  → Auto-generates table of contents

Add separators:
  → /siftcoder:consolidate --separators
  → Clear visual breaks between files

Number sections:
  → /siftcoder:consolidate --number
  → Auto-number headings

BACKUP STRATEGIES

Always backup:
  → /siftcoder:consolidate --backup
  → Safe if you need originals later

Backup to directory:
  → /siftcoder:consolidate --backup-dir=./backup
  → Keeps directory clean

USE CASES

Create comprehensive guide:
  → /siftcoder:consolidate docs/*.md --into guide.md
  → Single source of truth

Prepare for publishing:
  → /siftcoder:consolidate chapters/*.md --into book.md
  → Ready for PDF/HTML conversion

Archive old docs:
  → /siftcoder:consolidate 2024/*.md --backup --into 2024-archive.md
  → Clean up, preserve history
```

---

## Allowed Tools

Read, Write, Edit, Bash, Glob, Grep
