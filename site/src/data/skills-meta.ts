export type StepType = 'script' | 'llm' | 'critique' | 'user' | 'dispatch' | 'verify';
export type SkillCategory = 'essentials' | 'analysis' | 'utilities';

export interface PipelineStep {
  id: string;
  label: string;
  type: StepType;
  description?: string;
}

export interface SkillConnection {
  to: string;
  label: string;
}

export interface SkillMeta {
  slug: string;
  command: string;
  category: SkillCategory;
  userInvocable: boolean;
  tagline: string;
  pipeline: PipelineStep[];
  connections: SkillConnection[];
}

export const skillsMeta: SkillMeta[] = [
  // ── essentials ────────────────────────────────────────────────────────
  {
    slug: 'init',
    command: '/aisa-init',
    category: 'essentials',
    userInvocable: true,
    tagline:
      'Detects your tech stack and scaffolds a complete .claude/ configuration from scratch.',
    pipeline: [
      {
        id: 'discovery',
        label: 'Scan project structure',
        type: 'script',
        description:
          'Reads package.json, configs, directory tree, existing specs',
      },
      {
        id: 'design',
        label: 'Design architecture',
        type: 'llm',
        description:
          'Proposes skills and agents across technical, business, and design domains',
      },
      {
        id: 'critique-design',
        label: 'Critique architecture',
        type: 'critique',
        description:
          'Verifies specificity, domain coverage, principle compliance',
      },
      {
        id: 'generate',
        label: 'Generate all files',
        type: 'dispatch',
        description:
          'Produces skills, agents, learnings journal, and CLAUDE.md',
      },
      {
        id: 'critique-output',
        label: 'Critique output',
        type: 'critique',
        description:
          'Checks P1-P3 and A1-A6 compliance on generated files',
      },
      {
        id: 'wire',
        label: 'Wire and validate',
        type: 'verify',
        description:
          'Writes files, verifies references, creates initial cache',
      },
    ],
    connections: [
      { to: 'audit', label: 'review initial setup' },
      { to: 'inspect', label: 'monitor after setup' },
      { to: 'cache', label: 'creates initial snapshot' },
    ],
  },
  {
    slug: 'sync',
    command: '/aisa-sync',
    category: 'essentials',
    userInvocable: true,
    tagline:
      'Full 7-phase maintenance cycle that keeps .claude/ in sync with your evolving codebase.',
    pipeline: [
      {
        id: 'snapshot',
        label: 'Snapshot inventory',
        type: 'script',
        description: 'Cache-first scan of .claude/ and project state',
      },
      {
        id: 'drift-audit',
        label: 'Drift audit',
        type: 'dispatch',
        description:
          'Reality-check every skill and agent incrementally',
      },
      {
        id: 'harvest',
        label: 'Harvest learnings',
        type: 'llm',
        description: 'Process ACTIVE log entries into promotions',
      },
      {
        id: 'expansion',
        label: 'Expansion analysis',
        type: 'llm',
        description:
          'Identify missing skills for new code and domains',
      },
      {
        id: 'plan',
        label: 'Build change plan',
        type: 'llm',
        description:
          'Consolidate findings into prioritized manifest P0-P5',
      },
      {
        id: 'critique',
        label: 'Critique change plan',
        type: 'critique',
        description: 'Quality scores, simulation, risk assessment',
      },
      {
        id: 'execute',
        label: 'Apply changes',
        type: 'dispatch',
        description: 'Apply approved changes and rebuild cache',
      },
    ],
    connections: [
      { to: 'cache', label: 'rebuilds cache after' },
      { to: 'harvest', label: 'invokes internally' },
      { to: 'lint', label: 'validate after changes' },
    ],
  },
  {
    slug: 'postmortem',
    command: '/aisa-postmortem',
    category: 'essentials',
    userInvocable: true,
    tagline:
      'Turns incidents into prevention by mapping root causes to skill gaps and encoding fixes.',
    pipeline: [
      {
        id: 'gather',
        label: 'Gather incident context',
        type: 'user',
        description:
          'Collect from arguments, conversation, or interactive questions',
      },
      {
        id: 'git-context',
        label: 'Analyze git history',
        type: 'script',
        description:
          'Identify fix-looking commits and related changes',
      },
      {
        id: 'root-cause',
        label: 'Root cause analysis',
        type: 'llm',
        description:
          'Map each cause to skill coverage gaps and quality gate failures',
      },
      {
        id: 'propose',
        label: 'Propose skill updates',
        type: 'llm',
        description:
          'Specific rules, gotchas, anti-patterns to add',
      },
      {
        id: 'apply',
        label: 'Apply and commit',
        type: 'user',
        description:
          'Update affected skills and append learning entries',
      },
    ],
    connections: [
      { to: 'harvest', label: 'creates learning entries for' },
      { to: 'lint', label: 'validate updated skills' },
      { to: 'inspect', label: 'check overall health after' },
    ],
  },

  // ── analysis ──────────────────────────────────────────────────────────
  {
    slug: 'audit',
    command: '/aisa-audit',
    category: 'analysis',
    userInvocable: true,
    tagline:
      'Deep read-only review of .claude/ content accuracy with mechanical validation and coverage gap analysis.',
    pipeline: [
      {
        id: 'detect-stack',
        label: 'Detect tech stack',
        type: 'script',
        description:
          'Run language, framework, and build tool detection',
      },
      {
        id: 'health-check',
        label: 'Run health check',
        type: 'script',
        description:
          'File paths, structure validation, CLAUDE.md diff, learnings stats',
      },
      {
        id: 'compliance',
        label: 'Principle compliance',
        type: 'verify',
        description:
          'P1-P3 and A1-A6 per-item PASS/FAIL with fixes',
      },
      {
        id: 'report',
        label: 'Present audit report',
        type: 'llm',
        description:
          'Two sections: Mechanical Checks + Supplementary Observations',
      },
    ],
    connections: [
      { to: 'sync', label: 'findings drive full sync' },
      { to: 'update', label: 'fix specific issues' },
      { to: 'init', label: 'suggest full rebuild if needed' },
    ],
  },
  {
    slug: 'inspect',
    command: '/aisa-inspect',
    category: 'analysis',
    userInvocable: true,
    tagline:
      'Quick read-only drift scan that reports CURRENT / OUTDATED / STALE / CRITICAL per file.',
    pipeline: [
      {
        id: 'health-script',
        label: 'Run health script',
        type: 'script',
        description:
          'Cache comparison, fast structural checks, CLAUDE.md diff',
      },
      {
        id: 'openspec-check',
        label: 'OpenSpec check',
        type: 'script',
        description:
          'Conditional: check openspec tooling if specs directory detected',
      },
      {
        id: 'interpret',
        label: 'Interpret and supplement',
        type: 'llm',
        description:
          'Code example spot-check, classify drift status per file',
      },
      {
        id: 'report',
        label: 'Present health report',
        type: 'user',
        description:
          'CURRENT/OUTDATED/STALE/CRITICAL classifications with fix offers',
      },
    ],
    connections: [
      { to: 'sync', label: 'triggers full sync when drift detected' },
      { to: 'update', label: 'triggers targeted fix' },
      { to: 'cache', label: 'reads cached snapshots' },
    ],
  },
  {
    slug: 'lint',
    command: '/aisa-lint',
    category: 'analysis',
    userInvocable: true,
    tagline:
      'Validates skill and agent structure against P1-P3 and A1-A6 principles without checking codebase accuracy.',
    pipeline: [
      {
        id: 'validate-script',
        label: 'Run validation script',
        type: 'script',
        description:
          'verify-setup.js validate --json for structural checks',
      },
      {
        id: 'deep-check',
        label: 'Deep supplementary check',
        type: 'llm',
        description:
          'PCIDCI pattern, capability-tool consistency review',
      },
      {
        id: 'agent-validation',
        label: 'Agent principle check',
        type: 'verify',
        description:
          'Cross-reference with Agent Principles A1-A6',
      },
      {
        id: 'report',
        label: 'Present lint report',
        type: 'llm',
        description:
          'Compliance tables, issues with proposed fixes',
      },
      {
        id: 'apply-fixes',
        label: 'Apply fixes',
        type: 'user',
        description:
          'Insert missing pieces, commit surgically with approval',
      },
    ],
    connections: [
      { to: 'cache', label: 'updates snapshot with compliance flags' },
      { to: 'update', label: 'fix lint violations' },
    ],
  },
  {
    slug: 'update',
    command: '/aisa-update',
    category: 'analysis',
    userInvocable: true,
    tagline:
      'Targeted skill/agent update scoped to a specific code change using git diff.',
    pipeline: [
      {
        id: 'scope',
        label: 'Scope the change',
        type: 'script',
        description:
          'git diff analysis to identify affected skills and agents',
      },
      {
        id: 'drift-check',
        label: 'Targeted drift check',
        type: 'llm',
        description:
          'Check only affected files against P1-P3, A1-A6',
      },
      {
        id: 'coverage',
        label: 'New coverage needs',
        type: 'llm',
        description:
          'Identify new patterns, rules, integrations, domains',
      },
      {
        id: 'propose',
        label: 'Propose changes',
        type: 'llm',
        description: 'Focused change plan with P0-P5 priorities',
      },
      {
        id: 'apply',
        label: 'Apply and commit',
        type: 'user',
        description:
          'Apply surgically, optionally append learnings, commit',
      },
    ],
    connections: [
      { to: 'lint', label: 'validate after update' },
      { to: 'sync', label: 'flags out-of-scope drift for' },
    ],
  },

  // ── utilities ─────────────────────────────────────────────────────────
  {
    slug: 'harvest',
    command: '/aisa-harvest',
    category: 'utilities',
    userInvocable: true,
    tagline:
      'Promotes ACTIVE learnings from the log into skill gotchas, new skills, and documentation.',
    pipeline: [
      {
        id: 'read-log',
        label: 'Read learning log',
        type: 'script',
        description:
          'Count entries by status and category; stop if 0 ACTIVE',
      },
      {
        id: 'cluster',
        label: 'Cluster analysis',
        type: 'llm',
        description:
          'Group by theme, identify high-priority promotions and new skill signals',
      },
      {
        id: 'propose',
        label: 'Propose promotions',
        type: 'user',
        description:
          'Present promotions to existing skills, new skills, doc updates',
      },
      {
        id: 'apply',
        label: 'Apply promotions',
        type: 'dispatch',
        description:
          'Add content, create skills, update docs, mark entries PROMOTED',
      },
    ],
    connections: [
      { to: 'lint', label: 'validate promoted skills' },
      { to: 'sync', label: 'suggested for significant patterns' },
    ],
  },
  {
    slug: 'cache',
    command: '/aisa-cache',
    category: 'utilities',
    userInvocable: true,
    tagline:
      'Manages the .claude/cache/ snapshot for incremental scanning, reducing token use by 60-80%.',
    pipeline: [
      {
        id: 'resolve-command',
        label: 'Resolve sub-command',
        type: 'script',
        description:
          'Parse: rebuild (default), status, or invalidate',
      },
      {
        id: 'execute',
        label: 'Execute operation',
        type: 'script',
        description:
          'Run cache-snapshot.js with appropriate flags',
      },
      {
        id: 'report',
        label: 'Report results',
        type: 'llm',
        description:
          'Show cache freshness, hash comparisons, recommendations',
      },
    ],
    connections: [
      { to: 'sync', label: 'provides snapshots for' },
      { to: 'inspect', label: 'provides snapshots for' },
    ],
  },
  {
    slug: 'spec-check',
    command: '/aisa-spec-check',
    category: 'utilities',
    userInvocable: true,
    tagline:
      'Checks openspec CLI availability, project initialization, and version currency.',
    pipeline: [
      {
        id: 'run-check',
        label: 'Run check script',
        type: 'script',
        description: 'Locate and execute check-openspec.js --json',
      },
      {
        id: 'interpret',
        label: 'Interpret results',
        type: 'llm',
        description:
          'Classify overall state as GOOD or NEEDS_ACTION',
      },
      {
        id: 'present',
        label: 'Present findings',
        type: 'user',
        description:
          'CLI status, project status, version status with remediation offers',
      },
      {
        id: 'remediate',
        label: 'Apply remediations',
        type: 'script',
        description: 'Execute approved fixes and re-verify',
      },
    ],
    connections: [
      { to: 'init', label: 'validates prerequisites for' },
    ],
  },
];

export function getSkillMeta(slug: string): SkillMeta | undefined {
  return skillsMeta.find((s) => s.slug === slug);
}

export function getSkillsByCategory(category: SkillCategory): SkillMeta[] {
  return skillsMeta.filter((s) => s.category === category);
}
