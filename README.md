# ai-setup-automation

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin marketplace that ships two plugins: `ai-setup-automation` for creating and maintaining AI-ready project configurations, and `sdlc-utilities` for SDLC automation (pull requests, etc.).

## What It Does

- Detects your tech stack and scaffolds a `.claude/` directory with `CLAUDE.md`, skills, commands, and settings
- Provides 9 built-in skills for initial setup, ongoing evolution, health checks, and post-incident learning
- Manages a cache layer to reduce token consumption by 60–80% on repeated audits
- Keeps your AI configuration in sync with your codebase as it evolves

## Key Benefits

**Self-Learning Configuration** — Your `.claude/` setup grows smarter with every session. Post-mortems encode lessons into skills; harvest cycles promote recurring patterns into permanent rules.

**Cache-First Audits** — Snapshot hashing skips unchanged files entirely, cutting token consumption by 60–80% on typical runs. Weekly health checks become fast enough to actually run weekly.

**Enforced Dual Critique Gates** — Every workflow critiques the plan before executing and reviews output before delivery. `aisa-evolve-validate` flags any skill that skips either gate.

---

## Technical Requirements

| Requirement | Version | Notes |
| --- | --- | --- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | — | This is a Claude Code plugin marketplace |
| Node.js | >= 16 | For `cache-snapshot.js` and `verify-setup.js` scripts. Uses built-in modules, no `npm install` needed |
| git | — | Assumed for most features |
| gh (GitHub CLI) | — | Required for `/sdlc:pr`. Falls back to showing the description if unavailable |

## Installation

```text
/plugin marketplace add rnagrodzki/ai-setup-automation
```

Verify by starting a new Claude Code session — both plugins announce themselves:

```text
[ai-setup-automation] Plugin loaded. Use /aisa:setup to initialize AI configuration for your project.
[sdlc-utilities] Plugin loaded. Use /sdlc:pr to create or update a pull request with an auto-generated description.
```

See [docs/getting-started.md](docs/getting-started.md) for a full first-use walkthrough.

## Quick Start

1. Navigate to your project directory
2. Start Claude Code
3. Run `/aisa:setup`
4. Follow the interactive prompts

The command detects your tech stack, presents a setup plan for your approval, and scaffolds the full `.claude/` directory.

---

## Plugins

### `aisa` — ai-setup-automation

Creates and continuously evolves AI-ready project configurations (`CLAUDE.md`, `.claude/` directory).

**Highlights:**

- **9 built-in skills** covering the full lifecycle: initial setup, health checks, targeted updates, full evolution cycles, incident post-mortems, and learning harvest
- **Cache-first scanning** reduces token consumption by 60–80% on repeat runs
- **Self-learning loop** — incidents get encoded into skills so the same mistake cannot recur
- **Dual critique gates** enforced on every workflow: critique the plan, then critique the output

| Command | Description |
| --- | --- |
| `/aisa:setup` | Detect tech stack and scaffold full `.claude/` configuration |
| `/aisa:audit` | Audit existing setup and suggest improvements |
| `/aisa:postmortem` | Guided incident analysis; encode lessons into skills |
| `/aisa:validate` | Validate skills and agents against architectural principles |

> **[Full reference →](docs/plugin-ai-setup-automation.md)** Skills, recommended cadence, lifecycle diagram, execution modes, core principles

### sdlc-utilities

Automates SDLC tasks: generates structured PR descriptions from commits and diffs, and runs
project-customizable multi-dimension code reviews matched to your changed files.

| Command | Description |
| --- | --- |
| `/sdlc:pr` | Create a PR with an auto-generated structured description |
| `/sdlc:review` | Run multi-dimension code review on the current branch |
| `/sdlc:review-init` | Scan the project and create tailored review dimension files |

`/sdlc:pr` supports `--draft`, `--update`, and `--base <branch>` flags.
`/sdlc:review` supports `--base`, `--dimensions`, and `--dry-run` flags.

> **[Full reference →](docs/plugin-sdlc-utilities.md)** Usage examples, flag reference, example PR output, code review workflow, dimension format

---

## Documentation

| Document | Description |
| --- | --- |
| [Getting Started](docs/getting-started.md) | Installation, first use, what gets created |
| [Architecture](docs/architecture.md) | Repository structure, plugin system, name resolution |
| [Plugin: ai-setup-automation](docs/plugin-ai-setup-automation.md) | Skills reference, cadence, lifecycle, execution modes, principles |
| [Plugin: sdlc-utilities](docs/plugin-sdlc-utilities.md) | PR command usage, flags, example output, skill template |
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

## License

[AGPL-3.0](LICENSE)
