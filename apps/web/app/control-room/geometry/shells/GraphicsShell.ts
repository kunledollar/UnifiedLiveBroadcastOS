/**
 * GraphicsShell — Step 40
 *
 * Normalized viewport-fraction geometry for the Graphics Operator workspace.
 * Prioritizes composer access, program/preview visibility, and contextual
 * inspector editing.
 *
 *  ┌──────────────┬───────────────────────────┬──────────────┐
 *  │   GRAPHICS   │       TRIAD (45%)          │ INSPECTOR    │
 *  │   COMPOSER   │  Program · Preview         │ (25%)        │
 *  │   (30%)      │  65% height                │ 65% height   │
 *  │   full       ├───────────────────────────┼──────────────┤
 *  │   height     │  WORKBENCH (45% · 35%)     │ OUTPUT       │
 *  │              │  Assets · Logs · Notes     │ (25% · 35%)  │
 *  └──────────────┴───────────────────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const GraphicsShell: WorkspaceShell = {
  id: 'graphics-operator',

  zones: [
    {
      id: 'graphics-composer',
      rect: { x: 0, y: 0, width: 0.30, height: 1.0 },
      normalized: true,
      minWidth: 240,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.30, y: 0, width: 0.45, height: 0.65 },
      normalized: true,
      minWidth: 420,
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
      id: 'workbench',
      rect: { x: 0.30, y: 0.65, width: 0.45, height: 0.35 },
      normalized: true,
      minWidth: 420,
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
