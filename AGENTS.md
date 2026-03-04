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
| `/aisa:postmortem` | Guided incident analysis; encodes lessons into skills |
| `/aisa:validate` | Validate all skills and agents against architectural principles |

### Skills

| Skill | When to invoke |
| --- | --- |
| `aisa:aisa-init` | New project or full rebuild — 6-phase discovery → generate pipeline |
| `aisa:aisa-evolve` | Full evolution cycle (every 2–4 weeks) — 7-phase drift → execute pipeline |
| `aisa:aisa-evolve-health` | Weekly read-only drift scan and status report |
| `aisa:aisa-evolve-harvest` | Promote accumulated learnings into skills/docs |
| `aisa:aisa-evolve-target` | Scoped update after a feature, refactor, or integration |
| `aisa:aisa-evolve-validate` | Validate all skills against architectural principles |
| `aisa:aisa-evolve-cache` | Manage `.claude/cache/` snapshot hashes (60–80 % token reduction) |
| `aisa:aisa-evolve-postmortem` | Create learning entries and skill gaps from an incident |
| `aisa:aisa-evolve-principles` | Shared principles / tool registry — dependency only, never invoked directly |

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
