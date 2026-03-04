# Getting Started

## Installation

### Step 1 — Add the marketplace

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
```

This registers the marketplace catalog with Claude Code. No plugins are installed yet.

### Step 2 — Install the plugin

```text
/plugin install aisa@ai-setup-automation
```

Or browse interactively: run `/plugin`, go to the **Discover** tab, and select the plugin to install.

### Verifying Installation

After installation, start a new Claude Code session. You should see a message from the plugin:

```text
[ai-setup-automation] Plugin loaded. Use /aisa:setup to initialize AI configuration for your project.
```

> **Note:** Commands and skills are namespaced with the plugin name. The `/setup` command
> becomes `/aisa:setup`. See [Architecture](architecture.md#name-resolution) for details.

## Updating Plugins

### Refresh the marketplace catalog

```text
/plugin marketplace update ai-setup-automation
```

### Update the plugin

```text
/plugin update aisa@ai-setup-automation
```

### Enable auto-update

Open `/plugin`, go to the **Marketplaces** tab, and toggle auto-update for `ai-setup-automation`.

### Migrating from older installs

If you installed before the naming fix (when the plugin was `ai-setup-automation`), uninstall and reinstall:

```text
/plugin uninstall ai-setup-automation@ai-setup-automation
/plugin install aisa@ai-setup-automation
```

See [Troubleshooting](../README.md#troubleshooting) in the README if you encounter "plugin not found" errors.

## First Use

### Setting Up a New Project

1. Navigate to your project directory
2. Start Claude Code
3. Run `/aisa:setup`
4. Follow the interactive prompts

The command will:
- Detect your project's tech stack (language, framework, build tool)
- Present a setup plan for your approval
- Create `CLAUDE.md` with project context
- Scaffold the `.claude/` directory structure
- Recommend skills and commands tailored to your stack

### Auditing an Existing Setup

If your project already has some AI configuration:

```
/aisa:audit
```

This will review what exists and suggest improvements.

### Other `aisa` Commands

| Command | Purpose |
|---|---|
| `/aisa:postmortem` | Guided incident analysis — encodes lessons into skills to prevent recurrence |
| `/aisa:validate` | Validate all skills and agents in `.claude/` against architectural principles |

## What Gets Created

| File/Directory | Purpose |
|---|---|
| `CLAUDE.md` | Project context document for Claude |
| `.claude/settings.json` | Permissions and environment config |
| `.claude/skills/` | Directory for project-specific skills |
| `.claude/commands/` | Directory for slash commands |

## Next Steps

- Read [Architecture](architecture.md) to understand how the plugin works
- Read [Adding Skills](adding-skills.md) to create project-specific skills
- Read [Adding Commands](adding-commands.md) to create custom slash commands
- Read [Adding Hooks](adding-hooks.md) to set up automated actions
