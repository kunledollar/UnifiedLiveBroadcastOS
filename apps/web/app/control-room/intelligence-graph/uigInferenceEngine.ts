/**
 * UIG Inference Engine (UIE) — Step 83 Phase 1
 *
 * The thinking layer of UBOS. Scans the Intelligence Graph after UENL
 * normalization and produces insights, warnings, predictions, operator
 * guidance, automation triggers, workspace highlights, and UI emphasis.
 *
 * Layers (Phase 1 implements foundational rules in each):
 *   1. Structural — dependencies, conflicts, missing nodes, broken paths
 *   2. Temporal   — scene-change frequency / transition likelihood
 *   3. Semantic   — audio danger, output health, graphics relevance
 *   4. Predictive — scene transition + graphics activation likelihood
 *
 * Later steps expand rule coverage, ML scoring, and cross-cluster inference.
 */

import type {
  UBOSIntelligenceGraph,
  UigEdge,
  UigInsight,
  UigInsightKind,
  UigNode,
  UigNodeType,
} from './ubosIntelligenceGraph.js';

export type InferenceResultKind =
  | 'insight'
  | 'warning'
  | 'prediction'
  | 'guidance'
  | 'recommendation'
  | 'automation_trigger'
  | 'ui_emphasis'
  | 'workspace_highlight';

export type InferenceEmphasis = 'critical' | 'warning' | 'info' | 'highlight';

export type InferenceResult = {
  id: string;
  rule: string;
  kind: InferenceResultKind;
  message: string;
  confidence: number;
  nodeId?: string;
  relatedNodeIds: string[];
  workspace?: string | null;
  emphasis?: InferenceEmphasis;
  timestamp: number;
};

export type InferenceRunResult = {
  results: InferenceResult[];
  insights: UigInsight[];
  highlights: InferenceResult[];
  emphasis: InferenceResult[];
  automationTriggers: InferenceResult[];
};

const AUDIO_PEAK_DANGER = 0.9;
const OUTPUT_DROP_THRESHOLD = 2;
const SCENE_TRANSITION_WINDOW_MS = 15_000;
const SCENE_TRANSITION_MIN_CHANGES = 3;

const WORKSPACE_RELEVANCE: Record<string, UigNodeType[]> = {
  production: ['SceneNode', 'GraphicsNode', 'AudioNode', 'OutputNode', 'RoutingNode'],
  director: ['SceneNode', 'OutputNode', 'AudioNode', 'ReplayNode'],
  graphics: ['GraphicsNode', 'SceneNode', 'OutputNode'],
  replay: ['ReplayNode', 'SceneNode', 'OutputNode'],
  distribution: ['RoutingNode', 'OutputNode', 'HealthNode'],
  automation: ['AutomationNode', 'SceneNode', 'RoutingNode'],
  analytics: ['HealthNode', 'PredictionNode', 'OutputNode', 'SystemNode'],
  'social-fabric': ['SceneNode', 'OutputNode', 'AutomationNode'],
  'monitor-wall': ['OutputNode', 'HealthNode', 'ReplayNode', 'RoutingNode'],
};

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function toInsightKind(kind: InferenceResultKind): UigInsightKind | null {
  switch (kind) {
    case 'warning':
      return 'warning';
    case 'prediction':
      return 'prediction';
    case 'guidance':
      return 'guidance';
    case 'recommendation':
    case 'insight':
      return 'recommendation';
    default:
      return null;
  }
}

export class UIGInferenceEngine {
  private readonly graph: UBOSIntelligenceGraph;
  private sceneHistory: Array<{ key: string; at: number }> = [];
  private generation = 0;

