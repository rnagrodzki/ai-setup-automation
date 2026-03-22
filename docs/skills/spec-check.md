# `/aisa:aisa-spec-check` — Check openspec tooling

Verifies that the `openspec` CLI is installed, that the current project has been initialized with it, and that the installed version is current. Use it before relying on openspec-based workflows to confirm your environment is ready, or after a fresh clone to understand what setup steps remain.

## Usage

```text
/aisa:aisa-spec-check
```

## Examples

```text
/aisa:aisa-spec-check
```

> Checks for the `openspec` CLI on `$PATH`, inspects the project for an existing openspec initialization, and compares the installed version against the latest published release. Reports one of:
> - **INSTALLED / CURRENT** — CLI is present and up to date; project is initialized
> - **INSTALLED / OUTDATED** — CLI is present but a newer version is available; offers to run `npm install -g @fission-ai/openspec`
> - **NOT INITIALIZED** — CLI is installed but `openspec init` has not been run in this project; offers to run it
> - **NOT INSTALLED** — CLI is missing entirely; offers to run `npm install -g @fission-ai/openspec`

## Prerequisites

- Node.js >= 16
- npm (used for version comparison against the registry)
- `openspec` CLI — optional; the skill checks for it and offers to install it if absent

## What It Creates / Modifies

Read-only by default. When the check reveals a missing or outdated installation, the skill describes the required action and asks for your confirmation before running any of the following:

- `npm install -g @fission-ai/openspec` — installs or upgrades the CLI
- `openspec init` — initializes the current project

## Related Skills

- [`/aisa:aisa-inspect`](inspect.md) — read-only drift scan of the `.claude/` setup
- [`/aisa:aisa-init`](init.md) — full AI project configuration scaffolding
