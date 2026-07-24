/**
 * ReplayShell — Step 41
 *
 * Normalized viewport-fraction geometry for the Replay Operator workspace.
 * Optimized for fast clip selection, trimming, replay injection, and
 * clear visibility of all camera angles and replay output.
 *
 *  ┌────────────────────────────────┬──────────────────────┐
 *  │       CAMERA GRID (65%)        │  REPLAY MONITOR      │
 *  │       70% height               │  (35%)               │
 *  │       Multi-cam view           │  70% height          │
 *  ├────────────────────────────────┼──────────────────────┤
 *  │  TIMELINE (65% · 15%)          │  INSPECTOR           │
 *  ├────────────────────────────────┤  (35% · 30%)         │
 *  │  WORKBENCH (65% · 15%)         │                      │
 *  └────────────────────────────────┴──────────────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const ReplayShell: WorkspaceShell = {
  id: 'replay-operator',

  zones: [
    {
      id: 'camera-grid',
      rect: { x: 0, y: 0, width: 0.65, height: 0.70 },
      normalized: true,
      minWidth: 480,
      minHeight: 270,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'replay-monitor',
      rect: { x: 0.65, y: 0, width: 0.35, height: 0.70 },
      normalized: true,
      minWidth: 300,
      minHeight: 270,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'timeline',
      rect: { x: 0, y: 0.70, width: 0.65, height: 0.15 },
      normalized: true,
      minWidth: 480,
      minHeight: 48,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'inspector',
      rect: { x: 0.65, y: 0.70, width: 0.35, height: 0.30 },
      normalized: true,
      minWidth: 240,
      minHeight: 120,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0, y: 0.85, width: 0.65, height: 0.15 },
      normalized: true,
      minWidth: 480,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
