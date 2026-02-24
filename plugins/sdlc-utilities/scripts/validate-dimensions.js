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

const fs = require('node:fs');
const path = require('node:path');

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
      projectRoot = path.resolve(args[++i]);
    } else if (a === '--json') {
      outputFormat = 'json';
    } else if (a === '--markdown') {
      outputFormat = 'markdown';
    }
  }

  return { projectRoot, outputFormat };
}

// ---------------------------------------------------------------------------
// YAML frontmatter parser (no external deps)
// ---------------------------------------------------------------------------

/**
 * Extract raw frontmatter string from file content.
 * Returns null if no valid frontmatter block found.
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Extract body content (everything after the closing ---).
 */
function extractBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trim() : '';
}

/**
 * Parse a simple YAML string into an object.
 * Handles: strings, booleans, integers, inline arrays, multiline arrays.
 */
function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Skip empty lines
    if (!line.trim()) { i++; continue; }

    // Match key: value
    const kvMatch = line.match(/^(\S[^:]*?)\s*:\s*(.*)$/);
    if (!kvMatch) { i++; continue; }

    const key = kvMatch[1].trim();
    const rest = kvMatch[2].trim();

    if (rest === '') {
      // Multiline array — collect subsequent lines starting with '- '
      const arr = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s+/)) {
        arr.push(lines[i].replace(/^\s+-\s+/, '').trim());
        i++;
      }
      result[key] = arr;
      continue;
    }

    // Inline array: [val1, val2]
    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1);
      result[key] = inner.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      i++;
      continue;
    }

    // Boolean
    if (rest === 'true') { result[key] = true; i++; continue; }
    if (rest === 'false') { result[key] = false; i++; continue; }

    // Integer
    if (/^\d+$/.test(rest)) { result[key] = parseInt(rest, 10); i++; continue; }

    // String (strip optional quotes)
    result[key] = rest.replace(/^["']|["']$/g, '');
    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Glob syntax validation (lightweight — no minimatch)
// ---------------------------------------------------------------------------

function isValidGlob(pattern) {
  if (typeof pattern !== 'string') return false;
  if (!pattern.trim()) return false;
  // No triple stars
  if (/\*{3,}/.test(pattern)) return false;
  // Balanced brackets
  let depth = 0;
  for (const ch of pattern) {
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth < 0) return false; }
  }
  if (depth !== 0) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Known frontmatter fields
// ---------------------------------------------------------------------------

const KNOWN_FIELDS = new Set([
  'name', 'description', 'triggers', 'skip-when',
  'severity', 'max-files', 'requires-full-diff',
]);

const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);

