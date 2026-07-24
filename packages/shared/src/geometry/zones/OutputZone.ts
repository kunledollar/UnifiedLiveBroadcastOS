
import type { Rect, RenderOutput, Zone } from '../types.js';

/**
 * OutputZone — Destination and output health surface.
 * Displays the status, bitrate, latency, and health of every
 * active streaming destination and recording output. Used by
 * the Streaming Operator and Distribution workspaces.
 */
export interface OutputZone extends Zone {
  id: 'output';
  rect: Rect;
  /** Number of active destinations displayed in this zone. */
  destinationCount: number;
  render(): RenderOutput;
}

export const outputZoneDefinition = {
  id: 'output',
  defaultRect: { x: 1620, y: 580, width: 300, height: 460 },
  minWidth: 240,
  minHeight: 160,
  collapsible: true,
  resizable: true,
} as const;
