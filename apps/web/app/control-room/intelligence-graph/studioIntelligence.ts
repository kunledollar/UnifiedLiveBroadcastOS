/**
 * Studio Intelligence 1.0 — Step 106
 *
 * The top-level intelligence layer of UBOS, sitting *above* Workspace
 * Intelligence Engine 2.0 (Step 105) the way WIE 2.0 itself sits above
 * WIE 1.0 (Step 89): each layer consumes and summarizes the one below it,
 * none re-derives what the layer below already decided. Studio
 * Intelligence 1.0 is explicitly "powered by" WIE 2.0 / IFE / PE / OGE /
 * UIIL per the Step 106 spec, so — unlike WIE 2.0, which stayed
 * intentionally decoupled from HUD 2.0 — this module *does* import WIE
 * 2.0's severity model directly rather than re-deriving it; WIE 2.0 is a
 * genuine, intended dependency here, not a layering violation.
 *
 * Seven responsibilities, each a thin, honest composition over what
 * already exists rather than a parallel system:
 *
 *   1. Whole-studio prediction fusion — reuses WIE 2.0's own
 *      conflict-resolved predictions (`resolvedPredictions`); this
 *      module's addition is grouping them into the seven named
 *      subsystems (scenes/graphics/audio/routing/replay/streaming/
 *      output health) for studio-level reporting.
 *   2. Studio-level severity scoring — the *exact same* 5-band model as
 *      WIE 2.0 (0.0-0.2 informational … 0.8-1.0 critical); imported, not
 *      duplicated, since both explicitly share one severity model.
 *   3. Studio health modeling — a new, honest per-subsystem stability
 *      score. Only `output`/`routing`/`graphics`/`audio` have a real
 *      `FusionCluster` source today (Step 87 defines eight clusters, none
 *      named "replay" or "streaming" — the same documented gap
 *      `workspaceIntelligenceEngine2.ts` already notes for its own
 *      workspace-aware focus). `replay`/`streaming` health honestly
 *      report `status: 'unknown'` rather than fabricating a number from
 *      unrelated signals.
 *   4. Studio-wide guidance — annotates OGE's existing, already
 *      role-aware, already-ranked guidance (Step 88) with a severity
 *      band; does not regenerate guidance.
 *   5. Studio-level intelligence themes — maps the active operator role
 *      onto one of the six named studio modes (Director/Graphics/Audio/
 *      Replay/Streaming/Solo), then reuses WIE 2.0's own
 *      `decideThemeModifier` for the severity-driven modifier.
 *   6. Cinematic studio intelligence transitions — maps WIE 2.0's
 *      severity-implied motion *intensity* onto the concrete UBDS motion
 *      primitives (glow/pulse/shake/fade/elevate, Step 91/96) that should
 *      play studio-wide, for `OperatorHUD.tsx`'s outer container.
 *   7. Studio-wide intelligence timeline — reuses WIE 2.0's own
 *      `timeline` verbatim; it already merges predictions, guidance,
 *      insights, automation triggers, and output health changes across
 *      the whole graph (Step 105).
 *
 * Kept dependency-free of React/`@ubos/ui`/`hud/`, matching every other
 * intelligence-graph engine's layering — application code (HUD 2.0,
 * WorkspaceShell) reads *from* this module, never the reverse.
 */
