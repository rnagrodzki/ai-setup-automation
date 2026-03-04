# AI Setup Automation — Claude Code Plugin Marketplace

This repository is a **Claude Code plugin marketplace** that ships the `ai-setup-automation` plugin for AI-driven project configuration. Installation requires two steps:

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
/plugin install aisa@ai-setup-automation
```

---

## Repository Layout

```text
.claude-plugin/marketplace.json   # Marketplace manifest (entry point)
plugins/
  ai-setup-automation/            # Plugin: AI project config scaffolding & evolution
docs/                             # Architecture, getting-started, skill/command/hook guides
README.md
```

The plugin lives under `plugins/ai-setup-automation/` and follows the structure:

```text
.claude-plugin/plugin.json   # Plugin manifest
commands/                    # Slash commands (*.md)
skills/                      # Skills (one subdirectory each)
hooks/hooks.json             # Session-start and other hooks
scripts/                     # Node.js helper scripts (optional; invoked via Bash)
```

---

## Plugin — `aisa` (ai-setup-automation)

Creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory).

### Commands

| Command | Purpose |
| --- | --- |
| `/aisa:setup` | Detect tech stack and scaffold full `CLAUDE.md` + `.claude/` configuration |
| `/aisa:audit` | Audit existing AI configuration and suggest improvements |
| `/aisa:validate` | Validate all skills and agents against architectural principles |
| `/aisa:postmortem` | Guided incident analysis; encodes lessons into skills |
| `/aisa:evolve` | Full evolution cycle (every 2–4 weeks) — verify, update, and expand `.claude/` |
| `/aisa:health` | Quick read-only drift scan and status report; run weekly or before sprints |
| `/aisa:target` | Scoped update after a specific feature, refactor, or integration |
| `/aisa:harvest` | Promote accumulated learnings from log into skills and docs |
| `/aisa:cache` | Manage `.claude/cache/` snapshot hashes (60–80% token reduction) |

### Skills

All skills have `user-invocable: false` — they are implementation details invoked by commands, not
directly by users. Use the commands above as the entry points.

| Skill | Invoked by |
| --- | --- |
| `aisa:aisa-init` | `/aisa:setup` |
| `aisa:aisa-evolve` | `/aisa:evolve` |
| `aisa:aisa-evolve-health` | `/aisa:health` |
| `aisa:aisa-evolve-harvest` | `/aisa:harvest` |
| `aisa:aisa-evolve-target` | `/aisa:target` |
| `aisa:aisa-evolve-validate` | `/aisa:validate` |
| `aisa:aisa-evolve-cache` | `/aisa:cache` |
| `aisa:aisa-evolve-postmortem` | `/aisa:postmortem` |
| `aisa:aisa-evolve-principles` | dependency only — loaded by other skills |

---

## Architecture Principles

1. **Spec-driven development** — design before implementation
2. **Plan → Critique → Improve → Do → Critique → Improve** — mandatory dual critique gates in every pipeline (critique the plan, then critique the output)
3. **Cache-first incremental scanning** — snapshot hashing in `.claude/cache/`
4. **Parallel execution** — always run independent steps concurrently
5. **Self-learning directives** — learnings flow into `.claude/learnings/log.md` and are harvested into skills
6. **Specificity over generics** — every skill targets a concrete task

---

## Working in This Repository

- **Adding a skill:** Follow `docs/adding-skills.md`. Place the skill under `plugins/ai-setup-automation/skills/<skill-name>/SKILL.md`.
- **Adding a command:** Follow `docs/adding-commands.md`. Place it under `plugins/ai-setup-automation/commands/<command>.md`.
- **Adding a hook:** Follow `docs/adding-hooks.md`. Edit `plugins/ai-setup-automation/hooks/hooks.json`.
- **Plugin manifest fields:** See `docs/architecture.md` for required fields in `plugin.json`.
