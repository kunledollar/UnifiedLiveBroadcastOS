/**
 * Workspace Intelligence Engine 2.0 (WIE 2.0) — Step 105
 *
 * The global intelligence orchestrator of UBOS. Where WIE 1.0
 * (`workspaceIntelligenceEngine.ts`, Step 89) converts fused insights into
 * per-panel UI signals for the *current* workspace/role, WIE 2.0 sits one
 * level above it and fuses across the whole studio:
 *
 *   - cross-workspace prediction fusion + conflict resolution
 *   - global severity scoring (0.0-1.0 confidence → 5 named bands)
 *   - role-aware intelligence (delegates to WIE 1.0's existing
 *     `isRelevantToRole`, does not re-derive role/cluster relevance)
 *   - workspace-aware intelligence (Triad/Inspector/Program Output/Replay/
 *     Streaming each get a distinct focus over the same underlying signals)
 *   - theme-switching decisions (a severity-driven modifier, complementing
 *     Step 103's per-signal `ubosIntelligenceThemeMap` with a *global*
 *     severity-driven one)
 *   - HUD 2.0 intelligence routing (resolved predictions feed HUD's
 *     Primary Insight zone instead of the raw, possibly-conflicting
 *     Predictive Engine feed — see `routeGlobalIntelligenceToHud` in
 *     `../hud/hudIntelligence.ts`)
 *   - a studio-wide intelligence timeline, extending Step 104's HUD
 *     timeline with an explicit "output health changes" source drawn from
 *     the Temporal Pattern Engine's (Step 85) spike/drop/anomaly node
 *     fields, not just fused insights/predictions
 *
 * Kept dependency-free (no React, no `@ubos/ui`) so it is unit-testable the
 * same way the rest of the intelligence-graph package is (`node:test`, no
 * DOM/renderer) — exactly like Predictive Engine (86), Insight Fusion
 * Engine (87), Operator Guidance Engine (88), and WIE 1.0 (89). WIE 2.0
 * intentionally has *no* dependency on `../hud/hudIntelligence.ts`: HUD 2.0
 * (Step 104) is an application-layer consumer of this engine, not the
 * other way around — the same layering every other engine already follows
 * (`intelligence-graph/` is read by `hud/`, `zones/`, and workspace shells,
 * never the reverse).
 */
import type { UBOSIntelligenceGraph, UigNode } from './ubosIntelligenceGraph.js';
import type { Prediction, PredictionCategory } from './predictiveEngine.js';
import type { FusedInsight, FusionCluster } from './insightFusionEngine.js';
import type { GuidanceAction, GuidanceRole } from './operatorGuidanceEngine.js';
import { normalizeRole } from './operatorGuidanceEngine.js';
import type { InferenceResult } from './uigInferenceEngine.js';

// ── Global severity scoring ─────────────────────────────────────────────────

export type SeverityBand = 'informational' | 'low' | 'medium' | 'high' | 'critical';

export const SEVERITY_BANDS: readonly SeverityBand[] = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
];

/**
 * Step 105's exact banding thresholds. Upper bound of each band is
 * exclusive except the top band (0.8-1.0 is inclusive of 1.0) — i.e. a
 * score of exactly 0.2 is `low`, not `informational`, and exactly 0.8 is
 * `critical`, not `high`, matching "0.2-0.4 → low" / "0.8-1.0 → critical"
 * read as half-open intervals against neighboring bands.
 */
export function scoreSeverityBand(score: number): SeverityBand {
  const clamped = Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0;
  if (clamped < 0.2) return 'informational';
  if (clamped < 0.4) return 'low';
  if (clamped < 0.6) return 'medium';
  if (clamped < 0.8) return 'high';
  return 'critical';
}

/**
 * Mirrors `UbosThemeIntelligenceAction` from `@ubos/ui`'s `themes.ts`
 * (Step 103) as a local string union rather than a cross-package import —
 * WIE 2.0 stays framework/package-free like every other intelligence
 * engine; the UI layer (Step 103's theme tokens, Step 104's HUD) already
 * owns the *rendering* of these modifier names.
 */
export type ThemeModifierId =
  | 'increaseAccentIntensity'
  | 'switchToCriticalVariant'
  | 'enablePredictiveMotion'
  | 'enableGradientShift'
  | 'reduceAccentIntensity'
  | 'collapseOverlays'
  | 'increaseDepthAndSpacing';

export type MotionIntensity = 'none' | 'subtle' | 'moderate' | 'strong' | 'critical';

