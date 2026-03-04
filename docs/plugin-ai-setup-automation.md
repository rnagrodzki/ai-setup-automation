# Plugin: ai-setup-automation — Reference

## Overview

`ai-setup-automation` creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory) for any codebase. See the [README](../README.md) for installation and quick start.

All functionality is exposed through `/aisa:*` commands. Skills are implementation details invoked by commands — they are not user-facing.

---

## Commands Reference

### `/aisa:setup` — New Project Setup

Full 6-phase pipeline: discover project → design skills/agents → critique → generate → critique → wire.

```text
/aisa:setup
```

**When**: New project setup or full `.claude/` rebuild.

Detects your tech stack, presents a configuration plan for approval, and scaffolds the complete `.claude/` directory structure. If an existing `.claude/` setup is detected, offers a choice between auditing the existing config or rebuilding from scratch.

---

### `/aisa:audit` — Health + Compliance Check

Read-only audit of the existing `.claude/` setup. Runs mechanical verification across two dimensions:

1. **Health** — reports CURRENT / OUTDATED / STALE / CRITICAL status per file
2. **Validate** — checks principle compliance (self-learning directives, dual critique gates, structural completeness)

```text
/aisa:audit
```

**When**: Quick status check; no changes are made.

---

### `/aisa:evolve` — Full Evolution Cycle

7-phase pipeline: snapshot → drift audit → harvest learnings → expansion analysis → change plan → critique → execute.

```text
/aisa:evolve
/aisa:evolve payment-integration   # emphasize a specific area
```

**When**: Every 2–4 weeks, after major features, when the setup feels stale.

Pause points after the drift audit, change plan, and critique phases — user approval required before proceeding.

---

### `/aisa:health` — Quick Health Check

Read-only drift scan. Reports status of every skill, agent, and CLAUDE.md file. Only fixes critical issues (with permission).

```text
/aisa:health
```

**When**: Weekly or before sprints. Fast enough to run regularly — uses cache to skip unchanged files.

---

### `/aisa:target` — Targeted Update

Scoped evolution after a specific change. Scans only the affected area and updates relevant skills/agents without a full evolution cycle.

```text
/aisa:target added Stripe webhook handler for subscription cancellation
/aisa:target refactored auth module from sessions to JWT
/aisa:target new PIX payment integration
```

**When**: After shipping a feature, completing a refactor, or adding an integration.

---

### `/aisa:validate` — Principle Compliance Check

Validates all skills and agents against architectural principles — self-learning directives, Plan→Critique→Improve→Do→Critique→Improve patterns, and structural completeness. Does NOT check codebase accuracy.

```text
/aisa:validate
/aisa:validate .claude/skills/my-new-skill/SKILL.md   # validate specific file
/aisa:validate .claude/agents/                         # validate all agents
```

**When**: After adding or editing skills/agents, before committing `.claude/` changes, as a pre-flight check after any workflow that creates or modifies skills.

---

### `/aisa:postmortem` — Guided Incident Analysis

Walks you through describing an incident with interactive questions, checks recent git history for evidence, then encodes lessons into skills to prevent recurrence.

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

---

### `/aisa:harvest` — Promote Learnings

Processes ACTIVE entries in `.claude/learnings/log.md` — promotes recurring patterns into skill gotchas, creates new skills for uncovered domains, fills documentation gaps.

```text
/aisa:harvest
```

**When**: 10+ ACTIVE learning log entries, or the oldest entry is more than 2 weeks old.

---

### `/aisa:cache` — Manage Snapshot Cache

Maintains `.claude/cache/` for incremental scanning. Reduces token consumption by 60–80% on repeat evolution runs by skipping files unchanged since the last audit.

```text
/aisa:cache              # rebuild cache from current state (default)
/aisa:cache status       # report cache freshness and coverage
/aisa:cache invalidate   # force full scan on next run
```

**When**: Cache is rebuilt automatically after every full `/aisa:evolve` cycle. Use `status` to check freshness, `invalidate` to force a clean scan.

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