// ---------------------------------------------------------------------------
// Validate a single dimension file
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

  // D1 — Frontmatter present
  const rawFm = extractFrontmatter(content);
  if (!rawFm) {
    errors.push({ check: 'D1', message: 'Missing YAML frontmatter block (--- delimiters)', line: null });
    return { errors, warnings, parsed: null };
  }

  const fm = parseSimpleYaml(rawFm);

  // D11 — Unknown fields (check before required-field checks so typo suggestions appear early)
  for (const key of Object.keys(fm)) {
    if (!KNOWN_FIELDS.has(key)) {
      // Simple typo suggestion
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

  // D2 — name
  if (!fm.name && fm.name !== 0) {
    errors.push({ check: 'D2', message: 'Missing required field: name', line: null });
  } else if (typeof fm.name !== 'string') {
    errors.push({ check: 'D2', message: 'Field "name" must be a string', line: null });
  } else if (!/^[a-z0-9-]+$/.test(fm.name)) {
    errors.push({ check: 'D2', message: `Field "name" must be lowercase letters, digits, and hyphens only (got: "${fm.name}")`, line: null });
  } else if (fm.name.length > 64) {
    errors.push({ check: 'D2', message: `Field "name" exceeds 64 characters (got: ${fm.name.length})`, line: null });
  }

  // D3 — description
  if (!fm.description) {
    errors.push({ check: 'D3', message: 'Missing required field: description', line: null });
  } else if (typeof fm.description !== 'string') {
    errors.push({ check: 'D3', message: 'Field "description" must be a string', line: null });
  } else if (fm.description.trim().length === 0) {
    errors.push({ check: 'D3', message: 'Field "description" must not be empty', line: null });
  } else if (fm.description.length > 256) {
    errors.push({ check: 'D3', message: `Field "description" exceeds 256 characters (got: ${fm.description.length})`, line: null });
  }

  // D4 — triggers
  if (!fm.triggers) {
    errors.push({ check: 'D4', message: 'Missing required field: triggers (must be a non-empty array of glob patterns)', line: null });
  } else if (!Array.isArray(fm.triggers)) {
    errors.push({ check: 'D4', message: 'Field "triggers" must be an array of strings', line: null });
  } else if (fm.triggers.length === 0) {
    errors.push({ check: 'D4', message: 'Field "triggers" must contain at least one pattern', line: null });
  } else {
    // D5 — glob syntax
    for (const pattern of fm.triggers) {
      if (!isValidGlob(pattern)) {
        errors.push({ check: 'D5', message: `Invalid glob pattern in triggers: "${pattern}"`, line: null });
      }
    }
  }

  // D6 — severity (optional)
  if (fm.severity !== undefined) {
    if (!VALID_SEVERITIES.has(fm.severity)) {
      warnings.push({ check: 'D6', message: `Field "severity" must be one of: critical, high, medium, low, info (got: "${fm.severity}")`, line: null });
    }
  }

  // D7 — max-files (optional)
  if (fm['max-files'] !== undefined) {
    if (!Number.isInteger(fm['max-files']) || fm['max-files'] <= 0) {
      warnings.push({ check: 'D7', message: `Field "max-files" must be a positive integer (got: ${JSON.stringify(fm['max-files'])})`, line: null });
    }
  }

  // D8 — skip-when (optional)
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

  // D9 — body non-empty
  const body = extractBody(content);
  if (body.length < 10) {
    errors.push({ check: 'D9', message: `Body must contain at least 10 characters of review instructions (got: ${body.length})`, line: null });
  }

  // D12 — requires-full-diff (optional)
  if (fm['requires-full-diff'] !== undefined) {
    if (typeof fm['requires-full-diff'] !== 'boolean') {
      warnings.push({ check: 'D12', message: `Field "requires-full-diff" must be a boolean (got: ${JSON.stringify(fm['requires-full-diff'])})`, line: null });
    }
  }

  return { errors, warnings, parsed: fm };
}

// ---------------------------------------------------------------------------
// Main validation runner
// ---------------------------------------------------------------------------

function validateAll(projectRoot) {
  const dimensionsDir = path.join(projectRoot, '.claude', 'review-dimensions');

  let files = [];
  try {
    const entries = fs.readdirSync(dimensionsDir);
    files = entries
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dimensionsDir, f));
  } catch (err) {
    // Directory doesn't exist — not an error for this script, just zero results
    files = [];
  }

  const results = [];
  const seenNames = new Map(); // name -> first file

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const { errors, warnings, parsed } = validateDimensionFile(filePath);
    const name = parsed ? parsed.name || null : null;

    // D10 — name uniqueness (cross-file check)
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
    summary: {
      total: results.length,
      pass: passCount,
      fail: failCount,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
    },
    overall,
  };
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

function formatJson(report) {
  return JSON.stringify(report, null, 2);
}

function padEnd(str, len) {
  return String(str).padEnd(len);
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

  // Overview table
  lines.push('## Dimension Status');
  lines.push('');
  lines.push('| Dimension | File | Errors | Warnings | Status |');
  lines.push('|-----------|------|--------|----------|--------|');
  for (const d of report.dimensions) {
    const name = d.name || '(unknown)';
    lines.push(`| ${name} | ${d.file} | ${d.errors.length} | ${d.warnings.length} | ${d.status} |`);
  }
  lines.push('');

  // Issues table (only if there are any)
  const allIssues = [];
  for (const d of report.dimensions) {
    for (const e of d.errors) {
      allIssues.push({ file: d.file, check: e.check, severity: 'ERROR', message: e.message });
    }
    for (const w of d.warnings) {
      allIssues.push({ file: d.file, check: w.check, severity: 'WARNING', message: w.message });
    }
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

  // Exit code: 0 = all pass or warnings only, 1 = errors found, 2 = script error
  if (report.summary.total_errors > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (err) {
  process.stderr.write(`validate-dimensions.js error: ${err.message}\n`);
  process.exit(2);
}