export type SeverityImplication = {
  /** UBDS elevation level (0-4, Step 94) this severity band should render at. */
  elevation: 0 | 1 | 2 | 3 | 4;
  motionIntensity: MotionIntensity;
  /** Whether HUD 2.0 should visually emphasize signals at this band. */
  hudEmphasis: boolean;
  /** Whether a panel carrying this severity should highlight. */
  panelHighlight: boolean;
  /** Global theme modifier this severity band should drive, if any. */
  themeModifier: ThemeModifierId | null;
};

export const SEVERITY_IMPLICATIONS: Record<SeverityBand, SeverityImplication> = {
  informational: {
    elevation: 0,
    motionIntensity: 'none',
    hudEmphasis: false,
    panelHighlight: false,
    themeModifier: null,
  },
  low: {
    elevation: 1,
    motionIntensity: 'subtle',
    hudEmphasis: false,
    panelHighlight: false,
    themeModifier: 'reduceAccentIntensity',
  },
  medium: {
    elevation: 2,
    motionIntensity: 'moderate',
    hudEmphasis: true,
    panelHighlight: false,
    themeModifier: 'enableGradientShift',
  },
  high: {
    elevation: 3,
    motionIntensity: 'strong',
    hudEmphasis: true,
    panelHighlight: true,
    themeModifier: 'increaseAccentIntensity',
  },
  critical: {
    elevation: 4,
    motionIntensity: 'critical',
    hudEmphasis: true,
    panelHighlight: true,
    themeModifier: 'switchToCriticalVariant',
  },
};

/** Severity implication for a raw confidence-style score (0-1). */
export function severityImplicationsFor(score: number): SeverityImplication {
  return SEVERITY_IMPLICATIONS[scoreSeverityBand(score)];
}

export type ThemeDecision = {
  band: SeverityBand;
  modifier: ThemeModifierId | null;
};

/**
 * Theme-switching decision (Step 105) — distinct from, and complementary
 * to, Step 103's `ubosIntelligenceThemeMap` (which reacts to a single WIE
 * 1.0 per-panel action). This reacts to the *global* severity score across
 * the whole studio, so a critical signal anywhere escalates the active
 * theme even if the operator's current panel focus is calm.
 */
export function decideThemeModifier(globalSeverityScore: number): ThemeDecision {
  const band = scoreSeverityBand(globalSeverityScore);
  return { band, modifier: SEVERITY_IMPLICATIONS[band].themeModifier };
}

// ── Cross-workspace prediction fusion + conflict resolution ────────────────

/**
 * Two predictions are in conflict when they are about the *same*
 * underlying resource (share a node id) but disagree on *what* is about to
 * happen to it (different categories) within a short window of each
 * other — e.g. the spec's example: a predicted graphics activation and a
 * predicted scene transition both targeting the scene currently on
 * Program. Same-category predictions about the same node are not a
 * conflict, they are corroboration.
 */
const CONFLICT_WINDOW_MS = 4000;

export type PredictionConflict = {
  winner: Prediction;
  loser: Prediction;
  reason: string;
};

export function predictionsConflict(a: Prediction, b: Prediction): boolean {
  if (a.id === b.id) return false;
  if (a.category === b.category) return false;
  if (Math.abs(a.timestamp - b.timestamp) > CONFLICT_WINDOW_MS) return false;

  const aTargets = new Set([a.nodeId, ...a.relatedNodeIds]);
  if (b.nodeId && aTargets.has(b.nodeId)) return true;
  return b.relatedNodeIds.some((id) => aTargets.has(id));
}

/**
 * Resolves every pairwise conflict by keeping the higher-confidence
 * prediction and marking the other superseded. `resolved` is the
 * de-duplicated feed HUD 2.0's Primary Insight zone should render;
 * `conflicts` is kept for Inspector 2.0-style deep diagnostics / testing.
 */
export function resolvePredictionConflicts(predictions: readonly Prediction[]): {
  resolved: Prediction[];
  conflicts: PredictionConflict[];
} {
  const superseded = new Set<string>();
  const conflicts: PredictionConflict[] = [];

  for (let i = 0; i < predictions.length; i += 1) {
    for (let j = i + 1; j < predictions.length; j += 1) {
      const a = predictions[i]!;
      const b = predictions[j]!;
      if (!predictionsConflict(a, b)) continue;

      const winner = a.confidence >= b.confidence ? a : b;
      const loser = winner === a ? b : a;
      if (superseded.has(loser.id)) continue;

      superseded.add(loser.id);
      conflicts.push({
        winner,
        loser,
        reason:
          `${loser.category} (${Math.round(loser.confidence * 100)}%) superseded by ` +
          `${winner.category} (${Math.round(winner.confidence * 100)}%) — overlapping ` +
          `target within ${CONFLICT_WINDOW_MS}ms`,
      });
    }
  }

  return {
    resolved: predictions.filter((p) => !superseded.has(p.id)),
    conflicts,
  };
}

