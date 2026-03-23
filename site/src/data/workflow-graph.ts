export interface WorkflowNode {
  slug: string;
  command: string;
  category: 'essentials' | 'analysis' | 'utilities';
  lane: 'setup' | 'maintain' | 'learn';
  col: number;
  tagline: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
  style: 'solid' | 'dashed' | 'cross-lane';
}

export const workflowNodes: WorkflowNode[] = [
  // SETUP lane
  {
    slug: 'spec-check',
    command: '/aisa-spec-check',
    category: 'utilities',
    lane: 'setup',
    col: 0,
    tagline: 'Check prerequisites & openspec',
  },
  {
    slug: 'init',
    command: '/aisa-init',
    category: 'essentials',
    lane: 'setup',
    col: 1,
    tagline: 'Scaffold .claude/ configuration',
  },
  {
    slug: 'audit',
    command: '/aisa-audit',
    category: 'analysis',
    lane: 'setup',
    col: 2,
    tagline: 'Deep review of AI setup',
  },

  // MAINTAIN lane
  {
    slug: 'inspect',
    command: '/aisa-inspect',
    category: 'analysis',
    lane: 'maintain',
    col: 0,
    tagline: 'Quick weekly health check',
  },
  {
    slug: 'update',
    command: '/aisa-update',
    category: 'analysis',
    lane: 'maintain',
    col: 1,
    tagline: 'Targeted post-feature update',
  },
  {
    slug: 'sync',
    command: '/aisa-sync',
    category: 'essentials',
    lane: 'maintain',
    col: 2,
    tagline: 'Full maintenance cycle',
  },

  // LEARN lane
  {
    slug: 'postmortem',
    command: '/aisa-postmortem',
    category: 'essentials',
    lane: 'learn',
    col: 0,
    tagline: 'Incident-to-prevention pipeline',
  },
  {
    slug: 'harvest',
    command: '/aisa-harvest',
    category: 'utilities',
    lane: 'learn',
    col: 1,
    tagline: 'Promote learnings to skills',
  },
  {
    slug: 'lint',
    command: '/aisa-lint',
    category: 'analysis',
    lane: 'learn',
    col: 2,
    tagline: 'Validate against principles',
  },
];

export const workflowEdges: WorkflowEdge[] = [
  // Within-lane edges (solid)
  { from: 'spec-check', to: 'init', label: 'validates before', style: 'solid' },
  { from: 'init', to: 'audit', label: 'review setup', style: 'solid' },
  { from: 'inspect', to: 'update', label: 'drift found', style: 'solid' },
  { from: 'update', to: 'sync', label: 'triggers full', style: 'solid' },
  { from: 'postmortem', to: 'harvest', label: 'creates learnings', style: 'solid' },
  { from: 'harvest', to: 'lint', label: 'validate promoted', style: 'solid' },

  // Cross-lane edges
  { from: 'init', to: 'inspect', label: 'then monitor', style: 'cross-lane' },
  { from: 'audit', to: 'sync', label: 'findings drive', style: 'cross-lane' },
  { from: 'sync', to: 'harvest', label: 'harvests learnings', style: 'cross-lane' },
  { from: 'postmortem', to: 'update', label: 'encode lessons', style: 'cross-lane' },
  { from: 'lint', to: 'update', label: 'fix violations', style: 'cross-lane' },
];

export const laneLabels: Record<string, string> = {
  setup: 'SETUP',
  maintain: 'MAINTAIN',
  learn: 'LEARN',
};

export const laneOrder = ['setup', 'maintain', 'learn'] as const;
