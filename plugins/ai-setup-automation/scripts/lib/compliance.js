'use strict';

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Valid Claude Code built-in tools (from aisa-evolve-principles/SKILL.md)
// ---------------------------------------------------------------------------

const VALID_TOOLS = new Set([
  'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
  'WebFetch', 'WebSearch', 'TodoWrite', 'Skill', 'ToolSearch', 'Task',
]);

// ---------------------------------------------------------------------------
// Skill principle patterns (P1, P2, P3) — from aisa-evolve-validate/REFERENCE.md
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

const SKILL_PCIDCI_EXTRA_PATTERNS = [
  /critique/i,
  /verify.*before/i,
  /check.*pass/i,
];

// ---------------------------------------------------------------------------
// Agent principle patterns (A4, A5) — from aisa-evolve-validate/REFERENCE.md
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Capability-tool mapping (A3) — from aisa-evolve-principles/SKILL.md
// ---------------------------------------------------------------------------

// Each entry: capability keywords in body → required tool(s)
// Returns warnings (not hard failures) since capability words appear in many contexts.
const CAPABILITY_TOOL_MAP = [
  { patterns: [/\brun\b/i, /\bexecute\b/i, /\blint\b/i, /\bcompile\b/i], tools: ['Bash'], label: 'run/execute/lint/compile' },
  { patterns: [/\bsearch\s+web\b/i, /\blook\s+up\b/i], tools: ['WebSearch'], label: 'search web' },
  { patterns: [/\bfetch\s+url\b/i, /\bdownload\b/i], tools: ['WebFetch'], label: 'fetch URL' },
  { patterns: [/\bload\s+skill\b/i, /\binvoke\s+skill\b/i], tools: ['Skill'], label: 'load/invoke skill' },
];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function anyMatch(content, patterns) {
  return patterns.some(p => p.test(content));
}

// Strip frontmatter from content, returning only the body below the closing ---
function stripFrontmatter(content) {
  const fmMatch = content.match(/^---\n[\s\S]*?\n---\n/);
  return fmMatch ? content.slice(fmMatch[0].length) : content;
}

// ---------------------------------------------------------------------------
// Skill compliance — P1, P2, P3
// ---------------------------------------------------------------------------

function evaluateSkillCompliance(name, content) {
  const has_learning_capture = anyMatch(content, SKILL_LEARNING_PATTERNS);
  const has_quality_gates = anyMatch(content, SKILL_QUALITY_GATE_PATTERNS);
  const has_pcidci_workflow = has_quality_gates || anyMatch(content, SKILL_PCIDCI_EXTRA_PATTERNS);
  const exempt_from_gates = name.startsWith('openspec-');
  return { has_quality_gates, has_learning_capture, has_pcidci_workflow, exempt_from_gates };
}

// ---------------------------------------------------------------------------
// Agent compliance — A1 (frontmatter), A2 (tools)
// ---------------------------------------------------------------------------

function checkFrontmatterValid(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { pass: false, missing_fields: ['name', 'description', 'model'] };
  const fm = fmMatch[1];
  const required = ['name', 'description', 'model'];
  const missing = required.filter(field => !new RegExp(`^${field}\\s*:`, 'm').test(fm));
  return { pass: missing.length === 0, missing_fields: missing };
}

function checkToolsValid(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { pass: false, invalid_tools: [] };
  const fm = fmMatch[1];
  const toolsMatch = fm.match(/^tools\s*:\s*(.+)/m);
  if (!toolsMatch) return { pass: true, invalid_tools: [], omitted: true };
  const tools = toolsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
  const invalid = tools.filter(tool => {
    const base = tool.replace(/\s*\(.*\)/, '').trim();
    return !VALID_TOOLS.has(base);
  });
  return { pass: invalid.length === 0, invalid_tools: invalid };
}

// ---------------------------------------------------------------------------
// Agent compliance — A3 (capability-tool consistency)
// ---------------------------------------------------------------------------

/**
 * Check capability-tool consistency (A3).
 * Scans agent body (below frontmatter) for capability keywords.
 * Cross-references against declared tools.
 * Returns warnings only — not hard failures (per spec: "flag for review").
 */
function checkCapabilityToolConsistency(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const toolsMatch = fm.match(/^tools\s*:\s*(.+)/m);

  // If tools: is omitted, all tools are available — no capability mismatch possible
  if (!toolsMatch) return { pass: true, warnings: [], all_tools: true };

  const declaredTools = new Set(
    toolsMatch[1].split(',').map(t => t.replace(/\s*\(.*\)/, '').trim())
  );

  const body = stripFrontmatter(content);
  const warnings = [];

  for (const { patterns, tools, label } of CAPABILITY_TOOL_MAP) {
    if (anyMatch(body, patterns)) {
      const missing = tools.filter(t => !declaredTools.has(t));
      if (missing.length > 0) {
        warnings.push({ capability: label, expected_tools: tools, missing_tools: missing });
      }
    }
  }

  return { pass: warnings.length === 0, warnings };
}