// ── Role-aware intelligence ─────────────────────────────────────────────────

/**
 * Minimal surface this module needs from WIE 1.0 — its exact
 * `isRelevantToRole` method — so role relevance is computed exactly once,
 * not re-derived. Kept as a narrow interface (not the concrete class) so
 * tests can pass a fake, matching the `HudIntelligenceSource`/
 * `TriadIntelligenceSource` convention already used by the application
 * layer.
 */
export interface RoleRelevanceSource {
  isRelevantToRole(insight: FusedInsight, role: GuidanceRole): boolean;
}

/**
 * Role-aware intelligence (Step 105) — per the spec: Director cares about
 * transitions/timing/scene flow, Graphics about layer conflicts/activation
 * timing, Audio about clipping/routing/peaks, Replay about clip timing/
 * angle selection, Streaming about output health/destination stability.
 * That relevance judgment already exists on WIE 1.0 (`isRelevantToRole`,
 * Step 89) — this is the ranked, limited view for "what should the current
 * role see right now", not a second relevance model.
 */
export function roleFocusedInsights(
  role: GuidanceRole,
  fusedInsights: readonly FusedInsight[],
  source: RoleRelevanceSource,
  limit = 5,
): FusedInsight[] {
  return fusedInsights.filter((insight) => source.isRelevantToRole(insight, role)).slice(0, limit);
}

// ── Workspace-aware intelligence ────────────────────────────────────────────

/**
 * The five workspace/zone identities the Step 105 spec names explicitly.
 * Deliberately distinct from `GuidanceRole` (Director/Graphics Operator/
 * Audio Engineer/...) — these are *zones* (Triad, Inspector, Program
 * Output, Replay, Streaming), not operator roles; Director/Graphics/Audio
 * Workspace intelligence is already covered by role-aware intelligence
 * above, since each of those workspaces maps 1:1 onto its matching role.
 */
export type WorkspaceIntelligenceZone = 'triad' | 'inspector' | 'programOutput' | 'replay' | 'streaming';

export const WORKSPACE_INTELLIGENCE_ZONES: readonly WorkspaceIntelligenceZone[] = [
  'triad',
  'inspector',
  'programOutput',
  'replay',
  'streaming',
];

/**
 * Which fused-insight clusters each zone focuses on, per the spec: Triad →
 * fused scene/graphics/audio, Inspector → deep diagnostics (every
 * cluster), Program Output → output health, Streaming → destination
 * stability (routing-led, output as secondary). Replay has no dedicated
 * `FusionCluster` today (Step 87 defines eight clusters, none named
 * "replay") — introducing one would ripple through IFE/OGE/WIE 1.0's
 * cluster tables, which is a foundation change out of scope here. Replay's
 * spec bullet is "time-based predictions" anyway, not a cluster filter, so
 * it is handled separately in `workspaceFocusedPredictions` below by
 * sorting chronologically rather than filtering by cluster.
 */
export const WORKSPACE_ZONE_CLUSTERS: Readonly<
  Record<WorkspaceIntelligenceZone, readonly FusionCluster[] | 'all'>
> = {
  triad: ['scene', 'graphics', 'audio'],
  inspector: 'all',
  programOutput: ['output'],
  replay: [],
  streaming: ['routing', 'output'],
};

export function workspaceFocusedInsights(
  zone: WorkspaceIntelligenceZone,
  fusedInsights: readonly FusedInsight[],
  limit = 5,
): FusedInsight[] {
  const clusters = WORKSPACE_ZONE_CLUSTERS[zone];
  if (clusters === 'all') return fusedInsights.slice(0, limit);
  if (clusters.length === 0) return [];
  return fusedInsights.filter((insight) => clusters.includes(insight.cluster)).slice(0, limit);
}

/**
 * Mirrors `InsightFusionEngine.clusterFromPredictionCategory` (Step 87)
 * exactly, duplicated locally rather than imported — the same small,
 * deliberate duplication already used by `workspaceIntelligenceEngine.ts`
 * (Step 89) and `uiIntelligenceIntegrationLayer.ts` (Step 90) for their own
 * priority tables, keeping this engine decoupled from IFE's instance
 * methods.
 */
