
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * DockZone — Left navigation and source dock.
 * Houses the workspace sidebar, source browser, scene list,
 * media browser, and graphics library depending on the active
 * workspace and tab selection.
 */
export interface DockZone extends Zone {
  id: 'dock';
  rect: Rect;
  /** Id of the currently visible source tab in the dock. */
  activeSourceTabId: string;
  /** Whether the dock is in its narrow (icon-only) state. */
  compact: boolean;
  render(): RenderOutput;
}

export const dockZoneDefinition = {
  id: 'dock',
  rect: { x: 0, y: 56, width: 210, height: 984 },
  minWidth: 210,
  minHeight: 200,
  collapsible: false,
  resizable: false,
} as const;
