/**
 * Singleton WorkspaceManager instance for the Control Room.
 *
 * Initialised with sensible defaults so the hook and components can
 * import it directly without needing a React context provider.
 * Replace initialState values via the setter methods at runtime.
 */
import { WorkspaceManager } from './WorkspaceManager';

import { workspaceState } from '../workspace/workspaceState';

// Seed example operators at startup
workspaceState.addOperator({ id: 'op-1', name: 'Operator', role: 'director',          workspace: 'director' });
workspaceState.addOperator({ id: 'op-2', name: 'TD',       role: 'technical-director', workspace: 'technical-director' });

// Seed example distribution destinations at startup
workspaceState.registerDestination({ id: 'yt',    name: 'YouTube Live',   type: 'rtmp',  endpoint: 'rtmp://youtube.com/live' });
workspaceState.registerDestination({ id: 'fb',    name: 'Facebook Live',  type: 'rtmp',  endpoint: 'rtmp://facebook.com/live' });
workspaceState.registerDestination({ id: 'local', name: 'Local Recorder', type: 'file',  endpoint: '/recordings/program.mp4' });

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
