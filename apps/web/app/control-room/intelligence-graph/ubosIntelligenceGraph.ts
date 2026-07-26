/**
 * UBOS Intelligence Graph (UIG) — Steps 81–85
 *
 * Live, in-memory, event-driven knowledge graph that connects every engine,
 * workspace, operator action, and system state into a single semantic model.
 *
 * Step 81: graph foundation (nodes, edges, ingest)
 * Step 82: UIG Event Normalization Layer (UENL)
 * Step 83: UIG Inference Engine (UIE) Phase 1 — rule-based reasoning
 * Step 84: Confidence Scoring Engine (CSE) — belief strength across the graph
 * Step 85: Temporal Pattern Engine (TPE) — trends, spikes, anomalies over time
 * Step 86: Predictive Engine (PE) Phase 1 — forecasting future states
 * Step 87: Insight Fusion Engine (IFE) — unified operator guidance
 * Step 88: Operator Guidance Engine (OGE) — role-aware actionable instructions
 * Step 89: Workspace Intelligence Engine (WIE) — UI highlight/dim/warn signals
 * Step 90: UI Intelligence Integration Layer (UIIL) — apply signals to real UI
 * Step 105: Workspace Intelligence Engine 2.0 (WIE 2.0) — global intelligence
 *   orchestrator: cross-workspace prediction conflict resolution, global
 *   severity scoring, role/workspace-aware focus, theme-switching decisions,
 *   and the studio-wide intelligence timeline. Sits above (consumes, does
 *   not replace) every engine listed above.
 * Step 106: Studio Intelligence 1.0 — the top-level intelligence layer.
 *   Summarizes WIE 2.0's global result into whole-studio subsystem
 *   predictions, studio health modeling, studio-wide guidance, studio-level
 *   themes, and cinematic studio-wide motion. Sits above WIE 2.0 the same
 *   way WIE 2.0 sits above WIE 1.0.
 * Step 107: Studio Automation 1.0 — UBOS's first autonomous *action* layer.
 *   Computes automation eligibility decisions (safety-gated by confidence,
 *   severity, operator opt-in, and studio health), resolves conflicts
 *   between simultaneously-eligible decisions, groups non-conflicting ones
 *   into cross-workspace sync batches, and maintains an automation
 *   timeline. Decision-only: does not dispatch real broadcast commands
 *   (see `studioAutomation.ts` module doc for why).
 *
 * Later steps expand:
 *   - UBOS Design System / Triad 2.0 theming
 */

import {
  UIGEventNormalizer,
  canonicalTypeToNodeType,
  type CanonicalUigEvent,
  type RawUigEvent,
  type UigNormalizerContext,
} from './uigEventNormalizer.js';
import {
  UIGInferenceEngine,
  type InferenceResult,
  type InferenceRunResult,
} from './uigInferenceEngine.js';
import { ConfidenceScoringEngine } from './confidenceScoringEngine.js';
import {
  TemporalPatternEngine,
  type TemporalSample,
  type TemporalTrend,
} from './temporalPatternEngine.js';
import { PredictiveEngine, type Prediction } from './predictiveEngine.js';
import {
  InsightFusionEngine,
  type FusedInsight,
} from './insightFusionEngine.js';
import {
  OperatorGuidanceEngine,
  type GuidanceAction,
  type GuidanceRole,
} from './operatorGuidanceEngine.js';
import {
  WorkspaceIntelligenceEngine,
  type UiPanelId,
  type WorkspaceUiSignal,
} from './workspaceIntelligenceEngine.js';
import {
  UIIntegrationLayer,
  type UiIntelligenceState,
} from './uiIntelligenceIntegrationLayer.js';
import {
  WorkspaceIntelligenceEngine2,
  type WieGlobalResult,
  type WorkspaceIntelligenceZone,
} from './workspaceIntelligenceEngine2.js';
import {
  StudioIntelligence,
  type StudioIntelligenceResult,
} from './studioIntelligence.js';
import {
  StudioAutomation,
  type StudioAutomationResult,
} from './studioAutomation.js';

