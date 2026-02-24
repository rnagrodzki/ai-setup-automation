---
description: Initialize or audit AI configuration for the current project
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
argument-hint: "[audit]"
---

# /setup-ai Command

Initialize or audit the AI configuration for the current project. This command
creates CLAUDE.md, .claude/ directory structure, and recommends skills, commands,
and hooks based on the detected tech stack.

## Usage

- `/setup-ai` — Full setup: detect tech stack, create CLAUDE.md, scaffold .claude/
- `/setup-ai audit` — Audit existing setup and suggest improvements

## Workflow

### Step 0: Route by Arguments

Check `$ARGUMENTS`:

- If empty or not provided → run full setup (Steps 1–5 below)
- If `audit` → run Steps 1–2 only, then present a report of what exists and what is missing, with recommended improvements and priority (high/medium/low). Do not create any files.

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

### Step 3: Present Plan to User

Before creating any files, present a clear summary of what will happen:

```
AI Setup Plan for [project name]

Detected: [language], [framework], [build tool]

Will create:
  - CLAUDE.md (project context document)
  - .claude/settings.json (with appropriate permissions)
  - .claude/skills/ (directory)
  - .claude/commands/ (directory)

Recommended starter skills:
  - [skill based on tech stack]

Proceed? (yes to continue, no to cancel)
```

Wait for explicit user confirmation before creating any files.

### Step 4: Execute Setup

Use the `aisa-init` skill to perform the actual setup based on
the detected tech stack and user confirmation.

### Step 5: Report Results

After setup, summarize what was created:

- List all files created (with relative paths)
- List recommended next steps
- Remind the user how to add more skills: see the plugin's documentation at `https://github.com/rnagrodzki/ai-setup-automation/blob/main/docs/adding-skills.md`
