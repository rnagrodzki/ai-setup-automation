# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace that ships the `ai-setup-automation` plugin for creating and maintaining AI-ready project configurations.

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, commands, and settings
- Provides 9 commands covering the full lifecycle: setup, auditing, evolution, health checks, and post-incident learning
- Manages a cache layer to reduce token consumption by 60–80% on repeated audits
- Keeps your AI configuration in sync with your codebase as it evolves

## Key Benefits

**Self-Learning Configuration** — Your `.claude/` setup grows smarter with every session. Post-mortems encode lessons into skills; harvest cycles promote recurring patterns into permanent rules.

**Cache-First Audits** — Snapshot hashing skips unchanged files entirely, cutting token consumption by 60–80% on typical runs. Weekly health checks become fast enough to actually run weekly.

**Enforced Dual Critique Gates** — Every workflow critiques the plan before executing and reviews output before delivery. `/aisa:validate` flags any skill that skips either gate.

---

## Technical Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | — | This is a Claude Code plugin marketplace |
| Node.js | >= 16 | For `cache-snapshot.js` and `verify-setup.js` scripts. Uses built-in modules, no `npm install` needed |
| git | — | Assumed for most features |

## Installation

### Step 1 — Add the marketplace

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
```

This registers the marketplace catalog. No plugins are installed yet.

### Step 2 — Install the plugin

```text
/plugin install aisa@ai-setup-automation
```

Or browse interactively: run `/plugin`, go to the **Discover** tab, and select the plugin to install.

Verify by starting a new Claude Code session — the plugin announces itself:

```text
[ai-setup-automation] Plugin loaded. Use /aisa:setup to initialize AI configuration for your project.
```

See [docs/getting-started.md](docs/getting-started.md) for a full first-use walkthrough.

## Updating

### Step 1 — Refresh the marketplace catalog

```text
/plugin marketplace update ai-setup-automation
```

### Step 2 — Update the plugin

```text
/plugin update aisa@ai-setup-automation
```

### Enable auto-update

Open `/plugin`, go to the **Marketplaces** tab, and toggle auto-update for `ai-setup-automation`. When enabled, Claude Code checks for new versions on startup.

### Migrating from older installs

If you installed the plugin before this naming fix, uninstall the old entry and reinstall:

```text
/plugin uninstall ai-setup-automation@ai-setup-automation
/plugin install aisa@ai-setup-automation
```

## Quick Start

1. Navigate to your project directory
2. Start Claude Code
3. Run `/aisa:setup`
4. Follow the interactive prompts

The command detects your tech stack, presents a setup plan for your approval, and scaffolds the full `.claude/` directory.

---

## Plugin — `aisa` (ai-setup-automation)

Creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory).

**Highlights:**

- **9 commands** covering the full lifecycle: initial setup, health checks, targeted updates, full evolution cycles, incident post-mortems, and learning harvest
- **Cache-first scanning** reduces token consumption by 60–80% on repeat runs
- **Self-learning loop** — incidents get encoded into skills so the same mistake cannot recur
- **Dual critique gates** enforced on every workflow: critique the plan, then critique the output

| Command | Description |
| --- | --- |
| `/aisa:setup` | Detect tech stack and scaffold full `.claude/` configuration |
| `/aisa:audit` | Audit existing setup and suggest improvements |
| `/aisa:validate` | Validate skills and agents against architectural principles |
| `/aisa:postmortem` | Guided incident analysis; encode lessons into skills |
| `/aisa:evolve` | Full evolution cycle — verify, update, and expand `.claude/` |
| `/aisa:health` | Quick read-only health check; reports drift status per file |
| `/aisa:target` | Targeted update after a specific feature, refactor, or integration |
| `/aisa:harvest` | Promote accumulated learnings into skills and docs |
| `/aisa:cache` | Manage the snapshot cache for incremental scanning |

> **[Full reference →](docs/plugin-ai-setup-automation.md)** Skills, recommended cadence, lifecycle diagram, execution modes, core principles

---

## Documentation

| Document | Description |
| --- | --- |
| [Getting Started](docs/getting-started.md) | Installation, first use, what gets created |
| [Architecture](docs/architecture.md) | Repository structure, plugin system, name resolution |
| [Plugin: ai-setup-automation](docs/plugin-ai-setup-automation.md) | Skills reference, cadence, lifecycle, execution modes, principles |
| [Adding Skills](docs/adding-skills.md) | Create custom skills for your project |
| [Adding Commands](docs/adding-commands.md) | Create custom slash commands |
| [Adding Hooks](docs/adding-hooks.md) | Set up automated actions on session events |

## CI Checks

### Version Bump Check

A GitHub Actions workflow runs on every pull request targeting `main` and verifies that modified plugins have their `version` field bumped in `plugin.json`. The check:

- Detects which plugins have changed files in the PR
- Compares the `plugin.json` version against the base branch
- Fails if a plugin's files changed but its version was not incremented

To skip the check when a version bump is intentionally not needed, add the **`skip-version-check`** label to the pull request. The workflow will pass with a notice.

## Troubleshooting

### "Plugin not found" when updating via `/plugin` UI

This happens when the plugin name registered in the marketplace doesn't match the identity in `plugin.json`. Clear the cache, restart, and reinstall:

```bash
rm -rf ~/.claude/plugins/cache/ai-setup-automation
```

Then restart Claude Code and run:

```text
/plugin install aisa@ai-setup-automation
```

### Plugin not updating after marketplace refresh

The `version` field in `plugin.json` must be bumped for Claude Code to detect a new version. If the version hasn't changed, Claude Code uses the cached copy. See the [CI Checks](#ci-checks) section — every PR that modifies plugin files must bump the version.

### Auto-update not working

Open `/plugin`, go to the **Marketplaces** tab, and verify auto-update is toggled on for `ai-setup-automation`. Auto-update is off by default for third-party marketplaces.

### Timeout during marketplace add or plugin install

Large repositories may exceed the default git timeout. Set the environment variable before starting Claude Code:

```bash
export CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=300000
```

## License

[AGPL-3.0](LICENSE)
