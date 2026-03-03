# reviewing-changes Speed-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Speed up the `reviewing-changes` skill by replacing 6 sequential LLM steps with a fast pre-computation script and isolating the full review process in a dedicated orchestrator agent.

**Architecture:** A new `review-prepare.js` script (zero npm deps) handles all mechanical pre-work — git operations, programmatic glob matching, single diff split per dimension, plan critique, commit context, PR metadata — and outputs a JSON manifest + per-dimension `.diff` files to a temp directory. A new proper `agents/review-orchestrator.md` agent then reads the manifest, dispatches dimension subagents with pre-computed diffs, critiques/deduplicates results, and posts the PR comment. The `SKILL.md` shrinks from 11 steps to 4; the command becomes a thin passthrough.

**Tech Stack:** Node.js built-ins only (`fs`, `path`, `os`, `child_process`). No npm install required. Follows patterns from existing `validate-dimensions.js` and `verify-setup.js`.

---

## Context: What Exists Today

```
plugins/sdlc-utilities/
  scripts/
    validate-dimensions.js    ← 428 lines. Contains YAML parser, frontmatter
                                 extractor, glob validator, D1-D12 validation.
                                 All functions will move to lib/dimensions.js.
  skills/reviewing-changes/
    SKILL.md                  ← 244 lines, 11 steps. Most replaced by script.
    REFERENCE.md              ← Subagent prompt template, comment template.
    EXAMPLES.md               ← 5 example dimension files with real glob patterns.
  commands/
    review.md                 ← Currently does git validation. Will be stripped.
```

Key glob patterns in use (from EXAMPLES.md — must work after implementation):

```
**/*.ts          **/*.tsx         **/*.js          **/*.jsx
**/middleware/** **/auth/**       **/routes/**     **/controllers/**
**/*auth*        **/*token*       **/*secret*      **/*.test.*
**/node_modules/**               **/dist/**        **/vendor/**
```

---

## Task 1: Create `scripts/lib/dimensions.js`

Extract shared functions from `validate-dimensions.js` into a reusable module.

**Files:**

- Create: `plugins/sdlc-utilities/scripts/lib/dimensions.js`
- Modify: `plugins/sdlc-utilities/scripts/validate-dimensions.js`

**Step 1: Capture baseline output for regression test**

```bash
cd /path/to/test-project-with-dimensions
node /path/to/plugins/sdlc-utilities/scripts/validate-dimensions.js --project-root . --json > /tmp/baseline.json
echo "Baseline captured"
```

If you don't have a test project, create one:

```bash
mkdir -p /tmp/test-project/.claude/review-dimensions
cat > /tmp/test-project/.claude/review-dimensions/security.md << 'EOF'
---
name: security-review
description: Reviews changes for security vulnerabilities
triggers:
  - "**/auth/**"
  - "**/*token*"
severity: high
---
Check for exposed credentials and missing auth.
EOF
node plugins/sdlc-utilities/scripts/validate-dimensions.js --project-root /tmp/test-project --json > /tmp/baseline.json
```

**Step 2: Create `scripts/lib/` directory and write `dimensions.js`**

```bash
mkdir -p plugins/sdlc-utilities/scripts/lib
```

Create `plugins/sdlc-utilities/scripts/lib/dimensions.js` with this exact content:

