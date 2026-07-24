
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * GraphZone — Production and scene graph visualization area.
 * Renders the live production graph (signal routing, scene dependencies,
 * pipeline nodes) or scene composition graph. Used primarily by the
 * Technical Director and Engine Operator workspaces.
 */
export interface GraphZone extends Zone {
  id: 'graph';
  rect: Rect;
  /** Which graph is currently displayed. */
  mode: 'production' | 'scene' | 'routing' | 'pipeline';
  render(): RenderOutput;
}

export const graphZoneDefinition = {
  id: 'graph',
  defaultRect: { x: 210, y: 580, width: 1200, height: 420 },
  minWidth: 400,
  minHeight: 200,
  collapsible: true,
  resizable: true,
} as const;
