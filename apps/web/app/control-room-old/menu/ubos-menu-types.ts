import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';

/** Dockable panel identifiers exposed in the Docks menu. */
export type UbosDockPanelId =
  | 'scenes'
  | 'sources'
  | 'audio-mixer'
  | 'audio-channels'
  | 'scene-transitions'
  | 'replay'
  | 'media'
  | 'graphics'
  | 'guests'
  | 'inspector'
  | 'pipeline-inspector'
  | 'broadcast-io'
  | 'streaming'
  | 'recording'
  | 'automation'
  | 'monitor-wall'
  | 'timeline'
  | 'logs'
  | 'system-status';

export type UbosDockZone = 'left' | 'right' | 'bottom' | 'center' | 'floating';

export type UbosWorkspaceModeId =
  | 'director'
  | 'audio'
  | 'graphics'
  | 'replay'
  | 'streaming'
  | 'monitor-wall'
  | 'compact';

export type UbosDockPanelState = {
  visible: boolean;
  collapsed: boolean;
};

export type UbosDockLayoutState = {
  workspaceMode: UbosWorkspaceModeId;
  layoutLocked: boolean;
  dockPanels: Record<UbosDockPanelId, UbosDockPanelState>;
  zoneCollapsed: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
};

export type UbosDockPanelDefinition = {
  id: UbosDockPanelId;
  label: string;
  zone: UbosDockZone;
  navItem?: NavItemId;
  operationsTab?: OperationsTabId;
  dockTab?: DockTabId;
};

export type UbosMenuAction =
  | { type: 'workspace-mode'; mode: UbosWorkspaceModeId }
  | { type: 'toggle-dock'; panelId: UbosDockPanelId }
  | { type: 'reset-layout' }
  | { type: 'lock-layout'; locked: boolean }
  | { type: 'save-layout' }
  | { type: 'toggle-compact' }
  | { type: 'layout-focus'; focus: 'full' | 'switcher' | 'audio' }
  | { type: 'navigate'; href: string };

export const UBOS_DOCK_LAYOUT_STORAGE_KEY = 'ubos.controlRoom.dockLayout.v1';
export const UBOS_DOCK_LAYOUT_VERSION = 1 as const;

export type UbosDockLayoutSnapshot = UbosDockLayoutState & {
  version: typeof UBOS_DOCK_LAYOUT_VERSION;
  updatedAt: string;
};