const PREDICTION_CATEGORY_CLUSTER: Record<PredictionCategory, FusionCluster> = {
  scene_transition: 'scene',
  graphics_activation: 'graphics',
  audio_clipping: 'audio',
  routing_failure: 'routing',
  output_degradation: 'output',
  operator_action: 'operator',
  automation_trigger: 'automation',
};

export function workspaceFocusedPredictions(
  zone: WorkspaceIntelligenceZone,
  predictions: readonly Prediction[],
  limit = 5,
): Prediction[] {
  if (zone === 'replay') {
    // "Time-based predictions" — Replay cares about *when*, not domain.
    return [...predictions].sort((a, b) => a.timestamp - b.timestamp).slice(0, limit);
  }
  const clusters = WORKSPACE_ZONE_CLUSTERS[zone];
  if (clusters === 'all') return predictions.slice(0, limit);
  if (clusters.length === 0) return [];
  return predictions
    .filter((prediction) => clusters.includes(PREDICTION_CATEGORY_CLUSTER[prediction.category]))
    .slice(0, limit);
}

// ── Studio-wide intelligence timeline ───────────────────────────────────────

export type IntelligenceTimelineEntryKind =
  | 'prediction'
  | 'guidance'
  | 'insight'
  | 'automation'
  | 'output_health';

export type IntelligenceTimelineEntry = {
  id: string;
  kind: IntelligenceTimelineEntryKind;
  message: string;
  confidence: number;
  timestamp: number;
  severityBand: SeverityBand;
};

/**
 * "Output health changes" (Step 105's fifth timeline source, absent from
 * Step 104's simpler HUD timeline) drawn directly from the Temporal
 * Pattern Engine's (Step 85) `spike`/`drop`/`anomaly` fields already
 * carried on every `UigNode` — no new tracking, just a new read of
 * already-computed state.
 */
function outputHealthTimelineEntries(outputNodes: readonly UigNode[]): IntelligenceTimelineEntry[] {
  const entries: IntelligenceTimelineEntry[] = [];
  for (const node of outputNodes) {
    let change: string | null = null;
    if (node.spike) change = 'spike';
    else if (node.drop) change = 'drop';
    else if (node.anomaly) change = 'anomaly';
    if (!change) continue;

    entries.push({
      id: `output-health-${node.id}-${change}-${node.timestamp}`,
      kind: 'output_health',
      message: `Output health ${change} detected on ${node.id}`,
      confidence: node.confidence,
      timestamp: node.timestamp,
      severityBand: scoreSeverityBand(node.confidence),
    });
  }
  return entries;
}

/**
 * Merges predicted events, operator actions, fused insights, automation
 * triggers, and output health changes into one chronological, studio-wide
 * feed — the superset Step 104's `selectTimelineEntries` (HUD-only) draws
 * its HUD Timeline zone content from via `routeGlobalIntelligenceToHud`
 * (`../hud/hudIntelligence.ts`).
 */
export function buildStudioTimeline(
  resolvedPredictions: readonly Prediction[],
  guidance: readonly GuidanceAction[],
  fusedInsights: readonly FusedInsight[],
  automationTriggers: readonly InferenceResult[],
  outputNodes: readonly UigNode[],
  limit = 12,
): IntelligenceTimelineEntry[] {
  const entries: IntelligenceTimelineEntry[] = [
    ...resolvedPredictions.map((prediction) => ({
      id: `pred-${prediction.id}`,
      kind: 'prediction' as const,
      message: prediction.message,
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      severityBand: scoreSeverityBand(prediction.confidence),
    })),
    ...guidance.map((action) => ({
      id: `guide-${action.id}`,
      kind: 'guidance' as const,
      message: action.message,
      confidence: action.confidence,
      timestamp: action.timestamp,
      severityBand: scoreSeverityBand(action.confidence),
    })),
    ...fusedInsights.map((insight) => ({
      id: `insight-${insight.id}`,
      kind: 'insight' as const,
      message: insight.message,
      confidence: insight.confidence,
      timestamp: insight.timestamp,
      severityBand: scoreSeverityBand(insight.confidence),
    })),
    ...automationTriggers.map((trigger) => ({
      id: `auto-${trigger.id}`,
      kind: 'automation' as const,
      message: trigger.message,
      confidence: trigger.confidence,
      timestamp: trigger.timestamp,
      severityBand: scoreSeverityBand(trigger.confidence),
    })),
    ...outputHealthTimelineEntries(outputNodes),
  ];

  return entries
    .sort((a, b) => b.timestamp - a.timestamp || b.confidence - a.confidence)
    .slice(0, limit);
}

