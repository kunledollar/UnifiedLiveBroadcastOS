/**
 * ProductionShell — Step 39
 *
 * Normalized viewport-fraction geometry for the Production workspace.
 * Optimized for fast switching, scene transitions, preview/program
 * operations, and timeline-driven production flow.
 *
 *  ┌────────┬─────────────────────────────┬──────────────┐
 *  │        │         TRIAD (55%)         │ INSPECTOR    │
 *  │ SCENE  │  Program · Preview          │ (25%)        │
 *  │ (20%)  │  65% height                 │ 65% height   │
 *  │ full   ├─────────────────────────────┼──────────────┤
 *  │ height │  TIMELINE (55% · 15%)       │ OUTPUT       │
 *  │        ├─────────────────────────────┤ (25%)        │
 *  │        │  WORKBENCH (55% · 20%)      │ 35% height   │
 *  └────────┴─────────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const ProductionShell: WorkspaceShell = {
  id: 'production',

  zones: [
    {
      id: 'scene',
      rect: { x: 0, y: 0, width: 0.20, height: 1.0 },
      normalized: true,
      minWidth: 160,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.20, y: 0, width: 0.55, height: 0.65 },
      normalized: true,
      minWidth: 480,
      minHeight: 270,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'inspector',
      rect: { x: 0.75, y: 0, width: 0.25, height: 0.65 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'timeline',
      rect: { x: 0.20, y: 0.65, width: 0.55, height: 0.15 },
      normalized: true,
      minWidth: 480,
      minHeight: 48,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0.20, y: 0.80, width: 0.55, height: 0.20 },
      normalized: true,
      minWidth: 480,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.75, y: 0.65, width: 0.25, height: 0.35 },
      normalized: true,
      minWidth: 200,
      minHeight: 120,
      collapsible: true,
      resizable: true,
    },
  ],
};
