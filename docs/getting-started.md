# Getting Started

## Installation

### From GitHub

Add the marketplace to your Claude Code installation:

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
```

This registers the marketplace and installs the `ai-setup-automation` plugin with all
its skills, commands, and hooks.

### Verifying Installation

After installation, start a new Claude Code session. You should see messages from both plugins:

```
[ai-setup-automation] Plugin loaded. Use /aisa:setup to initialize AI configuration for your project.
[sdlc-utilities] Plugin loaded. Use /sdlc:pr to create or update a pull request with an auto-generated description.
```

> **Note:** Commands and skills are namespaced with the plugin name. The `/setup` command
> becomes `/aisa:setup`, and `/pr` becomes `/sdlc:pr`. See
> [Architecture](architecture.md#name-resolution) for details.

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
