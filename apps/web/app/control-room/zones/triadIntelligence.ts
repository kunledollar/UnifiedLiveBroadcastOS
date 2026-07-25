/**
 * Triad 2.0 intelligence wiring (Step 100).
 *
 * Pure, framework-free mapping connecting the UI Intelligence Integration
 * Layer (Step 90) to Triad's three lanes (scene/preview/program), so a
 * predicted scene transition highlights the Scene lane specifically and an
 * output warning elevates the Program lane specifically — not just the
 * whole Triad zone as one coarse block. The existing `ZONE_TO_PANELS.triad`
 * wrapper treatment (applied in `ControlRoomCanvas`) is left in place as
 * the outer "something in here matters" cue; this is the inner, precise
 * layer, matching UBDS elevation principle "elevation = importance" at
 * finer granularity — panels within a panel.
 *
 * Kept dependency-free (no React) so it is unit-testable the same way the
 * rest of the intelligence-graph package is (`node:test`, no DOM/renderer).
 */
import type { UiPanelId, UiSignalAction } from '../intelligence-graph/workspaceIntelligenceEngine.js';

export type TriadLaneId = 'scene' | 'preview' | 'program';

export const TRIAD_LANE_IDS: readonly TriadLaneId[] = ['scene', 'preview', 'program'];

/**
 * Which WIE panel drives each lane's intelligence treatment.
 *
 * Preview mirrors the Scene lane: it is the "about to go live" surface, the
 * same domain as a predicted scene transition (Step 89 has no separate
 * `previewPanel` concept — preview isn't modeled as distinct from scene
 * staging). Program is driven by `programOutputPanel`, since Program is
 * literally the on-air output surface.
 */
export const TRIAD_LANE_PANEL: Readonly<Record<TriadLaneId, UiPanelId>> = {
  scene: 'scenePanel',
  preview: 'scenePanel',
  program: 'programOutputPanel',
};

/**
 * Minimal surface this module needs — the exact shape of `UIIntegrationLayer`
 * (`uiIntelligenceIntegrationLayer.ts`), so call sites pass
 * `workspaceState.intelligenceGraph.uiIntegration`, the same instance
 * `ControlRoomCanvas` already reads from. Kept narrow (an interface, not the
 * concrete class) so tests can pass a fake.
 */
export interface TriadIntelligenceSource {
  classNameForPanel(panel: UiPanelId): string;
  getPanelAction(panel: UiPanelId): UiSignalAction | null;
}

/** CSS class for a Triad lane, derived from its driving WIE panel's current action. */
export function triadLaneClassName(laneId: TriadLaneId, uiIntegration: TriadIntelligenceSource): string {
  return uiIntegration.classNameForPanel(TRIAD_LANE_PANEL[laneId]);
}

/** Raw WIE action for a Triad lane (for badges/tooltips, not just the CSS class). */
export function triadLaneAction(laneId: TriadLaneId, uiIntegration: TriadIntelligenceSource): UiSignalAction | null {
  return uiIntegration.getPanelAction(TRIAD_LANE_PANEL[laneId]);
}
