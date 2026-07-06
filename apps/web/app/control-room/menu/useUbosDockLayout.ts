'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import { ubosDockPanelRegistry } from './ubos-dock-registry';
import {
  applyWorkspaceModeToDockLayout,
  createDefaultDockLayoutState,
  loadDockLayoutLocally,
  resetDockLayoutLocally,
  saveDockLayoutLocally,
  toggleDockPanelVisibility,
  toggleZoneCollapsed,
} from './ubos-dock-layout-persistence';
import type { UbosDockPanelId, UbosDockLayoutState, UbosWorkspaceModeId } from './ubos-menu-types';
import { ubosWorkspaceModes } from './ubos-workspace-modes';

export type DockLayoutActivation = {
  navItem?: NavItemId;
  operationsTab?: OperationsTabId;
  dockTab?: DockTabId;
  showFloatingPipeline?: boolean;
  showSceneTransitions?: boolean;
};

export function resolveDockActivation(
  dockPanels: UbosDockLayoutState['dockPanels'],
): DockLayoutActivation {
  const activation: DockLayoutActivation = {};

  for (const [id, panel] of Object.entries(dockPanels)) {
    if (!panel.visible) continue;
    const def = ubosDockPanelRegistry[id as UbosDockPanelId];
    if (!def) continue;
    if (def.navItem && !activation.navItem) activation.navItem = def.navItem;
    if (def.operationsTab) activation.operationsTab = def.operationsTab;
    if (def.dockTab) activation.dockTab = def.dockTab;
    if (def.id === 'pipeline-inspector') activation.showFloatingPipeline = true;
    if (def.id === 'scene-transitions') activation.showSceneTransitions = true;
  }

  return activation;
}

export function useUbosDockLayout() {
  const [state, setState] = useState<UbosDockLayoutState>(createDefaultDockLayoutState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadDockLayoutLocally();
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDockLayoutLocally(state);
  }, [state, hydrated]);

  const selectWorkspaceMode = useCallback((modeId: UbosWorkspaceModeId) => {
    setState(applyWorkspaceModeToDockLayout(modeId));
    return ubosWorkspaceModes[modeId];
  }, []);

  const toggleDockPanel = useCallback((panelId: UbosDockPanelId) => {
    setState((current) => toggleDockPanelVisibility(current, panelId));
  }, []);

  const toggleZone = useCallback((zone: 'left' | 'right' | 'bottom') => {
    if (state.layoutLocked) return;
    setState((current) => toggleZoneCollapsed(current, zone));
  }, [state.layoutLocked]);

  const setLayoutLocked = useCallback((locked: boolean) => {
    setState((current) => ({ ...current, layoutLocked: locked }));
  }, []);

  const saveLayout = useCallback(() => {
    saveDockLayoutLocally(state);
  }, [state]);

  const resetLayout = useCallback(() => {
    resetDockLayoutLocally();
    setState(createDefaultDockLayoutState());
    return ubosWorkspaceModes.director;
  }, []);

  const activation = resolveDockActivation(state.dockPanels);

  return {
    state,
    hydrated,
    activation,
    selectWorkspaceMode,
    toggleDockPanel,
    toggleZone,
    setLayoutLocked,
    saveLayout,
    resetLayout,
  };
}