  lastInsights: InferenceResult[] = [];
  lastRun: InferenceRunResult | null = null;

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  run(): InferenceRunResult {
    this.generation += 1;
    const now = Date.now();
    const results: InferenceResult[] = [];

    this.recordSceneSample(now);

    for (const node of this.graph.nodes.values()) {
      results.push(...this.applyRules(node, now));
    }

    // Graph-level rules (temporal / operator / structural scan)
    results.push(...this.applyGraphRules(now));

    // Deduplicate by id, newest wins
    const byId = new Map<string, InferenceResult>();
    for (const result of results) {
      byId.set(result.id, result);
    }
    const deduped = [...byId.values()].sort((a, b) => b.timestamp - a.timestamp);

    this.lastInsights = deduped;

    const insights: UigInsight[] = [];
    for (const result of deduped) {
      const kind = toInsightKind(result.kind);
      if (!kind) continue;
      insights.push({
        id: result.id,
        kind,
        message: result.message,
        confidence: result.confidence,
        relatedNodeIds: result.relatedNodeIds,
        timestamp: result.timestamp,
        rule: result.rule,
        ...(result.emphasis ? { emphasis: result.emphasis } : {}),
      });
    }

    const run: InferenceRunResult = {
      results: deduped,
      insights,
      highlights: deduped.filter((r) => r.kind === 'workspace_highlight'),
      emphasis: deduped.filter((r) => r.kind === 'ui_emphasis'),
      automationTriggers: deduped.filter((r) => r.kind === 'automation_trigger'),
    };
    this.lastRun = run;
    return run;
  }

