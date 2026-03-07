# Promptfoo Behavioral Tests

Regression tests that run skills through Claude and verify behavioral patterns.

## Requirements

- Claude Code CLI installed (`claude` in PATH) and logged in
- Node.js 18+
- promptfoo installed globally: `npm install -g promptfoo`

## Run tests

From this directory:

```bash
promptfoo eval --env-file .env
```

Open the web UI to inspect results:

```bash
promptfoo view --env-file .env
```

## Results

Results are stored locally in `.promptfoo-data/` (gitignored) instead of the default `~/.promptfoo/` in your home directory. This is configured via `PROMPTFOO_CONFIG_DIR` in the `.env` file.

- `.promptfoo-data/promptfoo.db` — SQLite database with all eval results
- `.promptfoo-data/logs/` — debug and error logs

Both `eval` and `view` must use `--env-file .env` to pick up this location.

## How it works

Each skill gets a dataset YAML under `datasets/` with 2–3 test cases. The `providers/claude-cli.js` custom provider shells out to `claude -p` (your Claude Pro/Max subscription — no API key needed). The `scripts/extract-skill-content.js` transformVars script injects skill file content into prompt variables at eval time.
