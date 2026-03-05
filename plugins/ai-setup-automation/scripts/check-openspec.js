#!/usr/bin/env node
/**
 * check-openspec.js
 * Checks openspec CLI availability, version, and project initialization.
 *
 * Usage:
 *   node check-openspec.js [options]
 *
 * Options:
 *   --project-root <path>   Project root to inspect (default: cwd)
 *   --json                  Structured JSON output to stdout (default)
 *   --brief                 Single-line human-readable status for hook output
 *
 * Exit codes: 0 = all good, 1 = issues found, 2 = script error
 *
 * Uses only Node.js built-in modules. No npm install required.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  let projectRoot = process.cwd();
  let outputFormat = 'json';

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--project-root') {
      if (!args[i + 1]) {
        process.stderr.write('Error: --project-root requires a value\n');
        process.exit(2);
      }
      projectRoot = path.resolve(args[++i]);
    } else if (a === '--json') {
      outputFormat = 'json';
    } else if (a === '--brief') {
      outputFormat = 'brief';
    }
  }

  return { projectRoot, outputFormat };
}

// ---------------------------------------------------------------------------
// CLI availability check
// ---------------------------------------------------------------------------

function checkCliInstalled() {
  try {
    const output = execSync('openspec --version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const version = output.trim();
    return { cli_installed: true, cli_version: version || null };
  } catch (e) {
    return { cli_installed: false, cli_version: null };
  }
}

// ---------------------------------------------------------------------------
// Latest version check (with cache)
// ---------------------------------------------------------------------------

const VERSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadVersionCache(projectRoot) {
  const cachePath = path.join(projectRoot, '.claude', 'cache', 'openspec-version.json');
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8');
    const data = JSON.parse(raw);
    if (
      data &&
      typeof data.version === 'string' &&
      typeof data.checked_at === 'number'
    ) {
      return data;
    }
  } catch (e) {
    // file missing or malformed — ignore
  }
  return null;
}

function writeVersionCache(projectRoot, version) {
  const cacheDir = path.join(projectRoot, '.claude', 'cache');
  // Only write if the cache directory already exists — do not create it.
  if (!fs.existsSync(cacheDir)) return;
  const cachePath = path.join(cacheDir, 'openspec-version.json');
  try {
    fs.writeFileSync(
      cachePath,
      JSON.stringify({ version, checked_at: Date.now() }, null, 2) + '\n',
      'utf-8'
    );
  } catch (e) {
    // non-fatal — cache write failure should not abort the script
  }
}

function fetchLatestVersion(projectRoot) {
  // Check cache first
  const cached = loadVersionCache(projectRoot);
  if (cached && Date.now() - cached.checked_at < VERSION_CACHE_TTL_MS) {
    return cached.version;
  }

  // Fetch from npm registry
  try {
    const output = execSync('npm show @fission-ai/openspec version', {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const version = output.trim();
    if (version) {
      writeVersionCache(projectRoot, version);
      return version;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Semver comparison
// ---------------------------------------------------------------------------

/**
 * Compare two semver strings.
 * Returns true if `latest` is strictly newer than `current`, false otherwise.
 * Returns null if either version cannot be parsed.
 */
