/**
 * Program Output 2.0 intelligence wiring (Step 102).
 *
 * Pure, framework-free mapping connecting the UI Intelligence Integration
 * Layer (Step 90) to Output's four canonical regions (program / preview /
 * routing / intelligenceTimeline — the same region vocabulary Step 98/101
 * established for Triad and Inspector). Same pattern as
 * `triadIntelligence.ts` (Step 100) and `inspector/inspectorIntelligence.ts`
 * (Step 101).
 *
 * Kept dependency-free (no React) so it is unit-testable without a DOM.
 */
import type { UiPanelId, UiSignalAction } from '../intelligence-graph/workspaceIntelligenceEngine.js';

export type OutputRegionId = 'program' | 'preview' | 'routing' | 'intelligenceTimeline';

export const OUTPUT_REGION_IDS: readonly OutputRegionId[] = [
  'program',
  'preview',
  'routing',
  'intelligenceTimeline',
];

/**
 * Which WIE panel drives each region's intelligence treatment.
 *
 * `preview` reads `scenePanel` — the same mapping Triad's own preview lane
 * uses (Step 100), since "preview" everywhere in UBOS means the same thing:
 * the staged, about-to-go-live surface, the domain of a predicted scene
 * transition. `program` reads `programOutputPanel` directly.
 * `intelligenceTimeline` reads `guidancePanel` — fused insights and
 * operator guidance are cross-cutting, not one domain.
 */
export const OUTPUT_REGION_PANEL: Readonly<Record<OutputRegionId, UiPanelId>> = {
  program: 'programOutputPanel',
  preview: 'scenePanel',
  routing: 'routingPanel',
  intelligenceTimeline: 'guidancePanel',
};

/** Minimal surface this module needs — the exact shape of `UIIntegrationLayer` (`uiIntelligenceIntegrationLayer.ts`). */
export interface OutputIntelligenceSource {
  classNameForPanel(panel: UiPanelId): string;
  getPanelAction(panel: UiPanelId): UiSignalAction | null;
}

/** CSS class for an Output region, derived from its driving WIE panel's current action. */
export function outputRegionClassName(
  regionId: OutputRegionId,
  uiIntegration: OutputIntelligenceSource,
): string {
  return uiIntegration.classNameForPanel(OUTPUT_REGION_PANEL[regionId]);
}

/** Raw WIE action for an Output region (for badges/tooltips, not just the CSS class). */
export function outputRegionAction(
  regionId: OutputRegionId,
  uiIntegration: OutputIntelligenceSource,
): UiSignalAction | null {
  return uiIntegration.getPanelAction(OUTPUT_REGION_PANEL[regionId]);
}
