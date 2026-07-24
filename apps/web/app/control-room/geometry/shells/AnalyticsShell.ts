/**
 * AnalyticsShell — Step 44 (authoritative spec)
 *
 * Normalized viewport-fraction geometry for the Analytics Operator
 * workspace. Prioritizes real-time metrics, audience analytics,
 * engagement data, and graph-based visualizations.
 *
 *  ┌────────────────────────────────┬─────────────────────┐
 *  │   ANALYTICS PANELS (65%)       │   GRAPH (35%)       │
 *  │   Real-time metrics            │   Visualizations    │
 *  │   Audience · Engagement        │   Trend analysis    │
 *  │   75% height                   │   75% height        │
 *  ├────────────────────────────────┼─────────────────────┤
 *  │   WORKBENCH (65% · 25%)        │   OUTPUT (35% · 25%)│
 *  │   Logs · Notes · Automation    │   Output health     │
 *  └────────────────────────────────┴─────────────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const AnalyticsShell: WorkspaceShell = {
  id: 'analytics',

  zones: [
    {
      id: 'analytics-panels',
      rect: { x: 0, y: 0, width: 0.65, height: 0.75 },
      normalized: true,
      minWidth: 480,
      minHeight: 300,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'graph',
      rect: { x: 0.65, y: 0, width: 0.35, height: 0.75 },
      normalized: true,
      minWidth: 280,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0, y: 0.75, width: 0.65, height: 0.25 },
      normalized: true,
      minWidth: 480,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.65, y: 0.75, width: 0.35, height: 0.25 },
      normalized: true,
      minWidth: 280,
      minHeight: 100,
      collapsible: true,
      resizable: true,
    },
  ],
};
