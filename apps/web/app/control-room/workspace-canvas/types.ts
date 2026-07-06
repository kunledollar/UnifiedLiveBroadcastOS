import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';

/** Production graph node rendered on the workspace canvas. */
export type ProductionNodeKind =
  | 'program'
  | 'preview'
  | 'source'
  | 'guest'
  | 'aux'
  | 'multiview'
  | 'confidence';

export type ProductionNode = {
  id: string;
  kind: ProductionNodeKind;
  label: string;
  sceneId?: string;
  sourceId?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
};

/** Panel identifiers for the workspace canvas. */
export type WorkspacePanelId =
  | 'asset-tree'
  | 'split-monitor'
  | 'switcher'
  | 'stream-patch'
  | 'audio-mixer'
  | 'system-diagnostics'
  | 'operations-dock'
  | 'bottom-deck'
  | 'graphics-deck'
  | 'media-deck'
  | 'replay-deck'
  | 'automation-deck'
  | 'collaboration-deck'
  | 'pipeline-inspector';

export type WorkspaceZoneId = 'top' | 'left' | 'center' | 'right' | 'bottom' | 'floating';

/** Dockable panel state tracked in React. */
export type WorkspacePanel = {
  id: string;
  panelType: WorkspacePanelId;
  zone: WorkspaceZoneId;
  title: string;
  collapsed: boolean;
  undocked: boolean;
  order: number;
  flexWeight: number;
  visible: boolean;
  metadata?: Record<string, unknown>;
};

/** Layout zone grouping panels. */
export type WorkspaceZone = {
  id: WorkspaceZoneId;
  label: string;
  panelIds: string[];
  flexWeight: number;
  collapsed: boolean;
};

export type WorkspacePresetId =
  | 'solo-streamer'
  | 'technical-director'
  | 'audio-engineer'
  | 'graphics-operator'
  | 'replay-operator'
  | 'producer';

/** Role-based layout preset with panel placement. */
export type WorkspacePreset = {
  id: WorkspacePresetId;
  label: string;
  description: string;
  role: string;
  zones: WorkspaceZone[];
  panels: WorkspacePanel[];
  defaultNavItem: NavItemId;
  defaultOperationsTab: OperationsTabId;
  defaultDockTab: DockTabId;
  programFlexWeight: number;
  previewFlexWeight: number;
};

/** Active route edge in the stream patch matrix. */
export type RoutingMatrixEdge = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  destinationId: string;
  destinationLabel: string;
  active: boolean;
  gain?: number;
};

export type WorkspaceCanvasState = {
  presetId: WorkspacePresetId;
  panels: Record<string, WorkspacePanel>;
  zones: Record<WorkspaceZoneId, WorkspaceZone>;
  undockedPanelIds: string[];
  activeNavItem: NavItemId;
  activeOperationsTab: OperationsTabId;
  activeDockTab: DockTabId;
};

export const WORKSPACE_CANVAS_STORAGE_KEY = 'ubos.controlRoom.workspaceCanvas.v315';
export const WORKSPACE_CANVAS_VERSION = 1 as const;

export type WorkspaceCanvasSnapshot = {
  version: typeof WORKSPACE_CANVAS_VERSION;
  presetId: WorkspacePresetId;
  panels: Record<string, WorkspacePanel>;
  zones: Record<WorkspaceZoneId, WorkspaceZone>;
  undockedPanelIds: string[];
  activeNavItem: NavItemId;
  activeOperationsTab: OperationsTabId;
  activeDockTab: DockTabId;
  updatedAt: string;
};
