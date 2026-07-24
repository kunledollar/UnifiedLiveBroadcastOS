/**
 * AutomationShell — Step 43
 *
 * Normalized viewport-fraction geometry for the Automation Director
 * workspace. Optimized for flow-builder graph editing, cue execution,
 * and macro management.
 *
 *  ┌──────────┬──────────────────────────────┬──────────────┐
 *  │ SCENE    │    AUTOMATION GRAPH (55%)    │ INSPECTOR    │
 *  │ (20%)    │    Flow builder canvas       │ (25%)        │
 *  │ full h   │    60% height                │ 60% height   │
 *  │          ├──────────────────────────────┼──────────────┤
 *  │          │    TRIAD (55% · 25%)         │ OUTPUT       │
 *  │          ├──────────────────────────────┤ (25% · 40%)  │
 *  │          │    WORKBENCH (55% · 15%)     │              │
 *  └──────────┴──────────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const AutomationShell: WorkspaceShell = {
  id: 'automation-operator',

  zones: [
    {
      id: 'scene',
      rect: { x: 0, y: 0, width: 0.20, height: 1.0 },
      normalized: true,
      minWidth: 160,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'graph',
      rect: { x: 0.20, y: 0, width: 0.55, height: 0.60 },
      normalized: true,
      minWidth: 480,
      minHeight: 300,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'inspector',
      rect: { x: 0.75, y: 0, width: 0.25, height: 0.60 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.20, y: 0.60, width: 0.55, height: 0.25 },
      normalized: true,
      minWidth: 480,
      minHeight: 120,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.75, y: 0.60, width: 0.25, height: 0.40 },
      normalized: true,
      minWidth: 200,
      minHeight: 120,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0.20, y: 0.85, width: 0.55, height: 0.15 },
      normalized: true,
      minWidth: 480,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