  applyRules(node: UigNode, now = Date.now()): InferenceResult[] {
    const results: InferenceResult[] = [];
    const eventType = node.eventType ?? '';
    const attr = node.attributes;

    // Rule 1 — Missing Source Detection
    if (
      node.type === 'SceneNode' ||
      eventType.startsWith('scene.')
    ) {
      const missingSources = strList(attr.missing_sources ?? attr.missingSources);
      const missingFlag = attr.missing === true || eventType === 'scene.missing_source';
      const brokenDeps = this.missingDependencyTargets(node.id);
      if (missingSources.length > 0 || missingFlag || brokenDeps.length > 0) {
        results.push({
          id: `rule1-missing-source-${node.id}-${this.generation}`,
          rule: 'rule.missing_source',
          kind: 'warning',
          message: 'Scene has missing source',
          confidence: 0.9,
          nodeId: node.id,
          relatedNodeIds: [node.id, ...missingSources, ...brokenDeps],
          emphasis: 'critical',
          timestamp: now,
        });
        results.push({
          id: `rule1-guidance-${node.id}-${this.generation}`,
          rule: 'rule.missing_source',
          kind: 'guidance',
          message: 'Restore or rematch the missing source before going to Program',
          confidence: 0.85,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'warning',
          timestamp: now,
        });
        results.push({
          id: `rule1-automation-${node.id}-${this.generation}`,
          rule: 'rule.missing_source',
          kind: 'automation_trigger',
          message: 'Suggest automation: hold take / flash source-missing tally',
          confidence: 0.7,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      }
    }

    // Rule 2 — Graphics Conflict Detection
    if (node.type === 'GraphicsNode' || eventType.startsWith('graphics.')) {
      const conflictAttr = attr.conflict === true;
      const conflictEdges = this.edgesOfType(node.id, 'conflicts_with');
      if (conflictAttr || conflictEdges.length > 0) {
        const related = conflictEdges.flatMap((e) => [e.from, e.to]);
        results.push({
          id: `rule2-graphics-conflict-${node.id}-${this.generation}`,
          rule: 'rule.graphics_conflict',
          kind: 'warning',
          message: 'Graphics layer conflict detected',
          confidence: 0.85,
          nodeId: node.id,
          relatedNodeIds: [node.id, ...related],
          emphasis: 'warning',
          timestamp: now,
        });
      }
    }

    // Rule 3 — Audio Danger Detection
    if (node.type === 'AudioNode' || eventType.startsWith('audio.')) {
      const peak = num(attr.peak);
      if (peak > AUDIO_PEAK_DANGER) {
        results.push({
          id: `rule3-audio-danger-${node.id}-${this.generation}`,
          rule: 'rule.audio_danger',
          kind: 'warning',
          message: 'Audio clipping risk',
          confidence: 0.95,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'critical',
          timestamp: now,
        });
        results.push({
          id: `rule3-audio-guidance-${node.id}-${this.generation}`,
          rule: 'rule.audio_danger',
          kind: 'guidance',
          message: 'Reduce gain or enable limiter on the hot channel',
          confidence: 0.9,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
        results.push({
          id: `rule3-audio-emphasis-${node.id}-${this.generation}`,
          rule: 'rule.audio_danger',
          kind: 'ui_emphasis',
          message: 'Emphasize audio mixer channel',
          confidence: 0.95,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'critical',
          timestamp: now,
        });
      }
    }

    // Rule 4 — Routing Break Detection
    if (
      node.type === 'RoutingNode' ||
      eventType.startsWith('routing.')
    ) {
      if (attr.broken === true || eventType === 'routing.destination_error') {
        results.push({
          id: `rule4-routing-break-${node.id}-${this.generation}`,
          rule: 'rule.routing_break',
          kind: 'warning',
          message: 'Routing path failure',
          confidence: 0.92,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'critical',
          timestamp: now,
        });
        results.push({
          id: `rule4-routing-automation-${node.id}-${this.generation}`,
          rule: 'rule.routing_break',
          kind: 'automation_trigger',
          message: 'Suggest automation: failover route or disable broken destination',
          confidence: 0.75,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      }
    }

    // Rule 5 — Output Degradation Detection
    if (node.type === 'OutputNode' || eventType.startsWith('output.')) {
      const dropped =
        num(attr.droppedframes) ||
        num(attr.dropped_frames) ||
        num(attr.droppedFrames);
      if (dropped > OUTPUT_DROP_THRESHOLD || eventType === 'output.frame_drop') {
        results.push({
          id: `rule5-output-degraded-${node.id}-${this.generation}`,
          rule: 'rule.output_degradation',
          kind: 'warning',
          message: 'Output degraded',
          confidence: 0.88,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'warning',
          timestamp: now,
        });
        results.push({
          id: `rule5-output-guidance-${node.id}-${this.generation}`,
          rule: 'rule.output_degradation',
          kind: 'guidance',
          message: 'Inspect encoder load and reduce composition complexity',
          confidence: 0.8,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      }
    }

    // Rule 8 — Prediction: Graphics Activation Likely
    if (node.type === 'GraphicsNode' || eventType.startsWith('graphics.')) {
      if (this.isGraphicsReferencedByActiveScene(node)) {
        results.push({
          id: `rule8-graphics-activation-${node.id}-${this.generation}`,
          rule: 'rule.predict_graphics_activation',
          kind: 'prediction',
          message: 'Graphics activation likely',
          confidence: 0.78,
          nodeId: node.id,
          relatedNodeIds: [node.id, 'scene:current'],
          emphasis: 'info',
          timestamp: now,
        });
      }
    }

    return results;
  }

  // ── Graph-level rules ─────────────────────────────────────────────────────

  private applyGraphRules(now: number): InferenceResult[] {
    const results: InferenceResult[] = [];

    // Rule 6 — Operator Awareness / workspace highlights
    results.push(...this.applyOperatorAwareness(now));

    // Rule 7 — Prediction: Scene Transition Likely
    const recentChanges = this.sceneHistory.filter(
      (s) => now - s.at <= SCENE_TRANSITION_WINDOW_MS,
    );
    const uniqueKeys = new Set(recentChanges.map((s) => s.key));
    if (recentChanges.length >= SCENE_TRANSITION_MIN_CHANGES && uniqueKeys.size >= 2) {
      const scene =
        this.graph.nodes.get('scene:current') ??
        [...this.graph.nodes.values()].find((n) => n.type === 'SceneNode');
      results.push({
        id: `rule7-scene-transition-${this.generation}`,
        rule: 'rule.predict_scene_transition',
        kind: 'prediction',
        message: 'Scene transition likely',
        confidence: Math.min(0.95, 0.55 + uniqueKeys.size * 0.1),
        relatedNodeIds: scene ? [scene.id] : [],
        emphasis: 'highlight',
        timestamp: now,
        ...(scene ? { nodeId: scene.id } : {}),
      });
      results.push({
        id: `rule7-ui-emphasis-${this.generation}`,
        rule: 'rule.predict_scene_transition',
        kind: 'ui_emphasis',
        message: 'Emphasize triad / scene switcher',
        confidence: 0.8,
        relatedNodeIds: scene ? [scene.id] : [],
        emphasis: 'highlight',
        timestamp: now,
        ...(scene ? { nodeId: scene.id } : {}),
      });
    }

    // Structural: empty routing graph
    const routes = [...this.graph.nodes.values()].filter((n) => n.type === 'RoutingNode');
    if (routes.length === 0) {
      results.push({
        id: `struct-routing-empty-${this.generation}`,
        rule: 'rule.structural_routing_empty',
        kind: 'recommendation',
        message: 'No active routes — signal path may be incomplete',
        confidence: 0.7,
        relatedNodeIds: [],
        timestamp: now,
      });
    }

    // Structural: health subsystem errors
    for (const node of this.graph.nodes.values()) {
      if (node.type !== 'HealthNode') continue;
      if (node.attributes.status === 'error') {
        const subsystem = String(node.attributes.subsystem ?? 'system');
        results.push({
          id: `struct-health-error-${subsystem}-${this.generation}`,
          rule: 'rule.structural_health',
          kind: 'warning',
          message: `${subsystem} reports error — investigate degradation path`,
          confidence: 0.9,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'critical',
          timestamp: now,
        });
      }
    }

    // Temporal Pattern Engine signals (Step 85)
    results.push(...this.applyTemporalRules(now));

    return results;
  }

  private applyTemporalRules(now: number): InferenceResult[] {
    const results: InferenceResult[] = [];

    for (const node of this.graph.nodes.values()) {
      if (node.spike) {
        results.push({
          id: `tpe-spike-${node.id}-${this.generation}`,
          rule: 'rule.temporal_spike',
          kind: 'warning',
          message: `Temporal spike detected on ${node.id}`,
          confidence: 0.82,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'warning',
          timestamp: now,
        });
      }
      if (node.drop) {
        results.push({
          id: `tpe-drop-${node.id}-${this.generation}`,
          rule: 'rule.temporal_drop',
          kind: 'warning',
          message: `Temporal drop detected on ${node.id}`,
          confidence: 0.8,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'warning',
          timestamp: now,
        });
      }
      if (node.anomaly) {
        results.push({
          id: `tpe-anomaly-${node.id}-${this.generation}`,
          rule: 'rule.temporal_anomaly',
          kind: 'warning',
          message: `Temporal anomaly detected on ${node.id}`,
          confidence: 0.85,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'critical',
          timestamp: now,
        });
      }
      if (node.trend === 'rising' && node.type === 'AudioNode') {
        results.push({
          id: `tpe-predict-audio-${node.id}-${this.generation}`,
          rule: 'rule.temporal_predict_audio_clip',
          kind: 'prediction',
          message: 'Predictive audio clipping risk — levels rising',
          confidence: 0.76,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'info',
          timestamp: now,
        });
      }
      if (node.trend === 'rising' && node.type === 'OutputNode') {
        results.push({
          id: `tpe-predict-output-${node.id}-${this.generation}`,
          rule: 'rule.temporal_predict_output_degradation',
          kind: 'prediction',
          message: 'Predictive output degradation — metrics rising',
          confidence: 0.74,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          emphasis: 'info',
          timestamp: now,
        });
      }
      if (node.cycle) {
        results.push({
          id: `tpe-cycle-${node.id}-${this.generation}`,
          rule: 'rule.temporal_cycle',
          kind: 'insight',
          message: `Repeating temporal cycle on ${node.id}`,
          confidence: 0.7,
          nodeId: node.id,
          relatedNodeIds: [node.id],
          timestamp: now,
        });
      }
    }

    return results;
  }

  private applyOperatorAwareness(now: number): InferenceResult[] {
    const results: InferenceResult[] = [];
    const context = this.graph.normalizer.getContext();
    const operatorNodes = [...this.graph.nodes.values()].filter((n) => n.type === 'OperatorNode');

    const workspace =
      (operatorNodes[0]?.workspace as string | null | undefined) ??
      (typeof operatorNodes[0]?.attributes.workspace === 'string'
        ? (operatorNodes[0].attributes.workspace as string)
        : null) ??
      context.workspace ??
      null;

    const operatorId = operatorNodes[0]?.id;
    if (!workspace && !operatorId && !context.operator) return results;

    const relevantTypes: UigNodeType[] =
      (workspace ? WORKSPACE_RELEVANCE[workspace] : undefined) ??
      WORKSPACE_RELEVANCE.production ??
      ['SceneNode', 'OutputNode'];

    const highlighted = [...this.graph.nodes.values()].filter((n) =>
      relevantTypes.includes(n.type),
    );

    if (highlighted.length === 0) return results;

    const wsLabel = workspace ?? 'current';
    results.push({
      id: `rule6-operator-awareness-${wsLabel}-${this.generation}`,
      rule: 'rule.operator_awareness',
      kind: 'workspace_highlight',
      message: `Highlight nodes relevant to workspace ${wsLabel}`,
      confidence: 0.8,
      relatedNodeIds: highlighted.map((n) => n.id),
      workspace: wsLabel,
      emphasis: 'highlight',
      timestamp: now,
      ...(operatorId ? { nodeId: operatorId } : {}),
    });

    results.push({
      id: `rule6-guidance-${wsLabel}-${this.generation}`,
      rule: 'rule.operator_awareness',
      kind: 'guidance',
      message: `Operator focus: prioritize ${relevantTypes.map((t) => t.replace('Node', '')).join(', ')}`,
      confidence: 0.75,
      relatedNodeIds: highlighted.slice(0, 6).map((n) => n.id),
      workspace: wsLabel,
      timestamp: now,
      ...(operatorId ? { nodeId: operatorId } : {}),
    });

    for (const node of highlighted.slice(0, 8)) {
      results.push({
        id: `rule6-emphasis-${node.id}-${this.generation}`,
        rule: 'rule.operator_awareness',
        kind: 'ui_emphasis',
        message: `Emphasize ${node.id} for workspace ${wsLabel}`,
        confidence: 0.7,
        nodeId: node.id,
        relatedNodeIds: [node.id],
        workspace: wsLabel,
        emphasis: 'highlight',
        timestamp: now,
      });
    }

    return results;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private recordSceneSample(now: number): void {
    const scene =
      this.graph.nodes.get('scene:current') ??
      [...this.graph.nodes.values()].find((n) => n.type === 'SceneNode');
    if (!scene) return;

    const key = String(scene.attributes.name ?? scene.id);
    const last = this.sceneHistory[this.sceneHistory.length - 1];
    if (!last || last.key !== key) {
      this.sceneHistory.push({ key, at: now });
    } else {
      last.at = now;
    }

    // Retain ~60s of history
    this.sceneHistory = this.sceneHistory.filter((s) => now - s.at <= 60_000);
  }

  private missingDependencyTargets(nodeId: string): string[] {
    const missing: string[] = [];
    for (const edge of this.graph.edges.values()) {
      if (edge.from !== nodeId || edge.type !== 'depends_on') continue;
      if (!this.graph.nodes.has(edge.to)) missing.push(edge.to);
    }
    return missing;
  }

  private edgesOfType(nodeId: string, type: UigEdge['type']): UigEdge[] {
    return [...this.graph.edges.values()].filter(
      (e) => e.type === type && (e.from === nodeId || e.to === nodeId),
    );
  }

  private isGraphicsReferencedByActiveScene(node: UigNode): boolean {
    const scene =
      this.graph.nodes.get('scene:current') ??
      [...this.graph.nodes.values()].find(
        (n) => n.type === 'SceneNode' && n.attributes.program === true,
      );
    if (!scene) return false;

    const layerIds = strList(scene.attributes.layerids ?? scene.attributes.layerIds);
    const graphicsId = node.id.replace(/^graphics:/, '');
    if (layerIds.includes(graphicsId) || layerIds.includes(node.id)) return true;

    // Edge: graphics → scene is_active_in, or scene → graphics is_active_in
    for (const edge of this.graph.edges.values()) {
      if (edge.type !== 'is_active_in') continue;
      if (
        (edge.from === node.id && edge.to === scene.id) ||
        (edge.from === scene.id && (edge.to === node.id || edge.to === `graphics:${graphicsId}`))
      ) {
        return true;
      }
    }
    return false;
  }
}