function isUpdateAvailable(current, latest) {
  if (!current || !latest) return null;

  function parseParts(v) {
    // Strip any leading 'v'
    const clean = v.replace(/^v/, '');
    const parts = clean.split('.').map(p => parseInt(p, 10));
    if (parts.length < 1 || parts.some(isNaN)) return null;
    return parts;
  }

  const cur = parseParts(current);
  const lat = parseParts(latest);
  if (!cur || !lat) return null;

  const len = Math.max(cur.length, lat.length);
  for (let i = 0; i < len; i++) {
    const c = cur[i] || 0;
    const l = lat[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false; // equal
}

// ---------------------------------------------------------------------------
// Project initialization check
// ---------------------------------------------------------------------------

/**
 * Check whether openspec has been initialized in the project.
 * Returns { project_initialized: bool, openspec_dir: string|null, specs_dir: string|null }
 */
function checkProjectInitialized(projectRoot) {
  // Canonical openspec init directory
  const openspecDir = path.join(projectRoot, '.openspec');
  const openspecInitialized = fs.existsSync(openspecDir) && fs.statSync(openspecDir).isDirectory();

  // Additional specs directories to check
  const specsDirCandidates = ['specs', 'openspec', 'spec', 'docs/specs', 'documentation'];
  let specsDir = null;
  for (const candidate of specsDirCandidates) {
    const full = path.join(projectRoot, candidate);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      specsDir = full;
      break;
    }
  }

  return {
    project_initialized: openspecInitialized,
    openspec_dir: openspecInitialized ? openspecDir : null,
    specs_dir: specsDir,
  };
}

// ---------------------------------------------------------------------------
// Suggestions builder
// ---------------------------------------------------------------------------

function buildSuggestions({ cli_installed, update_available, project_initialized, latest_version }) {
  const suggestions = [];

  if (!cli_installed) {
    suggestions.push({
      action: 'install',
      message: 'openspec not found. Install with: npm install -g @fission-ai/openspec',
    });
  }

  if (cli_installed && !project_initialized) {
    suggestions.push({
      action: 'init',
      message: 'Project not initialized. Run: openspec init --tools claude',
    });
  }

  if (update_available && latest_version) {
    suggestions.push({
      action: 'update',
      message: `Update available (${latest_version}). Run: npm install -g @fission-ai/openspec@latest`,
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Output renderers
// ---------------------------------------------------------------------------

function renderBrief({ cli_installed, cli_version, latest_version, update_available, project_initialized, suggestions }) {
  if (!cli_installed) {
    return 'openspec: not installed';
  }

  const parts = [];
  const displayVersion = cli_version.replace(/^v/, '');
  parts.push(`v${displayVersion} installed`);

  if (project_initialized) {
    parts.push('project initialized');
  } else {
    parts.push('project not initialized');
  }

  if (update_available === true && latest_version) {
    parts.push(`update available (${latest_version})`);
  } else if (update_available === false) {
    parts.push('up to date');
  }
  // update_available === null means we could not determine — omit

  return `openspec: ${parts.join(', ')}`;
}

// ---------------------------------------------------------------------------
// Main logic
// ---------------------------------------------------------------------------

function run(opts) {
  const { projectRoot, outputFormat } = opts;

  if (!fs.existsSync(projectRoot)) {
    process.stderr.write(`Error: project root does not exist: ${projectRoot}\n`);
    process.exit(2);
  }

  // 1. CLI availability
  const { cli_installed, cli_version } = checkCliInstalled();

  // 2. Latest version (always attempt, even if CLI not installed)
  const latest_version = fetchLatestVersion(projectRoot);

  // 3. Version comparison
  const update_available = isUpdateAvailable(cli_version, latest_version);

  // 4. Project initialization
  const { project_initialized, openspec_dir, specs_dir } = checkProjectInitialized(projectRoot);

  // 5. Suggestions
  const suggestions = buildSuggestions({
    cli_installed,
    update_available,
    project_initialized,
    latest_version,
  });

  const result = {
    cli_installed,
    cli_version,
    latest_version,
    update_available,
    project_initialized,
    openspec_dir,
    specs_dir,
    suggestions,
  };

  if (outputFormat === 'brief') {
    process.stdout.write(renderBrief(result) + '\n');
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }

  // Exit 1 if any issues, 0 if all good
  const hasIssues = !cli_installed || !project_initialized || update_available === true;
  process.exit(hasIssues ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (e) {
    process.stderr.write(`Error parsing arguments: ${e.message}\n`);
    process.exit(2);
  }

  try {
    run(opts);
  } catch (e) {
    process.stderr.write(`Unexpected error: ${e.message}\n`);
    process.exit(2);
  }
}

main();
