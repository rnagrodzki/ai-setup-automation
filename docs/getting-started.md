# Getting Started

## Installation

### Via Claude Code UI (recommended)

1. Open Claude Code and run `/plugin`
2. Go to **Marketplaces** → **Add marketplace** → enter `rnagrodzki/ai-setup-automation`
3. Go to **Discover** → select `aisa` → **Install**

### Via CLI

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
/plugin install aisa@ai-setup-automation
```

### Verifying Installation

After installation, start a new Claude Code session. You should see a message from the plugin:

```text
[ai-setup-automation] Plugin loaded. Use /aisa:setup to initialize AI configuration for your project.
```

> **Note:** Commands and skills are namespaced with the plugin name. The `/setup` command
> becomes `/aisa:setup`. See [Architecture](architecture.md#name-resolution) for details.

## Updating

### Update via Claude Code UI (recommended)

Open `/plugin`, go to the **Marketplaces** tab, and toggle auto-update for `ai-setup-automation`.

### Update via CLI

```text
/plugin marketplace update ai-setup-automation
/plugin update aisa@ai-setup-automation
```

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

```text
/aisa:audit
```

This reviews what exists and suggests improvements without modifying any files.

---

## Commands

| Command | Description |
| --- | --- |
| [`/aisa:setup`](commands/setup.md) | Detect tech stack and scaffold full `.claude/` configuration |
| [`/aisa:audit`](commands/audit.md) | Audit existing setup and suggest improvements |
| [`/aisa:validate`](commands/validate.md) | Validate skills and agents against architectural principles |
| [`/aisa:postmortem`](commands/postmortem.md) | Guided incident analysis; encode lessons into skills |
| [`/aisa:evolve`](commands/evolve.md) | Full evolution cycle — verify, update, and expand `.claude/` |
| [`/aisa:health`](commands/health.md) | Quick read-only health check; reports drift status per file |
| [`/aisa:target`](commands/target.md) | Targeted update after a specific feature, refactor, or integration |
| [`/aisa:harvest`](commands/harvest.md) | Promote accumulated learnings into skills and docs |
| [`/aisa:cache`](commands/cache.md) | Manage the snapshot cache for incremental scanning |

## What Gets Created

| File/Directory | Purpose |
| --- | --- |
| `CLAUDE.md` | Project context document for Claude |
| `.claude/settings.json` | Permissions and environment config |
| `.claude/skills/` | Directory for project-specific skills |
| `.claude/agents/` | Directory for autonomous agent definitions |
| `.claude/learnings/log.md` | Learning journal |
| `.claude/cache/snapshot.json` | Incremental evolution cache |

## Next Steps

- Read [Architecture](architecture.md) to understand how the plugin works
- Read [Adding Skills](adding-skills.md) to create project-specific skills
- Read [Adding Commands](adding-commands.md) to create custom slash commands
- Read [Adding Hooks](adding-hooks.md) to set up automated actions