export type UigNodeType =
  | 'SceneNode'
  | 'GraphicsNode'
  | 'AudioNode'
  | 'ReplayNode'
  | 'RoutingNode'
  | 'AutomationNode'
  | 'OutputNode'
  | 'HealthNode'
  | 'OperatorNode'
  | 'SystemNode'
  | 'PredictionNode';

export type UigEdgeType =
  | 'depends_on'
  | 'feeds_into'
  | 'affects'
  | 'predicts'
  | 'conflicts_with'
  | 'enhances'
  | 'requires'
  | 'is_active_in'
  | 'is_selected_by'
  | 'is_degraded_by';

export type UigNode = {
  id: string;
  type: UigNodeType;
  attributes: Record<string, unknown>;
  confidence: number;
  timestamp: number;
  /** Canonical event type from UENL (Step 82). */
  eventType?: string;
  source?: string;
  workspace?: string | null;
  operator?: string | null;
  lineage?: string[];
  /** Temporal Pattern Engine fields (Step 85). */
  history?: TemporalSample[];
  trend?: TemporalTrend;
  anomaly?: boolean;
  cycle?: boolean;
  spike?: boolean;
  drop?: boolean;
  smoothedConfidence?: number;
  velocity?: number;
};

export type UigEdge = {
  id: string;
  from: string;
  to: string;
  type: UigEdgeType;
  weight: number;
  timestamp: number;
  /** CSE-propagated edge confidence (Step 84). */
  confidence?: number;
};

/** Raw engine event accepted by ingest (normalized via UENL). */
export type UigEvent = RawUigEvent & {
  id?: string;
  type: UigNodeType | string;
  source: string;
  payload?: Record<string, unknown>;
};

export type UigInsightKind =
  | 'prediction'
  | 'warning'
  | 'recommendation'
  | 'guidance';

export type UigInsight = {
  id: string;
  kind: UigInsightKind;
  message: string;
  confidence: number;
  relatedNodeIds: string[];
  timestamp: number;
  rule?: string;
  emphasis?: 'critical' | 'warning' | 'info' | 'highlight';
};

export type UigSnapshot = {
  nodeCount: number;
  edgeCount: number;
  insightCount: number;
  eventCount: number;
  highlightCount: number;
  emphasisCount: number;
  avgConfidence: number;
  stability: number;
  temporal: {
    rising: number;
    falling: number;
    volatile: number;
    spikes: number;
    drops: number;
    anomalies: number;
    cycles: number;
  };
  predictionCount: number;
  latestPredictions: readonly Prediction[];
  fusedCount: number;
  latestFusedInsights: readonly FusedInsight[];
  guidanceCount: number;
  latestOperatorGuidance: readonly GuidanceAction[];
  guidanceRole: GuidanceRole | null;
  workspaceSignalCount: number;
  latestWorkspaceSignals: readonly WorkspaceUiSignal[];
  uiIntelligenceSignalCount: number;
  uiIntelligenceLastApply: number;
  nodesByType: Partial<Record<UigNodeType, number>>;
  latestInsights: readonly UigInsight[];
  latestEvents: readonly CanonicalUigEvent[];
  highlightedNodeIds: readonly string[];
  /** WIE 2.0 (Step 105) — global intelligence orchestration. */
  globalIntelligence: WieGlobalResult;
  resolvedPredictionCount: number;
  latestResolvedPredictions: readonly Prediction[];
  predictionConflictCount: number;
  globalSeverityScore: number;
  globalSeverityBand: WieGlobalResult['globalSeverityBand'];
  globalThemeModifier: WieGlobalResult['theme']['modifier'];
  latestStudioTimeline: WieGlobalResult['timeline'];
  latestRoleFocusedInsights: readonly FusedInsight[];
  /** Studio Intelligence 1.0 (Step 106) — top-level studio-wide summary. */
  studioIntelligence: StudioIntelligenceResult;
  studioHealthScore: number;
  studioHealthStatus: StudioIntelligenceResult['studioHealth']['status'];
  studioSeverityBand: StudioIntelligenceResult['studioSeverityBand'];
  studioTheme: StudioIntelligenceResult['studioTheme'];
  studioMotion: StudioIntelligenceResult['studioMotion'];
  /** Studio Automation 1.0 (Step 107) — automation eligibility decisions. */
  studioAutomation: StudioAutomationResult;
  automationEnabled: boolean;
  automationWouldExecuteCount: number;
  automationConflictCount: number;
  latestAutomationTimeline: StudioAutomationResult['timeline'];
};

