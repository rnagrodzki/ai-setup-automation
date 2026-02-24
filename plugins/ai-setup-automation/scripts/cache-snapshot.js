#!/usr/bin/env node
/**
 * cache-snapshot.js
 * Generates .claude/cache/snapshot.json for the aisa-evolve-cache skill.
 *
 * Usage:
 *   node cache-snapshot.js [rebuild|status|invalidate] [--project-root <path>]
 *
 * Modes:
 *   rebuild   (default) — Full rebuild of snapshot.json
 *   status              — Report cache freshness without modifying anything
 *   invalidate          — Delete cache files, force full scan on next run
 *
 * Uses only Node.js built-in modules. No npm install required.
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  let mode = 'rebuild';
  let projectRoot = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-root' && args[i + 1]) {
      projectRoot = path.resolve(args[++i]);
    } else if (['rebuild', 'status', 'invalidate'].includes(args[i])) {
      mode = args[i];
    }
  }

  return { mode, projectRoot };
}

// ---------------------------------------------------------------------------
// Hashing utilities
// ---------------------------------------------------------------------------

function hashBuffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function hashString(str) {
  return crypto.createHash('sha256').update(str, 'utf-8').digest('hex');
}

function safeHashFile(filePath) {
  try {
    return hashBuffer(fs.readFileSync(filePath));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    process.stderr.write(`Warning: Cannot read ${filePath}: ${e.message}\n`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// File metadata
// ---------------------------------------------------------------------------

function getFileMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stat = fs.statSync(filePath);
  return {
    lines: content.split('\n').length,
    mtime: stat.mtime.toISOString(),
    content,
  };
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------


/**
 * Discover skill files from .claude/skills/.
 * Handles two layouts:
 *   - Flat:   .claude/skills/<name>.md           → key = name
 *   - Nested: .claude/skills/<name>/SKILL.md     → key = <directory name>
 *
 * Supporting files inside skill subdirectories (README.md, etc.) are skipped.
 * REFERENCE.md files inside any skill subdirectory are excluded.
 */
