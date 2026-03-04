---
description: Run a targeted skills/agents update after a specific change
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite, Write, Edit]
argument-hint: "<description of what changed>"
---

# /target Command

Scoped evolution after a specific feature, refactor, or integration. Scans only the affected area
and updates relevant skills/agents without running a full evolution cycle.

## Usage

- `/aisa:target <description>` — Update skills for the described change

Examples:
- `/aisa:target added Stripe webhook handler for subscription cancellation`
- `/aisa:target refactored auth module from sessions to JWT`

## Workflow

Invoke the `aisa-evolve-target` skill, passing `$ARGUMENTS` as the change description.
