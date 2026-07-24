/**
 * DistributionShell — Step 42 (authoritative spec)
 *
 * Normalized viewport-fraction geometry for the Distribution Operator
 * workspace. Prioritizes routing controls, multi-destination previews,
 * and output health monitoring.
 *
 *  ┌─────────────┬──────────────────────────┬─────────────┐
 *  │ ROUTING MAP │      OUTPUT (50%)         │ OUTPUT      │
 *  │ (25%)       │  Multi-destination        │ HEALTH      │
 *  │ full height │  previews                 │ (25%)       │
 *  │             │  75% height               │ 75% height  │
 *  │             ├──────────────────────────┤             │
 *  │             │  WORKBENCH (50% · 25%)   │             │
 *  │             │  Logs · Notes · Routing  │             │
 *  └─────────────┴──────────────────────────┴─────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const DistributionShell: WorkspaceShell = {
  id: 'distribution-operator',

  zones: [
    {
      id: 'routing-map',
      rect: { x: 0, y: 0, width: 0.25, height: 1.0 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.25, y: 0, width: 0.50, height: 0.75 },
      normalized: true,
      minWidth: 420,
      minHeight: 270,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'output-health',
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
