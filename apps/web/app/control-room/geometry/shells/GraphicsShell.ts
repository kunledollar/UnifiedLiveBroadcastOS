import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
} from '@ubos/shared';

/** Graphics Operator — Preview-dominant with large inspector for template editing. */
export const GraphicsShell: WorkspaceShell = {
  id: 'graphics-operator',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 1110, height: 520 },
    },
    {
      ...inspectorZoneDefinition,
      defaultRect: { x: 1620, y: 56, width: 300, height: 700 },
    },
    { ...workbenchZoneDefinition },
  ],
};
