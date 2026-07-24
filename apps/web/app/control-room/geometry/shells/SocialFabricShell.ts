/**
 * SocialFabricShell — Step 45
 *
 * Normalized viewport-fraction geometry for the Social Fabric / Community
 * Director workspace. Optimized for unified chat, moderation, audience
 * engagement, and platform health monitoring.
 *
 *  ┌──────────────────────────┬──────────────┬──────────────┐
 *  │   CHAT MODERATION (50%)  │  TRIAD       │ INSPECTOR    │
 *  │   Unified chat +         │  (25%)       │ (25%)        │
 *  │   moderation queue       │  70% height  │ 70% height   │
 *  │   full height            ├──────────────┼──────────────┤
 *  │                          │  WORKBENCH   │  OUTPUT      │
 *  │                          │  (25% · 30%) │  (25% · 30%) │
 *  └──────────────────────────┴──────────────┴──────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const SocialFabricShell: WorkspaceShell = {
  id: 'social-fabric',

  zones: [
    {
      id: 'chat-moderation',
      rect: { x: 0, y: 0, width: 0.50, height: 1.0 },
      normalized: true,
      minWidth: 360,
      minHeight: 300,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'triad',
      rect: { x: 0.50, y: 0, width: 0.25, height: 0.70 },
      normalized: true,
      minWidth: 240,
      minHeight: 135,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'inspector',
      rect: { x: 0.75, y: 0, width: 0.25, height: 0.70 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'workbench',
      rect: { x: 0.50, y: 0.70, width: 0.25, height: 0.30 },
      normalized: true,
      minWidth: 240,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },

    {
      id: 'output',
      rect: { x: 0.75, y: 0.70, width: 0.25, height: 0.30 },
      normalized: true,
      minWidth: 200,
      minHeight: 100,
      collapsible: true,
      resizable: true,
    },
  ],
};
