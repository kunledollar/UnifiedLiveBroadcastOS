/**
 * Operator HUD 2.0 intelligence wiring (Step 104).
 *
 * The global intelligence overlay that sits above Triad 2.0, Inspector 2.0,
 * Program Output 2.0, and every workspace (Director, Graphics, Audio,
 * Replay, Streaming). Unlike Triad/Inspector/Output (Steps 100-102), which
 * map WIE panels onto *fixed geometry regions* they already own, HUD 2.0 has
 * no geometry region of its own — it floats above whichever workspace is
 * active — so its four zones (Primary Insight, Guidance, Warning, Timeline)
 * are a new, self-contained panel vocabulary rather than an extension of
 * `ZONE_TO_PANELS` (which drives the *geometry* zone wrappers in
 * `ControlRoomCanvas`, a different concern).
 *
 * Two responsibilities, same split every other Step 100-102 module uses:
 *   1. Outer intelligence *treatment* per zone — highlight/warn/pulse/
 *      prepare/dim/suppress/elevate — derived from the same WIE panels the
 *      rest of the Control Room already reacts to (`hudZoneAction` /
 *      `hudZoneClassName`), so the HUD glows/warns/pulses in sync with
 *      Triad, Inspector, and Output rather than running its own parallel
 *      inference.
 *   2. Inner *content* per zone — which predictions, guidance actions,
 *      fused insights, and automation triggers actually populate each zone
 *      — derived directly from the engine outputs already exposed on
 *      `UigSnapshot` (Steps 86-90), matching exactly how `TriadOperatorHud`,
 *      `InspectorIntelligenceBar`, and `OutputIntelligenceTimeline` read
 *      `graph.getSnapshot()` rather than re-deriving intelligence.
 *
 * Kept dependency-free (no React) so it is unit-testable the same way the
 * rest of the intelligence-graph package is (`node:test`, no DOM/renderer).
 */
import type { UiPanelId, UiSignalAction } from '../intelligence-graph/workspaceIntelligenceEngine.js';
import type { Prediction, PredictionCategory } from '../intelligence-graph/predictiveEngine.js';
import type { FusedInsight } from '../intelligence-graph/insightFusionEngine.js';
import type { GuidanceAction } from '../intelligence-graph/operatorGuidanceEngine.js';
import type { InferenceResult } from '../intelligence-graph/uigInferenceEngine.js';
import { uiActionClassName } from '../intelligence-graph/uiIntelligenceIntegrationLayer.js';

export type HudZoneId = 'primaryInsight' | 'guidance' | 'warning' | 'timeline';

export const HUD_ZONE_IDS: readonly HudZoneId[] = [
  'primaryInsight',
  'guidance',
  'warning',
  'timeline',
];

/**
 * Which WIE panels drive each HUD zone's outer treatment.
 *
 * `primaryInsight` covers exactly the four Step 104 bullets — predicted
 * scene transitions, predicted graphics activation, predicted audio peaks,
 * and output degradation predictions — i.e. scene/graphics/audio/output.
 * `guidance` mirrors `guidancePanel`, the same panel WIE always elevates
 * once OGE has actions (`operatorPanel` covers guidance sourced directly
 * from an operator/AI-crew action rather than a fused cluster).
 * `warning` covers the four Step 104 warning bullets — routing failures,
 * audio clipping, output health issues, and general critical system state.
 * `timeline` reads the same cross-cutting panels Output's own Intelligence
 * Timeline (Step 102) reads (`guidancePanel`), plus `automationPanel` and
 * `replayPanel` for "operator actions" and "automation triggers".
 */
export const HUD_ZONE_PANELS: Readonly<Record<HudZoneId, readonly UiPanelId[]>> = {
  primaryInsight: ['scenePanel', 'graphicsPanel', 'audioPanel', 'programOutputPanel'],
  guidance: ['guidancePanel', 'operatorPanel'],
  warning: ['programOutputPanel', 'routingPanel', 'audioPanel', 'systemPanel'],
  timeline: ['guidancePanel', 'automationPanel', 'replayPanel'],
};

/**
 * Minimal surface this module needs — the exact shape of `UIIntegrationLayer`
 * (`uiIntelligenceIntegrationLayer.ts`), so call sites pass
 * `workspaceState.intelligenceGraph.uiIntegration`, the same instance every
 * other Step 100-102 intelligence module reads from. Kept narrow (an
 * interface, not the concrete class) so tests can pass a fake.
 */
export interface HudIntelligenceSource {
  getPanelAction(panel: UiPanelId): UiSignalAction | null;
}

/**
 * Same relative ranking `WorkspaceIntelligenceEngine`/`UIIntegrationLayer`
 * already use internally (highlight > warn > pulse ≈ elevate > prepare >
 * dim > suppress) — duplicated locally rather than imported, matching the
 * existing convention of a small private priority table per consumer
 * (see `workspaceIntelligenceEngine.ts` and
 * `uiIntelligenceIntegrationLayer.ts`), since HUD zones — unlike a single
 * geometry zone — resolve *multiple* candidate panels down to one action.
 */
function actionPriority(action: UiSignalAction): number {
  switch (action) {
    case 'highlight':
      return 5;
    case 'warn':
      return 4;
    case 'pulse':
      return 3;
    case 'prepare':
      return 2;
    case 'elevate':
      return 2;
    case 'dim':
      return 1;
    case 'suppress':
      return 0;
    default:
      return 0;
  }
}

