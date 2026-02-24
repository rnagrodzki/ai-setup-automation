# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin for creating and maintaining AI-ready project configurations.

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, commands, and settings
- Provides 9 built-in skills for initial setup, ongoing evolution, health checks, and post-incident learning
- Manages a cache layer to reduce token consumption by 60–80% on repeated audits
- Keeps your AI configuration in sync with your codebase as it evolves

## Technical Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | — | This is a Claude Code plugin marketplace |
| Node.js | >= 16 | For `cache-snapshot.js` only. Uses built-in modules, no `npm install` needed |
| git | — | Assumed for most features |
| gh (GitHub CLI) | — | Required for `/sdlc:pr`. Falls back to showing the description if unavailable |

## Installation

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
```

Start a new Claude Code session to verify:

```text
[ai-setup-automation] Plugin loaded. Use /aisa:setup to initialize AI configuration for your project.
[sdlc-utilities] Plugin loaded. Use /sdlc:pr to create or update a pull request with an auto-generated description.
```

> **Note:** Commands and skills are namespaced with the plugin name (e.g., `/aisa:setup`,
> not `/setup`). See [docs/architecture.md](docs/architecture.md#name-resolution) for details.

See [docs/getting-started.md](docs/getting-started.md) for a full first-use walkthrough.

## Quick Start

1. Navigate to your project directory
2. Start Claude Code
3. Run `/aisa:setup`
4. Follow the interactive prompts

The command detects your tech stack, presents a setup plan for your approval, and scaffolds the full `.claude/` directory.

To audit an existing setup:

```text
/aisa:audit
```

---

## Plugins

This marketplace ships two plugins:

**ai-setup-automation** (namespace: `aisa`) — Creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory). Provides 9 skills for initial setup, ongoing evolution, health checks, caching, and post-incident learning.

**sdlc-utilities** (namespace: `sdlc`) — Automates common SDLC tasks. Currently ships a smart pull request command that generates structured PR descriptions from commits and diffs.

---

## Commands

### aisa (ai-setup-automation)

| Command | Description |
| --- | --- |
| `/aisa:setup` | Full setup: detect tech stack, create `CLAUDE.md`, scaffold `.claude/` |
| `/aisa:audit` | Audit existing setup and suggest improvements |
| `/aisa:postmortem` | Interactive guided post-mortem: gather incident context, then run `aisa-evolve-postmortem` |
| `/aisa:postmortem <description>` | Fast post-mortem: skip Q&A, jump straight to the skill with a pre-written description |
| `/aisa:validate` | Validate all skills and agents against architectural principles |
| `/aisa:validate <path>` | Validate only the specified file or directory |

### sdlc (sdlc-utilities)

| Command | Description |
| --- | --- |
| `/sdlc:pr` | Create a pull request with an auto-generated description from commits and diffs |
| `/sdlc:pr --draft` | Create a draft PR |
| `/sdlc:pr --base <branch>` | Create a PR targeting a specific base branch |

---

## Plugin: ai-setup-automation — Detailed Reference

### Skills

#### `aisa:aisa-init` — Build from scratch

Full 6-phase pipeline: discover project → design skills/agents → critique → generate → critique → wire.

```text
aisa:aisa-init specs/
aisa:aisa-init openspec/
aisa:aisa-init          # auto-detects specs location
```

**When**: New project setup, full `.claude/` rebuild, starting fresh.
**Model**: opus
**Phases**: Discovery → Design → Critique → Generate → Critique → Wire

---

#### `aisa:aisa-evolve` — Full evolution cycle

7-phase pipeline: snapshot → drift audit → harvest learnings → expansion analysis → change plan → critique → execute.

```text
aisa:aisa-evolve
aisa:aisa-evolve payment-integration   # emphasize a specific area
```

**When**: Every 2-4 weeks, after major features, when setup feels stale.
**Model**: opus
**Phases**: Snapshot → Drift → Harvest → Expand → Plan → Critique → Execute

---

#### `aisa:aisa-evolve-health` — Quick health check

Read-only drift scan. Reports status of every skill/agent/CLAUDE.md. Only fixes critical issues.

```text
aisa:aisa-evolve-health
```

**When**: Weekly, before sprints, quick sanity check.
**Model**: sonnet
**Output**: Health report with CURRENT/OUTDATED/STALE/CRITICAL status per file.

---

#### `aisa:aisa-evolve-harvest` — Promote learnings

Processes ACTIVE entries in `.claude/learnings/log.md` into skills, docs, and specs.

```text
aisa:aisa-evolve-harvest
```

**When**: 10+ ACTIVE learning entries, or oldest entry >2 weeks old.
**Model**: sonnet
**Actions**: Promotes to skill gotchas, creates new skills, fills doc gaps, rewrites unclear rules.

---

#### `aisa:aisa-evolve-target` — Targeted update

Scoped update after a specific change. Fast, focused, no full evolution.

```text
aisa:aisa-evolve-target added Stripe webhook handler for subscription cancellation
aisa:aisa-evolve-target refactored auth module from sessions to JWT
aisa:aisa-evolve-target new PIX payment integration
```

**When**: After shipping a feature, completing a refactor, adding an integration.
**Model**: sonnet
**Scope**: Only the affected skills/agents. Flags but doesn't fix unrelated drift.

---

#### `aisa:aisa-evolve-postmortem` — Learn from incidents

Creates learning entries, identifies skill gaps that allowed the incident, proposes prevention.

```text
aisa:aisa-evolve-postmortem webhook retry loop caused duplicate payments
aisa:aisa-evolve-postmortem OIDC token refresh race condition in concurrent requests
aisa:aisa-evolve-postmortem test suite passed but feature broke in production due to mocked repo
```

**When**: After incidents, painful bugs, production issues, long debugging sessions.
**Model**: opus
**Actions**: Creates learning entries, updates skills with prevention rules, closes test gaps.

---

#### `aisa:aisa-evolve-validate` — Principle compliance check

Validates all skills and agents against architectural principles (self-learning, Plan→Do→Critique→Improve, structural completeness). Does NOT check codebase accuracy — purely structural/pattern validation.

```text
aisa:aisa-evolve-validate
aisa:aisa-evolve-validate .claude/skills/my-new-skill.md     # validate specific file
aisa:aisa-evolve-validate .claude/agents/                     # validate all agents
```

**When**: After introducing new skills/agents independently, before committing skill changes, after manual edits.
**Model**: sonnet
**Checks**: Self-learning directives, Quality Gates sections, agent frontmatter, tool validity, self-review workflow, capability-tool consistency.
**Does NOT**: Check codebase accuracy, file paths, symbol signatures, or content quality — that's `aisa:aisa-evolve-health`.

---

#### `aisa:aisa-evolve-cache` — Manage snapshot cache

Maintains `.claude/cache/` for incremental scanning. Reduces token consumption by 60-80% on repeat evolution runs.

```text
aisa:aisa-evolve-cache              # rebuild cache from current state
aisa:aisa-evolve-cache status       # report cache freshness
aisa:aisa-evolve-cache invalidate   # force full scan on next run
```

**When**: After any aisa-evolve cycle (auto-rebuilt), or manually when cache seems stale.
**Model**: sonnet
**Output**: `.claude/cache/snapshot.json` (file hashes + principle flags) and `drift-report.json` (last audit results).

---

> **`aisa:aisa-evolve-principles`** — Shared principles, tool registry, and behavioral rules for all `aisa-*` skills. Dependency only — never invoked directly.

### `/aisa:postmortem` — Guided incident analysis

Walks you through describing an incident with interactive questions, checks recent git history for
evidence, then hands off to the `aisa-evolve-postmortem` skill to encode the lessons into your
skills so the same mistake can't happen again.

```text
/aisa:postmortem
```

Answer questions one at a time:

```text
What went wrong? Describe the incident, bug, or painful situation.
> webhook retry loop caused duplicate payments in checkout

