# Adding Commands

## Overview

Commands define slash commands (e.g., `/setup-ai`) that users invoke directly in
Claude Code. Each command is a single `.md` file with YAML frontmatter.

## Creating a New Command

### Step 1: Create the File

```bash
touch plugins/ai-setup-automation/commands/<command-name>.md
```

The filename (without `.md`) becomes the slash command name:
- `setup-ai.md` → `/setup-ai`
- `audit.md` → `/audit`
- `add-skill.md` → `/add-skill`

### Step 2: Write the Command File

```markdown
---
description: "Short description shown when listing commands"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# /<command-name> Command

Explain what this command does.

## Usage

- `/<command-name>` — Default behavior
- `/<command-name> <arg>` — Behavior with argument

## Workflow

### Step 1: [First Action]

[Instructions for Claude]

### Step 2: [Second Action]

[Instructions for Claude]
```

## Frontmatter Fields

| Field | Required | Description |
|---|---|---|
| `description` | Yes | Short description shown in command listing |
| `allowed-tools` | No | Tools this command may use (defaults to all) |
| `argument-hint` | No | Hint text for what argument the command accepts |
| `model` | No | Override the model (e.g., `claude-haiku-4-5-20251001`) |

## Allowed Tools Reference

| Command Type | Suggested Tools |
|---|---|
| Read-only analysis | `[Read, Glob, Grep, Bash]` |
| Code generation | `[Read, Write, Edit, Glob, Grep, Bash]` |
| Git operations | `[Bash]` |

## Tips

1. **Be explicit in instructions** — Commands are followed literally by Claude
2. **Include bash examples** — Show exact commands Claude should run
3. **Handle edge cases** — What if a file doesn't exist? What if git history is empty?
4. **Ask before destructive actions** — Always confirm with user before overwriting files
5. **Delegate to skills** — Reference skills by name for complex workflows

## Example: Audit Command

`commands/audit.md`:
```markdown
---
description: Audit the current project's AI configuration and suggest improvements
allowed-tools: [Read, Glob, Grep, Bash]
---

# /audit Command

Review the current project's AI configuration and report on what is missing
or could be improved.

## Workflow

### Step 1: Check for CLAUDE.md

```bash
test -f CLAUDE.md && echo "exists" || echo "missing"
```

### Step 2: Check .claude/ Structure

```bash
ls -la .claude/ 2>/dev/null || echo ".claude/ directory not found"
```

### Step 3: Report Findings

Present a checklist of findings:
- What exists and looks good
- What is missing
- Recommended improvements with priority (high/medium/low)
```
