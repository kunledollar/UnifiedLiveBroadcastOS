import type { WorkspaceShell } from '@ubos/shared';
import {
  triadZoneDefinition,
  outputZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
} from '@ubos/shared';

/** Monitor Wall — Triad-dominant full-screen confidence surface. */
export const MonitorWallShell: WorkspaceShell = {
  id: 'monitor-wall',
  zones: [
    { ...dockZoneDefinition },
    {
      ...triadZoneDefinition,
      rect: { x: 210, y: 56, width: 1110, height: 600 },
    },
    {
      ...outputZoneDefinition,
      rect: { x: 1620, y: 56, width: 300, height: 600 },
    },
    { ...workbenchZoneDefinition },
  ],
};
