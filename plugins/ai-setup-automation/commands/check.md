---
description: Quick read-only drift check — reports status of every skill, agent, and CLAUDE.md file
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite]
---

# /check Command

Quick read-only drift check of the `.claude/` setup — no changes unless critical
issues are found. Reports status of every skill, agent, and CLAUDE.md file.

## Usage

- `/aisa:check` — Run drift check across the full `.claude/` setup

## Workflow

Invoke the `aisa-checker` skill.
