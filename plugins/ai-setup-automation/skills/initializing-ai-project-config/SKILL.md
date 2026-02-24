---
name: initializing-ai-project-config
description: >-
  Use this skill when setting up AI tooling configuration for a new or existing
  project. Triggers on requests like "set up AI config", "initialize Claude
  configuration", "create CLAUDE.md", "add AI setup", "scaffold .claude directory",
  or when a project needs skills, commands, or hooks directories created. Covers
  creating CLAUDE.md with project context, .claude/ directory structure, starter
  skills, commands, and hooks.
---

# Initializing AI Project Configuration

Set up a complete AI-ready configuration for any project, including CLAUDE.md, .claude/
directory structure, skills, commands, and hooks.

## When to Use This Skill

- Setting up a brand-new project for AI-assisted development
- Adding AI configuration to an existing project that lacks it
- Auditing and improving an existing .claude/ setup
- When a user says "set up AI config" or "initialize Claude configuration"

## Prerequisites

Before starting, gather information about the project:

1. **Language and framework** — What tech stack is used?
2. **Build system** — How is the project built and tested?
3. **Directory structure** — What is the project layout?
4. **Existing AI config** — Is there already a CLAUDE.md or .claude/ directory?

## Workflow

### Step 1: Audit Current State

Check what already exists:

```bash
ls -la CLAUDE.md .claude/ .claude/skills/ .claude/commands/ 2>/dev/null
ls package.json go.mod Cargo.toml pyproject.toml Makefile Taskfile.yml 2>/dev/null
ls -la
```

### Step 2: Create CLAUDE.md

The `CLAUDE.md` file is the project's AI context document. It lives at the repository
root and tells Claude about the project. See `./config-templates.md` for language-specific
templates.

Structure:

```markdown
# Project Name

Brief description of what this project does.

## Tech Stack

- Language: [language]
- Framework: [framework]
- Build tool: [build tool]

## Project Structure

[Key directories and their purposes]

## Development Workflow

### Building
[How to build]

### Testing
[How to run tests]

### Linting
[How to lint]

## Conventions

[Project-specific coding conventions, naming patterns, etc.]
```

### Step 3: Create Directory Structure

```bash
mkdir -p .claude/skills
mkdir -p .claude/commands
```

### Step 4: Create Settings File

If `.claude/settings.json` does not exist, create a minimal one:

```json
{
  "permissions": {
    "allow": []
  }
}
```

Add project-appropriate permissions:

| Project Type | Suggested Permissions |
|---|---|
| Node.js | `Bash(npm:*)`, `Bash(npx:*)` |
| Go | `Bash(go:*)`, `Bash(task:*)` |
| Python | `Bash(python:*)`, `Bash(pip:*)` |
| General | `Bash(git:*)` |

### Step 5: Recommend Starter Skills

Based on the detected tech stack, recommend skills to create. See `./checklist.md` for
the full checklist of recommended skills per project type.

Common starter skills:

- **Writing tests** — patterns specific to the project's test framework
- **Code review** — project-specific review criteria
- **Documentation** — how docs are structured in this project

### Step 6: Recommend Starter Commands

Common slash commands based on project needs:

- `/review` — Review current changes
- `/pr` — Create or update a pull request
- `/test` — Run tests with appropriate flags

### Step 7: Verify Setup

```bash
ls -la .claude/
ls -la .claude/skills/
ls -la .claude/commands/
ls -la CLAUDE.md
wc -l CLAUDE.md
```

## Best Practices

1. **Keep CLAUDE.md concise** — Focus on what AI needs to know, not full documentation
2. **Use relative paths** — All references in skills should use relative paths
3. **Start minimal** — Begin with CLAUDE.md and add skills as patterns emerge
4. **Project-specific** — Tailor skills to the actual tech stack, not generic advice
5. **Version control** — Commit .claude/ directory so the team shares the configuration

## DO NOT

- Overwrite existing CLAUDE.md without asking the user first
- Create skills for technologies not used in the project
- Add overly permissive settings (e.g., `Bash(*)`)
- Create deeply nested directory structures inside .claude/
