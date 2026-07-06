import {
  WORKSPACE_CANVAS_STORAGE_KEY,
  WORKSPACE_CANVAS_VERSION,
  type WorkspaceCanvasSnapshot,
  type WorkspaceCanvasState,
  type WorkspacePanel,
  type WorkspacePresetId,
  type WorkspaceZoneId,
} from './types';
import { createCanvasStateFromPreset, getWorkspacePreset, workspaceCanvasPresets } from './presets';

function isValidPresetId(value: unknown): value is WorkspacePresetId {
  return typeof value === 'string' && value in workspaceCanvasPresets;
}

export function createWorkspaceCanvasSnapshot(state: WorkspaceCanvasState): WorkspaceCanvasSnapshot {
  return {
    version: WORKSPACE_CANVAS_VERSION,
    presetId: state.presetId,
    panels: state.panels,
    zones: state.zones,
    undockedPanelIds: state.undockedPanelIds,
    activeNavItem: state.activeNavItem,
    activeOperationsTab: state.activeOperationsTab,
    activeDockTab: state.activeDockTab,
    updatedAt: new Date().toISOString(),
  };
}

export function saveWorkspaceCanvasLocally(state: WorkspaceCanvasState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    WORKSPACE_CANVAS_STORAGE_KEY,
    JSON.stringify(createWorkspaceCanvasSnapshot(state)),
  );
}

export function loadWorkspaceCanvasLocally(): WorkspaceCanvasState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(WORKSPACE_CANVAS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceCanvasSnapshot>;
    if (!isValidPresetId(parsed.presetId)) return null;
    const fallback = createCanvasStateFromPreset(getWorkspacePreset(parsed.presetId));
    return {
      presetId: parsed.presetId,
      panels: { ...fallback.panels, ...parsed.panels },
      zones: { ...fallback.zones, ...(parsed.zones as WorkspaceCanvasState['zones']) },
      undockedPanelIds: parsed.undockedPanelIds ?? [],
      activeNavItem: parsed.activeNavItem ?? fallback.activeNavItem,
      activeOperationsTab: parsed.activeOperationsTab ?? fallback.activeOperationsTab,
      activeDockTab: parsed.activeDockTab ?? fallback.activeDockTab,
    };
  } catch {
    window.localStorage.removeItem(WORKSPACE_CANVAS_STORAGE_KEY);
    return null;
  }
}

export function resetWorkspaceCanvasLocally(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(WORKSPACE_CANVAS_STORAGE_KEY);
}

export function applyPresetToState(presetId: WorkspacePresetId): WorkspaceCanvasState {
  return createCanvasStateFromPreset(getWorkspacePreset(presetId));
}

export function togglePanelCollapsed(
  state: WorkspaceCanvasState,
  panelId: string,
): WorkspaceCanvasState {
  const panel = state.panels[panelId];
  if (!panel) return state;
  return {
    ...state,
    panels: {
      ...state.panels,
      [panelId]: { ...panel, collapsed: !panel.collapsed },
    },
  };
}

export function togglePanelUndocked(
  state: WorkspaceCanvasState,
  panelId: string,
): WorkspaceCanvasState {
  const panel = state.panels[panelId];
  if (!panel) return state;
  const undocked = !panel.undocked;
  const undockedPanelIds = undocked
    ? [...state.undockedPanelIds, panelId]
    : state.undockedPanelIds.filter((id) => id !== panelId);
  const originalZone =
    (panel.metadata?.originalZone as WorkspacePanel['zone'] | undefined) ?? 'left';
  return {
    ...state,
    undockedPanelIds,
    panels: {
      ...state.panels,
      [panelId]: {
        ...panel,
        undocked,
        zone: undocked ? 'floating' : originalZone,
        metadata: { ...panel.metadata, originalZone: panel.zone },
      },
    },
  };
}

export function toggleZoneCollapsed(
  state: WorkspaceCanvasState,
  zoneId: WorkspaceZoneId,
): WorkspaceCanvasState {
  const zone = state.zones[zoneId];
  if (!zone) return state;
  return {
    ...state,
    zones: {
      ...state.zones,
      [zoneId]: { ...zone, collapsed: !zone.collapsed },
    },
  };
}
