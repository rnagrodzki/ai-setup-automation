---
description: Full maintenance cycle — runs drift detection, harvests learnings, identifies expansion needs, applies prioritized updates to .claude/ skills and agents. Modifies files; includes approval gates
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite, Write, Edit, AskUserQuestion]
argument-hint: "[focus-area]"
---

# /sync Command

Run the full 7-phase sync cycle: verify skills/agents against the current codebase, detect drift,
harvest learnings, identify expansion needs, and apply prioritized updates.

## Usage

- `/aisa:sync` — Full sync cycle across all skills and agents
- `/aisa:sync <focus-area>` — Emphasize a specific area (e.g. `payment-integration`, `auth`)

## Workflow

Invoke the `aisa-syncer` skill, passing `$ARGUMENTS` as the optional focus area.
