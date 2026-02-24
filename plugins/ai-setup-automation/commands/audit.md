---
description: Audit existing AI configuration and suggest improvements
allowed-tools: [Read, Glob, Grep, Bash, TodoWrite]
---

# /audit Command

Audit the AI configuration for the current project. Reports what exists,
what is missing, and suggests improvements with priorities. Does not create
or modify any files.

## Usage

- `/audit` — Review existing AI configuration and report gaps

## Workflow

Do not create or modify any files during this workflow.

### Step 1: Detect Tech Stack

Examine the project to determine its technology:

```bash
ls package.json tsconfig.json 2>/dev/null && echo "Node.js/TypeScript detected"
ls go.mod go.sum 2>/dev/null && echo "Go detected"
ls pyproject.toml setup.py requirements.txt 2>/dev/null && echo "Python detected"
ls Cargo.toml 2>/dev/null && echo "Rust detected"
ls Makefile Taskfile.yml 2>/dev/null && echo "Build tool found"
```

### Step 2: Check Existing Configuration

```bash
test -f CLAUDE.md && echo "CLAUDE.md exists" || echo "CLAUDE.md missing"
test -d .claude && echo ".claude/ exists" || echo ".claude/ missing"
test -d .claude/skills && echo "skills/ exists" || echo "skills/ missing"
test -d .claude/commands && echo "commands/ exists" || echo "commands/ missing"
test -f .claude/settings.json && echo "settings.json exists" || echo "settings.json missing"
```

### Step 3: Present Audit Report

Present a prioritized report of what exists and what is missing:

```
AI Configuration Audit — [project name]

Detected stack: [language], [framework], [build tool]

✅ Exists:
  - [list items that exist and look correct]

❌ Missing:
  - [list items that are absent]

Recommendations:
  [high]   — [recommendation]
  [medium] — [recommendation]
  [low]    — [recommendation]
```

Do not create any files. If the user wants to set up missing configuration,
suggest running `/setup`.
