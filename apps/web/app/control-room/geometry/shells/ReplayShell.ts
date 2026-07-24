import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
  graphZoneDefinition,
} from '@ubos/shared';

/** Replay Operator — Preview-dominant with tall workbench for timeline. */
export const ReplayShell: WorkspaceShell = {
  id: 'replay-operator',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 1110, height: 400 },
    },
    {
      ...graphZoneDefinition,
      defaultRect: { x: 210, y: 456, width: 1110, height: 380 },
    },
    { ...inspectorZoneDefinition },
    { ...workbenchZoneDefinition },
  ],
};