export class UBOSIntelligenceGraph {
  readonly nodes = new Map<string, UigNode>();
  readonly edges = new Map<string, UigEdge>();
  readonly normalizer = new UIGEventNormalizer();
  readonly inferenceEngine = new UIGInferenceEngine(this);
  readonly confidenceEngine = new ConfidenceScoringEngine(this);
  readonly temporalEngine = new TemporalPatternEngine(this);
  readonly predictiveEngine = new PredictiveEngine(this);
  readonly fusionEngine = new InsightFusionEngine(this);
  readonly guidanceEngine = new OperatorGuidanceEngine(this);
  readonly workspaceIntelligence = new WorkspaceIntelligenceEngine(this);
  readonly uiIntegration = new UIIntegrationLayer();
  readonly workspaceIntelligence2 = new WorkspaceIntelligenceEngine2(this);
  readonly studioIntelligenceEngine = new StudioIntelligence(this);
  readonly studioAutomationEngine = new StudioAutomation(this);

  /** Latest inference results from UIE (Step 83). */
  lastInsights: InferenceResult[] = [];
  /** Latest fused operator guidance from IFE (Step 87). */
  fusedInsights: FusedInsight[] = [];
  /** Latest role-aware actions from OGE (Step 88). */
  operatorGuidance: GuidanceAction[] = [];
  /** Latest UI intelligence signals from WIE (Step 89). */
  workspaceSignals: WorkspaceUiSignal[] = [];
  /** Latest applied panel UI state from UIIL (Step 90). */
  uiIntelligence: UiIntelligenceState = this.uiIntegration.getState();
  /** Latest global intelligence result from WIE 2.0 (Step 105). */
  globalIntelligence: WieGlobalResult = this.workspaceIntelligence2.getResult();
  /** Latest studio-level result from Studio Intelligence 1.0 (Step 106). */
  studioIntelligence: StudioIntelligenceResult = this.studioIntelligenceEngine.getResult();
  /** Latest automation decisions from Studio Automation 1.0 (Step 107). */
  studioAutomation: StudioAutomationResult = this.studioAutomationEngine.getResult();

  private insights: UigInsight[] = [];
  private recentEvents: CanonicalUigEvent[] = [];
  private lastInferenceRun: InferenceRunResult | null = null;
  private readonly MAX_NODES = 200;
  private readonly MAX_EDGES = 400;
  private readonly MAX_INSIGHTS = 40;
  private readonly MAX_EVENTS = 80;

