# Promptfoo Behavioral Tests

Regression tests that run skills through Claude and verify behavioral patterns.

## Requirements

- Claude Code CLI installed (`claude` in PATH) and logged in
- Node.js 18+

## Run tests

From this directory:

```bash
npx promptfoo eval
```

Open the web UI to inspect results:

```bash
npx promptfoo view
```

## How it works

Each skill gets a dataset YAML under `datasets/` with 2–3 test cases. The `providers/claude-cli.js` custom provider shells out to `claude -p` (your Claude Pro/Max subscription — no API key needed). The `scripts/extract-skill-content.js` transformVars script injects skill file content into prompt variables at eval time.
