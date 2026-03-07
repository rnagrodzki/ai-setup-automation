# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace that ships the `ai-setup-automation` plugin for creating and maintaining AI-ready project configurations.

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, agents, and settings
- Provides 10 commands in three categories — Essentials, Analysis, and Utilities — covering the full lifecycle: setup, review, sync, checks, and post-incident learning
- Manages a cache layer to reduce token consumption by 60–80% on repeated audits
- Keeps your AI configuration in sync with your codebase as it evolves

---

## Technical Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | — | This is a Claude Code plugin marketplace |
| Node.js | >= 16 | For `cache-snapshot.js` and `verify-setup.js` scripts. Uses built-in modules, no `npm install` needed |
| git | — | Assumed for most features |

## Installation

### Via Claude Code UI (recommended)

1. Open Claude Code and run `/plugin`
2. Go to **Marketplaces** → **Add marketplace** → enter `rnagrodzki/ai-setup-automation`
3. Go to **Discover** → select `aisa` → **Install**

### Via CLI

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
/plugin install aisa@ai-setup-automation
```

See [docs/getting-started.md](docs/getting-started.md) for a full first-use walkthrough.

## Updating

### Update via Claude Code UI (recommended)

Open `/plugin`, go to the **Marketplaces** tab, and toggle auto-update for `ai-setup-automation`.

### Update via CLI

```text
/plugin marketplace update ai-setup-automation
/plugin update aisa@ai-setup-automation
```

### Migrating from older installs

If you installed the plugin before this naming fix, uninstall the old entry and reinstall:

```text
/plugin uninstall ai-setup-automation@ai-setup-automation
/plugin install aisa@ai-setup-automation
```

## Quick Start

1. Navigate to your project directory
2. Start Claude Code
3. Run `/aisa:init`
4. Follow the interactive prompts

The command detects your tech stack, presents a setup plan for your approval, and scaffolds the full `.claude/` directory.

---

## Commands

### Essentials

| Command | Description |
| --- | --- |
| [`/aisa:init`](docs/commands/init.md) | Scaffold a new `.claude/` directory — detects tech stack, generates CLAUDE.md, skills, agents, learnings journal, and cache. One-time setup for new projects |
| [`/aisa:sync`](docs/commands/sync.md) | Full maintenance cycle — runs drift detection, harvests learnings, identifies expansion needs, applies prioritized updates to `.claude/` skills and agents |
| [`/aisa:postmortem`](docs/commands/postmortem.md) | Incident-to-prevention pipeline — gathers context from conversation or git history, maps root causes to skill gaps, encodes lessons into `.claude/` skills and learnings log |

### Analysis

| Command | Description |
| --- | --- |
| [`/aisa:audit`](docs/commands/audit.md) | Deep read-only review of `.claude/` content accuracy — mechanical validation, outdated code example detection, skill specificity check, coverage gap analysis. Reports HEALTHY / NEEDS_ATTENTION / CRITICAL |
| [`/aisa:inspect`](docs/commands/inspect.md) | Quick read-only drift scan — compares `.claude/` skills and agents against current codebase state, reports CURRENT / OUTDATED / STALE / CRITICAL per file. Run weekly |
| [`/aisa:lint`](docs/commands/lint.md) | Validate skill and agent structure against architectural principles (P1-P3, A1-A6) — checks frontmatter, self-learning directives, PCIDCI pattern. Does not verify codebase accuracy |
| [`/aisa:update`](docs/commands/update.md) | Targeted skill/agent update after a specific code change — uses git diff to scope impact, updates only affected `.claude/` files, flags out-of-scope drift without fixing it |

### Utilities

| Command | Description |
| --- | --- |
| [`/aisa:harvest`](docs/commands/harvest.md) | Promote ACTIVE entries from `.claude/learnings/log.md` into skill gotchas, new skills, and documentation. Run when log has 10+ entries or oldest entry exceeds 2 weeks |
| [`/aisa:cache`](docs/commands/cache.md) | Manage the `.claude/cache/` snapshot used by inspect and sync — sub-commands: rebuild (default), status, invalidate. Reduces token use by 60-80% |
| [`/aisa:spec-check`](docs/commands/spec-check.md) | Check openspec CLI availability, project initialization status, and version currency — suggests install/init/update with user confirmation |

---

## Testing

Behavioral regression tests use [promptfoo](https://promptfoo.dev/) to validate plugin skills against expected outputs. Tests require [Task](https://taskfile.dev/) and [gum](https://github.com/charmbracelet/gum) for interactive selection.

| Command | Description |
| --- | --- |
| `task test` | Run all skill tests |
| `task test:skill` | Select one or more skills to test (interactive) |
| `task test:skill -- aisa-linter` | Test a specific skill directly |
| `task test:skill -- aisa-linter aisa-cacher` | Test multiple skills directly |
| `task test:view` | Open the promptfoo web UI to inspect results |

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

To skip the check when a version bump is intentionally not needed, add the **`skip-version-check`** label to the pull request.

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