/** The highest-priority WIE action among a HUD zone's candidate panels. */
export function hudZoneAction(
  zoneId: HudZoneId,
  source: HudIntelligenceSource,
): UiSignalAction | null {
  let best: UiSignalAction | null = null;
  let bestPriority = -1;
  for (const panel of HUD_ZONE_PANELS[zoneId]) {
    const action = source.getPanelAction(panel);
    if (!action) continue;
    const priority = actionPriority(action);
    if (priority > bestPriority) {
      best = action;
      bestPriority = priority;
    }
  }
  return best;
}

/** CSS class for a HUD zone, derived from its driving WIE panels' current action. */
export function hudZoneClassName(zoneId: HudZoneId, source: HudIntelligenceSource): string {
  return uiActionClassName(hudZoneAction(zoneId, source));
}

/**
 * Step 104 spec: "suppress → collapse HUD zone" — distinct from every other
 * geometry zone/panel, which merely fades under `.ubos-suppress` (Step 90)
 * because it still must occupy its geometry rect. A HUD zone has no
 * surrounding layout to preserve, so `suppress` here means "do not render
 * this zone at all" rather than "render it faintly".
 */
export function hudZoneCollapsed(zoneId: HudZoneId, source: HudIntelligenceSource): boolean {
  return hudZoneAction(zoneId, source) === 'suppress';
}

// ── Zone content (pure, engine-output-driven) ───────────────────────────────

/**
 * Primary Insight Zone (top-center) — Step 104's four canonical bullets are
 * exactly four `PredictionCategory` values from the Predictive Engine
 * (Step 86): predicted scene transitions, predicted graphics activation,
 * predicted audio peaks (`audio_clipping`, still a *prediction* here, not a
 * confirmed clip), and output degradation predictions.
 */
const PRIMARY_INSIGHT_CATEGORIES: readonly PredictionCategory[] = [
  'scene_transition',
  'graphics_activation',
  'audio_clipping',
  'output_degradation',
];

export function selectPrimaryInsights(
  predictions: readonly Prediction[],
  limit = 3,
): Prediction[] {
  return predictions
    .filter((prediction) => PRIMARY_INSIGHT_CATEGORIES.includes(prediction.category))
    .slice(0, limit);
}

/**
 * Guidance Zone (top-right) — Operator Guidance Engine (Step 88) output is
 * already role-aware, workspace-aware, and ranked by severity/confidence
 * (`getTopOperatorGuidance`/`latestOperatorGuidance`), so this is a direct
 * pass-through with a display limit, matching `TriadOperatorHud`'s use of
 * `latestOperatorGuidance[0]`.
 */
export function selectGuidanceActions(
  guidance: readonly GuidanceAction[],
  limit = 3,
): GuidanceAction[] {
  return guidance.slice(0, limit);
}

/**
 * Warning Zone (top-left) — Step 104's bullets (critical warnings, routing
 * failures, audio clipping, output health issues) are all *realized*
 * conditions, i.e. Insight Fusion Engine (Step 87) output at `critical`/
 * `warning` severity — distinct from Primary Insight's *predicted* content,
 * even though both can reference the same underlying cluster (e.g. output).
 */
export function selectWarnings(
  fusedInsights: readonly FusedInsight[],
  limit = 4,
): FusedInsight[] {
  return fusedInsights
    .filter((insight) => insight.severity === 'critical' || insight.severity === 'warning')
    .slice(0, limit);
}

export type HudTimelineEntryKind = 'prediction' | 'guidance' | 'insight' | 'automation';

export type HudTimelineEntry = {
  id: string;
  kind: HudTimelineEntryKind;
  message: string;
  confidence: number;
  timestamp: number;
};

/**
 * HUD Timeline (bottom-center) — merges predicted events (PE), operator
 * actions (OGE), fused insights (IFE), and automation triggers (UIE, via
 * `graph.getAutomationTriggers()`) into one chronological feed, newest
 * first, matching Step 104's four bullets exactly.
 */
export function selectTimelineEntries(
  predictions: readonly Prediction[],
  guidance: readonly GuidanceAction[],
  fusedInsights: readonly FusedInsight[],
  automationTriggers: readonly InferenceResult[],
  limit = 8,
): HudTimelineEntry[] {
  const entries: HudTimelineEntry[] = [
    ...predictions.map((prediction) => ({
      id: `pred-${prediction.id}`,
      kind: 'prediction' as const,
      message: prediction.message,
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
    })),
    ...guidance.map((action) => ({
      id: `guide-${action.id}`,
      kind: 'guidance' as const,
      message: action.message,
      confidence: action.confidence,
      timestamp: action.timestamp,
    })),
    ...fusedInsights.map((insight) => ({
      id: `insight-${insight.id}`,
      kind: 'insight' as const,
      message: insight.message,
      confidence: insight.confidence,
      timestamp: insight.timestamp,
    })),
    ...automationTriggers.map((trigger) => ({
      id: `auto-${trigger.id}`,
      kind: 'automation' as const,
      message: trigger.message,
      confidence: trigger.confidence,
      timestamp: trigger.timestamp,
    })),
  ];

  return entries
    .sort((a, b) => b.timestamp - a.timestamp || b.confidence - a.confidence)
    .slice(0, limit);
}
