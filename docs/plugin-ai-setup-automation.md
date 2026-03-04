# Plugin: ai-setup-automation — Reference

## Overview

`ai-setup-automation` creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory) for any codebase. See the [README](../README.md) for installation and quick start.

All functionality is exposed through `/aisa:*` commands. Skills are implementation details invoked by commands — they are not user-facing.

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

Each command has a dedicated doc with usage, examples, prerequisites, and what it creates or modifies.

---

## Recommended Cadence

| When | Command |
| --- | --- |
| New project or full rebuild | `/aisa:setup` |
| After shipping a feature or refactor | `/aisa:target <description>` |
| Weekly or before a sprint | `/aisa:health` |
| Every 2–4 weeks | `/aisa:evolve` |
| When 10+ learning log entries accumulate | `/aisa:harvest` |
| After an incident or painful bug | `/aisa:postmortem` |
| After writing new skills or agents | `/aisa:validate` |

---

## Lifecycle Diagram

```text
New project ──→ /aisa:setup ──→ daily development ──→ /aisa:target (after features)
                    │                  │                       │
                    │                  ├── /aisa:health (weekly)
                    │                  ├── /aisa:harvest (when log fills up)
                    │                  ├── /aisa:validate (after adding/editing skills)
                    │                  ├── /aisa:evolve (every 2-4 weeks)
                    │                  └── /aisa:postmortem (after incidents)
                    │
                    └── /aisa:cache (auto-rebuilt after each /aisa:evolve)
```

---

## File Structure

```text
.claude/skills/
├── aisa-init/
│   ├── SKILL.md          # aisa:aisa-init — build from scratch (invoked by /aisa:setup)
│   └── REFERENCE.md      # Full pipeline specification
├── aisa-evolve/
│   ├── SKILL.md          # aisa:aisa-evolve — full evolution cycle (invoked by /aisa:evolve)
│   └── REFERENCE.md      # Full Evolver pipeline specification
├── aisa-evolve-health/
│   └── SKILL.md          # aisa:aisa-evolve-health (invoked by /aisa:health)
├── aisa-evolve-harvest/
│   └── SKILL.md          # aisa:aisa-evolve-harvest (invoked by /aisa:harvest)
├── aisa-evolve-target/
│   └── SKILL.md          # aisa:aisa-evolve-target (invoked by /aisa:target)
├── aisa-evolve-validate/
│   ├── SKILL.md          # aisa:aisa-evolve-validate (invoked by /aisa:validate)
│   └── REFERENCE.md      # Validation checks specification
├── aisa-evolve-cache/
│   └── SKILL.md          # aisa:aisa-evolve-cache (invoked by /aisa:cache)
├── aisa-evolve-postmortem/
│   └── SKILL.md          # aisa:aisa-evolve-postmortem (invoked by /aisa:postmortem)
└── aisa-evolve-principles/
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

All `aisa-evolve-*` skills check `.claude/cache/snapshot.json` before scanning:

- **UNCHANGED** files (hash match) → skip deep audit, carry forward cached status
- **MODIFIED** files (hash differs) → full audit
- **NEW** files (not in cache) → full audit
- **DELETED** files (in cache, not on disk) → flag for cleanup

Token savings: **60-80%** on typical runs where <30% of files changed. Cache is rebuilt automatically after every full `/aisa:evolve` cycle.

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
