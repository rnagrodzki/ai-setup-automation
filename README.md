# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin for creating and maintaining AI-ready project configurations.

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, commands, and settings
- Provides 9 built-in skills for initial setup, ongoing evolution, health checks, and post-incident learning
- Manages a cache layer to reduce token consumption by 60–80% on repeated audits
- Keeps your AI configuration in sync with your codebase as it evolves

## Installation

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
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
| `/postmortem` | Interactive guided post-mortem: gather incident context, then run `aisa-evolve-postmortem` |
| `/postmortem <description>` | Fast post-mortem: skip Q&A, jump straight to the skill with a pre-written description |

#### `/postmortem` — Guided incident analysis

Walks you through describing an incident with interactive questions, checks recent git history for
evidence, then hands off to the `aisa-evolve-postmortem` skill to encode the lessons into your
skills so the same mistake can't happen again.

```text
/postmortem
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
/postmortem webhook retry loop caused duplicate payments in checkout
/postmortem OIDC token refresh race condition in concurrent requests
/postmortem test suite passed but feature broke in production due to mocked repo
```

**When**: After incidents, painful bugs, production issues, long debugging sessions.
**Requires**: A project with `.claude/` configured (run `/setup-ai` first if not).
**Delegates to**: `aisa-evolve-postmortem` skill for root cause → skill gap analysis.

### Skills

#### `/aisa-init` — Build from scratch

Full 6-phase pipeline: discover project → design skills/agents → critique → generate → critique → wire.

```text
/aisa-init specs/
/aisa-init openspec/
/aisa-init          # auto-detects specs location
```

**When**: New project setup, full `.claude/` rebuild, starting fresh.
**Model**: opus
**Phases**: Discovery → Design → Critique → Generate → Critique → Wire

---

#### `/aisa-evolve` — Full evolution cycle

7-phase pipeline: snapshot → drift audit → harvest learnings → expansion analysis → change plan → critique → execute.

```text
/aisa-evolve
/aisa-evolve payment-integration   # emphasize a specific area
```

**When**: Every 2-4 weeks, after major features, when setup feels stale.
**Model**: opus
**Phases**: Snapshot → Drift → Harvest → Expand → Plan → Critique → Execute

---

#### `/aisa-evolve-health` — Quick health check

Read-only drift scan. Reports status of every skill/agent/CLAUDE.md. Only fixes critical issues.

```text
/aisa-evolve-health
```

**When**: Weekly, before sprints, quick sanity check.
**Model**: sonnet
**Output**: Health report with CURRENT/OUTDATED/STALE/CRITICAL status per file.

---

#### `/aisa-evolve-harvest` — Promote learnings

Processes ACTIVE entries in `.claude/learnings/log.md` into skills, docs, and specs.

```text
/aisa-evolve-harvest
```

**When**: 10+ ACTIVE learning entries, or oldest entry >2 weeks old.
**Model**: sonnet
**Actions**: Promotes to skill gotchas, creates new skills, fills doc gaps, rewrites unclear rules.

---

#### `/aisa-evolve-target` — Targeted update

Scoped update after a specific change. Fast, focused, no full evolution.

```text
/aisa-evolve-target added Stripe webhook handler for subscription cancellation
/aisa-evolve-target refactored auth module from sessions to JWT
/aisa-evolve-target new PIX payment integration
```

**When**: After shipping a feature, completing a refactor, adding an integration.
**Model**: sonnet
**Scope**: Only the affected skills/agents. Flags but doesn't fix unrelated drift.

---

#### `/aisa-evolve-postmortem` — Learn from incidents

Creates learning entries, identifies skill gaps that allowed the incident, proposes prevention.

```text
/aisa-evolve-postmortem webhook retry loop caused duplicate payments
/aisa-evolve-postmortem OIDC token refresh race condition in concurrent requests
/aisa-evolve-postmortem test suite passed but feature broke in production due to mocked repo
```

