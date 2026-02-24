# CLAUDE.md Templates by Language

## Node.js / TypeScript

```markdown
# [Project Name]

[Brief description]

## Tech Stack

- Language: TypeScript
- Runtime: Node.js [version]
- Package manager: npm / pnpm / yarn
- Framework: [Express / Fastify / NestJS / etc.]

## Project Structure

- `src/` — Source code
- `tests/` — Test files
- `dist/` — Build output (gitignored)

## Development Workflow

### Install Dependencies

npm install

### Build

npm run build

### Test

npm test

### Lint

npm run lint
```

## Go

```markdown
# [Project Name]

[Brief description]

## Tech Stack

- Language: Go [version]
- Build tool: [go build / task / make]
- Test framework: testing + testify

## Project Structure

- `cmd/` — Application entry points
- `internal/` — Private application code
- `pkg/` — Public library code

## Development Workflow

### Build

go build ./...

### Test

go test ./...

### Lint

golangci-lint run
```

## Python

```markdown
# [Project Name]

[Brief description]

## Tech Stack

- Language: Python [version]
- Package manager: pip / poetry / uv
- Framework: [Django / FastAPI / Flask / etc.]

## Project Structure

- `src/` — Source code
- `tests/` — Test files
- `pyproject.toml` — Project configuration

## Development Workflow

### Install Dependencies

pip install -e ".[dev]"

### Test

pytest

### Lint

ruff check .

### Format

ruff format .
```

## Rust

```markdown
# [Project Name]

[Brief description]

## Tech Stack

- Language: Rust [version]
- Build tool: Cargo
- Framework: [Axum / Actix / etc.]

## Project Structure

- `src/` — Source code
- `tests/` — Integration tests
- `Cargo.toml` — Project configuration

## Development Workflow

### Build

cargo build

### Test

cargo test

### Lint

cargo clippy
```
