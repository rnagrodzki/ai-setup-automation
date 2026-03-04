# Plugin: ai-setup-automation — Reference

## Overview

`ai-setup-automation` creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory) for any codebase. See the [README](../README.md) for installation and quick start.

All functionality is exposed through `/aisa:*` commands. Skills are implementation details invoked by commands — they are not user-facing.

---

## Commands

| Command | Description |
| --- | --- |
| [`/aisa:setup`](commands/setup.md) | Detect tech stack and scaffold full `.claude/` configuration |
| [`/aisa:review`](commands/review.md) | Audit existing setup and suggest improvements |
| [`/aisa:lint`](commands/lint.md) | Validate skills and agents against architectural principles |
| [`/aisa:postmortem`](commands/postmortem.md) | Guided incident analysis; encode lessons into skills |
| [`/aisa:sync`](commands/sync.md) | Full evolution cycle — verify, update, and expand `.claude/` |
| [`/aisa:check`](commands/check.md) | Quick read-only health check; reports drift status per file |
| [`/aisa:update`](commands/update.md) | Targeted update after a specific feature, refactor, or integration |
| [`/aisa:harvest`](commands/harvest.md) | Promote accumulated learnings into skills and docs |
| [`/aisa:cache`](commands/cache.md) | Manage the snapshot cache for incremental scanning |

Each command has a dedicated doc with usage, examples, prerequisites, and what it creates or modifies.

---

## Recommended Cadence

| When | Command |
| --- | --- |
| New project or full rebuild | `/aisa:setup` |
| After shipping a feature or refactor | `/aisa:update <description>` |
| Weekly or before a sprint | `/aisa:check` |
| Every 2–4 weeks | `/aisa:sync` |
| When 10+ learning log entries accumulate | `/aisa:harvest` |
| After an incident or painful bug | `/aisa:postmortem` |
| After writing new skills or agents | `/aisa:lint` |

---

## Lifecycle Diagram

```text
New project ──→ /aisa:setup ──→ daily development ──→ /aisa:update (after features)
                    │                  │                       │
                    │                  ├── /aisa:check (weekly)
                    │                  ├── /aisa:harvest (when log fills up)
                    │                  ├── /aisa:lint (after adding/editing skills)
                    │                  ├── /aisa:sync (every 2-4 weeks)
                    │                  └── /aisa:postmortem (after incidents)
                    │
                    └── /aisa:cache (auto-rebuilt after each /aisa:sync)
```

---

## File Structure

```text
.claude/skills/
├── aisa-scaffolder/
│   ├── SKILL.md          # aisa:aisa-scaffolder — build from scratch (invoked by /aisa:setup)
│   └── REFERENCE.md      # Full pipeline specification
├── aisa-syncer/
│   ├── SKILL.md          # aisa:aisa-syncer — full sync cycle (invoked by /aisa:sync)
│   └── REFERENCE.md      # Full Evolver pipeline specification
├── aisa-checker/
│   └── SKILL.md          # aisa:aisa-checker (invoked by /aisa:check)
├── aisa-harvester/
│   └── SKILL.md          # aisa:aisa-harvester (invoked by /aisa:harvest)
├── aisa-updater/
│   └── SKILL.md          # aisa:aisa-updater (invoked by /aisa:update)
├── aisa-linter/
│   ├── SKILL.md          # aisa:aisa-linter (invoked by /aisa:lint)
│   └── REFERENCE.md      # Validation checks specification
├── aisa-cacher/
│   └── SKILL.md          # aisa:aisa-cacher (invoked by /aisa:cache)
├── aisa-postmortem/
│   └── SKILL.md          # aisa:aisa-postmortem (invoked by /aisa:postmortem)
└── aisa-principles/
    └── SKILL.md          # Shared principles and rules (dependency only, not user-facing)
```

All skills have `user-invocable: false` — use commands as the entry points.

---

## Scaling: Execution Modes and Token Optimization

### Execution Mode Selector (auto-detected)

| Setup size (skills + agents) | Mode | Token multiplier | Best for |
| --- | --- | --- | --- |
| ≤ 15 | Subagent parallel (`Task` tool) | ~2× | Independent workstreams, fresh context per audit |
| > 15 | Agent Teams (experimental) | ~3-4× | Cross-cutting drift, inter-agent coordination |

**Always parallel.** Even small setups benefit from workstream isolation — each subagent gets a fresh context window, preventing audit fatigue and token bloat in the orchestrator.

**Agent Teams** require `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Teammates get their own context windows and can share findings with each other (unlike subagents which only report back to the orchestrator). Use when workstreams have cross-cutting dependencies — e.g., a renamed type affects both domain and technical skills.

### Cache-First Incremental Scanning

All `aisa-*` skills check `.claude/cache/snapshot.json` before scanning:

- **UNCHANGED** files (hash match) → skip deep audit, carry forward cached status
- **MODIFIED** files (hash differs) → full audit
- **NEW** files (not in cache) → full audit
- **DELETED** files (in cache, not on disk) → flag for cleanup

Token savings: **60-80%** on typical runs where <30% of files changed. Cache is rebuilt automatically after every full `/aisa:sync` cycle.

---

## Core Principles

Enforced across all commands:

1. **Spec-driven development** — specs are source of truth
2. **Functional-first testing** — real infra, mock only at lowest external boundary
3. **Three-dimensional domains** — technical + business + design
4. **Continuous learning** — capture during work, promote to skills over time (self-learning directives mandatory)
5. **Plan → Critique → Improve → Do → Critique → Improve** — every skill/agent workflow must critique the plan before executing and review output before delivery (dual quality gates mandatory)
6. **Specificity over generics** — every skill must be THIS project's skill, not generic advice
7. **Critique gates** — mandatory dual quality checks (one before execution, one before delivery) prevent both flawed plans and shallow output
8. **Structural completeness** — agents must have valid frontmatter, real tools, and capability-tool consistency
9. **Cache-first scanning** — check snapshot hashes before deep-reading files; skip unchanged content to minimize token consumption
10. **Always parallel** — use subagent workstreams or Agent Teams for every audit; never single-thread through the full setup
