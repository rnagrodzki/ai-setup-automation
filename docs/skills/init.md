# `/aisa-init` — Initialize AI configuration for a project

Scaffolds a complete `.claude/` directory and `CLAUDE.md` for any codebase. It detects your tech stack, presents a plan for approval, then generates tailored skills, agents, and a learning journal. If AI configuration already exists, it offers to audit or rebuild instead of overwriting.

## Usage

```text
/aisa-init
```

## Flags

This skill takes no arguments.

## Examples

**New project — no existing `.claude/`**

```text
/aisa-init
```

> Detects stack, presents a setup plan with the list of files that will be created, waits for confirmation, then scaffolds `.claude/` and runs verification.

**Project with existing configuration**

```text
/aisa-init
```

> Detects existing skills/agents, presents a choice:
> - `1. Audit` — review what exists and suggest improvements (non-destructive)
> - `2. Rebuild` — delete and regenerate from scratch (asks for explicit confirmation)

## Prerequisites

- Claude Code installed and running in your project directory
- Node.js >= 16 (for post-setup verification scripts)
- git initialized (recommended — most features assume a git repo)

## What It Creates / Modifies

| Path | Description |
| --- | --- |
| `CLAUDE.md` | Project context document for Claude |
| `.claude/settings.json` | Permissions and environment config |
| `.claude/skills/` | Project-specific skill files |
| `.claude/agents/` | Autonomous agent definitions |
| `.claude/learnings/log.md` | Learning journal |
| `.claude/learnings/README.md` | Learning system documentation |
| `.claude/cache/snapshot.json` | Incremental evolution cache |

After creation, runs `verify-setup.js` automatically and prints a health + compliance report.

## Related Skills

- [`/aisa-audit`](audit.md) — non-destructive review of existing configuration
- [`/aisa-lint`](lint.md) — check new skills against architectural principles
- [`/aisa-update`](update.md) — update specific skills after shipping a feature
