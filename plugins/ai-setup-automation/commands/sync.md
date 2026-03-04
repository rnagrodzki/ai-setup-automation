---
description: Full sync cycle — verify skills/agents against codebase, detect drift, harvest learnings, and apply updates
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
