---
description: Targeted skill/agent update after a specific code change — uses git diff to scope impact, updates only affected .claude/ files, flags out-of-scope drift without fixing it
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite, Write, Edit]
argument-hint: "<description of what changed>"
---

# /update Command

Scoped update after a specific feature, refactor, or integration. Scans only the affected area
and updates relevant skills/agents without running a full sync cycle.

## Usage

- `/aisa:update <description>` — Update skills for the described change

Examples:
- `/aisa:update added Stripe webhook handler for subscription cancellation`
- `/aisa:update refactored auth module from sessions to JWT`

## Workflow

Invoke the `aisa-updater` skill, passing `$ARGUMENTS` as the change description.
