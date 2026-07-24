import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
  outputZoneDefinition,
} from '@ubos/shared';

/** Distribution / Streaming Operator — Program-dominant with full output panel. */
export const DistributionShell: WorkspaceShell = {
  id: 'distribution-operator',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 1110, height: 500 },
    },
    {
      ...outputZoneDefinition,
      defaultRect: { x: 1620, y: 56, width: 300, height: 900 },
    },
    { ...inspectorZoneDefinition },
    { ...workbenchZoneDefinition },
  ],
};
