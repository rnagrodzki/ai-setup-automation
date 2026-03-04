---
description: Run a quick read-only health check of the project's .claude/ setup
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite]
---

# /health Command

Quick health check of the `.claude/` setup — read-only drift scan with no changes unless critical
issues are found. Reports status of every skill, agent, and CLAUDE.md file.

## Usage

- `/aisa:health` — Run health check across the full `.claude/` setup

## Workflow

Invoke the `aisa-evolve-health` skill.
