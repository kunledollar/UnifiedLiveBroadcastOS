
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * TriadZone — Three-panel confidence surface.
 * Used by Technical Director and Monitor Wall workspaces.
 * Renders Program (left), Preview (center), and an auxiliary
 * confidence or destination feed (right) in a horizontal triad.
 */
export interface TriadZone extends Zone {
  id: 'triad';
  rect: Rect;
  /** Labels for the three panels: [program, preview, auxiliary]. */
  panelLabels: [string, string, string];
  render(): RenderOutput;
}

export const triadZoneDefinition = {
  id: 'triad',
  rect: { x: 210, y: 56, width: 1200, height: 500 },
  minWidth: 720,
  minHeight: 270,
  collapsible: false,
  resizable: true,
} as const;
