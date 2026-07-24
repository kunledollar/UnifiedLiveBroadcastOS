/**
 * DirectorShell — Step 38
 *
 * Normalized viewport-fraction geometry for the Director workspace.
 * All rect values are 0.0–1.0 fractions scaled to pixel coords by
 * UbosGeometryEngine.computeZones() at runtime.
 *
 * Layout (left → right, top → bottom):
 *
 *  ┌──────────┬────────────────────────┬──────────────┐
 *  │          │      TRIAD (48%)       │ INSPECTOR    │
 *  │  SCENE   │  Program · Preview     │ (30%)        │
 *  │  (22%)   │  70% height            │ 70% height   │
 *  │  full    ├────────────────────────┼──────────────┤
 *  │  height  │  WORKBENCH (48%)       │ OUTPUT       │
 *  │          │  Timeline · Logs       │ (30%)        │
 *  │          │  30% height            │ 30% height   │
 *  └──────────┴────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const DirectorShell: WorkspaceShell = {
  id: 'director',

  zones: [
    {
      id: 'scene',
      rect: { x: 0, y: 0, width: 0.22, height: 1.0 },
      normalized: true,
      minWidth: 180,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.22, y: 0, width: 0.48, height: 0.70 },
      normalized: true,
      minWidth: 480,
      minHeight: 270,
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
      id: 'workbench',
      rect: { x: 0.22, y: 0.70, width: 0.48, height: 0.30 },
      normalized: true,
      minWidth: 480,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.70, y: 0.70, width: 0.30, height: 0.30 },
      normalized: true,
      minWidth: 240,
      minHeight: 120,
      collapsible: true,
      resizable: true,
    },
  ],
};
