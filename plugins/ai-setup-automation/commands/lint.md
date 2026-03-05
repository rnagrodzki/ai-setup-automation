---
description: Validate skill and agent structure against architectural principles (P1-P3, A1-A6) — checks frontmatter, self-learning directives, PCIDCI pattern. Does not verify whether skill content is accurate to the codebase
allowed-tools: [Read, Glob, Grep, Bash, Skill, TodoWrite]
argument-hint: "[path-to-specific-file-or-directory]"
---

# /lint Command

Lint `.claude/` skills and agents for structural completeness and principle compliance —
self-learning directives, and Plan→Critique→Improve→Do→Critique→Improve patterns. Does NOT check codebase accuracy.

## Usage

- `/aisa:lint` — Lint all skills and agents in `.claude/`
- `/aisa:lint <path>` — Lint only the specified file or directory

## Workflow

Invoke the `aisa-linter` skill, passing `$ARGUMENTS` as the target scope.
