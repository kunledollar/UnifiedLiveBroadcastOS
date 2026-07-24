
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * WorkbenchZone — Bottom workspace strip.
 * Houses tabbed operational surfaces: scenes list, audio mixer,
 * automation queue, logs, routing, replay timeline, etc.
 * Height is fixed at the bottom of the viewport.
 */
export interface WorkbenchZone extends Zone {
  id: 'workbench';
  rect: Rect;
  /** Id of the currently active tab in this workbench. */
  activeTabId: string;
  /** Whether the workbench is in its expanded (tall) state. */
  expanded: boolean;
  render(): RenderOutput;
}

export const workbenchZoneDefinition = {
  id: 'workbench',
  defaultRect: { x: 210, y: 1040, width: 1710, height: 40 },
  minWidth: 480,
  minHeight: 40,
  collapsible: true,
  resizable: true,
} as const;
