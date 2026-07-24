
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * InspectorZone — Right-side contextual inspector panel.
 * Shows selection metadata, health, and operational detail for
 * the currently selected source, scene, graphic, or pipeline item.
 * Width is fixed; height fills from top bar to workbench.
 */
export interface InspectorZone extends Zone {
  id: 'inspector';
  rect: Rect;
  /** Id of the currently inspected item (panel, scene, source, etc.). */
  activeItemId: string | null;
  /** Whether the inspector is collapsed to a minimal strip. */
  collapsed: boolean;
  render(): RenderOutput;
}

export const inspectorZoneDefinition = {
  id: 'inspector',
  defaultRect: { x: 1620, y: 56, width: 300, height: 984 },
  minWidth: 240,
  minHeight: 200,
  collapsible: true,
  resizable: true,
} as const;
