# AI Setup Automation — Claude Code Plugin Marketplace

This repository is a **Claude Code plugin marketplace** that ships two plugins for AI-driven project configuration and software development lifecycle (SDLC) automation. It is installed as a single marketplace via:

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
```

---

## Repository Layout

```text
.claude-plugin/marketplace.json   # Marketplace manifest (entry point)
plugins/
  ai-setup-automation/            # Plugin: AI project config scaffolding & evolution
  sdlc-utilities/                 # Plugin: SDLC automation (PRs, etc.)
docs/                             # Architecture, getting-started, skill/command/hook guides
README.md
```

Each plugin lives under `plugins/<name>/` and follows the structure:

```text
.claude-plugin/plugin.json   # Plugin manifest
commands/                    # Slash commands (*.md)
skills/                      # Skills (one subdirectory each)
hooks/hooks.json             # Session-start and other hooks
```

---

## Plugin 1 — `ai-setup-automation`

Creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory).

### Plugin 1 Commands

| Command | Purpose |
| --- | --- |
| `/setup-ai` | Detect tech stack and scaffold full `CLAUDE.md` + `.claude/` configuration |
| `/postmortem` | Guided incident analysis; encodes lessons into skills |

### Plugin 1 Skills

| Skill | When to invoke |
| --- | --- |
| `aisa-init` | New project or full rebuild — 6-phase discovery → generate pipeline |
| `aisa-evolve` | Full evolution cycle (every 2–4 weeks) — 7-phase drift → execute pipeline |
| `aisa-evolve-health` | Weekly read-only drift scan and status report |
| `aisa-evolve-harvest` | Promote accumulated learnings into skills/docs |
| `aisa-evolve-target` | Scoped update after a feature, refactor, or integration |
| `aisa-evolve-validate` | Validate all skills against architectural principles |
| `aisa-evolve-cache` | Manage `.claude/cache/` snapshot hashes (60–80 % token reduction) |
| `aisa-evolve-postmortem` | Create learning entries and skill gaps from an incident |
| `aisa-evolve-principles` | Shared principles / tool registry — dependency only, never invoked directly |

---

## Plugin 2 — `sdlc-utilities`

Automates common SDLC tasks.

### Plugin 2 Commands

| Command | Purpose |
| --- | --- |
| `/pr [--draft] [--base <branch>]` | Open a pull request with an auto-generated Conventional PR description |

### Plugin 2 Skills

| Skill | Purpose |
| --- | --- |
| `creating-pull-requests` | Analyse commits and diffs; generate structured What/Why/How/Testing PR descriptions |

---

## Architecture Principles

1. **Spec-driven development** — design before implementation
2. **Plan → Do → Critique → Improve** — mandatory critique gates in every pipeline
3. **Cache-first incremental scanning** — snapshot hashing in `.claude/cache/`
4. **Parallel execution** — always run independent steps concurrently
5. **Self-learning directives** — learnings flow into `.claude/learnings/log.md` and are harvested into skills
6. **Specificity over generics** — every skill targets a concrete task

---

## Working in This Repository

- **Adding a skill:** Follow `docs/adding-skills.md`. Place the skill under `plugins/<plugin>/skills/<skill-name>/SKILL.md`.
- **Adding a command:** Follow `docs/adding-commands.md`. Place it under `plugins/<plugin>/commands/<command>.md`.
- **Adding a hook:** Follow `docs/adding-hooks.md`. Edit `plugins/<plugin>/hooks/hooks.json`.
- **Plugin manifest fields:** See `docs/architecture.md` for required fields in `plugin.json`.
- **Current branch:** `feat/sdlc-utilities` — active development on the SDLC plugin.
- **Target merge branch:** `main`.
