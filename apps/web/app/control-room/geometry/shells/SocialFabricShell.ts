import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
} from '@ubos/shared';

/** Social Fabric — Program-dominant with wide inspector for moderation. */
export const SocialFabricShell: WorkspaceShell = {
  id: 'social-fabric',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 900, height: 480 },
    },
    {
      ...inspectorZoneDefinition,
      defaultRect: { x: 1620, y: 56, width: 300, height: 984 },
    },
    { ...workbenchZoneDefinition },
  ],
};
