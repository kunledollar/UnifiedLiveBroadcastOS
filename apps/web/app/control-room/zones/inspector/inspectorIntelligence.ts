/**
 * Inspector 2.0 intelligence wiring (Step 101).
 *
 * Pure, framework-free mapping connecting the UI Intelligence Integration
 * Layer (Step 90) to Inspector's four canonical regions (navigation /
 * body / metadata / intelligenceBar — the same region vocabulary as
 * `ubosWorkspaceGridTemplates.inspector`, Step 98), the same pattern
 * `triadIntelligence.ts` (Step 100) established for Triad's three lanes.
 *
 * Kept dependency-free (no React) so it is unit-testable without a DOM.
 */
import type { UiPanelId, UiSignalAction } from '../../intelligence-graph/workspaceIntelligenceEngine.js';

export type InspectorRegionId = 'navigation' | 'body' | 'metadata' | 'intelligenceBar';

export const INSPECTOR_REGION_IDS: readonly InspectorRegionId[] = [
  'navigation',
  'body',
  'metadata',
  'intelligenceBar',
];

/**
 * Which WIE panel drives each region's intelligence treatment.
 *
 * Navigation (the scene list) and Body (scene composition/metadata) both
 * read `scenePanel` — Inspector's live content today is scene-focused
 * (`GraphInspector`/`SceneInspector`), matching Step 101's "Scene
 * Intelligence" domain. Metadata and the Intelligence Bar both read
 * `guidancePanel` — they surface cross-cutting fused insights/guidance/
 * confidence history, not one specific domain.
 */
export const INSPECTOR_REGION_PANEL: Readonly<Record<InspectorRegionId, UiPanelId>> = {
  navigation: 'scenePanel',
  body: 'scenePanel',
  metadata: 'guidancePanel',
  intelligenceBar: 'guidancePanel',
};

/** Minimal surface this module needs — the exact shape of `UIIntegrationLayer` (`uiIntelligenceIntegrationLayer.ts`). */
export interface InspectorIntelligenceSource {
  classNameForPanel(panel: UiPanelId): string;
  getPanelAction(panel: UiPanelId): UiSignalAction | null;
}

/** CSS class for an Inspector region, derived from its driving WIE panel's current action. */
export function inspectorRegionClassName(
  regionId: InspectorRegionId,
  uiIntegration: InspectorIntelligenceSource,
): string {
  return uiIntegration.classNameForPanel(INSPECTOR_REGION_PANEL[regionId]);
}

/** Raw WIE action for an Inspector region (for badges/tooltips, not just the CSS class). */
export function inspectorRegionAction(
  regionId: InspectorRegionId,
  uiIntegration: InspectorIntelligenceSource,
): UiSignalAction | null {
  return uiIntegration.getPanelAction(INSPECTOR_REGION_PANEL[regionId]);
}
