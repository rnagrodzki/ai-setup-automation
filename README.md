# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin for creating and maintaining AI-ready project configurations.

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, commands, and settings
- Provides 9 built-in skills for initial setup, ongoing evolution, health checks, and post-incident learning
- Manages a cache layer to reduce token consumption by 60–80% on repeated audits
- Keeps your AI configuration in sync with your codebase as it evolves

## Installation

```bash
claude plugin add github:rnagrodzki/ai-setup-automation
```

Start a new Claude Code session to verify:

```text
[ai-setup-automation] Plugin loaded. Use /setup-ai to initialize AI configuration for your project.
```

See [docs/getting-started.md](docs/getting-started.md) for a full first-use walkthrough.

## Quick Start

1. Navigate to your project directory
2. Start Claude Code
3. Run `/setup-ai`
4. Follow the interactive prompts

The command detects your tech stack, presents a setup plan for your approval, and scaffolds the full `.claude/` directory.

To audit an existing setup:

```text
/setup-ai audit
```

---

## Plugin: ai-setup-automation

### Commands

| Command | Description |
| --- | --- |
| `/setup-ai` | Full setup: detect tech stack, create `CLAUDE.md`, scaffold `.claude/` |
| `/setup-ai audit` | Audit existing setup and suggest improvements |

### Skills

#### Setup

| Skill | Model | Description |
| --- | --- | --- |
| `aisa-init` | opus | Generate a complete `.claude/` setup from scratch via a 6-phase pipeline: Discovery → Architecture Design → Architecture Critique → Generation → Generation Critique → Wiring & Validation. |

#### Evolution

| Skill | Model | Description |
| --- | --- | --- |
| `aisa-evolve` | opus | Full evolution cycle: snapshot, drift audit, learnings harvest, expansion analysis, change plan, critique, execute. Recommended every 2–4 weeks or after major features. |
| `aisa-evolve-health` | sonnet | Quick read-only health check. Runs snapshot and drift audit only. Auto-fixes critical drift only. |
| `aisa-evolve-target` | sonnet | Targeted evolution after a specific change. Uses `git diff` to scope the audit to only affected skills and agents. |
| `aisa-evolve-harvest` | sonnet | Promote accumulated learnings from `.claude/learnings/log.md` into skills and docs. Use when 10+ active entries exist. |
| `aisa-evolve-postmortem` | opus | Post-incident analysis: create learning entries, identify skill gaps, propose updates to prevent recurrence. |
| `aisa-evolve-cache` | sonnet | Manage `.claude/cache/` snapshots for incremental audits. Subcommands: `rebuild`, `status`, `invalidate`. |
| `aisa-evolve-validate` | sonnet | Validate skills and agents against architectural principles (P1–P3 for skills, A1–A6 for agents). |
| `aisa-evolve-principles` | — | Shared principles, tool registry, and behavioral rules for all `aisa-*` skills. Dependency only — never invoked directly. |

### Recommended Cadence

| When | Skill to run |
| --- | --- |
| New project or full rebuild | `aisa-init` |
| After shipping a feature or refactor | `aisa-evolve-target` |
| Weekly or before a sprint | `aisa-evolve-health` |
| Every 2–4 weeks | `aisa-evolve` |
| When 10+ learning log entries accumulate | `aisa-evolve-harvest` |
| After an incident or painful bug | `aisa-evolve-postmortem` |
| After writing new skills or agents | `aisa-evolve-validate` |

---

## Architecture

This repository serves dual roles:

- **Marketplace** — the root `.claude-plugin/marketplace.json` makes it installable via `claude plugin add`
- **Plugin** — `plugins/ai-setup-automation/` contains the skills, commands, and hooks

```text
ai-setup-automation/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest
├── plugins/
│   └── ai-setup-automation/
│       ├── .claude-plugin/
│       │   └── plugin.json       # Plugin manifest (v0.1.0)
│       ├── skills/               # 9 skill definitions
│       ├── commands/             # Slash commands
│       └── hooks/                # Session hooks
└── docs/                         # Documentation
```

See [docs/architecture.md](docs/architecture.md) for details.

## Documentation

| Document | Description |
| --- | --- |
| [Getting Started](docs/getting-started.md) | Installation, first use, what gets created |
| [Architecture](docs/architecture.md) | Repository structure and how the plugin system works |
| [Adding Skills](docs/adding-skills.md) | Create custom skills for your project |
| [Adding Commands](docs/adding-commands.md) | Create custom slash commands |
| [Adding Hooks](docs/adding-hooks.md) | Set up automated actions on session events |

## License

[AGPL-3.0](LICENSE)
