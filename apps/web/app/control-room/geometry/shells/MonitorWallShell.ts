/**
 * MonitorWallShell — Step 46
 *
 * Normalized viewport-fraction geometry for the Monitor Wall workspace.
 * Optimized for full-confidence monitoring of every stream, output,
 * and source simultaneously — production health at a glance.
 *
 *  ┌──────────────────────────────────────────┬──────────────┐
 *  │        MONITOR GRID (75%)                │ SYSTEM       │
 *  │        Program · Preview · Destinations  │ STATUS       │
 *  │        85% height                        │ (25%)        │
 *  │                                          │ full height  │
 *  ├──────────────────────────────────────────┤              │
 *  │        WORKBENCH (75% · 15%)             │              │
 *  └──────────────────────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const MonitorWallShell: WorkspaceShell = {
  id: 'monitor-wall',

  zones: [
    {
      id: 'triad',
      rect: { x: 0, y: 0, width: 0.75, height: 0.85 },
      normalized: true,
      minWidth: 720,
      minHeight: 405,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.75, y: 0, width: 0.25, height: 1.0 },
      normalized: true,
      minWidth: 240,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0, y: 0.85, width: 0.75, height: 0.15 },
      normalized: true,
      minWidth: 720,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