**When**: After incidents, painful bugs, production issues, long debugging sessions.
**Model**: opus
**Actions**: Creates learning entries, updates skills with prevention rules, closes test gaps.

---

#### `/aisa-evolve-validate` — Principle compliance check

Validates all skills and agents against architectural principles (self-learning, Plan→Do→Critique→Improve, structural completeness). Does NOT check codebase accuracy — purely structural/pattern validation.

```text
/aisa-evolve-validate
/aisa-evolve-validate .claude/skills/my-new-skill.md     # validate specific file
/aisa-evolve-validate .claude/agents/                      # validate all agents
```

**When**: After introducing new skills/agents independently, before committing skill changes, after manual edits.
**Model**: sonnet
**Checks**: Self-learning directives, Quality Gates sections, agent frontmatter, tool validity, self-review workflow, capability-tool consistency.
**Does NOT**: Check codebase accuracy, file paths, symbol signatures, or content quality — that's `/aisa-evolve-health`.

---

#### `/aisa-evolve-cache` — Manage snapshot cache

Maintains `.claude/cache/` for incremental scanning. Reduces token consumption by 60-80% on repeat evolution runs.

```text
/aisa-evolve-cache              # rebuild cache from current state
/aisa-evolve-cache status       # report cache freshness
/aisa-evolve-cache invalidate   # force full scan on next run
```

**When**: After any aisa-evolve cycle (auto-rebuilt), or manually when cache seems stale.
**Model**: sonnet
**Output**: `.claude/cache/snapshot.json` (file hashes + principle flags) and `drift-report.json` (last audit results).

---

> **`aisa-evolve-principles`** — Shared principles, tool registry, and behavioral rules for all `aisa-*` skills. Dependency only — never invoked directly.

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

### File Structure

```text
.claude/skills/
├── aisa-init/
│   ├── SKILL.md          # /aisa-init command — build from scratch
│   └── REFERENCE.md      # Full pipeline specification
├── aisa-evolve/
│   ├── SKILL.md          # /aisa-evolve command — full evolution cycle
│   └── REFERENCE.md      # Full Evolver pipeline specification
├── aisa-evolve-health/
│   └── SKILL.md          # /aisa-evolve-health — quick health check
├── aisa-evolve-harvest/
│   └── SKILL.md          # /aisa-evolve-harvest — promote learnings
├── aisa-evolve-target/
│   └── SKILL.md          # /aisa-evolve-target — scoped update
├── aisa-evolve-validate/
│   ├── SKILL.md          # /aisa-evolve-validate — principle compliance
│   └── REFERENCE.md      # Validation checks specification
├── aisa-evolve-cache/
│   └── SKILL.md          # /aisa-evolve-cache — snapshot cache management
├── aisa-evolve-postmortem/
│   └── SKILL.md          # /aisa-evolve-postmortem — incident learning
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

## Plugin: sdlc-utilities

| Command | Description |
| --- | --- |
| `/pr` | Create a pull request with an auto-generated description from commits and diffs |
| `/pr --draft` | Create a draft PR |
| `/pr --base <branch>` | Create a PR targeting a specific base branch |

### `/pr` — Smart pull request creation

Analyzes all commits and the diff on your branch, then generates a Conventional PR description
(What / Why / How / Testing) and creates the PR via the GitHub CLI. Presents the generated
description for your review before creating.

```text
/pr
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
/pr --draft                    # create as a draft PR
/pr --base develop             # target the develop branch instead of main
/pr --draft --base release/2   # combine flags
```

**When**: Ready to open a PR and want a structured, consistent description without writing it by hand.
**Requires**: `gh` CLI installed and authenticated (`gh auth login`). Falls back to showing the description for manual use if `gh` is unavailable.
**Delegates to**: `creating-pull-requests` skill for description generation.

### `creating-pull-requests` skill

Reusable knowledge skill that analyzes commits and diffs to generate PR descriptions in the
Conventional PR format. Loaded by the `/pr` command and available to any other command or
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
