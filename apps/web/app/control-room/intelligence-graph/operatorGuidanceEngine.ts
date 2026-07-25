/**
 * Operator Guidance Engine (OGE) — Step 88
 *
 * Turns fused intelligence (IFE) into human-readable, role-aware,
 * workspace-aware actions the operator should take next.
 *
 * Transforms UBOS from "here are the fused insights" into
 * "here is what YOU should do right now."
 */

import type { FusionCluster, FusionSeverity, FusedInsight } from './insightFusionEngine.js';
import type { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

/** Canonical OGE roles (Step 88). */
export type GuidanceRole =
  | 'Director'
  | 'Technical Director'
  | 'Graphics Operator'
  | 'Audio Engineer'
  | 'Replay Operator'
  | 'Streaming Operator'
  | 'Solo Streamer'
  | 'Compact Operator';

export type GuidanceActionType =
  | 'Critical Action'
  | 'Warning Action'
  | 'Prepare Action'
  | 'Monitor';

export type GuidanceAction = {
  id: string;
  role: GuidanceRole;
  workspace: string | null;
  nodeId: string | null;
  cluster: FusionCluster;
  severity: GuidanceActionType;
  message: string;
  confidence: number;
  timestamp: number;
};

const NOISE_THRESHOLD = 0.5;

const SEVERITY_LABEL: Record<FusionSeverity, GuidanceActionType> = {
  critical: 'Critical Action',
  warning: 'Warning Action',
  prediction: 'Prepare Action',
  info: 'Monitor',
};

const SEVERITY_WEIGHT: Record<GuidanceActionType, number> = {
  'Critical Action': 3,
  'Warning Action': 2,
  'Prepare Action': 1,
  Monitor: 0,
};

/** Clusters each role cares about most. */
const ROLE_CLUSTERS: Record<GuidanceRole, FusionCluster[]> = {
  Director: ['scene', 'operator', 'automation', 'output'],
  'Technical Director': ['routing', 'output', 'system', 'scene', 'automation'],
  'Graphics Operator': ['graphics', 'scene'],
  'Audio Engineer': ['audio'],
  'Replay Operator': ['scene', 'system', 'output'],
  'Streaming Operator': ['output', 'routing', 'system'],
  'Solo Streamer': ['scene', 'graphics', 'audio', 'output', 'routing', 'automation', 'operator', 'system'],
  'Compact Operator': ['scene', 'audio', 'output', 'graphics', 'routing'],
};

/** Workspaces that boost relevance for a role. */
const ROLE_WORKSPACES: Record<GuidanceRole, string[]> = {
  Director: ['director', 'production', 'production-director'],
  'Technical Director': ['production', 'director', 'distribution', 'automation', 'monitor-wall'],
  'Graphics Operator': ['graphics'],
  'Audio Engineer': ['audio', 'production'],
  'Replay Operator': ['replay', 'production'],
  'Streaming Operator': ['distribution', 'streaming', 'monitor-wall'],
  'Solo Streamer': ['streamer', 'solo', 'production', 'compact'],
  'Compact Operator': ['compact', 'production', 'streamer'],
};

const ROLE_TEMPLATES: Record<
  GuidanceRole,
  Partial<Record<FusionCluster, string>>
> = {
  Director: {
    scene: 'Prepare the next take and confirm Program readiness.',
    output: 'Hold take if Program health is unstable.',
    automation: 'Confirm automation will not fire mid-take.',
    operator: 'Align crew focus on the active risk.',
  },
  'Technical Director': {
    routing: 'Verify signal path and prepare failover route.',
    output: 'Inspect encoder load and Program stability.',
    system: 'Check subsystem health before continuing.',
    scene: 'Validate sources feeding Program.',
    automation: 'Review automation conditions before they fire.',
  },
  'Graphics Operator': {
    graphics: 'Review active graphics layers for conflicts.',
    scene: 'Arm the next graphics package for take.',
  },
  'Audio Engineer': {
    audio: 'Check audio levels and reduce gain if necessary.',
  },
  'Replay Operator': {
    scene: 'Stand by for replay / ISO on the next beat.',
    output: 'Confirm replay return path to Program.',
    system: 'Verify replay buffers are healthy.',
  },
  'Streaming Operator': {
    output: 'Monitor output health and prepare fallback destination.',
    routing: 'Confirm destination routes are live.',
    system: 'Watch distribution / health alarms.',
  },
  'Solo Streamer': {
    scene: 'Prepare for a possible scene transition.',
    graphics: 'Review overlays before they go live.',
    audio: 'Watch levels — reduce gain if peaking.',
    output: 'Check stream health before continuing.',
    routing: 'Confirm your destination is still connected.',
  },
  'Compact Operator': {
    scene: 'Keep Program scene ready.',
    audio: 'Watch audio peaks.',
    output: 'Watch Program health.',
    graphics: 'Check overlays.',
    routing: 'Confirm routes.',
  },
};

function normalizeRole(raw: string | null | undefined): GuidanceRole {
  if (!raw) return 'Director';
  const key = raw.trim().toLowerCase().replace(/[_]+/g, '-').replace(/\s+/g, ' ');

  if (key === 'director' || key === 'producer') return 'Director';
  if (key === 'technical-director' || key === 'technical director' || key === 'td') {
    return 'Technical Director';
  }
  if (key === 'graphics-operator' || key === 'graphics operator' || key === 'graphics') {
    return 'Graphics Operator';
  }
  if (key === 'audio-engineer' || key === 'audio engineer' || key === 'audio') {
    return 'Audio Engineer';
  }
  if (key === 'replay-operator' || key === 'replay operator' || key === 'replay') {
    return 'Replay Operator';
  }
  if (
    key === 'streaming-operator' ||
    key === 'streaming operator' ||
    key === 'streaming' ||
    key === 'monitor-operator'
  ) {
    return 'Streaming Operator';
  }
  if (key === 'solo streamer' || key === 'solo-streamer' || key === 'streamer') {
    return 'Solo Streamer';
  }
  if (key === 'compact operator' || key === 'compact-operator' || key === 'compact') {
    return 'Compact Operator';
  }

  // Display-name passthrough
  const titled = raw.trim();
  const known: GuidanceRole[] = [
    'Director',
    'Technical Director',
    'Graphics Operator',
    'Audio Engineer',
    'Replay Operator',
    'Streaming Operator',
    'Solo Streamer',
    'Compact Operator',
  ];
  const match = known.find((r) => r.toLowerCase() === titled.toLowerCase());
  return match ?? 'Director';
}

function workspaceFromRoleGuess(workspace: string | null | undefined): GuidanceRole | null {
  if (!workspace) return null;
  const ws = workspace.toLowerCase();
  if (ws.includes('graphics')) return 'Graphics Operator';
  if (ws.includes('audio')) return 'Audio Engineer';
  if (ws.includes('replay')) return 'Replay Operator';
  if (ws.includes('distribution') || ws.includes('streaming')) return 'Streaming Operator';
  if (ws.includes('compact')) return 'Compact Operator';
  if (ws.includes('streamer') || ws.includes('solo')) return 'Solo Streamer';
  if (ws.includes('director')) return 'Director';
  if (ws.includes('automation') || ws.includes('monitor')) return 'Technical Director';
  if (ws.includes('production')) return 'Director';
  return null;
}

export class OperatorGuidanceEngine {
  private readonly graph: UBOSIntelligenceGraph;

  operatorGuidance: GuidanceAction[] = [];
  private activeRole: GuidanceRole = 'Director';
  private activeWorkspace: string | null = null;

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  setContext(role?: string | null, workspace?: string | null): void {
    if (role) this.activeRole = normalizeRole(role);
    if (workspace !== undefined) this.activeWorkspace = workspace;
  }

  getContext(): { role: GuidanceRole; workspace: string | null } {
    return { role: this.activeRole, workspace: this.activeWorkspace };
  }

  /**
   * Generate role/workspace-aware actions from fused insights.
   * Defaults to stored context or graph normalizer context.
   */
  generate(
    operatorRole?: string | null,
    workspace?: string | null,
  ): GuidanceAction[] {
    const context = this.graph.normalizer.getContext();
    const role = normalizeRole(
      operatorRole ??
        this.activeRole ??
        this.inferRoleFromGraph() ??
        workspaceFromRoleGuess(workspace ?? context.workspace) ??
        'Director',
    );
    const ws =
      workspace ??
      this.activeWorkspace ??
      context.workspace ??
      null;

    this.activeRole = role;
    this.activeWorkspace = ws;

    const fused = this.graph.fusedInsights ?? [];

    // Rule 5 — Suppress noise (stricter than IFE)
    const strong = fused.filter((f) => f.confidence >= NOISE_THRESHOLD);

    // Rules 1–2 — Role + workspace relevance
    const relevant = strong.filter((f) => this.isRelevant(f, role, ws));

    // Rule 4 — Action clarity + role templates
    let actions = relevant.map((f) => this.toAction(f, role, ws));

    // Rule 6 — Merge similar actions
    actions = this.mergeSimilar(actions);

    // Rule 3 — Severity prioritization
    actions.sort((a, b) => this.rank(b) - this.rank(a));

    // Compact / Solo: keep a short list
    const limit = role === 'Compact Operator' ? 3 : role === 'Solo Streamer' ? 5 : 6;
    this.operatorGuidance = actions.slice(0, limit);
    return this.operatorGuidance;
  }

  isRelevant(
    signal: FusedInsight,
    role: GuidanceRole,
    workspace: string | null,
  ): boolean {
    const clusters = ROLE_CLUSTERS[role];
    if (!clusters.includes(signal.cluster)) {
      // Solo/Compact still see critical system issues
      if (
        (role === 'Solo Streamer' || role === 'Compact Operator') &&
        signal.severity === 'critical'
      ) {
        return true;
      }
      // Critical output is always relevant to Director / TD / Streaming
      if (
        signal.severity === 'critical' &&
        (signal.cluster === 'output' || signal.cluster === 'system') &&
        (role === 'Director' || role === 'Technical Director' || role === 'Streaming Operator')
      ) {
        return true;
      }
      return false;
    }

    // Workspace filter: if signal has workspace and it mismatches, demote unless role owns cluster
    if (workspace && signal.workspace && signal.workspace !== workspace) {
      const roleWs = ROLE_WORKSPACES[role];
      const ownsWorkspace = roleWs.includes(workspace.toLowerCase());
      // Keep if operator is in their home workspace and signal is for their cluster
      if (!ownsWorkspace && signal.confidence < 0.75) return false;
    }

    // Skeleton-style message checks as additional soft gate for specialist roles
    if (role === 'Audio Engineer' && signal.cluster !== 'audio') return false;
    if (role === 'Graphics Operator' && signal.cluster !== 'graphics' && signal.cluster !== 'scene') {
      return false;
    }
    if (
      role === 'Streaming Operator' &&
      signal.cluster !== 'output' &&
      signal.cluster !== 'routing' &&
      signal.cluster !== 'system'
    ) {
      return false;
    }

    return true;
  }

  toAction(
    signal: FusedInsight,
    role: GuidanceRole,
    workspace: string | null,
  ): GuidanceAction {
    return {
      id: `oge-${role.replace(/\s+/g, '-').toLowerCase()}-${signal.cluster}-${signal.nodeId ?? 'x'}-${signal.timestamp}`,
      role,
      workspace,
      nodeId: signal.nodeId,
      cluster: signal.cluster,
      severity: SEVERITY_LABEL[signal.severity],
      message: this.formatMessage(signal, role),
      confidence: signal.confidence,
      timestamp: signal.timestamp,
    };
  }

  formatMessage(signal: FusedInsight, role: GuidanceRole): string {
    const template = ROLE_TEMPLATES[role][signal.cluster];
    if (template) return template;

    // Fallbacks by role + message content (skeleton rules)
    const msg = signal.message.toLowerCase();
    if (role === 'Audio Engineer' && (msg.includes('audio') || signal.cluster === 'audio')) {
      return 'Check audio levels and reduce gain if necessary.';
    }
    if (role === 'Director' && (msg.includes('scene') || signal.cluster === 'scene')) {
      return 'Prepare for a possible scene transition.';
    }
    if (role === 'Graphics Operator' && (msg.includes('graphics') || signal.cluster === 'graphics')) {
      return 'Review active graphics layers for conflicts.';
    }
    if (role === 'Streaming Operator' && (msg.includes('output') || signal.cluster === 'output')) {
      return 'Monitor output health and prepare fallback destination.';
    }

    // Prefer fused recommended action when short/actionable
    if (signal.recommendedAction && signal.recommendedAction.length <= 80) {
      return signal.recommendedAction;
    }
    return 'Review system status.';
  }

  rank(action: GuidanceAction): number {
    return SEVERITY_WEIGHT[action.severity] * action.confidence;
  }

  getGuidance(): readonly GuidanceAction[] {
    return this.operatorGuidance;
  }

  getTopGuidance(limit = 3): readonly GuidanceAction[] {
    return this.operatorGuidance.slice(0, limit);
  }

  reset(): void {
    this.operatorGuidance = [];
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private mergeSimilar(actions: GuidanceAction[]): GuidanceAction[] {
    const map = new Map<string, GuidanceAction>();
    for (const action of actions) {
      const key = `${action.role}:${action.cluster}:${action.severity}`;
      const existing = map.get(key);
      if (!existing || action.confidence > existing.confidence) {
        map.set(key, action);
      }
    }
    return [...map.values()];
  }

  private inferRoleFromGraph(): GuidanceRole | null {
    const operator = [...this.graph.nodes.values()].find((n) => n.type === 'OperatorNode');
    if (!operator) return null;
    const roleAttr =
      (typeof operator.attributes.role === 'string' && operator.attributes.role) ||
      null;
    if (roleAttr) return normalizeRole(roleAttr);
    return workspaceFromRoleGuess(operator.workspace ?? null);
  }
}

export { normalizeRole };
