
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * SceneZone — Program and Preview monitor surface.
 * The primary confidence and switching surface for every workspace.
 * Program occupies the left portion; Preview occupies the right.
 * In solo or compact modes both may overlap or stack vertically.
 */
export interface SceneZone extends Zone {
  id: 'scene';
  rect: Rect;
  /** Weight of Program monitor (0–100). Preview takes the remainder. */
  programWeight: number;
  /** Whether monitors are stacked vertically instead of side by side. */
  stacked: boolean;
  render(): RenderOutput;
}

export const sceneZoneDefinition = {
  id: 'scene',
  defaultRect: { x: 210, y: 56, width: 900, height: 500 },
  minWidth: 480,
  minHeight: 270,
  collapsible: false,
  resizable: true,
} as const;
