import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
  graphZoneDefinition,
} from '@ubos/shared';

export const ProductionShell: WorkspaceShell = {
  id: 'production',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 1110, height: 480 },
    },
    {
      ...graphZoneDefinition,
      defaultRect: { x: 210, y: 536, width: 1110, height: 300 },
    },
    { ...inspectorZoneDefinition },
    { ...workbenchZoneDefinition },
  ],
};
