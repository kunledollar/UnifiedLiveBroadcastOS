/**
 * Singleton WorkspaceManager instance for the Control Room.
 *
 * Initialised with sensible defaults so the hook and components can
 * import it directly without needing a React context provider.
 * Replace initialState values via the setter methods at runtime.
 */
import { WorkspaceManager } from './WorkspaceManager';

export const workspaceManager = new WorkspaceManager({
  programSceneId:  null,
  previewSceneId:  null,
  isLive:          false,
  isRecording:     false,
  activeOutputCount:  0,
  connectedGuestCount: 0,
  viewportWidth:   1920,
  viewportHeight:  1080,
  workspace:       'director',
  monitors:        [],
  outputs:         [],
  aiCrewActive:    false,
  aiCrewOverlayEnabled: false,
  aiAlertLevel:    'normal',
});
