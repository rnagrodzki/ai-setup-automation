---
description: Run a full evolution cycle for the project's .claude/ setup
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite, Write, Edit, AskUserQuestion]
argument-hint: "[focus-area]"
---

# /evolve Command

Run the full 7-phase evolution cycle: verify skills/agents against the current codebase, detect drift,
harvest learnings, identify expansion needs, and apply prioritized updates.

## Usage

- `/aisa:evolve` — Full cycle across all skills and agents
- `/aisa:evolve <focus-area>` — Emphasize a specific area (e.g. `payment-integration`, `auth`)

## Workflow

Invoke the `aisa-evolve` skill, passing `$ARGUMENTS` as the optional focus area.
