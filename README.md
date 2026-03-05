# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace that ships the `ai-setup-automation` plugin for creating and maintaining AI-ready project configurations.

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, agents, and settings
- Provides 10 commands covering the full lifecycle: setup, review, sync, checks, and post-incident learning
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
3. Run `/aisa:setup`
4. Follow the interactive prompts

The command detects your tech stack, presents a setup plan for your approval, and scaffolds the full `.claude/` directory.

---

## Commands

| Command | Description |
| --- | --- |
| [`/aisa:setup`](docs/commands/setup.md) | Detect tech stack and scaffold a complete `.claude/` configuration from scratch |
| [`/aisa:setup-review`](docs/commands/setup-review.md) | Deep review of `.claude/` setup — verification scripts, content accuracy, prioritized recommendations |
| [`/aisa:lint`](docs/commands/lint.md) | Lint skills and agents for structural completeness and principle compliance |
| [`/aisa:postmortem`](docs/commands/postmortem.md) | Guided post-mortem after incidents — gathers context, checks git history, encodes lessons into skills |
| [`/aisa:sync`](docs/commands/sync.md) | Full sync cycle — verify skills/agents against codebase, detect drift, harvest learnings, apply updates |
| [`/aisa:check`](docs/commands/check.md) | Quick read-only drift check — reports status of every skill, agent, and CLAUDE.md file |
| [`/aisa:update`](docs/commands/update.md) | Update skills/agents affected by a specific feature, refactor, or integration |
| [`/aisa:harvest`](docs/commands/harvest.md) | Promote accumulated learnings from `.claude/learnings/log.md` into skills and documentation |
| [`/aisa:cache`](docs/commands/cache.md) | Manage the cache snapshot for incremental scanning (rebuild, status, invalidate) |
| [`/aisa:spec-check`](docs/commands/spec-check.md) | Check openspec CLI availability, project initialization, and version currency |

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
