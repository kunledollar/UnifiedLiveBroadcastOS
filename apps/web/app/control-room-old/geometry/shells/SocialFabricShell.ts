/**
 * SocialFabricShell — Step 45 (authoritative spec)
 *
 * Normalized viewport-fraction geometry for the Social Fabric Operator
 * workspace. Prioritizes real-time chat moderation, engagement monitoring,
 * AI-assisted moderation, and viewer interaction flow.
 *
 *  ┌──────────────┬──────────────────────────┬─────────────┐
 *  │  ENGAGEMENT  │    UNIFIED CHAT (50%)    │ MODERATION  │
 *  │  GRAPHS      │    All platforms unified  │ (25%)       │
 *  │  (25%)       │    Chat timeline          │ 75% height  │
 *  │  full height │    75% height             │             │
 *  │              ├──────────────────────────┤             │
 *  │              │  WORKBENCH (50% · 25%)   │             │
 *  │              │  Logs · Notes · Automod  │             │
 *  └──────────────┴──────────────────────────┴─────────────┘
 */
import type { WorkspaceShell } from '@ubos/shared';

export const SocialFabricShell: WorkspaceShell = {
  id: 'social-fabric',

  zones: [
    {
      id: 'engagement-graphs',
      rect: { x: 0, y: 0, width: 0.25, height: 1.0 },
      normalized: true,
      minWidth: 200,
      minHeight: 200,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'unified-chat',
      rect: { x: 0.25, y: 0, width: 0.50, height: 0.75 },
      normalized: true,
      minWidth: 360,
      minHeight: 300,
      collapsible: false,
      resizable: true,
    },

    {
      id: 'moderation',
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
      minWidth: 360,
      minHeight: 40,
      collapsible: true,
      resizable: true,
    },
  ],
};
