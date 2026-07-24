import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
} from '@ubos/shared';

export const DirectorShell: WorkspaceShell = {
  id: 'director',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      rect: { x: 210, y: 56, width: 1110, height: 520 },
    },
    { ...inspectorZoneDefinition },
    { ...workbenchZoneDefinition },
  ],
};
