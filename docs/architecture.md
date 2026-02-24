# Architecture

## Overview

This repository serves two roles:

1. **Marketplace** — The root `.claude-plugin/marketplace.json` makes the repo installable
   as a Claude Code marketplace
2. **Plugin** — The `plugins/ai-setup-automation/` directory contains the actual plugin
   with skills, commands, and hooks

## Directory Structure

```
ai-setup-automation/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest (entry point)
├── plugins/
│   └── ai-setup-automation/
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin manifest
│       ├── skills/               # Skill definitions
│       │   └── <skill-name>/
│       │       ├── SKILL.md      # Skill entry point (YAML frontmatter + instructions)
│       │       └── *.md          # Optional supporting files
│       ├── commands/             # Slash command definitions
│       │   └── <command>.md      # Command file (YAML frontmatter + instructions)
│       └── hooks/
│           └── hooks.json        # Hook configuration
└── docs/                         # Documentation
```

## How It Works

### Marketplace Layer

The root `marketplace.json` tells Claude Code: "This repository contains plugins. Here
is where to find them." It lists each plugin with a name and a relative source path.

When a user runs `/plugin marketplace add rnagrodzki/ai-setup-automation` in Claude Code:
1. Clones or references this repository
2. Reads `.claude-plugin/marketplace.json`
3. Discovers the listed plugins
4. Loads each plugin from its `source` path

### Plugin Layer

Each plugin has its own `.claude-plugin/plugin.json` that declares:
- **name** and **description** — Identification
- **version** — Semantic version for tracking updates
- **author** — Who maintains this plugin

### Name Resolution

When a plugin is loaded from a marketplace, Claude Code prefixes all commands and skills
with the plugin's `name` (from `plugin.json`), using the format `<plugin-name>:<item-name>`.

**Commands** — invoked as `/<plugin-name>:<command-name>`:

| File | Plugin name | Resolved command |
|---|---|---|
| `commands/setup-ai.md` | `ai-setup-automation` | `/aisa:setup-ai` |
| `commands/pr.md` | `sdlc-utilities` | `/sdlc:pr` |

**Skills** — referenced as `<plugin-name>:<skill-name>`:

| Directory | Plugin name | Resolved name |
|---|---|---|
| `skills/aisa-init/` | `ai-setup-automation` | `aisa:aisa-init` |
| `skills/creating-pull-requests/` | `sdlc-utilities` | `sdlc:creating-pull-requests` |

The `name` field in `plugin.json` is the namespace prefix. Keep it stable — renaming it
changes every command and skill name for all installed users.

### Skills

Skills are directories under `plugins/<plugin>/skills/`. Each skill directory must
contain a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name-in-gerund-form
description: "When Claude should invoke this skill (max 1024 characters)"
---
```

The `description` field is critical — Claude uses it to decide when to activate the
skill. Write it as a trigger condition, not a summary.

Supporting files (`.md` templates, checklists, scripts) live alongside `SKILL.md` in
the same directory. Reference them with relative paths like `./supporting-file.md`.

### Commands

Commands are `.md` files under `plugins/<plugin>/commands/`. The filename (without `.md`)
becomes the slash command name. Each file has YAML frontmatter:

```yaml
---
description: "Short description shown in command list"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---
```

For example, `commands/setup-ai.md` creates the `/setup-ai` command.

### Hooks

Hooks are defined in `plugins/<plugin>/hooks/hooks.json`. Available hook points:

| Hook | When It Fires |
|---|---|
| `SessionStart` | When a Claude Code session begins |
| `PreToolUse` | Before a tool is invoked (use `matcher` to filter by tool name) |
| `PostToolUse` | After a tool completes |

## Adding Multiple Plugins

To add a second plugin to this marketplace:

1. Create `plugins/<new-plugin-name>/` with its own `.claude-plugin/plugin.json`
2. Add an entry to the root `marketplace.json`:

   ```json
   {
     "name": "new-plugin-name",
     "source": "./plugins/new-plugin-name"
   }
   ```

3. Follow the same structure: `skills/`, `commands/`, `hooks/`