  /** Default workspace / operator / system context for UENL. */
  setContext(context: UigNormalizerContext): void {
    this.normalizer.setContext(context);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  addNode(node: UigNode): void {
    this.nodes.set(node.id, node);
    this.pruneNodes();
  }

  addEdge(edge: UigEdge): void {
    const key = edge.id || `${edge.from}->${edge.to}:${edge.type}`;
    this.edges.set(key, { ...edge, id: key });
    this.pruneEdges();
  }

  ingest(event: UigEvent): UigNode {
    const node = this.materialize(event);
    this.reweightAllEdges();
    this.runInference();
    return node;
  }

  /** Ingest many engine signals in one pass; inference runs once at the end. */
  ingestBatch(events: UigEvent[]): void {
    for (const event of events) {
      this.materialize(event);
    }
    this.reweightAllEdges();
    this.runInference();
  }

  /**
   * Normalize → CSE score → TPE history/patterns → node/edges.
   * Shared by ingest / ingestBatch.
   */
  private materialize(event: UigEvent): UigNode {
    const normalized = this.normalizer.normalize(event);
    const canonical = this.confidenceEngine.applyToEvent(normalized);
    this.rememberEvent(canonical);

    let node = this.nodeFromCanonical(canonical);
    node = this.confidenceEngine.applyToNode(node, canonical.confidence);
    // Preserve prior history via TPE.update (reads existing node before replace)
    node = this.temporalEngine.update(node);
    this.addNode(node);

    const derivedEdges = this.deriveEdges(node);
    for (const edge of derivedEdges) {
      this.addEdge(this.confidenceEngine.applyToEdge(edge));
    }
    return node;
  }

  private reweightAllEdges(): void {
    for (const [key, edge] of this.edges) {
      this.edges.set(key, this.confidenceEngine.applyToEdge(edge));
    }
  }

  // ── Normalization (Step 82 — delegates to UENL) ───────────────────────────

  /** Normalize a raw engine event into the canonical UIG event format. */
  normalizeRawEvent(event: UigEvent | RawUigEvent): CanonicalUigEvent {
    return this.normalizer.normalize(event);
  }

  /**
   * Legacy helper: raw event → graph node (via UENL).
   * Prefer normalizeRawEvent + nodeFromCanonical for Step 82+ callers.
   */
  normalizeEvent(event: UigEvent): UigNode {
    return this.nodeFromCanonical(this.normalizer.normalize(event));
  }

  nodeFromCanonical(event: CanonicalUigEvent): UigNode {
    return {
      id: event.id,
      type: canonicalTypeToNodeType(event.type),
      eventType: event.type,
      source: event.source,
      workspace: event.workspace,
      operator: event.operator,
      lineage: event.lineage,
      attributes: {
        ...event.attributes,
        event_type: event.type,
        // Preserve payload `source` (e.g. route endpoint); engine name lives here
        engine_source: event.source,
        workspace: event.workspace,
        operator: event.operator,
        lineage: event.lineage,
      },
      timestamp: event.timestamp,
      confidence: event.confidence,
    };
  }

  // ── Edge derivation (foundation — Step 83+ expands) ───────────────────────

  deriveEdges(node: UigNode): UigEdge[] {
    const now = Date.now();
    const edges: UigEdge[] = [];
    const attr = node.attributes;

    const link = (
      to: string | undefined,
      type: UigEdgeType,
      weight = 1,
    ): void => {
      if (!to || to === node.id) return;
      edges.push({
        id: `${node.id}->${to}:${type}`,
        from: node.id,
        to,
        type,
        weight,
        timestamp: now,
      });
    };

    switch (node.type) {
      case 'SceneNode': {
        const layerIds = Array.isArray(attr.layerids)
          ? (attr.layerids as string[])
          : Array.isArray(attr.layerIds)
            ? (attr.layerIds as string[])
            : [];
        for (const layerId of layerIds) {
          link(`graphics:${layerId}`, 'is_active_in', 0.9);
        }
        if (attr.program === true) {
          link('output:program', 'feeds_into', 1.0);
        }
        break;
      }
      case 'GraphicsNode': {
        const sceneId =
          typeof attr.sceneid === 'string'
            ? attr.sceneid
            : typeof attr.sceneId === 'string'
              ? attr.sceneId
              : null;
        link(sceneId ? `scene:${sceneId}` : 'scene:current', 'is_active_in', 0.8);
        link('output:program', 'feeds_into', 0.7);
        if (typeof attr.conflicts_with === 'string') {
          link(attr.conflicts_with, 'conflicts_with', 1.0);
        } else if (Array.isArray(attr.conflicts_with)) {
          for (const other of attr.conflicts_with) {
            if (typeof other === 'string') link(other, 'conflicts_with', 1.0);
          }
        }
        break;
      }
      case 'AudioNode':
        link('output:program', 'feeds_into', 0.9);
        if ((attr.peak as number | undefined) !== undefined && (attr.peak as number) > 0.9) {
          link('health:audio', 'is_degraded_by', 0.95);
        }
        break;
      case 'ReplayNode': {
        const cameraId =
          typeof attr.cameraid === 'string'
            ? attr.cameraid
            : typeof attr.cameraId === 'string'
              ? attr.cameraId
              : undefined;
        link(cameraId ? `system:camera:${cameraId}` : undefined, 'depends_on', 0.8);
        break;
      }
      case 'RoutingNode':
        if (typeof attr.source === 'string') {
          link(`system:source:${attr.source}`, 'depends_on', 1.0);
        }
        if (typeof attr.destination === 'string') {
          link(`system:dest:${attr.destination}`, 'feeds_into', 1.0);
        }
        if (attr.broken === true) link('health:routing', 'is_degraded_by', 1.0);
        break;
      case 'AutomationNode':
        if (typeof attr.target === 'string') link(attr.target as string, 'affects', 0.85);
        break;
      case 'OutputNode': {
        link('scene:current', 'depends_on', 0.9);
        const dropped =
          typeof attr.droppedframes === 'number'
            ? attr.droppedframes
            : typeof attr.droppedFrames === 'number'
              ? attr.droppedFrames
              : 0;
        if (dropped > 0) {
          link('health:output', 'is_degraded_by', 0.9);
        }
        break;
      }
      case 'HealthNode':
        if (attr.status === 'error' || attr.status === 'warning') {
          const subsystem = typeof attr.subsystem === 'string' ? attr.subsystem : 'system';
          link(`system:${subsystem}`, 'is_degraded_by', attr.status === 'error' ? 1.0 : 0.6);
        }
        break;
      case 'OperatorNode': {
        const workspaceId =
          typeof attr.workspaceid === 'string'
            ? attr.workspaceid
            : typeof attr.workspaceId === 'string'
              ? attr.workspaceId
              : typeof node.workspace === 'string'
                ? node.workspace
                : undefined;
        if (workspaceId) {
          link(`system:workspace:${workspaceId}`, 'is_selected_by', 1.0);
        }
        break;
      }
      case 'PredictionNode': {
        const targetId =
          typeof attr.targetid === 'string'
            ? attr.targetid
            : typeof attr.targetId === 'string'
              ? attr.targetId
              : undefined;
        if (targetId) link(targetId, 'predicts', node.confidence);
        break;
      }
      default:
        break;
    }

    return edges;
  }

  // ── Inference + Prediction (Steps 83–86) ──────────────────────────────────

  runInference(): InferenceRunResult {
    const run = this.inferenceEngine.run();

    // Predictive Engine Phase 1 — forecast future states
    const predictions = this.predictiveEngine.run();
    const predictionResults = this.predictiveEngine.toInferenceResults(predictions);

    // Merge UIE + PE, then CSE refinement + noise filter
    const merged = [...run.results, ...predictionResults];
    const refinedResults: InferenceResult[] = [];
    for (const result of merged) {
      const refined = this.confidenceEngine.refineInsight(result);
      if (refined) refinedResults.push(refined);
    }
    refinedResults.sort((a, b) => b.confidence - a.confidence || b.timestamp - a.timestamp);

    const refinedInsights: UigInsight[] = [];
    for (const result of refinedResults) {
      let kind: UigInsightKind | null = null;
      if (result.kind === 'warning') kind = 'warning';
      else if (result.kind === 'prediction') kind = 'prediction';
      else if (result.kind === 'guidance') kind = 'guidance';
      else if (result.kind === 'recommendation' || result.kind === 'insight') kind = 'recommendation';
      if (!kind) continue;
      const insight: UigInsight = {
        id: result.id,
        kind,
        message: result.message,
        confidence: result.confidence,
        relatedNodeIds: result.relatedNodeIds,
        timestamp: result.timestamp,
        rule: result.rule,
      };
      if (result.emphasis) insight.emphasis = result.emphasis;
      refinedInsights.push(insight);
    }

    const refinedRun: InferenceRunResult = {
      results: refinedResults,
      insights: refinedInsights,
      highlights: refinedResults.filter((r) => r.kind === 'workspace_highlight'),
      emphasis: refinedResults.filter((r) => r.kind === 'ui_emphasis'),
      automationTriggers: refinedResults.filter((r) => r.kind === 'automation_trigger'),
    };

    this.lastInsights = refinedRun.results;
    this.lastInferenceRun = refinedRun;
    this.insights = refinedInsights.slice(0, this.MAX_INSIGHTS);

    // Insight Fusion Engine — unify into operator-facing guidance
    this.fusedInsights = this.fusionEngine.fuse(
      refinedRun.results,
      this.predictiveEngine.getPredictions() as Prediction[],
    );

    // Operator Guidance Engine — role/workspace-specific actions
    this.operatorGuidance = this.guidanceEngine.generate();

    // Workspace Intelligence Engine — UI highlight/dim/warn/pulse signals
    this.workspaceSignals = this.workspaceIntelligence.compute();

    // UI Intelligence Integration Layer — apply signals to panel UI state
    this.uiIntelligence = this.uiIntegration.apply(this.workspaceSignals);

    // Workspace Intelligence Engine 2.0 — global cross-workspace orchestration
    this.globalIntelligence = this.workspaceIntelligence2.compute();

    // Studio Intelligence 1.0 — top-level studio-wide summary
    this.studioIntelligence = this.studioIntelligenceEngine.compute(this.globalIntelligence);

    // Studio Automation 1.0 — automation eligibility decisions
    this.studioAutomation = this.studioAutomationEngine.compute();

    return refinedRun;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getNode(id: string): UigNode | undefined {
    return this.nodes.get(id);
  }

  getNodes(): readonly UigNode[] {
    return [...this.nodes.values()];
  }

  getNodesByType(type: UigNodeType): readonly UigNode[] {
    return [...this.nodes.values()].filter((n) => n.type === type);
  }

  getEdges(): readonly UigEdge[] {
    return [...this.edges.values()];
  }

  getEdgesFor(nodeId: string): readonly UigEdge[] {
    return [...this.edges.values()].filter((e) => e.from === nodeId || e.to === nodeId);
  }

  getInsights(): readonly UigInsight[] {
    return this.insights;
  }

  getRecentEvents(): readonly CanonicalUigEvent[] {
    return this.recentEvents;
  }

  getInferenceResults(): readonly InferenceResult[] {
    return this.lastInsights;
  }

  getHighlightedNodeIds(): readonly string[] {
    const ids = new Set<string>();
    for (const highlight of this.lastInferenceRun?.highlights ?? []) {
      for (const id of highlight.relatedNodeIds) ids.add(id);
    }
    return [...ids];
  }

  getUiEmphasis(): readonly InferenceResult[] {
    return this.lastInferenceRun?.emphasis ?? [];
  }

  getAutomationTriggers(): readonly InferenceResult[] {
    return this.lastInferenceRun?.automationTriggers ?? [];
  }

  getPredictions(): readonly Prediction[] {
    return this.predictiveEngine.getPredictions();
  }

  /** Alias used by IFE skeleton / external callers. */
  get lastPredictions(): readonly Prediction[] {
    return this.predictiveEngine.getPredictions();
  }

  getFusedInsights(): readonly FusedInsight[] {
    return this.fusedInsights;
  }

  getTopFusedInsights(limit = 3): readonly FusedInsight[] {
    return this.fusionEngine.getTopInsights(limit);
  }

  /** Generate / refresh role-aware operator guidance (Step 88). */
  generateOperatorGuidance(role?: string | null, workspace?: string | null): GuidanceAction[] {
    this.operatorGuidance = this.guidanceEngine.generate(role, workspace);
    this.workspaceSignals = this.workspaceIntelligence.compute(role, workspace);
    this.uiIntelligence = this.uiIntegration.apply(this.workspaceSignals);
    this.globalIntelligence = this.workspaceIntelligence2.compute(role, workspace);
    this.studioIntelligence = this.studioIntelligenceEngine.compute(this.globalIntelligence);
    this.studioAutomation = this.studioAutomationEngine.compute();
    return this.operatorGuidance;
  }

  getOperatorGuidance(): readonly GuidanceAction[] {
    return this.operatorGuidance;
  }

  getTopOperatorGuidance(limit = 3): readonly GuidanceAction[] {
    return this.guidanceEngine.getTopGuidance(limit);
  }

  /** Compute / refresh UI intelligence signals (Step 89) and apply via UIIL (Step 90). */
  computeWorkspaceSignals(role?: string | null, workspace?: string | null): WorkspaceUiSignal[] {
    this.workspaceSignals = this.workspaceIntelligence.compute(role, workspace);
    this.uiIntelligence = this.uiIntegration.apply(this.workspaceSignals);
    this.globalIntelligence = this.workspaceIntelligence2.compute(role, workspace);
    this.studioIntelligence = this.studioIntelligenceEngine.compute(this.globalIntelligence);
    this.studioAutomation = this.studioAutomationEngine.compute();
    return this.workspaceSignals;
  }

  /** Latest global intelligence result from WIE 2.0 (Step 105). */
  getGlobalIntelligence(): WieGlobalResult {
    return this.globalIntelligence;
  }

  /** Recompute WIE 2.0's global intelligence result on demand (Step 105). */
  computeGlobalIntelligence(role?: string | null, workspace?: string | null): WieGlobalResult {
    this.globalIntelligence = this.workspaceIntelligence2.compute(role, workspace);
    this.studioIntelligence = this.studioIntelligenceEngine.compute(this.globalIntelligence);
    return this.globalIntelligence;
  }

  /** Workspace-aware intelligence focus for one of the five canonical zones (Step 105). */
  getWorkspaceIntelligenceFocus(zone: WorkspaceIntelligenceZone, limit?: number) {
    return this.workspaceIntelligence2.workspaceFocus(zone, limit);
  }

  /** Latest studio-level result from Studio Intelligence 1.0 (Step 106). */
  getStudioIntelligence(): StudioIntelligenceResult {
    return this.studioIntelligence;
  }

  /** Recompute Studio Intelligence 1.0's summary on demand (Step 106). */
  computeStudioIntelligence(): StudioIntelligenceResult {
    this.studioIntelligence = this.studioIntelligenceEngine.compute(this.globalIntelligence);
    return this.studioIntelligence;
  }

  /** Latest automation decisions from Studio Automation 1.0 (Step 107). */
  getStudioAutomation(): StudioAutomationResult {
    return this.studioAutomation;
  }

  /** Recompute Studio Automation 1.0's decisions on demand (Step 107). */
  computeStudioAutomation(): StudioAutomationResult {
    this.studioAutomation = this.studioAutomationEngine.compute();
    return this.studioAutomation;
  }

  getWorkspaceSignals(): readonly WorkspaceUiSignal[] {
    return this.workspaceSignals;
  }

  getPanelUiAction(panel: UiPanelId) {
    return this.uiIntegration.getPanelAction(panel) ?? this.workspaceIntelligence.getPanelAction(panel);
  }

  /** Applied panel UI state from UIIL (Step 90). */
  getUiIntelligence(): UiIntelligenceState {
    return this.uiIntelligence;
  }

  /** CSS class string for a geometry zone wrapper. */
  getZoneUiClassName(zoneId: string): string {
    return this.uiIntegration.classNameForZone(zoneId);
  }

  /** CSS class string for a WIE panel id. */
  getPanelUiClassName(panel: UiPanelId): string {
    return this.uiIntegration.classNameForPanel(panel);
  }

  getSnapshot(): UigSnapshot {
    const nodesByType: Partial<Record<UigNodeType, number>> = {};
    let confidenceSum = 0;
    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] ?? 0) + 1;
      confidenceSum += node.confidence;
    }
    const highlightedNodeIds = this.getHighlightedNodeIds();
    const avgConfidence = this.nodes.size > 0 ? confidenceSum / this.nodes.size : 0;
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      insightCount: this.insights.length,
      eventCount: this.recentEvents.length,
      highlightCount: this.lastInferenceRun?.highlights.length ?? 0,
      emphasisCount: this.lastInferenceRun?.emphasis.length ?? 0,
      avgConfidence,
      stability: this.confidenceEngine.stabilityScore(),
      temporal: this.temporalEngine.getSummary(),
      predictionCount: this.predictiveEngine.getPredictions().length,
      latestPredictions: this.predictiveEngine.getPredictions().slice(0, 8),
      fusedCount: this.fusedInsights.length,
      latestFusedInsights: this.fusedInsights.slice(0, 5),
      guidanceCount: this.operatorGuidance.length,
      latestOperatorGuidance: this.operatorGuidance.slice(0, 5),
      guidanceRole: this.guidanceEngine.getContext().role,
      workspaceSignalCount: this.workspaceSignals.length,
      latestWorkspaceSignals: this.workspaceSignals.slice(0, 10),
      uiIntelligenceSignalCount: this.uiIntelligence.signalCount,
      uiIntelligenceLastApply: this.uiIntelligence.lastApply,
      nodesByType,
      latestInsights: this.insights.slice(0, 8),
      latestEvents: this.recentEvents.slice(0, 10),
      highlightedNodeIds,
      globalIntelligence: this.globalIntelligence,
      resolvedPredictionCount: this.globalIntelligence.resolvedPredictions.length,
      latestResolvedPredictions: this.globalIntelligence.resolvedPredictions.slice(0, 8),
      predictionConflictCount: this.globalIntelligence.conflicts.length,
      globalSeverityScore: this.globalIntelligence.globalSeverityScore,
      globalSeverityBand: this.globalIntelligence.globalSeverityBand,
      globalThemeModifier: this.globalIntelligence.theme.modifier,
      latestStudioTimeline: this.globalIntelligence.timeline.slice(0, 10),
      latestRoleFocusedInsights: this.globalIntelligence.roleFocusedInsights,
      studioIntelligence: this.studioIntelligence,
      studioHealthScore: this.studioIntelligence.studioHealth.score,
      studioHealthStatus: this.studioIntelligence.studioHealth.status,
      studioSeverityBand: this.studioIntelligence.studioSeverityBand,
      studioTheme: this.studioIntelligence.studioTheme,
      studioMotion: this.studioIntelligence.studioMotion,
      studioAutomation: this.studioAutomation,
      automationEnabled: this.studioAutomation.automationEnabled,
      automationWouldExecuteCount: this.studioAutomation.winners.length,
      automationConflictCount: this.studioAutomation.conflicts.length,
      latestAutomationTimeline: this.studioAutomation.timeline,
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.insights = [];
    this.recentEvents = [];
    this.lastInsights = [];
    this.lastInferenceRun = null;
    this.fusedInsights = [];
    this.operatorGuidance = [];
    this.workspaceSignals = [];
    this.confidenceEngine.reset();
    this.temporalEngine.reset();
    this.predictiveEngine.reset();
    this.fusionEngine.reset();
    this.guidanceEngine.reset();
    this.workspaceIntelligence.reset();
    this.uiIntegration.reset();
    this.uiIntelligence = this.uiIntegration.getState();
    this.workspaceIntelligence2.reset();
    this.globalIntelligence = this.workspaceIntelligence2.getResult();
    this.studioIntelligenceEngine.reset();
    this.studioIntelligence = this.studioIntelligenceEngine.getResult();
    this.studioAutomationEngine.reset();
    this.studioAutomation = this.studioAutomationEngine.getResult();
  }

  // ── Pruning ───────────────────────────────────────────────────────────────

  private rememberEvent(event: CanonicalUigEvent): void {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.MAX_EVENTS) {
      this.recentEvents = this.recentEvents.slice(0, this.MAX_EVENTS);
    }
  }

  private pruneNodes(): void {
    if (this.nodes.size <= this.MAX_NODES) return;
    const sorted = [...this.nodes.values()].sort((a, b) => a.timestamp - b.timestamp);
    const removeCount = this.nodes.size - this.MAX_NODES;
    for (let i = 0; i < removeCount; i++) {
      const node = sorted[i];
      if (!node) continue;
      this.nodes.delete(node.id);
      for (const [key, edge] of this.edges) {
        if (edge.from === node.id || edge.to === node.id) this.edges.delete(key);
      }
    }
  }

  private pruneEdges(): void {
    if (this.edges.size <= this.MAX_EDGES) return;
    const sorted = [...this.edges.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const removeCount = this.edges.size - this.MAX_EDGES;
    for (let i = 0; i < removeCount; i++) {
      const entry = sorted[i];
      if (entry) this.edges.delete(entry[0]);
    }
  }
}
