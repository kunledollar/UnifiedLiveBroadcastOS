/**
 * DistributionShell — Step 42
 *
 * Normalized viewport-fraction geometry for the Distribution Operator
 * workspace. Optimized for monitoring all active streaming destinations,
 * protecting delivery health, and managing failover.
 *
 *  ┌──────────┬──────────────────────────┬─────────────────┐
 *  │ SCENE    │      TRIAD (45%)         │ DESTINATION     │
 *  │ (15%)    │  Program · Preview       │ MONITOR (40%)   │
 *  │ full h   │  65% height              │ full height     │
 *  │          ├──────────────────────────┤                 │
 *  │          │  NETWORK GRAPH (45%)     │                 │
 *  │          │  20% height              │                 │
 *  │          ├──────────────────────────┤                 │
 *  │          │  WORKBENCH (45% · 15%)   │                 │
 *  └──────────┴──────────────────────────┴─────────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const DistributionShell: WorkspaceShell = {
  id: 'distribution-operator',

  zones: [
    {
      id: 'scene',
      rect: { x: 0, y: 0, width: 0.15, height: 1.0 },
      normalized: true,
      minWidth: 120,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.15, y: 0, width: 0.45, height: 0.65 },
      normalized: true,
      minWidth: 420,
      minHeight: 270,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'destination-monitor',
      rect: { x: 0.60, y: 0, width: 0.40, height: 1.0 },
      normalized: true,
      minWidth: 320,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'graph',
      rect: { x: 0.15, y: 0.65, width: 0.45, height: 0.20 },
      normalized: true,
      minWidth: 420,
      minHeight: 80,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0.15, y: 0.85, width: 0.45, height: 0.15 },
      normalized: true,
      minWidth: 420,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
