import type { WorkspaceShell } from '@ubos/shared';
import {
  sceneZoneDefinition,
  inspectorZoneDefinition,
  workbenchZoneDefinition,
  dockZoneDefinition,
  graphZoneDefinition,
} from '@ubos/shared';

/** Automation Operator — Flow-builder graph dominant with scene confidence. */
export const AutomationShell: WorkspaceShell = {
  id: 'automation-operator',
  zones: [
    { ...dockZoneDefinition },
    {
      ...sceneZoneDefinition,
      defaultRect: { x: 210, y: 56, width: 900, height: 380 },
    },
    {
      ...graphZoneDefinition,
      defaultRect: { x: 210, y: 436, width: 1110, height: 500 },
    },
    { ...inspectorZoneDefinition },
    { ...workbenchZoneDefinition },
  ],
};