// ---------------------------------------------------------------------------
// Agent compliance — A6 (skill references valid)
// ---------------------------------------------------------------------------

/**
 * Check that all .claude/skills/X and .claude/agents/X references in an
 * agent file resolve to real files on disk.
 */
function checkSkillReferencesValid(content, projectRoot) {
  const body = stripFrontmatter(content);
  // Match .claude/skills/<name> or .claude/agents/<name> with optional .md extension
  const refPattern = /\.claude\/(?:skills|agents)\/([a-zA-Z0-9_-]+(?:\.md)?)/g;
  const missing = [];
  let match;

  while ((match = refPattern.exec(body)) !== null) {
    const ref = match[0];
    const refPath = path.join(projectRoot, ref);
    const refPathMd = refPath.endsWith('.md') ? refPath : refPath + '.md';
    const refPathDir = refPath.endsWith('.md') ? refPath.slice(0, -3) : refPath;

    // Try: exact match, .md suffix, subdirectory with SKILL.md
    const exists = fs.existsSync(refPath)
      || fs.existsSync(refPathMd)
      || fs.existsSync(path.join(refPathDir, 'SKILL.md'))
      || fs.existsSync(path.join(refPathDir, 'AGENT.md'));

    if (!exists) {
      missing.push(ref);
    }
  }

  // Deduplicate
  const uniqueMissing = [...new Set(missing)];
  return { pass: uniqueMissing.length === 0, missing: uniqueMissing };
}

// ---------------------------------------------------------------------------
// Full agent compliance evaluation (A1-A5)
// ---------------------------------------------------------------------------

function evaluateAgentCompliance(content) {
  return {
    frontmatter_valid: checkFrontmatterValid(content).pass,
    tools_valid: checkToolsValid(content).pass,
    has_self_review: anyMatch(content, AGENT_SELF_REVIEW_PATTERNS),
    has_learning_capture: anyMatch(content, AGENT_LEARNING_PATTERNS),
  };
}

// ---------------------------------------------------------------------------
// Skill structure validation — S1-S5
// ---------------------------------------------------------------------------

/**
 * Validate skill file structure and frontmatter.
 * Checks S1 (layout), S2 (frontmatter), S3 (name), S4 (description), S5 (line count).
 * @param {string} name - Skill name (directory name or filename without .md)
 * @param {string} content - File content
 * @param {string} layout - 'flat' | 'nested' (from discoverSkillFiles)
 */