import type { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import type { Prediction, PredictionCategory } from './predictiveEngine.js';
import type { FusedInsight, FusionCluster } from './insightFusionEngine.js';
import type { GuidanceAction, GuidanceRole } from './operatorGuidanceEngine.js';
import {
  scoreSeverityBand,
  SEVERITY_IMPLICATIONS,
  decideThemeModifier,
  type SeverityBand,
  type MotionIntensity,
  type ThemeDecision,
  type IntelligenceTimelineEntry,
  type WieGlobalResult,
} from './workspaceIntelligenceEngine2.js';

// ── Whole-studio prediction fusion ──────────────────────────────────────────

/**
 * The seven subsystems the Step 106 spec names for whole-studio prediction
 * fusion. Every `PredictionCategory` (Step 86) maps onto at most one of
 * these; `operator_action`/`automation_trigger` map to none (they are
 * operator/automation events, not one of the seven named subsystems) and
 * are simply absent from the breakdown, not force-fit into a wrong bucket.
 */
export type StudioSubsystem =
  | 'scenes'
  | 'graphics'
  | 'audio'
  | 'routing'
  | 'replay'
  | 'streaming'
  | 'outputHealth';

export const STUDIO_SUBSYSTEMS: readonly StudioSubsystem[] = [
  'scenes',
  'graphics',
  'audio',
  'routing',
  'replay',
  'streaming',
  'outputHealth',
];

const PREDICTION_CATEGORY_SUBSYSTEM: Partial<Record<PredictionCategory, StudioSubsystem>> = {
  scene_transition: 'scenes',
  graphics_activation: 'graphics',
  audio_clipping: 'audio',
  routing_failure: 'routing',
  output_degradation: 'outputHealth',
};

/**
 * Groups WIE 2.0's already conflict-resolved predictions by studio
 * subsystem — the "single studio-level prediction model" the spec asks
 * for. No new conflict resolution happens here; a three-way conflict (the
 * spec's own example: a predicted scene transition vs. a predicted
 * graphics activation vs. a predicted audio peak) is already resolved to
 * one winner by WIE 2.0's `resolvePredictionConflicts` before it ever
 * reaches this function.
 */
export function groupPredictionsBySubsystem(
  predictions: readonly Prediction[],
): Record<StudioSubsystem, Prediction[]> {
  const grouped = Object.fromEntries(STUDIO_SUBSYSTEMS.map((s) => [s, [] as Prediction[]])) as Record<
    StudioSubsystem,
    Prediction[]
  >;
  for (const prediction of predictions) {
    const subsystem = PREDICTION_CATEGORY_SUBSYSTEM[prediction.category];
    if (subsystem) grouped[subsystem].push(prediction);
  }
  return grouped;
}

// ── Studio health modeling ──────────────────────────────────────────────────

export type StudioHealthDimension = 'output' | 'routing' | 'graphics' | 'audio' | 'replay' | 'streaming';

export const STUDIO_HEALTH_DIMENSIONS: readonly StudioHealthDimension[] = [
  'output',
  'routing',
  'graphics',
  'audio',
  'replay',
  'streaming',
];

/**
 * Which `FusionCluster` (Step 87) feeds each health dimension. `replay`
 * and `streaming` have no dedicated cluster today (the same gap WIE 2.0's
 * `WORKSPACE_ZONE_CLUSTERS` already documents) — deliberately left
 * unmapped rather than approximated from `routing`/`output`, which would
 * silently double-count those two dimensions' signals as if they were
 * independent evidence.
 */
const HEALTH_DIMENSION_CLUSTER: Partial<Record<StudioHealthDimension, FusionCluster>> = {
  output: 'output',
  routing: 'routing',
  graphics: 'graphics',
  audio: 'audio',
};

export type StudioHealthStatus = 'stable' | 'warning' | 'unstable' | 'critical' | 'unknown';

export type StudioHealthDimensionResult = {
  dimension: StudioHealthDimension;
  /** 0 (fully degraded) – 1 (fully stable). `null` when there is no signal source yet. */
  score: number | null;
  status: StudioHealthStatus;
  sampleCount: number;
};

export type StudioHealth = {
  dimensions: readonly StudioHealthDimensionResult[];
  /** Overall studio health score, 0 (critical) – 1 (fully stable). */
  score: number;
  status: StudioHealthStatus;
};

/**
 * A single fused insight's severity as a 0-1 score, blending its
 * categorical `FusionSeverity` (Step 87) with its confidence — the same
 * two inputs WIE 2.0 already uses for global severity, just applied per
 * insight instead of taking a single studio-wide max.
 */
const SEVERITY_BASE_WEIGHT: Record<FusedInsight['severity'], number> = {
  critical: 1,
  warning: 0.65,
  prediction: 0.4,
  info: 0.15,
};

/**
 * Exported so Studio Automation 1.0 (Step 107) can reuse the exact same
 * per-insight severity scoring when gating automation eligibility by
 * "how risky is this subsystem right now" — one canonical implementation,
 * not a third duplicate.
 */
export function fusedInsightSeverityScore(insight: FusedInsight): number {
  return SEVERITY_BASE_WEIGHT[insight.severity] * insight.confidence;
}

/**
 * Studio health status thresholds — per the Step 106 code sample
 * verbatim (`computeStudioHealth`): average severity above 0.8 is
 * `critical`, above 0.6 `unstable`, above 0.4 `warning`, otherwise
 * `stable`. Deliberately a *different* threshold set than the general
 * 5-band `SeverityBand` model (which starts banding at 0.2) — health
 * *status* is coarser than per-signal severity by design.
 */
function healthStatusFromAverageSeverity(avgSeverity: number): StudioHealthStatus {
  if (avgSeverity > 0.8) return 'critical';
  if (avgSeverity > 0.6) return 'unstable';
  if (avgSeverity > 0.4) return 'warning';
  return 'stable';
}

/**
 * Models output/routing/graphics/audio/replay/streaming stability and
 * produces one overall studio health score, per the Step 106 spec.
 */
export function computeStudioHealth(fusedInsights: readonly FusedInsight[]): StudioHealth {
  const dimensions: StudioHealthDimensionResult[] = STUDIO_HEALTH_DIMENSIONS.map((dimension) => {
    const cluster = HEALTH_DIMENSION_CLUSTER[dimension];
    if (!cluster) {
      return { dimension, score: null, status: 'unknown', sampleCount: 0 };
    }
    const signals = fusedInsights.filter((insight) => insight.cluster === cluster);
    if (signals.length === 0) {
      return { dimension, score: null, status: 'unknown', sampleCount: 0 };
    }
    const avgSeverity =
      signals.reduce((sum, insight) => sum + fusedInsightSeverityScore(insight), 0) / signals.length;
    return {
      dimension,
      score: 1 - avgSeverity,
      status: healthStatusFromAverageSeverity(avgSeverity),
      sampleCount: signals.length,
    };
  });

  const scored = dimensions.filter(
    (d): d is StudioHealthDimensionResult & { score: number } => d.score !== null,
  );
  if (scored.length === 0) {
    return { dimensions, score: 1, status: 'stable' };
  }
  const overallScore = scored.reduce((sum, d) => sum + d.score, 0) / scored.length;
  return {
    dimensions,
    score: overallScore,
    status: healthStatusFromAverageSeverity(1 - overallScore),
  };
}

// ── Studio-wide guidance ─────────────────────────────────────────────────────

export type StudioGuidanceItem = GuidanceAction & { severityBand: SeverityBand };

/**
 * Severity-aware, operator-role-aware, cross-workspace guidance — Operator
 * Guidance Engine (Step 88) already produces exactly that (its output is
 * global, not siloed per workspace, and already carries `role`); this
 * annotates each action with a severity band rather than regenerating
 * guidance, keeping OGE the single source of truth for *what* to tell the
 * operator.
 */
export function buildStudioGuidance(guidance: readonly GuidanceAction[]): StudioGuidanceItem[] {
  return guidance.map((action) => ({ ...action, severityBand: scoreSeverityBand(action.confidence) }));
}

// ── Studio-level intelligence themes ────────────────────────────────────────

/**
 * The six studio modes named in the spec — mirrors `UbosThemeName` from
 * `@ubos/ui`'s `themes.ts` (Step 103) as a local literal union rather than
 * a cross-package import, the same decoupling WIE 2.0 already applies to
 * `ThemeModifierId`.
 */
export type StudioIntelligenceMode = 'director' | 'graphics' | 'audio' | 'replay' | 'streaming' | 'solo';

/**
 * Role → studio mode. Technical Director and Compact Operator have no
 * dedicated mode of their own in the six named above — Technical Director
 * shares Director's mode (same clarity/timing character Step 103's own
 * theme docs already note), and Compact Operator folds into Solo (Step
 * 103: "compact is a density mode more than a distinct visual identity").
 */
const ROLE_STUDIO_MODE: Record<GuidanceRole, StudioIntelligenceMode> = {
  Director: 'director',
  'Technical Director': 'director',
  'Graphics Operator': 'graphics',
  'Audio Engineer': 'audio',
  'Replay Operator': 'replay',
  'Streaming Operator': 'streaming',
  'Solo Streamer': 'solo',
  'Compact Operator': 'solo',
};

export type StudioThemeDecision = ThemeDecision & { mode: StudioIntelligenceMode };

export function selectStudioTheme(role: GuidanceRole, globalSeverityScore: number): StudioThemeDecision {
  return { mode: ROLE_STUDIO_MODE[role], ...decideThemeModifier(globalSeverityScore) };
}

// ── Cinematic studio intelligence transitions ───────────────────────────────

/**
 * Mirrors `UbosMotionPrimitive` from `@ubos/ui`'s `motion.ts` (Step 91/96)
 * as a local literal union, same decoupling rationale as `ThemeModifierId`
 * — "slide" is omitted here since it is a state-*transition* primitive
 * (Step 96: "transitions between states"), not a standing cinematic
 * treatment a studio-wide severity level should hold for as long as that
 * severity persists.
 */
export type StudioMotionPrimitive = 'pulse' | 'glow' | 'fade' | 'shake' | 'elevate';

/**
 * WIE 2.0 already classifies severity into a `MotionIntensity`
 * (none/subtle/moderate/strong/critical, `SEVERITY_IMPLICATIONS`); this
 * is the studio-wide *cinematic* rendering of that intensity — which
 * concrete motion primitives should play across the whole HUD overlay,
 * not just one panel.
 */
const STUDIO_MOTION_BY_INTENSITY: Record<MotionIntensity, readonly StudioMotionPrimitive[]> = {
  none: [],
  subtle: ['fade'],
  moderate: ['glow'],
  strong: ['pulse', 'glow'],
  critical: ['shake', 'elevate'],
};

export function studioMotionForSeverity(band: SeverityBand): readonly StudioMotionPrimitive[] {
  return STUDIO_MOTION_BY_INTENSITY[SEVERITY_IMPLICATIONS[band].motionIntensity];
}

// ── The orchestrator ────────────────────────────────────────────────────────

export type StudioIntelligenceResult = {
  role: GuidanceRole;
  workspace: string | null;
  studioPredictions: readonly Prediction[];
  studioPredictionsBySubsystem: Record<StudioSubsystem, Prediction[]>;
  studioFused: readonly FusedInsight[];
  studioSeverityScore: number;
  studioSeverityBand: SeverityBand;
  studioGuidance: StudioGuidanceItem[];
  studioTimeline: readonly IntelligenceTimelineEntry[];
  studioHealth: StudioHealth;
  studioTheme: StudioThemeDecision;
  studioMotion: readonly StudioMotionPrimitive[];
  timestamp: number;
};

function emptyResult(): StudioIntelligenceResult {
  const health = computeStudioHealth([]);
  return {
    role: 'Director',
    workspace: null,
    studioPredictions: [],
    studioPredictionsBySubsystem: groupPredictionsBySubsystem([]),
    studioFused: [],
    studioSeverityScore: 0,
    studioSeverityBand: 'informational',
    studioGuidance: [],
    studioTimeline: [],
    studioHealth: health,
    studioTheme: selectStudioTheme('Director', 0),
    studioMotion: studioMotionForSeverity('informational'),
    timestamp: 0,
  };
}

/**
 * Studio Intelligence 1.0 (Step 106) — the top-level intelligence layer.
 * Constructor shape matches every other engine on `UBOSIntelligenceGraph`
 * (`constructor(graph: UBOSIntelligenceGraph)`), not the Step 106 spec's
 * literal `constructor(wie2)` — `graph` already exposes
 * `workspaceIntelligence2`/`getGlobalIntelligence()`/`getFusedInsights()`/
 * `getOperatorGuidance()` as public members, so a second constructor
 * parameter would be redundant, and every one of Steps 86-90/105 already
 * uses this exact one-argument shape.
 */
export class StudioIntelligence {
  private readonly graph: UBOSIntelligenceGraph;
  private result: StudioIntelligenceResult = emptyResult();

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  /**
   * Summarizes WIE 2.0's latest global intelligence result
   * (`graph.getGlobalIntelligence()`) into the studio-level model. Does
   * not recompute WIE 2.0 itself — call
   * `graph.computeGlobalIntelligence(role, workspace)` first if a fresh
   * WIE 2.0 pass is needed, exactly like WIE 2.0 reads (and does not
   * recompute) Predictive Engine / Insight Fusion Engine output.
   */
  compute(global: WieGlobalResult = this.graph.getGlobalIntelligence()): StudioIntelligenceResult {
    const fusedInsights = this.graph.getFusedInsights();
    const guidance = this.graph.getOperatorGuidance();

    this.result = {
      role: global.role,
      workspace: global.workspace,
      studioPredictions: global.resolvedPredictions,
      studioPredictionsBySubsystem: groupPredictionsBySubsystem(global.resolvedPredictions),
      studioFused: fusedInsights,
      studioSeverityScore: global.globalSeverityScore,
      studioSeverityBand: global.globalSeverityBand,
      studioGuidance: buildStudioGuidance(guidance),
      studioTimeline: global.timeline,
      studioHealth: computeStudioHealth(fusedInsights),
      studioTheme: selectStudioTheme(global.role, global.globalSeverityScore),
      studioMotion: studioMotionForSeverity(global.globalSeverityBand),
      timestamp: Date.now(),
    };
    return this.result;
  }

  getResult(): StudioIntelligenceResult {
    return this.result;
  }

  reset(): void {
    this.result = emptyResult();
  }
}
