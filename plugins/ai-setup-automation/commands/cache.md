---
description: Manage the cache snapshot for incremental scanning (rebuild, status, invalidate)
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite]
argument-hint: "[rebuild|status|invalidate]"
---

# /cache Command

Manage the `.claude/cache/` snapshot that enables incremental scanning — reducing token
consumption by 60–80% by skipping files unchanged since the last audit.

## Usage

- `/aisa:cache` — Rebuild the cache from the current state (default)
- `/aisa:cache status` — Report cache freshness and coverage
- `/aisa:cache invalidate` — Force a full scan on the next evolution run

## Workflow

Invoke the `aisa-cacher` skill, passing `$ARGUMENTS` as the sub-command.
