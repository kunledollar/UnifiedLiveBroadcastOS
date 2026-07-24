import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
  graphZoneDefinition,
} from '@ubos/shared';

/** Analytics — Graph and metrics dominant with program confidence. */
export const AnalyticsShell: WorkspaceShell = {
  id: 'analytics',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 700, height: 380 },
    },
    {
      ...graphZoneDefinition,
      defaultRect: { x: 210, y: 436, width: 1110, height: 540 },
    },
    { ...inspectorZoneDefinition },
    { ...workbenchZoneDefinition },
  ],
};