```javascript
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// YAML frontmatter parser (no external deps)
// ---------------------------------------------------------------------------

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

function extractBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const kvMatch = line.match(/^(\S[^:]*?)\s*:\s*(.*)$/);
    if (!kvMatch) { i++; continue; }

    const key = kvMatch[1].trim();
    const rest = kvMatch[2].trim();

    if (rest === '') {
      const arr = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s+/)) {
        arr.push(lines[i].replace(/^\s+-\s+/, '').trim());
        i++;
      }
      result[key] = arr;
      continue;
    }

    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1);
      result[key] = inner.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      i++;
      continue;
    }

    if (rest === 'true') { result[key] = true; i++; continue; }
    if (rest === 'false') { result[key] = false; i++; continue; }
    if (/^\d+$/.test(rest)) { result[key] = parseInt(rest, 10); i++; continue; }

    result[key] = rest.replace(/^["']|["']$/g, '');
    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Glob syntax validation (lightweight)
// ---------------------------------------------------------------------------

function isValidGlob(pattern) {
  if (typeof pattern !== 'string') return false;
  if (!pattern.trim()) return false;
  if (/\*{3,}/.test(pattern)) return false;
  let depth = 0;
  for (const ch of pattern) {
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth < 0) return false; }
  }
  return depth === 0;
}

// ---------------------------------------------------------------------------
// Known fields and valid severities
// ---------------------------------------------------------------------------

const KNOWN_FIELDS = new Set([
  'name', 'description', 'triggers', 'skip-when',
  'severity', 'max-files', 'requires-full-diff',
]);

const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);

// ---------------------------------------------------------------------------
// Validate a single dimension file (D0-D12)
// ---------------------------------------------------------------------------

function validateDimensionFile(filePath) {
  const errors = [];
  const warnings = [];

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    errors.push({ check: 'D0', message: `Cannot read file: ${err.message}`, line: null });
    return { errors, warnings, parsed: null };
  }

  const rawFm = extractFrontmatter(content);
  if (!rawFm) {
    errors.push({ check: 'D1', message: 'Missing YAML frontmatter block (--- delimiters)', line: null });
    return { errors, warnings, parsed: null };
  }

  const fm = parseSimpleYaml(rawFm);

  for (const key of Object.keys(fm)) {
    if (!KNOWN_FIELDS.has(key)) {
      const suggestions = [...KNOWN_FIELDS].filter(f => {
        if (Math.abs(f.length - key.length) > 3) return false;
        let diff = 0;
        const minLen = Math.min(f.length, key.length);
        for (let i = 0; i < minLen; i++) { if (f[i] !== key[i]) diff++; }
        return diff <= 2;
      });
      const hint = suggestions.length > 0 ? ` (did you mean: ${suggestions.join(', ')}?)` : '';
      warnings.push({ check: 'D11', message: `Unknown frontmatter field: "${key}"${hint}`, line: null });
    }
  }

  if (!fm.name && fm.name !== 0) {
    errors.push({ check: 'D2', message: 'Missing required field: name', line: null });
  } else if (typeof fm.name !== 'string') {
    errors.push({ check: 'D2', message: 'Field "name" must be a string', line: null });
  } else if (!/^[a-z0-9-]+$/.test(fm.name)) {
    errors.push({ check: 'D2', message: `Field "name" must be lowercase letters, digits, and hyphens only (got: "${fm.name}")`, line: null });
  } else if (fm.name.length > 64) {
    errors.push({ check: 'D2', message: `Field "name" exceeds 64 characters (got: ${fm.name.length})`, line: null });
  }

  if (!fm.description) {
    errors.push({ check: 'D3', message: 'Missing required field: description', line: null });
  } else if (typeof fm.description !== 'string') {
    errors.push({ check: 'D3', message: 'Field "description" must be a string', line: null });
  } else if (fm.description.trim().length === 0) {
    errors.push({ check: 'D3', message: 'Field "description" must not be empty', line: null });
  } else if (fm.description.length > 256) {
    errors.push({ check: 'D3', message: `Field "description" exceeds 256 characters (got: ${fm.description.length})`, line: null });
  }

  if (!fm.triggers) {
    errors.push({ check: 'D4', message: 'Missing required field: triggers (must be a non-empty array of glob patterns)', line: null });
  } else if (!Array.isArray(fm.triggers)) {
    errors.push({ check: 'D4', message: 'Field "triggers" must be an array of strings', line: null });
  } else if (fm.triggers.length === 0) {
    errors.push({ check: 'D4', message: 'Field "triggers" must contain at least one pattern', line: null });
  } else {
    for (const pattern of fm.triggers) {
      if (!isValidGlob(pattern)) {
        errors.push({ check: 'D5', message: `Invalid glob pattern in triggers: "${pattern}"`, line: null });
      }
    }
  }

  if (fm.severity !== undefined && !VALID_SEVERITIES.has(fm.severity)) {
    warnings.push({ check: 'D6', message: `Field "severity" must be one of: critical, high, medium, low, info (got: "${fm.severity}")`, line: null });
  }

  if (fm['max-files'] !== undefined && (!Number.isInteger(fm['max-files']) || fm['max-files'] <= 0)) {
    warnings.push({ check: 'D7', message: `Field "max-files" must be a positive integer (got: ${JSON.stringify(fm['max-files'])})`, line: null });
  }

  if (fm['skip-when'] !== undefined) {
    if (!Array.isArray(fm['skip-when'])) {
      warnings.push({ check: 'D8', message: 'Field "skip-when" must be an array of strings', line: null });
    } else {
      for (const pattern of fm['skip-when']) {
        if (!isValidGlob(pattern)) {
          warnings.push({ check: 'D8', message: `Invalid glob pattern in skip-when: "${pattern}"`, line: null });
        }
      }
    }
  }

  const body = extractBody(content);
  if (body.length < 10) {
    errors.push({ check: 'D9', message: `Body must contain at least 10 characters of review instructions (got: ${body.length})`, line: null });
  }

  if (fm['requires-full-diff'] !== undefined && typeof fm['requires-full-diff'] !== 'boolean') {
    warnings.push({ check: 'D12', message: `Field "requires-full-diff" must be a boolean (got: ${JSON.stringify(fm['requires-full-diff'])})`, line: null });
  }

  return { errors, warnings, parsed: fm };
}

// ---------------------------------------------------------------------------
// Validate all dimension files in a project
// ---------------------------------------------------------------------------

function validateAll(projectRoot) {
  const dimensionsDir = path.join(projectRoot, '.claude', 'review-dimensions');

  let files = [];
  try {
    const entries = fs.readdirSync(dimensionsDir);
    files = entries
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dimensionsDir, f));
  } catch (_) {
    files = [];
  }

  const results = [];
  const seenNames = new Map();

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const { errors, warnings, parsed } = validateDimensionFile(filePath);
    const name = parsed ? parsed.name || null : null;

    if (name && seenNames.has(name)) {
      errors.push({
        check: 'D10',
        message: `Duplicate dimension name "${name}" — also used in ${path.basename(seenNames.get(name))}`,
        line: null,
      });
    } else if (name) {
      seenNames.set(name, filePath);
    }

    const status = errors.length > 0 ? 'FAIL' : 'PASS';
    results.push({ file: fileName, name, status, errors, warnings });
  }

  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);
  const totalWarnings = results.reduce((s, r) => s + r.warnings.length, 0);
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  let overall;
  if (failCount > 0) overall = 'HAS_ISSUES';
  else if (totalWarnings > 0) overall = 'HAS_WARNINGS';
  else overall = 'PASS';

  return {
    timestamp: new Date().toISOString(),
    dimensions_dir: path.relative(projectRoot, dimensionsDir),
    dimensions: results,
    summary: { total: results.length, pass: passCount, fail: failCount, total_errors: totalErrors, total_warnings: totalWarnings },
    overall,
  };
}

module.exports = {
  extractFrontmatter,
  extractBody,
  parseSimpleYaml,
  isValidGlob,
  KNOWN_FIELDS,
  VALID_SEVERITIES,
  validateDimensionFile,
  validateAll,
};
```

**Step 3: Rewrite `validate-dimensions.js` to import from the lib**

Replace the entire file content of `plugins/sdlc-utilities/scripts/validate-dimensions.js` with:

