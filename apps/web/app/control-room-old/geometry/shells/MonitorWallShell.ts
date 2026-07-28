/**
 * MonitorWallShell — Step 46 (authoritative spec)
 *
 * Normalized viewport-fraction geometry for the Monitor Wall workspace.
 * Optimized for maximum visibility — camera feeds, program/preview,
 * remote guests, destinations, and system health at a glance.
 *
 *  ┌────────────────────────────────────────────────────────┐
 *  │               MULTI-FEED GRID (100% × 80%)            │
 *  │  Cameras · Program · Preview · Guests · Destinations  │
 *  │  Replay feeds · Graphics feeds                        │
 *  ├────────────────────────────────────────┬──────────────┤
 *  │  OUTPUT (75% × 20%)                    │ SYSTEM       │
 *  │  Multi-destination previews            │ HEALTH       │
 *  │  Output health · Distribution          │ (25% × 20%) │
 *  └────────────────────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const MonitorWallShell: WorkspaceShell = {
  id: 'monitor-wall',

  zones: [
    {
      id: 'multi-feed-grid',
      rect: { x: 0, y: 0, width: 1.0, height: 0.80 },
      normalized: true,
      minWidth: 720,
      minHeight: 405,
      collapsible: false,
      resizable: false,
    },

    {
      id: 'output',
      rect: { x: 0, y: 0.80, width: 0.75, height: 0.20 },
      normalized: true,
      minWidth: 480,
      minHeight: 80,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'system-health',
      rect: { x: 0.75, y: 0.80, width: 0.25, height: 0.20 },
      normalized: true,
      minWidth: 200,
      minHeight: 80,
      collapsible: true,
      resizable: true,
    },
  ],
};