How did you find out?
> customer support tickets, 3 duplicate charges reported

How was it fixed — or is it still open?
> added idempotency key check before processing retry

How long did it take to identify the root cause?
> ~4 hours

Which part of the codebase or system was involved?
> payments/webhook_handler.py and the Stripe retry config
```

Or skip the Q&A by providing a description upfront:

```text
/aisa:postmortem webhook retry loop caused duplicate payments in checkout
/aisa:postmortem OIDC token refresh race condition in concurrent requests
/aisa:postmortem test suite passed but feature broke in production due to mocked repo
```

**When**: After incidents, painful bugs, production issues, long debugging sessions.
**Requires**: A project with `.claude/` configured (run `/aisa:setup` first if not).
**Delegates to**: `aisa:aisa-evolve-postmortem` skill for root cause → skill gap analysis.

### `/aisa:validate` — Principle compliance check

Thin wrapper around the `aisa-evolve-validate` skill. Validates all `.claude/` skills and agents
against architectural principles — structural completeness, self-learning directives, and
Plan→Do→Critique→Improve patterns. Does NOT check codebase accuracy.

```text
/aisa:validate
/aisa:validate .claude/skills/my-new-skill/SKILL.md   # validate specific file
/aisa:validate .claude/agents/                         # validate all agents
```

**When**: After adding or editing skills/agents, before committing `.claude/` changes, as a
pre-flight check in any workflow that creates or modifies skills.
**Requires**: A project with `.claude/` configured (run `/aisa:setup` first if not).
**Delegates to**: `aisa:aisa-evolve-validate` skill for all checks and optional fix application.

---

### Recommended Cadence

| When | Skill to run |
| --- | --- |
| New project or full rebuild | `aisa:aisa-init` |
| After shipping a feature or refactor | `aisa:aisa-evolve-target` |
| Weekly or before a sprint | `aisa:aisa-evolve-health` |
| Every 2–4 weeks | `aisa:aisa-evolve` |
| When 10+ learning log entries accumulate | `aisa:aisa-evolve-harvest` |
| After an incident or painful bug | `aisa:aisa-evolve-postmortem` |
| After writing new skills or agents | `/aisa:validate` → `aisa:aisa-evolve-validate` |

### File Structure

```text
.claude/skills/
├── aisa-init/
│   ├── SKILL.md          # aisa:aisa-init — build from scratch
│   └── REFERENCE.md      # Full pipeline specification
├── aisa-evolve/
│   ├── SKILL.md          # aisa:aisa-evolve — full evolution cycle
│   └── REFERENCE.md      # Full Evolver pipeline specification
├── aisa-evolve-health/
│   └── SKILL.md          # aisa:aisa-evolve-health — quick health check
├── aisa-evolve-harvest/
│   └── SKILL.md          # aisa:aisa-evolve-harvest — promote learnings
├── aisa-evolve-target/
│   └── SKILL.md          # aisa:aisa-evolve-target — scoped update
├── aisa-evolve-validate/
│   ├── SKILL.md          # aisa:aisa-evolve-validate — principle compliance
│   └── REFERENCE.md      # Validation checks specification
├── aisa-evolve-cache/
│   └── SKILL.md          # aisa:aisa-evolve-cache — snapshot cache management
├── aisa-evolve-postmortem/
│   └── SKILL.md          # aisa:aisa-evolve-postmortem — incident learning
└── aisa-evolve-principles/
    └── SKILL.md          # Shared principles and rules (dependency only)
