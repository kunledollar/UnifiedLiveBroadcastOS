'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import {
  applyPresetToState,
  adjustMonitorSplit,
  adjustZoneFlexWeight,
  loadWorkspaceCanvasLocally,
  resetWorkspaceCanvasLocally,
  saveWorkspaceCanvasLocally,
  setMonitorSplit,
  setZoneFlexWeight,
  togglePanelCollapsed,
  togglePanelUndocked,
} from './persistence';
import type { WorkspaceCanvasState, WorkspacePresetId } from './types';
import { getWorkspacePreset } from './presets';

const defaultState = applyPresetToState('technical-director');

export function useWorkspaceCanvasState(initialPresetId?: WorkspacePresetId) {
  const [state, setState] = useState<WorkspaceCanvasState>(() => {
    if (initialPresetId) return applyPresetToState(initialPresetId);
    return defaultState;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadWorkspaceCanvasLocally();
    if (stored) {
      setState(stored);
    } else if (initialPresetId) {
      setState(applyPresetToState(initialPresetId));
    }
    setHydrated(true);
  }, [initialPresetId]);

  useEffect(() => {
    if (!hydrated) return;
    saveWorkspaceCanvasLocally(state);
  }, [state, hydrated]);

  const selectPreset = useCallback((presetId: WorkspacePresetId) => {
    setState(applyPresetToState(presetId));
  }, []);

  const saveLayout = useCallback(() => {
    saveWorkspaceCanvasLocally(state);
  }, [state]);

  const resetLayout = useCallback(() => {
    resetWorkspaceCanvasLocally();
    setState(applyPresetToState('technical-director'));
  }, []);

  const collapsePanel = useCallback((panelId: string) => {
    setState((current) => togglePanelCollapsed(current, panelId));
  }, []);

  const undockPanel = useCallback((panelId: string) => {
    setState((current) => togglePanelUndocked(current, panelId));
  }, []);

  const setActiveNavItem = useCallback((activeNavItem: NavItemId) => {
    setState((current) => ({ ...current, activeNavItem }));
  }, []);

  const setActiveOperationsTab = useCallback((activeOperationsTab: OperationsTabId) => {
    setState((current) => ({ ...current, activeOperationsTab }));
  }, []);

  const setActiveDockTab = useCallback((activeDockTab: DockTabId) => {
    setState((current) => ({ ...current, activeDockTab }));
  }, []);

  const resizeZone = useCallback((zoneId: 'left' | 'right' | 'bottom', delta: number) => {
    setState((current) => adjustZoneFlexWeight(current, zoneId, delta));
  }, []);

  const resizeZoneTo = useCallback((zoneId: 'left' | 'right' | 'bottom', flexWeight: number) => {
    setState((current) => setZoneFlexWeight(current, zoneId, flexWeight));
  }, []);

  const resizeMonitorSplit = useCallback((deltaProgramWeight: number) => {
    setState((current) => adjustMonitorSplit(current, deltaProgramWeight));
  }, []);

  const setMonitorSplitWeights = useCallback((programFlexWeight: number) => {
    setState((current) => setMonitorSplit(current, programFlexWeight));
  }, []);

  const preset = getWorkspacePreset(state.presetId);

  return {
    state,
    preset,
    hydrated,
    selectPreset,
    saveLayout,
    resetLayout,
    collapsePanel,
    undockPanel,
    setActiveNavItem,
    setActiveOperationsTab,
    setActiveDockTab,
    resizeZone,
    resizeZoneTo,
    resizeMonitorSplit,
    setMonitorSplitWeights,
  };
}
