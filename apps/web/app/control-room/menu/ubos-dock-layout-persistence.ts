import { UBOS_DOCK_PANEL_LIST } from './ubos-dock-registry';
import { ubosWorkspaceModes } from './ubos-workspace-modes';
import {
  UBOS_DOCK_LAYOUT_STORAGE_KEY,
  UBOS_DOCK_LAYOUT_VERSION,
  type UbosDockLayoutSnapshot,
  type UbosDockLayoutState,
  type UbosDockPanelId,
  type UbosWorkspaceModeId,
} from './ubos-menu-types';

const ALL_DOCK_IDS = UBOS_DOCK_PANEL_LIST.map((p) => p.id);

function isValidWorkspaceMode(value: unknown): value is UbosWorkspaceModeId {
  return typeof value === 'string' && value in ubosWorkspaceModes;
}

function isValidDockPanelId(value: unknown): value is UbosDockPanelId {
  return typeof value === 'string' && ALL_DOCK_IDS.includes(value as UbosDockPanelId);
}

export function createDefaultDockPanels(): UbosDockLayoutState['dockPanels'] {
  const mode = ubosWorkspaceModes.director;
  const panels = {} as UbosDockLayoutState['dockPanels'];
  for (const id of ALL_DOCK_IDS) {
    panels[id] = {
      visible: mode.dockVisibility[id] ?? false,
      collapsed: false,
    };
  }
  return panels;
}

export function createDefaultDockLayoutState(): UbosDockLayoutState {
  return {
    workspaceMode: 'director',
    layoutLocked: false,
    dockPanels: createDefaultDockPanels(),
    zoneCollapsed: { left: false, right: false, bottom: false },
  };
}

export function createDockLayoutSnapshot(state: UbosDockLayoutState): UbosDockLayoutSnapshot {
  return {
    version: UBOS_DOCK_LAYOUT_VERSION,
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

export function saveDockLayoutLocally(state: UbosDockLayoutState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    UBOS_DOCK_LAYOUT_STORAGE_KEY,
    JSON.stringify(createDockLayoutSnapshot(state)),
  );
}

export function loadDockLayoutLocally(): UbosDockLayoutState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(UBOS_DOCK_LAYOUT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<UbosDockLayoutSnapshot>;
    if (!isValidWorkspaceMode(parsed.workspaceMode)) return null;

    const fallback = createDefaultDockPanels();
    const dockPanels = { ...fallback };
    if (parsed.dockPanels) {
      for (const id of ALL_DOCK_IDS) {
        const stored = parsed.dockPanels[id];
        if (stored) {
          dockPanels[id] = {
            visible: Boolean(stored.visible),
            collapsed: Boolean(stored.collapsed),
          };
        }
      }
    }

    return {
      workspaceMode: parsed.workspaceMode,
      layoutLocked: Boolean(parsed.layoutLocked),
      dockPanels,
      zoneCollapsed: {
        left: parsed.zoneCollapsed?.left ?? false,
        right: parsed.zoneCollapsed?.right ?? false,
        bottom: parsed.zoneCollapsed?.bottom ?? false,
      },
    };
  } catch {
    window.localStorage.removeItem(UBOS_DOCK_LAYOUT_STORAGE_KEY);
    return null;
  }
}

export function resetDockLayoutLocally(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(UBOS_DOCK_LAYOUT_STORAGE_KEY);
}

export function applyWorkspaceModeToDockLayout(modeId: UbosWorkspaceModeId): UbosDockLayoutState {
  const mode = ubosWorkspaceModes[modeId];
  const dockPanels = createDefaultDockPanels();
  for (const id of ALL_DOCK_IDS) {
    dockPanels[id] = {
      visible: mode.dockVisibility[id] ?? false,
      collapsed: false,
    };
  }
  return {
    workspaceMode: modeId,
    layoutLocked: false,
    dockPanels,
    zoneCollapsed: { ...mode.zoneCollapsed },
  };
}

export function toggleDockPanelVisibility(
  state: UbosDockLayoutState,
  panelId: UbosDockPanelId,
): UbosDockLayoutState {
  if (!isValidDockPanelId(panelId)) return state;
  const current = state.dockPanels[panelId];
  return {
    ...state,
    dockPanels: {
      ...state.dockPanels,
      [panelId]: { ...current, visible: !current.visible },
    },
  };
}

export function toggleZoneCollapsed(
  state: UbosDockLayoutState,
  zone: 'left' | 'right' | 'bottom',
): UbosDockLayoutState {
  return {
    ...state,
    zoneCollapsed: {
      ...state.zoneCollapsed,
      [zone]: !state.zoneCollapsed[zone],
    },
  };
}