```

### Lifecycle

```text
New project ──→ /aisa-init ──→ daily development ──→ /aisa-evolve-target (after features)
                    │                  │                       │
                    │                  ├── /aisa-evolve-health (weekly)
                    │                  ├── /aisa-evolve-harvest (when log fills up)
                    │                  ├── /aisa-evolve-validate (after adding/editing skills)
                    │                  ├── /aisa-evolve (every 2-4 weeks)
                    │                  └── /aisa-evolve-postmortem (after incidents)
                    │
                    └── /aisa-evolve-cache (auto-rebuilt after each cycle)
```

### Scaling: Execution Modes & Token Optimization

#### Execution Mode Selector (auto-detected)

| Setup size (skills + agents) | Mode | Token multiplier | Best for |
| --- | --- | --- | --- |
| ≤ 15 | Subagent parallel (`Task` tool) | ~2× | Independent workstreams, fresh context per audit |
| > 15 | Agent Teams (experimental) | ~3-4× | Cross-cutting drift, inter-agent coordination |

**Always parallel.** Even small setups benefit from workstream isolation — each subagent gets a fresh context window, preventing audit fatigue and token bloat in the orchestrator.

**Agent Teams** require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Teammates get their own context windows and can share findings with each other (unlike subagents which only report back to the orchestrator). Use when workstreams have cross-cutting dependencies — e.g., a renamed type affects both domain and technical skills.

#### Cache-First Incremental Scanning

All `aisa-evolve-*` skills check `.claude/cache/snapshot.json` before scanning:

- **UNCHANGED** files (hash match) → skip deep audit, carry forward cached status
- **MODIFIED** files (hash differs) → full audit
- **NEW** files (not in cache) → full audit
- **DELETED** files (in cache, not on disk) → flag for cleanup

Token savings: **60-80%** on typical runs where <30% of files changed. Cache is rebuilt automatically after every full `aisa-evolve` cycle.

### Core Principles

Enforced across all commands:

1. **Spec-driven development** — specs are source of truth
2. **Functional-first testing** — real infra, mock only at lowest external boundary
3. **Three-dimensional domains** — technical + business + design
4. **Continuous learning** — capture during work, promote to skills over time (self-learning directives mandatory)
5. **Plan → Do → Critique → Improve** — every skill/agent workflow must include a review step before output is done (quality gates mandatory)
6. **Specificity over generics** — every skill must be THIS project's skill, not generic advice
7. **Critique gates** — mandatory quality checks prevent shallow output
8. **Structural completeness** — agents must have valid frontmatter, real tools, and capability-tool consistency
9. **Cache-first scanning** — check snapshot hashes before deep-reading files; skip unchanged content to minimize token consumption
10. **Always parallel** — use subagent workstreams or Agent Teams for every audit; never single-thread through the full setup

---

## Plugin: sdlc-utilities — Detailed Reference

### `/sdlc:pr` — Smart pull request creation

Analyzes all commits and the diff on your branch, then generates a Conventional PR description
(What / Why / How / Testing) and creates the PR via the GitHub CLI. Presents the generated
description for your review before creating.

```text
/sdlc:pr
```

Generates a title and structured description, then prompts:

```text
PR Title: feat: add webhook retry with idempotency keys

