# AI Setup Automation — Claude Code Plugin Marketplace

This repository is a **Claude Code plugin marketplace** that ships the `ai-setup-automation` plugin for AI-driven project configuration.

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

## Architecture Principles

1. **Spec-driven development** — design before implementation
2. **Plan → Critique → Improve → Do → Critique → Improve** — mandatory dual critique gates in every pipeline (critique the plan, then critique the output)
3. **Cache-first incremental scanning** — snapshot hashing in `.claude/cache/`
4. **Parallel execution** — always run independent steps concurrently
5. **Self-learning directives** — learnings flow into `.claude/learnings/log.md` and are harvested into skills
6. **Specificity over generics** — every skill targets a concrete task

---

## Working in This Repository

### Adding a command

1. Create `plugins/ai-setup-automation/commands/<command>.md` — follow `docs/adding-commands.md` for the required frontmatter and structure
2. Create `docs/commands/<command>.md` using `docs/commands/_TEMPLATE.md` as the base — every command must have a dedicated documentation page
3. Link the new doc in the README command table: `[/aisa:<command>](docs/commands/<command>.md)`

### Adding a skill

Place the skill under `plugins/ai-setup-automation/skills/<skill-name>/SKILL.md`. Follow `docs/adding-skills.md`. Skills have `user-invocable: false` — they are invoked by commands, not directly by users.

### Adding a hook

Edit `plugins/ai-setup-automation/hooks/hooks.json`. Follow `docs/adding-hooks.md`.

### Testing with Promptfoo

**NEVER run `promptfoo eval` on the full test suite automatically.** Only single-skill verification is allowed (e.g., `promptfoo eval -c promptfooconfig.yaml --filter-pattern <skill-name>`). Running all tests consumes excessive resources and must be triggered manually by the user.

### Plugin manifest fields

See `docs/architecture.md` for required fields in `plugin.json`.
