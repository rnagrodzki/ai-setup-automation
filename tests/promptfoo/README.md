# Promptfoo Behavioral Tests

Regression tests that run skills through Claude and verify behavioral patterns.

## Requirements

- Claude Code CLI installed (`claude` in PATH) and logged in
- Node.js 18+
- promptfoo installed globally: `npm install -g promptfoo`

## Run tests

From this directory:

```bash
promptfoo eval
```

Open the web UI to inspect results:

```bash
promptfoo view
```

## Results

Promptfoo stores results in `~/.promptfoo/` in your home directory (not in this repo):

- `~/.promptfoo/promptfoo.db` — SQLite database with all eval results
- `~/.promptfoo/logs/` — debug and error logs

`promptfoo view` reads from this database and opens a local web UI to browse past evals.

## How it works

Each skill gets a dataset YAML under `datasets/` with 2–3 test cases. The `providers/claude-cli.js` custom provider shells out to `claude -p` (your Claude Pro/Max subscription — no API key needed). The `scripts/extract-skill-content.js` transformVars script injects skill file content into prompt variables at eval time.
