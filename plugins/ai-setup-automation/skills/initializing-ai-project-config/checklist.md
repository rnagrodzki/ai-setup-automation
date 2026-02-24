# AI Setup Checklist by Project Type

## Universal (All Projects)

- [ ] `CLAUDE.md` at repository root
- [ ] `.claude/settings.json` with appropriate permissions
- [ ] `.claude/skills/` directory exists
- [ ] `.claude/commands/` directory exists
- [ ] At least one skill for the dominant workflow

## Node.js / TypeScript

- [ ] Skill: writing unit tests (Jest / Vitest patterns)
- [ ] Skill: writing integration tests
- [ ] Command: `/pr` for pull request creation
- [ ] Hook: PostToolUse lint on Edit/Write (e.g., `npx eslint --fix`)
- [ ] Permission: `Bash(npm:*)`, `Bash(npx:*)`

## Go

- [ ] Skill: writing unit tests (table-driven patterns)
- [ ] Skill: writing functional/integration tests
- [ ] Skill: logging conventions
- [ ] Command: `/pr` for pull request creation
- [ ] Hook: PostToolUse lint on Edit/Write (e.g., `task lint`)
- [ ] Permission: `Bash(go:*)`, `Bash(task:*)`

## Python

- [ ] Skill: writing pytest tests
- [ ] Skill: type hinting conventions
- [ ] Command: `/pr` for pull request creation
- [ ] Hook: PostToolUse lint on Edit/Write (e.g., `ruff check --fix`)
- [ ] Permission: `Bash(python:*)`, `Bash(pip:*)`

## Rust

- [ ] Skill: writing unit and integration tests
- [ ] Skill: error handling conventions (thiserror, anyhow)
- [ ] Command: `/pr` for pull request creation
- [ ] Hook: PostToolUse lint on Edit/Write (e.g., `cargo clippy`)
- [ ] Permission: `Bash(cargo:*)`

## Monorepo

All of the above, plus:

- [ ] Skill: navigating the monorepo structure
- [ ] Skill: cross-package dependency management
- [ ] Clear `CLAUDE.md` section on module boundaries and ownership

## Documentation-Heavy Projects

- [ ] Skill: validating markdown documentation
- [ ] Skill: maintaining API documentation
- [ ] Templates for common document types
