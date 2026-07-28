/**
 * AutomationShell — Step 43 (authoritative spec)
 *
 * Normalized viewport-fraction geometry for the Automation Director
 * workspace. Prioritizes rule-driven production, automation graph
 * editing, and contextual inspector for rule properties.
 *
 *  ┌─────────────┬──────────────────────────┬─────────────┐
 *  │  RULE LIST  │   AUTOMATION GRAPH (50%) │ INSPECTOR   │
 *  │  (25%)      │   Node-based graph       │ (25%)       │
 *  │  full height│   75% height             │ 75% height  │
 *  │             ├──────────────────────────┤             │
 *  │             │  WORKBENCH (50% · 25%)   │             │
 *  │             │  Logs · Notes · Testing  │             │
 *  └─────────────┴──────────────────────────┴─────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const AutomationShell: WorkspaceShell = {
  id: 'automation-operator',

  zones: [
    {
      id: 'rule-list',
      rect: { x: 0, y: 0, width: 0.25, height: 1.0 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'automation-graph',
      rect: { x: 0.25, y: 0, width: 0.50, height: 0.75 },
      normalized: true,
      minWidth: 420,
      minHeight: 300,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'inspector',
      rect: { x: 0.75, y: 0, width: 0.25, height: 0.75 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0.25, y: 0.75, width: 0.50, height: 0.25 },
      normalized: true,
      minWidth: 420,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
