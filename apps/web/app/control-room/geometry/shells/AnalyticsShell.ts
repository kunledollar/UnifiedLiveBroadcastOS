/**
 * AnalyticsShell — Step 44
 *
 * Normalized viewport-fraction geometry for the Analytics Director
 * workspace. Optimized for metrics dashboards, audience data, and
 * performance monitoring across all platforms.
 *
 *  ┌──────────┬──────────────────────────────┬──────────────┐
 *  │ SCENE    │    METRICS GRAPH (55%)       │ INSPECTOR    │
 *  │ (15%)    │    Charts + audience data    │ (30%)        │
 *  │ full h   │    70% height                │ 70% height   │
 *  │          ├──────────────────────────────┼──────────────┤
 *  │          │    TRIAD (55% · 20%)         │ OUTPUT       │
 *  │          ├──────────────────────────────┤ (30% · 30%)  │
 *  │          │    WORKBENCH (55% · 10%)     │              │
 *  └──────────┴──────────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const AnalyticsShell: WorkspaceShell = {
  id: 'analytics',

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
      id: 'graph',
      rect: { x: 0.15, y: 0, width: 0.55, height: 0.70 },
      normalized: true,
      minWidth: 480,
      minHeight: 300,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'inspector',
      rect: { x: 0.70, y: 0, width: 0.30, height: 0.70 },
      normalized: true,
      minWidth: 240,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.15, y: 0.70, width: 0.55, height: 0.20 },
      normalized: true,
      minWidth: 480,
      minHeight: 100,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.70, y: 0.70, width: 0.30, height: 0.30 },
      normalized: true,
      minWidth: 240,
      minHeight: 100,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0.15, y: 0.90, width: 0.55, height: 0.10 },
      normalized: true,
      minWidth: 480,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