function checkSkillStructure(name, content, layout) {
  const issues = [];

  // Guard: if layout is undefined (caller didn't originate from discoverSkillFiles),
  // skip S1 check rather than produce a spurious failure
  const s1_layout_valid = layout !== undefined ? layout === 'nested' : true;
  if (layout !== undefined && !s1_layout_valid) {
    issues.push({
      check: 'S1',
      message: `Skill uses flat file layout (${name}.md) instead of required directory layout (${name}/SKILL.md)`,
      proposed_fix: `Move ${name}.md into a directory: mkdir .claude/skills/${name} && mv .claude/skills/${name}.md .claude/skills/${name}/SKILL.md`,
    });
  }

  // S2: Frontmatter present
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const s2_frontmatter_present = !!fmMatch;
  if (!s2_frontmatter_present) {
    issues.push({
      check: 'S2',
      message: 'Skill file has no YAML frontmatter',
      proposed_fix: 'Add frontmatter at top of SKILL.md: ---\\nname: <skill-name>\\ndescription: "<one-line description>"\\n---',
    });
  }

  const fm = fmMatch ? fmMatch[1] : '';

  // S3: name field — present, lowercase-hyphens only, max 64 chars
  const nameMatch = fm.match(/^name\s*:\s*(.+)/m);
  const nameVal = nameMatch ? nameMatch[1].trim() : null;
  const s3_name_valid = !!(nameVal && /^[a-z0-9-]+$/.test(nameVal) && nameVal.length <= 64);
  if (!nameVal) {
    issues.push({
      check: 'S3',
      message: 'Frontmatter missing `name` field',
      proposed_fix: `Add 'name: ${name}' to frontmatter`,
    });
  } else if (!/^[a-z0-9-]+$/.test(nameVal)) {
    issues.push({
      check: 'S3',
      message: `Frontmatter 'name' field contains invalid characters: '${nameVal}' (must be lowercase letters, digits, hyphens only)`,
      proposed_fix: `Change name to: ${nameVal.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
    });
  } else if (nameVal.length > 64) {
    issues.push({
      check: 'S3',
      message: `Frontmatter 'name' field too long: ${nameVal.length} chars (max 64)`,
      proposed_fix: 'Shorten the name field to 64 characters or fewer',
    });
  }

  // S4: description field — present, max 1024 chars
  const descMatch = fm.match(/^description\s*:\s*(.+)/m);
  const descVal = descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, '') : null;
  const s4_description_valid = !!(descVal && descVal.length <= 1024);
  if (!descVal) {
    issues.push({
      check: 'S4',
      message: 'Frontmatter missing `description` field',
      proposed_fix: `Add 'description: "<one-line description of what this skill does>"' to frontmatter`,
    });
  } else if (descVal.length > 1024) {
    issues.push({
      check: 'S4',
      message: `Frontmatter 'description' too long: ${descVal.length} chars (max 1024)`,
      proposed_fix: 'Shorten the description field to 1024 characters or fewer',
    });
  }

  // S5: Line count — max 500 lines
  const lineCount = content.split('\n').length;
  const s5_line_count_valid = lineCount <= 500;
  if (!s5_line_count_valid) {
    issues.push({
      check: 'S5',
      message: `SKILL.md exceeds 500 lines: ${lineCount} lines`,
      proposed_fix: 'Extract detailed reference material into a REFERENCE.md file in the same directory and link to it from SKILL.md',
    });
  }

  return {
    checks: {
      s1_layout_valid,
      s2_frontmatter_present,
      s3_name_valid,
      s4_description_valid,
      s5_line_count_valid,
      line_count: lineCount,
    },
    issues,
  };
}

// ---------------------------------------------------------------------------
// Skill competency overlap detection
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every',
  'this', 'that', 'these', 'those', 'it', 'its', 'use', 'using', 'used', 'any', 'all',
  'run', 'runs', 'running', 'add', 'adds', 'adding', 'when', 'how', 'what', 'which',
]);

/**
 * Extract keywords from a skill's description and first-level headings.
 */
function extractSkillKeywords(content) {
  const words = new Set();
  // From frontmatter description
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const descMatch = fm.match(/^description\s*:\s*(.+)/m);
  if (descMatch) {
    descMatch[1].toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).forEach(w => words.add(w));
  }
  // From h2 headings
  const headings = content.match(/^## .+/gm) || [];
  for (const h of headings) {
    h.replace(/^## /, '').toLowerCase().split(/\W+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).forEach(w => words.add(w));
  }
  return words;
}

/**
 * Detect competency overlap between skills using Jaccard similarity on keywords.
 * @param {Array<{name: string, content: string}>} skills
 * @returns {{ pairs: Array<{skill_a, skill_b, overlap_score, shared_keywords}> }}
 */
function detectSkillOverlap(skills) {
  const OVERLAP_THRESHOLD = 0.4;
  const pairs = [];

  const keywordSets = skills.map(s => ({ name: s.name, keywords: extractSkillKeywords(s.content) }));

  for (let i = 0; i < keywordSets.length; i++) {
    for (let j = i + 1; j < keywordSets.length; j++) {
      const a = keywordSets[i];
      const b = keywordSets[j];
      if (a.keywords.size === 0 || b.keywords.size === 0) continue;

      const intersection = [...a.keywords].filter(k => b.keywords.has(k));
      const union = new Set([...a.keywords, ...b.keywords]);
      const score = intersection.length / union.size;

      if (score >= OVERLAP_THRESHOLD) {
        pairs.push({
          skill_a: a.name,
          skill_b: b.name,
          overlap_score: Math.round(score * 100) / 100,
          shared_keywords: intersection.sort(),
        });
      }
    }
  }

  return { pairs };
}

module.exports = {
  VALID_TOOLS,
  SKILL_LEARNING_PATTERNS,
  SKILL_QUALITY_GATE_PATTERNS,
  SKILL_PCIDCI_EXTRA_PATTERNS,
  AGENT_SELF_REVIEW_PATTERNS,
  AGENT_LEARNING_PATTERNS,
  anyMatch,
  stripFrontmatter,
  evaluateSkillCompliance,
  evaluateAgentCompliance,
  checkFrontmatterValid,
  checkToolsValid,
  checkCapabilityToolConsistency,
  checkSkillReferencesValid,
  checkSkillStructure,
  detectSkillOverlap,
};