PR Description:
─────────────────────────────────────────────
## What
Added idempotency key validation to the webhook retry handler to prevent
duplicate payment processing on retried events (#142).

## Why
Retried webhook events were being processed multiple times, causing duplicate
charges in checkout. Stripe sends the same event ID on retries, which we can
use as an idempotency key.

## How
- `payments/webhook_handler.py`: check event ID against `processed_events`
  table before processing; store ID after successful processing
- `db/migrations/`: new `processed_events` table with TTL index
- `payments/tests/test_webhook_handler.py`: added retry deduplication tests

## Testing
Automated: 4 new unit tests covering duplicate event detection, first-time
processing, expired TTL, and concurrent retry scenarios. All pass.
Manual: triggered test webhooks with repeated event IDs via Stripe CLI.
─────────────────────────────────────────────

Create this PR? (yes / edit / cancel)
```

With flags:

```text
/sdlc:pr --draft                    # create as a draft PR
/sdlc:pr --base develop             # target the develop branch instead of main
/sdlc:pr --draft --base release/2   # combine flags
```

**When**: Ready to open a PR and want a structured, consistent description without writing it by hand.
**Requires**: `gh` CLI installed and authenticated (`gh auth login`). Falls back to showing the description for manual use if `gh` is unavailable.
**Delegates to**: `sdlc:creating-pull-requests` skill for description generation.

### `sdlc:creating-pull-requests` skill

Reusable knowledge skill that analyzes commits and diffs to generate PR descriptions in the
Conventional PR format. Loaded by the `/sdlc:pr` command and available to any other command or
skill that needs to produce PR content.

**Template:**

```text
## What
[1-3 sentences: what changed, feature/fix/refactor type, issue references]

## Why
[1-3 sentences: concrete problem or need, never "because it was needed"]

## How
[Bullet list grouped by concern: architectural decisions, key files, non-obvious choices]

## Testing
[Automated tests added/modified, manual steps, edge cases. Honest about gaps.]
```

**When triggered**: "create PR", "open pull request", "write PR description", "conventional PR format"

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