function discoverSkillFiles(projectRoot) {
  const skillsDir = path.join(projectRoot, '.claude', 'skills');
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch (e) {
    return results;
  }

  for (const entry of entries) {
    const full = path.join(skillsDir, entry.name);
    if (entry.isFile() && entry.name.endsWith('.md')) {
      // Flat layout: .claude/skills/foo.md
      results.push({
        name: path.basename(entry.name, '.md'),
        relativePath: path.relative(projectRoot, full).replace(/\\/g, '/'),
        absolutePath: full,
      });
    } else if (entry.isDirectory()) {
      // Nested layout: .claude/skills/foo/SKILL.md — key is the directory name
      const skillMd = path.join(full, 'SKILL.md');
      if (fs.existsSync(skillMd)) {
        results.push({
          name: entry.name,
          relativePath: path.relative(projectRoot, skillMd).replace(/\\/g, '/'),
          absolutePath: skillMd,
        });
      }
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Discover agent files from .claude/agents/.
 * Handles the same flat/nested layouts as skills.
 */
function discoverAgentFiles(projectRoot) {
  const agentsDir = path.join(projectRoot, '.claude', 'agents');
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(agentsDir, { withFileTypes: true });
  } catch (e) {
    return results;
  }

  for (const entry of entries) {
    const full = path.join(agentsDir, entry.name);
    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push({
        name: path.basename(entry.name, '.md'),
        relativePath: path.relative(projectRoot, full).replace(/\\/g, '/'),
        absolutePath: full,
      });
    } else if (entry.isDirectory()) {
      const agentMd = path.join(full, 'AGENT.md');
      const fallbackMd = path.join(full, entry.name + '.md');
      const primary = fs.existsSync(agentMd) ? agentMd
        : fs.existsSync(fallbackMd) ? fallbackMd
        : null;
      if (primary) {
        results.push({
          name: entry.name,
          relativePath: path.relative(projectRoot, primary).replace(/\\/g, '/'),
          absolutePath: primary,
        });
      }
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Principle compliance — skills (P1, P2, P3)
// ---------------------------------------------------------------------------

const SKILL_LEARNING_PATTERNS = [
  /learnings\/log\.md/i,
  /learning\s+capture/i,
  /capture.*learnings/i,
  /learnings.*capture/i,
];

const SKILL_QUALITY_GATE_PATTERNS = [
  /quality\s+gates?/i,
  /pass\s+criteria/i,
  /fail\s+action/i,
  /self-review/i,
  /critique.*before/i,
  /review.*before.*deliver/i,
];

const SKILL_PDCI_EXTRA_PATTERNS = [
  /critique/i,
  /verify.*before/i,
  /check.*pass/i,
];

function anyMatch(content, patterns) {
  return patterns.some(p => p.test(content));
}

function evaluateSkillCompliance(name, content) {
  const has_learning_capture = anyMatch(content, SKILL_LEARNING_PATTERNS);
  const has_quality_gates = anyMatch(content, SKILL_QUALITY_GATE_PATTERNS);
  // P3 is satisfied by quality gates, or by PDCI-indicating patterns
  const has_pdci_workflow = has_quality_gates || anyMatch(content, SKILL_PDCI_EXTRA_PATTERNS);
  const exempt_from_gates = name.startsWith('openspec-');

  return { has_quality_gates, has_learning_capture, has_pdci_workflow, exempt_from_gates };
}

// ---------------------------------------------------------------------------
// Principle compliance — agents (A1, A2, A4, A5)
// ---------------------------------------------------------------------------

const VALID_TOOLS = new Set([
  'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
  'WebFetch', 'WebSearch', 'TodoWrite', 'Skill', 'ToolSearch', 'Task',
]);

function checkFrontmatterValid(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  const fm = fmMatch[1];
  return ['name', 'description', 'model', 'tools'].every(field =>
    new RegExp(`^${field}\\s*:`, 'm').test(fm)
  );
}

function checkToolsValid(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return false;
  const fm = fmMatch[1];
  const toolsMatch = fm.match(/^tools\s*:\s*(.+)/m);
  if (!toolsMatch) return false;
  const tools = toolsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  return tools.every(tool => {
    // Handle Task(worker, researcher) syntax
    const base = tool.replace(/\s*\(.*\)/, '').trim();
    return VALID_TOOLS.has(base);
  });
}

const AGENT_SELF_REVIEW_PATTERNS = [
  /self-review/i,
  /review.*before.*deliver/i,
  /critique.*before/i,
  /quality\s+gate/i,
  /validate.*output/i,
  /re-read.*output/i,
  /check.*pass.*criteria/i,
];

const AGENT_LEARNING_PATTERNS = [
  /learning\s+capture/i,
  /learnings\/log\.md/i,
];

function evaluateAgentCompliance(content) {
  return {
    frontmatter_valid: checkFrontmatterValid(content),
    tools_valid: checkToolsValid(content),
    has_self_review: anyMatch(content, AGENT_SELF_REVIEW_PATTERNS),
    has_learning_capture: anyMatch(content, AGENT_LEARNING_PATTERNS),
  };
}

// ---------------------------------------------------------------------------
// Learnings log
// ---------------------------------------------------------------------------

function countLearningEntries(projectRoot) {
  const logPath = path.join(projectRoot, '.claude', 'learnings', 'log.md');
  const sha256 = safeHashFile(logPath);
  if (!sha256) {
    return { total_entries: 0, active: 0, promoted: 0, stale: 0, sha256: null };
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  // Match **Status**: ACTIVE / PROMOTED[:target] / STALE
  const pattern = /\*\*Status\*\*\s*:\s*(ACTIVE|PROMOTED[^\n]*|STALE)/gi;
  let active = 0, promoted = 0, stale = 0;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const status = match[1].toUpperCase();
    if (status === 'ACTIVE') active++;
    else if (status.startsWith('PROMOTED')) promoted++;
    else if (status === 'STALE') stale++;
  }

  return { total_entries: active + promoted + stale, active, promoted, stale, sha256 };
}

// ---------------------------------------------------------------------------
// Project indicators
// ---------------------------------------------------------------------------

function walkDirMaxDepth(dir, maxDepth, depth = 0) {
  const results = [];
  if (depth >= maxDepth) return results;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    results.push(full);
    if (entry.isDirectory()) {
      results.push(...walkDirMaxDepth(full, maxDepth, depth + 1));
    }
  }
  return results;
}

function hashDirectoryListing(dirs) {
  const entries = [];
  for (const dir of dirs) {
    try {
      const names = fs.readdirSync(dir).sort();
      entries.push(...names.map(n => path.join(dir, n)));
    } catch (e) {
      // directory does not exist — skip
    }
  }
  if (entries.length === 0) return null;
  return hashString(entries.sort().join('\n'));
}

function hashSrcListing(projectRoot) {
  const srcDir = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcDir)) return null;
  const files = walkDirMaxDepth(srcDir, 2).sort();
  if (files.length === 0) return null;
  return hashString(files.join('\n'));
}

function hashProjectIndicators(projectRoot) {
  return {
    go_mod_hash: safeHashFile(path.join(projectRoot, 'go.mod')),
    package_json_hash: safeHashFile(path.join(projectRoot, 'package.json')),
    spec_dir_hash: hashDirectoryListing([
      path.join(projectRoot, 'specs'),
      path.join(projectRoot, 'openspec'),
    ]),
    src_dir_listing_hash: hashSrcListing(projectRoot),
  };
}

function projectRootHash(projectRoot) {
  try {
    const output = execSync('ls -la', { cwd: projectRoot, encoding: 'utf-8' });
    const sorted = output.split('\n').sort().join('\n');
    return hashString(sorted);
  } catch (e) {
    // Fallback: hash sorted file/dir names only
    const entries = fs.readdirSync(projectRoot).sort().join('\n');
    return hashString(entries);
  }
}

// ---------------------------------------------------------------------------
// REBUILD mode
// ---------------------------------------------------------------------------

function rebuildMode(projectRoot) {
  const skills = discoverSkillFiles(projectRoot);
  const agents = discoverAgentFiles(projectRoot);

  const skillsSection = {};
  for (const skill of skills) {
    let meta, compliance;
    try {
      meta = getFileMetadata(skill.absolutePath);
      compliance = evaluateSkillCompliance(skill.name, meta.content);
    } catch (e) {
      process.stderr.write(`Warning: Cannot process skill ${skill.name}: ${e.message}\n`);
      continue;
    }
    skillsSection[skill.name] = {
      path: skill.relativePath,
      sha256: hashBuffer(fs.readFileSync(skill.absolutePath)),
      lines: meta.lines,
      mtime: meta.mtime,
      ...compliance,
    };
  }

  const agentsSection = {};
  for (const agent of agents) {
    let meta, compliance;
    try {
      meta = getFileMetadata(agent.absolutePath);
      compliance = evaluateAgentCompliance(meta.content);
    } catch (e) {
      process.stderr.write(`Warning: Cannot process agent ${agent.name}: ${e.message}\n`);
      continue;
    }
    agentsSection[agent.name] = {
      path: agent.relativePath,
      sha256: hashBuffer(fs.readFileSync(agent.absolutePath)),
      lines: meta.lines,
      mtime: meta.mtime,
      ...compliance,
    };
  }

  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  const claudeMd = fs.existsSync(claudeMdPath)
    ? { sha256: safeHashFile(claudeMdPath), mtime: fs.statSync(claudeMdPath).mtime.toISOString() }
    : { sha256: null, mtime: null };

  const snapshot = {
    generated_at: new Date().toISOString(),
    generated_by: 'aisa-evolve-cache',
    project_root_hash: projectRootHash(projectRoot),
    skills: skillsSection,
    agents: agentsSection,
    claude_md: claudeMd,
    learnings_log: countLearningEntries(projectRoot),
    project_indicators: hashProjectIndicators(projectRoot),
  };

  const cacheDir = path.join(projectRoot, '.claude', 'cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    path.join(cacheDir, 'snapshot.json'),
    JSON.stringify(snapshot, null, 2) + '\n'
  );

  console.log(
    `Cache rebuilt: ${Object.keys(skillsSection).length} skills, ` +
    `${Object.keys(agentsSection).length} agents → .claude/cache/snapshot.json`
  );
}

// ---------------------------------------------------------------------------
// STATUS mode
// ---------------------------------------------------------------------------

function formatAge(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function statusMode(projectRoot) {
  const cacheDir = path.join(projectRoot, '.claude', 'cache');
  const snapshotPath = path.join(cacheDir, 'snapshot.json');
  const driftPath = path.join(cacheDir, 'drift-report.json');

  const snapshotExists = fs.existsSync(snapshotPath);
  const driftExists = fs.existsSync(driftPath);

  console.log('## Cache Status\n');

  if (!snapshotExists) {
    console.log('- snapshot.json: MISSING');
    console.log(`- drift-report.json: ${driftExists ? 'EXISTS' : 'MISSING'}`);
    console.log('\n### Recommendation\nSTALE — full rebuild recommended');
    return;
  }

  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  } catch (e) {
    console.log('- snapshot.json: EXISTS but CORRUPT — full rebuild recommended');
    console.log(`- drift-report.json: ${driftExists ? 'EXISTS' : 'MISSING'}`);
    return;
  }

  const age = Date.now() - new Date(snapshot.generated_at).getTime();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

  let driftAge = 'MISSING';
  if (driftExists) {
    try {
      const drift = JSON.parse(fs.readFileSync(driftPath, 'utf-8'));
      driftAge = `age: ${formatAge(Date.now() - new Date(drift.generated_at).getTime())}`;
    } catch (e) {
      driftAge = 'EXISTS (unreadable)';
    }
  }

  console.log(`- snapshot.json: EXISTS — age: ${formatAge(age)}`);
  console.log(`- drift-report.json: ${driftExists ? `EXISTS — ${driftAge}` : 'MISSING'}`);

  // Compare hashes
  const currentSkills = discoverSkillFiles(projectRoot);
  const currentAgents = discoverAgentFiles(projectRoot);
  const cachedSkillNames = new Set(Object.keys(snapshot.skills || {}));
  const cachedAgentNames = new Set(Object.keys(snapshot.agents || {}));

  let staleSkills = 0;
  for (const skill of currentSkills) {
    const current = safeHashFile(skill.absolutePath);
    const cached = snapshot.skills?.[skill.name]?.sha256;
    if (!cached || cached !== current) staleSkills++;
  }
  const newSkills = currentSkills.filter(s => !cachedSkillNames.has(s.name)).length;
  const deletedSkills = [...cachedSkillNames].filter(
    n => !currentSkills.some(s => s.name === n)
  ).length;

  let staleAgents = 0;
  for (const agent of currentAgents) {
    const current = safeHashFile(agent.absolutePath);
    const cached = snapshot.agents?.[agent.name]?.sha256;
    if (!cached || cached !== current) staleAgents++;
  }

  const currentIndicators = hashProjectIndicators(projectRoot);
  let indicatorsChanged = 0;
  for (const [key, value] of Object.entries(currentIndicators)) {
    if (value !== (snapshot.project_indicators?.[key] ?? null)) indicatorsChanged++;
  }

  console.log(
    `- Skills cached: ${cachedSkillNames.size} / ${currentSkills.length} on disk` +
    (staleSkills > 0 ? ` — ${staleSkills} stale (hash mismatch)` : '') +
    (newSkills > 0 ? `, ${newSkills} new` : '') +
    (deletedSkills > 0 ? `, ${deletedSkills} deleted` : '')
  );
  console.log(
    `- Agents cached: ${cachedAgentNames.size} / ${currentAgents.length} on disk` +
    (staleAgents > 0 ? ` — ${staleAgents} stale` : '')
  );
  console.log(`- Project indicators: ${indicatorsChanged} changed since snapshot`);

  console.log('\n### Recommendation');
  if (age > twoWeeksMs) {
    console.log('STALE — cache older than 2 weeks, full rebuild recommended');
  } else if (staleSkills === 0 && staleAgents === 0 && newSkills === 0 && indicatorsChanged === 0) {
    console.log('FRESH — no rebuild needed');
  } else if (staleSkills + staleAgents + newSkills < 5) {
    console.log('PARTIALLY STALE — incremental scan sufficient');
  } else {
    console.log('STALE — full rebuild recommended');
  }
}

// ---------------------------------------------------------------------------
// INVALIDATE mode
// ---------------------------------------------------------------------------

function invalidateMode(projectRoot) {
  const cacheDir = path.join(projectRoot, '.claude', 'cache');
  let deleted = 0;
  for (const file of ['snapshot.json', 'drift-report.json']) {
    const filePath = path.join(cacheDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  }
  if (deleted > 0) {
    console.log(`Cache invalidated (${deleted} file${deleted > 1 ? 's' : ''} deleted). Next aisa-evolve run will do a full scan.`);
  } else {
    console.log('Nothing to invalidate — no cache files found.');
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  const { mode, projectRoot } = parseArgs(process.argv);

  if (!fs.existsSync(projectRoot)) {
    process.stderr.write(`Error: project root does not exist: ${projectRoot}\n`);
    process.exit(1);
  }

  switch (mode) {
    case 'rebuild':
      rebuildMode(projectRoot);
      break;
    case 'status':
      statusMode(projectRoot);
      break;
    case 'invalidate':
      invalidateMode(projectRoot);
      break;
    default:
      process.stderr.write(`Unknown mode: ${mode}\n`);
      process.exit(1);
  }
}

main();