// ── The orchestrator ────────────────────────────────────────────────────────

export type WieGlobalResult = {
  role: GuidanceRole;
  workspace: string | null;
  resolvedPredictions: Prediction[];
  conflicts: PredictionConflict[];
  globalSeverityScore: number;
  globalSeverityBand: SeverityBand;
  severityImplication: SeverityImplication;
  roleFocusedInsights: FusedInsight[];
  theme: ThemeDecision;
  timeline: IntelligenceTimelineEntry[];
  timestamp: number;
};

function emptyGlobalResult(): WieGlobalResult {
  return {
    role: 'Director',
    workspace: null,
    resolvedPredictions: [],
    conflicts: [],
    globalSeverityScore: 0,
    globalSeverityBand: 'informational',
    severityImplication: SEVERITY_IMPLICATIONS.informational,
    roleFocusedInsights: [],
    theme: { band: 'informational', modifier: null },
    timeline: [],
    timestamp: 0,
  };
}

/**
 * WIE 2.0 — the global intelligence orchestrator (Step 105). Fuses the
 * output of every engine already on the graph (Predictive Engine, Insight
 * Fusion Engine, Operator Guidance Engine, WIE 1.0/UIIL) into one
 * cross-workspace result: conflict-resolved predictions, a global severity
 * score/band, role-focused insights, a theme-switching decision, and a
 * studio-wide timeline. Constructor shape matches every other engine on
 * `UBOSIntelligenceGraph` (`constructor(graph: UBOSIntelligenceGraph)`) —
 * `graph` already exposes `predictiveEngine`/`fusionEngine`/
 * `guidanceEngine`/`workspaceIntelligence`/`uiIntegration` as public
 * readonly fields, so no separate constructor arguments are needed.
 */
export class WorkspaceIntelligenceEngine2 {
  private readonly graph: UBOSIntelligenceGraph;
  private result: WieGlobalResult = emptyGlobalResult();

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  compute(operatorRole?: string | null, workspace?: string | null): WieGlobalResult {
    const guidanceCtx = this.graph.guidanceEngine.getContext();
    const role = normalizeRole(operatorRole ?? guidanceCtx.role);
    const ws =
      workspace ??
      guidanceCtx.workspace ??
      this.graph.normalizer.getContext().workspace ??
      null;

    const predictions = this.graph.predictiveEngine.getPredictions() as Prediction[];
    const { resolved, conflicts } = resolvePredictionConflicts(predictions);

    const fusedInsights = this.graph.getFusedInsights();
    const guidance = this.graph.getOperatorGuidance();
    const automationTriggers = this.graph.getAutomationTriggers();
    const outputNodes = this.graph.getNodesByType('OutputNode');

    const criticalOrWarning = fusedInsights.filter(
      (insight) => insight.severity === 'critical' || insight.severity === 'warning',
    );
    const severityInputs = [
      ...resolved.map((prediction) => prediction.confidence),
      ...criticalOrWarning.map((insight) => insight.confidence),
    ];
    const globalSeverityScore = severityInputs.length > 0 ? Math.max(...severityInputs) : 0;
    const globalSeverityBand = scoreSeverityBand(globalSeverityScore);

    this.result = {
      role,
      workspace: ws,
      resolvedPredictions: resolved,
      conflicts,
      globalSeverityScore,
      globalSeverityBand,
      severityImplication: SEVERITY_IMPLICATIONS[globalSeverityBand],
      roleFocusedInsights: roleFocusedInsights(role, fusedInsights, this.graph.workspaceIntelligence),
      theme: decideThemeModifier(globalSeverityScore),
      timeline: buildStudioTimeline(resolved, guidance, fusedInsights, automationTriggers, outputNodes),
      timestamp: Date.now(),
    };
    return this.result;
  }

  getResult(): WieGlobalResult {
    return this.result;
  }

  /** Workspace-aware focus for one of the five canonical zones (Step 105). */
  workspaceFocus(
    zone: WorkspaceIntelligenceZone,
    limit = 5,
  ): { insights: FusedInsight[]; predictions: Prediction[] } {
    return {
      insights: workspaceFocusedInsights(zone, this.graph.getFusedInsights(), limit),
      predictions: workspaceFocusedPredictions(zone, this.result.resolvedPredictions, limit),
    };
  }

  reset(): void {
    this.result = emptyGlobalResult();
  }
}