```javascript
#!/usr/bin/env node
/**
 * validate-dimensions.js
 * Validates review dimension files in <project>/.claude/review-dimensions/.
 *
 * Usage:
 *   node validate-dimensions.js [options]
 *
 * Options:
 *   --project-root <path>   Project root (default: cwd)
 *   --json                  JSON output to stdout (default)
 *   --markdown              Formatted markdown output to stdout
 *
 * Exit codes: 0 = all pass, 1 = issues found, 2 = script error
 *
 * Uses only Node.js built-in modules. No npm install required.
 */

'use strict';

const { validateAll } = require('./lib/dimensions');

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  let projectRoot = process.cwd();
  let outputFormat = 'json';

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--project-root' && args[i + 1]) {
      projectRoot = require('node:path').resolve(args[++i]);
    } else if (a === '--json') {
      outputFormat = 'json';
    } else if (a === '--markdown') {
      outputFormat = 'markdown';
    }
  }

  return { projectRoot, outputFormat };
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

function formatJson(report) {
  return JSON.stringify(report, null, 2);
}

function formatMarkdown(report) {
  const lines = [];
  lines.push('# Dimension Validation Report');
  lines.push('');
  lines.push(`**Overall:** ${report.overall} | ${report.summary.pass}/${report.summary.total} pass, ${report.summary.total_errors} error(s), ${report.summary.total_warnings} warning(s)`);
  lines.push('');

  if (report.dimensions.length === 0) {
    lines.push(`No dimension files found in \`${report.dimensions_dir}\`.`);
    lines.push('');
    lines.push('Run `/sdlc:review-init` to create tailored review dimensions for this project.');
    return lines.join('\n');
  }

  lines.push('## Dimension Status');
  lines.push('');
  lines.push('| Dimension | File | Errors | Warnings | Status |');
  lines.push('|-----------|------|--------|----------|--------|');
  for (const d of report.dimensions) {
    const name = d.name || '(unknown)';
    lines.push(`| ${name} | ${d.file} | ${d.errors.length} | ${d.warnings.length} | ${d.status} |`);
  }
  lines.push('');

  const allIssues = [];
  for (const d of report.dimensions) {
    for (const e of d.errors) allIssues.push({ file: d.file, check: e.check, severity: 'ERROR', message: e.message });
    for (const w of d.warnings) allIssues.push({ file: d.file, check: w.check, severity: 'WARNING', message: w.message });
  }

  if (allIssues.length > 0) {
    lines.push('## Issues');
    lines.push('');
    lines.push('| # | File | Check | Severity | Message |');
    lines.push('|---|------|-------|----------|---------|');
    allIssues.forEach((issue, idx) => {
      lines.push(`| ${idx + 1} | ${issue.file} | ${issue.check} | ${issue.severity} | ${issue.message} |`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

try {
  const { projectRoot, outputFormat } = parseArgs(process.argv);
  const report = validateAll(projectRoot);

  if (outputFormat === 'markdown') {
    process.stdout.write(formatMarkdown(report) + '\n');
  } else {
    process.stdout.write(formatJson(report) + '\n');
  }

  process.exit(report.summary.total_errors > 0 ? 1 : 0);
} catch (err) {
  process.stderr.write(`validate-dimensions.js error: ${err.message}\n`);
  process.exit(2);
}
```

**Step 4: Verify identical behavior**

```bash
cd /path/to/repo
node plugins/sdlc-utilities/scripts/validate-dimensions.js --project-root /tmp/test-project --json > /tmp/after.json
diff /tmp/baseline.json /tmp/after.json
```

Expected: no diff output (files are identical).

**Step 5: Commit**

```bash
git add plugins/sdlc-utilities/scripts/lib/dimensions.js plugins/sdlc-utilities/scripts/validate-dimensions.js
git commit -m "refactor: extract shared dimension lib from validate-dimensions.js"
```

---

## Task 2: Implement `globToRegex` and glob matching in `review-prepare.js`

The hardest algorithmic piece — get this right first, tested in isolation.

**Files:**

- Create: `plugins/sdlc-utilities/scripts/review-prepare.js` (partial — just glob functions for now)
- Create: `plugins/sdlc-utilities/scripts/test-glob.js` (temporary test harness, delete after)

**Step 1: Write failing test first**

Create `plugins/sdlc-utilities/scripts/test-glob.js`:

```javascript
'use strict';

// Test cases derived from EXAMPLES.md real patterns.
// Each: [pattern, file, expectedMatch]
const cases = [
  // ** extension matching
  ['**/*.ts',          'src/widget.ts',              true],
  ['**/*.ts',          'src/widget.js',              false],
  ['**/*.ts',          'src/deep/nested/widget.ts',  true],
  ['**/*.tsx',         'src/App.tsx',                true],
  ['**/*.tsx',         'src/App.ts',                 false],

  // ** directory matching
  ['**/auth/**',       'src/auth/login.ts',          true],
  ['**/auth/**',       'src/auth/nested/jwt.ts',     true],
  ['**/auth/**',       'src/utils/format.ts',        false],
  ['**/middleware/**', 'src/middleware/cors.js',      true],
  ['**/middleware/**', 'src/auth/login.ts',           false],

  // ** substring filename matching
  ['**/*auth*',        'src/utils/authHelper.ts',    true],
  ['**/*auth*',        'src/authService.ts',         true],
  ['**/*auth*',        'src/utils/format.ts',        false],
  ['**/*token*',       'src/utils/tokenHelper.ts',   true],
  ['**/*secret*',      'config/secrets.json',        true],
  ['**/*secret*',      'config/settings.json',       false],

  // multi-dot extension (skip-when patterns)
  ['**/*.test.*',      'src/auth/login.test.ts',     true],
  ['**/*.test.*',      'src/auth/login.spec.ts',     false],
  ['**/*.spec.*',      'src/auth/login.spec.ts',     true],
  ['**/*.spec.*',      'src/auth/login.test.ts',     false],

  // vendor/build directories
  ['**/node_modules/**', 'node_modules/lodash/index.js', true],
  ['**/node_modules/**', 'src/utils/format.ts',          false],
  ['**/dist/**',         'dist/bundle.js',               true],
  ['**/dist/**',         'src/bundle.js',                false],

  // root-relative single-segment *
  ['**/*.json',        'package.json',               true],
  ['**/*.json',        'src/config/settings.json',   true],
  ['**/*.yaml',        'openapi.yaml',               true],
];

// Paste globToRegex implementation here for testing:
function globToRegex(pattern) {
  // IMPLEMENTATION GOES HERE — paste the function below
}

let passed = 0;
let failed = 0;

for (const [pattern, file, expected] of cases) {
  const re = globToRegex(pattern);
  const actual = re.test(file);
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: globToRegex("${pattern}").test("${file}") = ${actual}, want ${expected}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${cases.length} cases`);
process.exit(failed > 0 ? 1 : 0);
```

**Step 2: Run test to verify it fails (function stub)**

```bash
node plugins/sdlc-utilities/scripts/test-glob.js
```

Expected: fails because `globToRegex` is a stub.

**Step 3: Create `review-prepare.js` with `globToRegex` and `matchFiles`**

Create `plugins/sdlc-utilities/scripts/review-prepare.js` (full file — more functions added in later tasks):

```javascript
#!/usr/bin/env node
/**
 * review-prepare.js
 * Pre-computes all data needed for the reviewing-changes skill:
 * git state, changed files, dimension matching, diff splitting,
 * commit context, PR metadata. Outputs JSON manifest + per-dimension
 * .diff files to a temp directory.
 *
 * Usage:
 *   node review-prepare.js [options]
 *
 * Options:
 *   --project-root <path>     Project root (default: cwd)
 *   --base <branch>           Base branch (auto-detect if omitted)
 *   --dimensions <name,...>   Filter to named dimensions only
 *   --json                    JSON output to stdout (default)
 *
 * Exit codes: 0 = success, 1 = no dimensions or no changes, 2 = script error
 * Stdout: JSON manifest
 * Stderr: warnings/progress
 * Side effect: writes .diff files to OS temp dir
 *
 * Uses only Node.js built-in modules. No npm install required.
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const os   = require('node:os');
const { execSync } = require('node:child_process');

const { validateAll, extractBody, parseSimpleYaml, extractFrontmatter } = require('./lib/dimensions');

// ---------------------------------------------------------------------------
// Glob matching
// ---------------------------------------------------------------------------

/**
 * Convert a glob pattern to a RegExp.
 * Handles the patterns used in review dimension files:
 *   **\/   — zero or more directory segments
 *   **     — any sequence of characters (including slashes)
 *   *      — any chars within a single path segment (no slash)
 *   ?      — single char (no slash)
 *   [...]  — character class
 *   .      — literal dot (escaped)
 */
function globToRegex(pattern) {
  let re = '';
  let i = 0;
  const len = pattern.length;

  while (i < len) {
    const ch = pattern[i];

    if (ch === '*') {
      if (i + 1 < len && pattern[i + 1] === '*') {
        // ** — match zero or more path segments
        if (i + 2 < len && pattern[i + 2] === '/') {
          // **/ — zero or more dir segments (e.g. **/auth/**)
          re += '(?:[^/]+/)*';
          i += 3;
        } else {
          // ** at end or followed by non-slash — match everything
          re += '.*';
          i += 2;
        }
      } else {
        // * — match within a single segment
        re += '[^/]*';
        i++;
      }
    } else if (ch === '?') {
      re += '[^/]';
      i++;
    } else if (ch === '[') {
      const close = pattern.indexOf(']', i + 1);
      if (close === -1) {
        re += '\\[';
        i++;
      } else {
        re += pattern.slice(i, close + 1);
        i = close + 1;
      }
    } else if ('.+^${}()|\\'.includes(ch)) {
      re += '\\' + ch;
      i++;
    } else {
      re += ch;
      i++;
    }
  }

  return new RegExp('^' + re + '$');
}

/**
 * Match a list of changed files against a dimension's trigger/skip-when globs.
 * Returns { matched: string[], truncated: boolean }
 */
function matchFiles(dimension, changedFiles) {
  const triggers  = (dimension.triggers    || []).map(globToRegex);
  const skipWhen  = (dimension['skip-when'] || []).map(globToRegex);
  const maxFiles  = dimension['max-files'] || 100;

  let matched = changedFiles.filter(f =>
    triggers.some(re => re.test(f)) && !skipWhen.some(re => re.test(f))
  );

  const truncated = matched.length > maxFiles;
  if (truncated) matched = matched.slice(0, maxFiles);

  return { matched, truncated };
}

module.exports = { globToRegex, matchFiles };
```

**Step 4: Copy `globToRegex` into the test harness and run**

In `test-glob.js`, replace the stub with the real implementation (copy the function body from `review-prepare.js`), then:

```bash
node plugins/sdlc-utilities/scripts/test-glob.js
```

Expected output:

```
24 passed, 0 failed out of 24 cases
```

**Step 5: Commit**

```bash
git add plugins/sdlc-utilities/scripts/review-prepare.js plugins/sdlc-utilities/scripts/test-glob.js
git commit -m "feat: add review-prepare.js with globToRegex and matchFiles"
```

---

## Task 3: Add git operations to `review-prepare.js`

**Files:**

- Modify: `plugins/sdlc-utilities/scripts/review-prepare.js`

**Step 1: Add these functions to `review-prepare.js` (append before `module.exports`)**

```javascript
// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  let projectRoot = process.cwd();
  let baseBranch = null;
  let dimensionFilter = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--project-root' && args[i + 1]) projectRoot = path.resolve(args[++i]);
    else if (a === '--base' && args[i + 1]) baseBranch = args[++i];
    else if (a === '--dimensions' && args[i + 1]) dimensionFilter = args[++i].split(',').map(s => s.trim());
  }

  return { projectRoot, baseBranch, dimensionFilter };
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...opts }).trim();
  } catch (err) {
    return null;
  }
}

function checkGitState(projectRoot) {
  const inside = exec('git rev-parse --is-inside-work-tree', { cwd: projectRoot });
  if (inside !== 'true') throw new Error('Not inside a git repository');

  const currentBranch = exec('git branch --show-current', { cwd: projectRoot }) || 'HEAD';
  const statusLines = exec('git status --porcelain', { cwd: projectRoot }) || '';
  const dirtyFiles = statusLines.split('\n').filter(Boolean).map(l => l.slice(3));

  return { currentBranch, uncommittedChanges: dirtyFiles.length > 0, dirtyFiles };
}

function detectBaseBranch(projectRoot) {
  const fromRemote = exec(
    "git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'",
    { cwd: projectRoot, shell: true }
  );
  if (fromRemote) return fromRemote;

  for (const candidate of ['main', 'master']) {
    const exists = exec(`git rev-parse --verify ${candidate} 2>/dev/null`, { cwd: projectRoot });
    if (exists) return candidate;
  }

  throw new Error('Cannot auto-detect base branch. Use --base <branch>.');
}

function getChangedFiles(base, projectRoot) {
  const out = exec(`git diff --name-only ${base}..HEAD`, { cwd: projectRoot });
  return out ? out.split('\n').filter(Boolean) : [];
}

function getCommitLog(base, projectRoot) {
  const log = exec(`git log --oneline ${base}..HEAD`, { cwd: projectRoot });
  return log || '';
}

function getCommitCount(base, projectRoot) {
  const count = exec(`git rev-list --count ${base}..HEAD`, { cwd: projectRoot });
  return count ? parseInt(count, 10) : 0;
}

/**
 * Returns Map<filePath, [{hash, subject}]> capped at 5 commits per file.
 */
function getCommitFileMap(base, projectRoot) {
  const raw = exec(
    `git log --format="COMMIT:%H %s" --name-only ${base}..HEAD`,
    { cwd: projectRoot }
  );
  if (!raw) return new Map();

  const fileCommits = new Map();
  let current = null;

  for (const line of raw.split('\n')) {
    if (line.startsWith('COMMIT:')) {
      const rest = line.slice(7);
      const spaceIdx = rest.indexOf(' ');
      const hash = rest.slice(0, 8);
      const subject = spaceIdx >= 0 ? rest.slice(spaceIdx + 1) : '';
      current = { hash, subject };
    } else if (line.trim() && current) {
      const file = line.trim();
      if (!fileCommits.has(file)) fileCommits.set(file, []);
      const commits = fileCommits.get(file);
      if (commits.length < 5) commits.push(current);
    }
  }

  return fileCommits;
}
```

**Step 2: Quick smoke test**

```bash
cd /path/to/any-git-repo
node -e "
const { execSync } = require('child_process');
// Inline test: verify exec helper works
const out = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
console.log('Current branch:', out);
"
```

Expected: prints the current branch name.

**Step 3: Commit**

```bash
git add plugins/sdlc-utilities/scripts/review-prepare.js
git commit -m "feat: add git helpers to review-prepare.js"
```

---

## Task 4: Add diff splitting and dimension diff writing

**Files:**

- Modify: `plugins/sdlc-utilities/scripts/review-prepare.js`

**Step 1: Add these functions to `review-prepare.js`**

```javascript
// ---------------------------------------------------------------------------
// Diff operations
// ---------------------------------------------------------------------------

/**
 * Fetch full diff and split into per-file chunks.
 * Returns Map<filePath, rawDiffChunk>
 */
function fetchAndSplitDiff(base, projectRoot) {
  const raw = exec(`git diff ${base}..HEAD`, { cwd: projectRoot });
  if (!raw) return new Map();

  const fileDiffs = new Map();
  // Split on each "diff --git" header, keeping the header with the chunk
  const chunks = raw.split(/(?=^diff --git )/m);

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    // "diff --git a/path b/path" — use b/ path (handles renames)
    const m = chunk.match(/^diff --git a\/.+ b\/(.+)/m);
    if (m) {
      // Strip trailing newline to avoid double-blank-lines when joining
      fileDiffs.set(m[1].trim(), chunk);
    }
  }

  return fileDiffs;
}

/**
 * Write one .diff file per active dimension to tmpDir.
 * Returns the path to tmpDir (created inside OS temp dir).
 */
function writeDimensionDiffs(activeDimensions, fileDiffs, projectRoot) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdlc-review-'));

  for (const dim of activeDimensions) {
    const parts = [];
    for (const file of dim.matched_files) {
      const chunk = fileDiffs.get(file);
      if (chunk) parts.push(chunk);
    }
    const diffContent = parts.join('\n');
    const diffPath = path.join(tmpDir, `${dim.name}.diff`);
    fs.writeFileSync(diffPath, diffContent, 'utf8');
    dim.diff_file = diffPath;
  }

  return tmpDir;
}
```

**Step 2: Verify the split logic manually**

```bash
cd /path/to/any-git-repo-with-changes
node -e "
const { execSync } = require('child_process');
const raw = execSync('git diff HEAD~1..HEAD', { encoding: 'utf8' });
const chunks = raw.split(/(?=^diff --git )/m).filter(c => c.trim());
console.log('Files in diff:', chunks.length);
chunks.forEach(c => {
  const m = c.match(/^diff --git a\/.+ b\/(.+)/m);
  if (m) console.log(' -', m[1].trim());
});
"
```

Expected: lists the changed files from the last commit.

**Step 3: Commit**

```bash
git add plugins/sdlc-utilities/scripts/review-prepare.js
git commit -m "feat: add diff splitting and per-dimension diff writing"
```

---

## Task 5: Add plan critique/refine and PR metadata

**Files:**

- Modify: `plugins/sdlc-utilities/scripts/review-prepare.js`

**Step 1: Add these functions to `review-prepare.js`**

```javascript
// ---------------------------------------------------------------------------
// Plan critique and refinement
// ---------------------------------------------------------------------------

const SEVERITY_RANK = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };

/**
 * Analyse the matching results and produce critique metadata.
 */
function critiquePlan(dimensions, changedFiles) {
  const allMatchedFiles = new Set(dimensions.flatMap(d => d.matched_files));
  const uncoveredFiles = changedFiles.filter(f => !allMatchedFiles.has(f));

  const totalCount = changedFiles.length;
  const overBroad = dimensions
    .filter(d => d.status === 'ACTIVE' && totalCount > 0 && d.matched_files.length / totalCount > 0.8)
    .map(d => d.name);

  // Detect dimensions with identical matched-file sets
  const overlappingPairs = [];
  const active = dimensions.filter(d => d.status === 'ACTIVE');
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = new Set(active[i].matched_files);
      const b = new Set(active[j].matched_files);
      if (a.size === b.size && [...a].every(f => b.has(f))) {
        overlappingPairs.push([active[i].name, active[j].name]);
      }
    }
  }

  const dimensionCapApplied = active.length > 8;

  return { uncoveredFiles, overBroad, overlappingPairs, dimensionCapApplied };
}

/**
 * If more than 8 dimensions are active, keep only the top 8 by priority.
 * Priority: severity descending, then matched_files count ascending.
 */
function refinePlan(dimensions) {
  const active = dimensions.filter(d => d.status === 'ACTIVE');
  if (active.length <= 8) return { dimensions, queued: [] };

  active.sort((a, b) => {
    const severityDiff = (SEVERITY_RANK[b.severity] || 3) - (SEVERITY_RANK[a.severity] || 3);
    if (severityDiff !== 0) return severityDiff;
    return a.matched_files.length - b.matched_files.length;
  });

  const keep = new Set(active.slice(0, 8).map(d => d.name));
  const queued = [];

  for (const dim of dimensions) {
    if (dim.status === 'ACTIVE' && !keep.has(dim.name)) {
      dim.status = 'QUEUED';
      queued.push(dim.name);
    }
  }

  return { dimensions, queued };
}

// ---------------------------------------------------------------------------
// PR metadata
// ---------------------------------------------------------------------------

function fetchPrMetadata() {
  try {
    const prJson = execSync('gh pr view --json number,url 2>/dev/null', { encoding: 'utf8' }).trim();
    const pr = JSON.parse(prJson);
    const repoJson = execSync('gh repo view --json owner,name', { encoding: 'utf8' }).trim();
    const repo = JSON.parse(repoJson);
    return { exists: true, number: pr.number, url: pr.url, owner: repo.owner.login, repo: repo.name };
  } catch (_) {
    return { exists: false };
  }
}
```

**Step 2: Commit**

```bash
git add plugins/sdlc-utilities/scripts/review-prepare.js
git commit -m "feat: add plan critique, refinement, and PR metadata to review-prepare.js"
```

---

## Task 6: Wire everything together — `main()` and manifest assembly

**Files:**

- Modify: `plugins/sdlc-utilities/scripts/review-prepare.js`

**Step 1: Replace the `module.exports` line at the bottom of `review-prepare.js` with the full wiring**

Remove:

```javascript
module.exports = { globToRegex, matchFiles };
```

Add:

```javascript
// ---------------------------------------------------------------------------
// Load and match dimensions
// ---------------------------------------------------------------------------

function loadAndMatchDimensions(projectRoot, changedFiles, dimensionFilter) {
  const report = validateAll(projectRoot);

  // Map validation results to dimension objects
  const dims = [];
  for (const result of report.dimensions) {
    if (result.status === 'FAIL') continue; // skip ERRORed dimensions

    // Re-read the file to get full frontmatter fields (validateAll only gives parsed name etc.)
    const filePath = require('node:path').join(projectRoot, '.claude', 'review-dimensions', result.file);
    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch (_) { continue; }

    const fm = parseSimpleYaml(extractFrontmatter(content) || '');
    const body = extractBody(content);

    // Apply --dimensions filter
    if (dimensionFilter && !dimensionFilter.includes(fm.name)) continue;

    const { matched, truncated } = matchFiles(fm, changedFiles);

    dims.push({
      name: fm.name,
      description: fm.description || '',
      severity: fm.severity || 'medium',
      requires_full_diff: fm['requires-full-diff'] || false,
      status: matched.length === 0 ? 'SKIPPED' : (truncated ? 'TRUNCATED' : 'ACTIVE'),
      matched_files: matched,
      matched_count: matched.length,
      truncated,
      diff_file: null, // filled later
      body,
      file_context: [], // filled later
      warnings: result.warnings,
    });
  }

  return { dims, report };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function main() {
  const { projectRoot, baseBranch, dimensionFilter } = parseArgs(process.argv);

  // Git state
  let gitState;
  try {
    gitState = checkGitState(projectRoot);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(2);
  }

  const base = baseBranch || (() => {
    try { return detectBaseBranch(projectRoot); }
    catch (err) { process.stderr.write(`Error: ${err.message}\n`); process.exit(2); }
  })();

  // Changed files
  const changedFiles = getChangedFiles(base, projectRoot);
  if (changedFiles.length === 0) {
    process.stderr.write(`No changed files found between this branch and "${base}".\n`);
    process.exit(1);
  }

  // Dimensions
  const { dims, report } = loadAndMatchDimensions(projectRoot, changedFiles, dimensionFilter);
  if (dims.length === 0) {
    process.stderr.write('No review dimensions found in .claude/review-dimensions/.\nRun /sdlc:review-init to create tailored review dimensions.\n');
    process.exit(1);
  }

  // Commit context
  const commitFileMap = getCommitFileMap(base, projectRoot);
  for (const dim of dims) {
    dim.file_context = dim.matched_files.map(file => ({
      file,
      commits: commitFileMap.get(file) || [],
    }));
  }

  // Diffs
  const fileDiffs = fetchAndSplitDiff(base, projectRoot);
  const activeDims = dims.filter(d => d.status === 'ACTIVE' || d.status === 'TRUNCATED');
  const tmpDir = writeDimensionDiffs(activeDims, fileDiffs, projectRoot);

  // Plan critique and refinement
  const critique = critiquePlan(dims, changedFiles);
  const { queued } = refinePlan(dims);

  // PR metadata
  const pr = fetchPrMetadata();

  // Manifest
  const manifest = {
    version: 1,
    timestamp: new Date().toISOString(),
    base_branch: base,
    current_branch: gitState.currentBranch,
    git: {
      commit_count: getCommitCount(base, projectRoot),
      commit_log: getCommitLog(base, projectRoot),
      changed_files: changedFiles,
    },
    uncommitted_changes: gitState.uncommittedChanges,
    dirty_files: gitState.dirtyFiles,
    pr,
    dimensions: dims,
    plan_critique: {
      uncovered_files: critique.uncoveredFiles,
      over_broad_dimensions: critique.overBroad,
      overlapping_pairs: critique.overlappingPairs,
      dimension_cap_applied: critique.dimensionCapApplied,
      queued_dimensions: queued,
    },
    summary: {
      total_dimensions: dims.length,
      active_dimensions: dims.filter(d => d.status === 'ACTIVE' || d.status === 'TRUNCATED').length,
      skipped_dimensions: dims.filter(d => d.status === 'SKIPPED').length,
      queued_dimensions: queued.length,
      total_changed_files: changedFiles.length,
      uncovered_file_count: critique.uncoveredFiles.length,
    },
    diff_dir: tmpDir,
  };

  process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
  process.exit(0);
}

// Run only when executed directly (not required as module)
if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`review-prepare.js error: ${err.message}\n${err.stack}\n`);
    process.exit(2);
  }
}

module.exports = { globToRegex, matchFiles };
```

**Step 2: Run the full script against a real branch**

```bash
cd /path/to/a-project-with-review-dimensions-and-changes
node /path/to/plugins/sdlc-utilities/scripts/review-prepare.js \
  --project-root . \
  --base main \
  --json | head -80
```

Expected: valid JSON manifest starting with `{ "version": 1, "timestamp":...`. Check:

- `git.changed_files` lists the actual changed files
- `dimensions` array has entries with correct `status` values
- Active dimensions have `diff_file` pointing to `/tmp/sdlc-review-XXXXX/name.diff`
- The `.diff` files exist on disk

```bash
# Verify diff files were created
ls $(node plugins/sdlc-utilities/scripts/review-prepare.js --json 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.diff_dir)")
```

**Step 3: Delete the temporary test harness**

```bash
git rm plugins/sdlc-utilities/scripts/test-glob.js
```

**Step 4: Commit**

```bash
git add plugins/sdlc-utilities/scripts/review-prepare.js
git commit -m "feat: complete review-prepare.js with manifest output and diff writing"
```

---

## Task 7: Create the orchestrator agent

**Files:**

- Create: `plugins/sdlc-utilities/agents/review-orchestrator.md`

**Step 1: Create the agents directory and write the agent**

```bash
mkdir -p plugins/sdlc-utilities/agents
```

Create `plugins/sdlc-utilities/agents/review-orchestrator.md`:

````markdown
---
name: review-orchestrator
description: Orchestrates multi-dimension code review. Reads a pre-computed JSON manifest, dispatches dimension review subagents in parallel, critiques and deduplicates findings, and posts a consolidated PR comment.
tools: Read, Glob, Grep, Bash, Agent
---

# Code Review Orchestrator

You are the review orchestrator. You receive a JSON manifest from `review-prepare.js`
and a path to `REFERENCE.md`. Your job: run the full review pipeline in isolation so
the user's main context stays clean.

## Inputs (provided in your prompt)

- **MANIFEST_JSON**: The full JSON from `review-prepare.js`
- **REFERENCE_MD_PATH**: Glob path to locate `**/reviewing-changes/REFERENCE.md`

## Step 1 — Parse Manifest and Present Plan

Parse MANIFEST_JSON. Display the review plan:

```
Review Plan
  Base branch:   {base_branch}
  Changed files: {git.changed_files.length}
  Dimensions:    {summary.active_dimensions} active, {summary.skipped_dimensions} skipped

| Dimension        | Files | Severity | Status   |
|------------------|-------|----------|----------|
| security-review  | 8     | high     | ACTIVE   |
| performance      | 0     | medium   | SKIPPED  |
```

Surface warnings from `plan_critique`:

- **Uncovered files** (`uncovered_files.length > 0`): list them
- **Over-broad** (`over_broad_dimensions`): flag by name
- **Queued** (`queued_dimensions`): note they were capped out

If `uncommitted_changes` is true: warn the user that uncommitted changes are not
included in this review.

## Step 2 — Dispatch Dimension Subagents

Read REFERENCE.md (locate via Glob). Use section 2 "Subagent Prompt Template".

For each dimension with `status: "ACTIVE"` or `status: "TRUNCATED"`:

1. Read the pre-computed diff: `Read(dimension.diff_file)`
2. Build the subagent prompt using the template from REFERENCE.md section 2, filling:
   - `{dimension.name}`, `{dimension.description}`, `{dimension.severity}`
   - `{dimension body}` → `dimension.body`
   - `{list of matched files}` → `dimension.matched_files` (one per line)
   - `{filtered diff}` → the content read from `dimension.diff_file`
   - Add commit context section before the Output Format section:

     ```
     ## Commit Context
     Use these commit messages to understand the author's intent:

     {for each entry in dimension.file_context where commits.length > 0}
     - `{entry.file}` — {entry.commits.map(c => `${c.hash}: ${c.subject}`).join('; ')}
     {end for}
     ```

3. Dispatch via Agent tool (subagent_type: general-purpose)

**Dispatch ALL active dimensions in a SINGLE message** (multiple Agent tool calls in
one response). Do not dispatch one at a time.

Collect all subagent results.

## Step 3 (CRITIQUE) — Review Subagent Results

After all subagents return:

- **Duplicates**: same `file:line` flagged by multiple dimensions?
- **Contradictions**: conflicting recommendations at the same `file:line`?
- **Zero findings credibility**: dimension returned "No findings" — does the diff
  for that dimension actually contain potential issues?
- **Severity calibration**: any finding with wrong severity (e.g., `info` for
  credential exposure, or `critical` for a minor style note)?

## Step 4 (IMPROVE) — Refine Findings

Apply fixes from the critique:

- **Deduplicate**: when same `file:line` appears in multiple dimensions, keep the
  finding from the highest-severity dimension. Add: `Also flagged by: {other-dimension}`.
- **Contradictions**: keep both findings. Add: `Note: conflicting recommendations —
  manual review required.`
- **Re-calibrate** miscalibrated severities.

## Step 5 — Build and Post Consolidated Comment

Format the comment using the template from REFERENCE.md section 3.

**Compute verdict:**

- `CHANGES REQUESTED` — any `critical` finding, OR ≥ 3 `high` findings
- `APPROVED WITH NOTES` — any `high` finding, OR ≥ 5 `medium` findings
- `APPROVED` — all other cases

**Post the comment:**

If `manifest.pr.exists`:

```bash
gh api repos/{manifest.pr.owner}/{manifest.pr.repo}/issues/{manifest.pr.number}/comments \
  -f body="{comment}"
```

If no PR: present the full review in the terminal, then offer:

```
No PR found. Options:
  1. Create a draft PR to attach this review as a comment
  2. Save review to .claude/reviews/<branch>-<date>.md
  3. Keep in terminal only (already shown)
```

## Step 6 — Return Summary

Output this summary for the main context to display:

```
Review complete
  Dimensions run:  {active} ({skipped} skipped — no matching files)
  Total findings:  {total}
    critical: {C} | high: {H} | medium: {M} | low: {L} | info: {I}
  Verdict: {VERDICT}
  PR comment: {url or "none"}
```

## Quality Gates

Before returning:

- All active dimensions were dispatched and results collected
- Deduplication pass completed
- Consolidated comment has all 4 sections: header, summary table, verdict, per-dimension details
- All findings reference a specific `file:line`
- Verdict computed from actual severity counts (not hardcoded)
````

**Step 2: Commit**

```bash
git add plugins/sdlc-utilities/agents/review-orchestrator.md
git commit -m "feat: add review-orchestrator agent to sdlc-utilities"
```

---

## Task 8: Simplify `SKILL.md`

Replace the 244-line, 11-step file with a focused 4-step version.

**Files:**

- Modify: `plugins/sdlc-utilities/skills/reviewing-changes/SKILL.md`

**Step 1: Replace the entire SKILL.md content**

```markdown
---
name: reviewing-changes
description: "Use this skill when reviewing code changes across project-defined dimensions (security, performance, docs, concurrency, etc.). Runs review-prepare.js to pre-compute all git data, then delegates to the review-orchestrator agent. Triggers on: review changes, code review, review PR, multi-dimension review, run review."
---

# Reviewing Changes

Pre-compute review data with a script, then delegate all orchestration to the
`review-orchestrator` agent. The agent dispatches dimension subagents, deduplicates
findings, and posts the consolidated PR comment.

---

## Step 1 — Run Preparation Script

Locate the script:

```
**/sdlc-utilities/scripts/review-prepare.js
```

Build the command from the arguments passed to this skill:

```bash
node <script-path>/review-prepare.js \
  --project-root . \
  [--base <branch>]        # include if --base was provided
  [--dimensions <names>]   # include if --dimensions was provided
  --json
```

Run the command and capture stdout as `MANIFEST_JSON`.

**On non-zero exit:**

- Exit code 1: show the stderr message to the user and stop.
- Exit code 2: show `Script error — see output above` and stop.

**Uncommitted changes warning:**

If `manifest.uncommitted_changes` is `true`, warn the user:

```
Warning: you have uncommitted changes ({dirty_files.length} files). They are NOT
included in this review diff. Commit or stash them first if you want them reviewed.
Continue? (yes/no)
```

Wait for confirmation before proceeding.

---

## Step 2 — Dry Run Check

If `--dry-run` was passed:

Format and display the review plan from the manifest:

```
Review Plan (dry run — no subagents dispatched)

  Base branch:    {manifest.base_branch}
  Changed files:  {manifest.git.changed_files.length}
  Dimensions:     {manifest.summary.active_dimensions} active, {manifest.summary.skipped_dimensions} skipped

| Dimension | Files | Severity | Status |
|-----------|-------|----------|--------|
...

Plan critique:
  - Uncovered files: {manifest.plan_critique.uncovered_files.join(', ') or "none"}
  - Over-broad:      {manifest.plan_critique.over_broad_dimensions.join(', ') or "none"}
```

Stop here.

---

## Step 3 — Spawn Orchestrator Agent

Locate the orchestrator agent definition:

```
**/sdlc-utilities/agents/review-orchestrator.md
```

Locate the reference templates:

```
**/reviewing-changes/REFERENCE.md
```

Spawn a single Agent (subagent_type: general-purpose) with the orchestrator agent's
instructions and this context embedded in the prompt:

```
MANIFEST_JSON: {the full JSON manifest from Step 1}
REFERENCE_MD_PATH: {the Glob path to REFERENCE.md}
```

Wait for the orchestrator to complete and return results.

---

## Step 4 — Report and Cleanup

Display the orchestrator's summary to the user.

Clean up the temp diff directory:

```bash
rm -rf {manifest.diff_dir}
```

---

## See Also

- `agents/review-orchestrator.md` — full orchestration logic
- `REFERENCE.md` — dimension format spec, subagent prompt template, comment template
- `EXAMPLES.md` — 5 ready-to-use example dimension files
- `sdlc:initializing-review-dimensions` — creates tailored dimensions for a project
```

**Step 2: Commit**

```bash
git add plugins/sdlc-utilities/skills/reviewing-changes/SKILL.md
git commit -m "feat: simplify reviewing-changes SKILL.md to 4-step orchestrator-delegating flow"
```

---

## Task 9: Update `REFERENCE.md`

Add manifest schema documentation and update the subagent prompt template with commit context.

**Files:**

- Modify: `plugins/sdlc-utilities/skills/reviewing-changes/REFERENCE.md`

**Step 1: Prepend a new Section 0 before the existing content**

At the very top of `REFERENCE.md`, before `## 1. Dimension File Format`, insert:

```markdown
## 0. JSON Manifest Schema

`review-prepare.js` outputs this JSON to stdout. The orchestrator agent reads it.

```json
{
  "version": 1,
  "timestamp": "ISO-8601",
  "base_branch": "main",
  "current_branch": "feat/xyz",
  "uncommitted_changes": false,
  "dirty_files": [],
  "git": {
    "commit_count": 5,
    "commit_log": "abc1234 feat: add widget\n...",
    "changed_files": ["src/a.ts", "src/b.ts"]
  },
  "pr": {
    "exists": true,
    "number": 42,
    "url": "https://github.com/owner/repo/pull/42",
    "owner": "owner",
    "repo": "repo"
  },
  "dimensions": [
    {
      "name": "security-review",
      "description": "...",
      "severity": "high",
      "requires_full_diff": false,
      "status": "ACTIVE",
      "matched_files": ["src/auth/login.ts"],
      "matched_count": 1,
      "truncated": false,
      "diff_file": "/tmp/sdlc-review-XXXXX/security-review.diff",
      "body": "# Security Review\n...",
      "file_context": [
        {
          "file": "src/auth/login.ts",
          "commits": [{ "hash": "abc1234", "subject": "feat: add OAuth2 flow" }]
        }
      ],
      "warnings": []
    }
  ],
  "plan_critique": {
    "uncovered_files": ["README.md"],
    "over_broad_dimensions": [],
    "overlapping_pairs": [],
    "dimension_cap_applied": false,
    "queued_dimensions": []
  },
  "summary": {
    "total_dimensions": 5,
    "active_dimensions": 3,
    "skipped_dimensions": 2,
    "queued_dimensions": 0,
    "total_changed_files": 12,
    "uncovered_file_count": 1
  },
  "diff_dir": "/tmp/sdlc-review-XXXXX"
}
```

`status` values: `ACTIVE`, `SKIPPED`, `TRUNCATED`, `QUEUED`

---
```

**Step 2: Update Section 2 — Subagent Prompt Template**

In the existing template (Section 2), add the commit context block and update the diff sourcing note.

After `## Changed Files in Your Scope` and before `## Diff to Review`, add:

```markdown
## Commit Context

Use these to understand the author's intent:

{for each entry in file_context where entry.commits.length > 0}
- `{entry.file}` — {entry.commits.map(c => `${c.hash}: ${c.subject}`).join('; ')}
{end for}
```

Change the diff sourcing note after `## Diff to Review` from:

```
{filtered diff — only hunks from matched files}
```

to:

```
{content of dimension.diff_file — pre-computed by review-prepare.js}
```

**Step 3: Commit**

```bash
git add plugins/sdlc-utilities/skills/reviewing-changes/REFERENCE.md
git commit -m "docs: add manifest schema and commit context to reviewing-changes REFERENCE.md"
```

---

## Task 10: Simplify the command + update architecture docs

**Files:**

- Modify: `plugins/sdlc-utilities/commands/review.md`
- Modify: `docs/architecture.md`

**Step 1: Replace the entire `review.md` content**

```markdown
---
description: Run multi-dimension code review on the current branch using project-defined review dimensions
allowed-tools: [Glob, Bash, Skill, Agent]
argument-hint: "[--base <branch>] [--dimensions <name,...>] [--dry-run]"
---

# /review Command

Invoke the `reviewing-changes` skill, passing all `$ARGUMENTS`.

All validation (git state, base branch detection, uncommitted changes warning,
dimension discovery) is handled by the `review-prepare.js` script inside the skill.
```

**Step 2: Update `docs/architecture.md` plugin structure section**

Find the `sdlc-utilities/` directory tree in the architecture doc and add `agents/`:

```text
plugins/
  sdlc-utilities/
    .claude-plugin/
      plugin.json
    agents/                           # Agent definitions (NEW)
      review-orchestrator.md
    skills/
      ...
    commands/
      ...
    hooks/
      hooks.json
    scripts/
      validate-dimensions.js
      review-prepare.js               # NEW
      lib/
        dimensions.js                 # NEW
```

Also update the prose description in the doc from:

> "each with their own skills, commands, hooks, and optionally scripts"

to:

> "each with their own skills, commands, hooks, scripts, and optionally agents"

**Step 3: Commit**

```bash
git add plugins/sdlc-utilities/commands/review.md docs/architecture.md
git commit -m "feat: simplify review command to thin passthrough; add agents/ to architecture docs"
```

---

## Task 11: End-to-End Verification

**Step 1: Validate shared lib extraction is still correct**

```bash
# Re-run against your test project from Task 1
node plugins/sdlc-utilities/scripts/validate-dimensions.js \
  --project-root /tmp/test-project --json | python3 -m json.tool
```

Expected: valid JSON with `"overall": "PASS"` (or warnings if expected).

**Step 2: Glob correctness spot check**

```bash
node -e "
const { globToRegex } = require('./plugins/sdlc-utilities/scripts/review-prepare.js');
const cases = [
  ['**/*.ts', 'src/widget.ts', true],
  ['**/*.ts', 'src/widget.js', false],
  ['**/auth/**', 'src/auth/login.ts', true],
  ['**/auth/**', 'src/utils/format.ts', false],
  ['**/*.test.*', 'src/auth/login.test.ts', true],
  ['**/*token*', 'src/utils/tokenHelper.ts', true],
];
let ok = true;
for (const [pat, file, exp] of cases) {
  const got = globToRegex(pat).test(file);
  if (got !== exp) { console.error('FAIL:', pat, file, got, '!==', exp); ok = false; }
}
if (ok) console.log('All glob cases pass');
"
```

Expected: `All glob cases pass`

**Step 3: Dry run on a real branch**

```bash
/sdlc:review --dry-run
```

Expected: Review plan table with dimension statuses, plan critique, no subagents dispatched.

**Step 4: Full review run**

```bash
/sdlc:review
```

Expected:

- Script runs fast (<2 seconds before first subagent)
- Orchestrator agent spawned (isolated context)
- Dimension subagents dispatched in parallel
- Findings critiqued and deduplicated
- PR comment posted (if PR exists) or options presented
- Temp directory cleaned up

**Step 5: Edge case — no dimensions**

```bash
# In a project without .claude/review-dimensions/
/sdlc:review
```

Expected: `No review dimensions found. Run /sdlc:review-init to create tailored review dimensions.`

**Step 6: Edge case — dimension filter**

```bash
/sdlc:review --dimensions security-review
```

Expected: only `security-review` dimension runs; others skipped.
