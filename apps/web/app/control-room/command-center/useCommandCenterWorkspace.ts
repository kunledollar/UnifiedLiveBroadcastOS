'use client';

/**
 * UBOS 3.15B — React bridge for the shared Workspace Manager foundation.
 *
 * Owns a `WorkspacePanelRegistry` instance plus the active preset, operator
 * zone overrides, bottom tab, and shell preferences. Everything managed here
 * is serializable layout metadata; no runtime handles (MediaStream,
 * MediaRecorder, AudioContext, WebRTC, DOM nodes, sockets, iframe refs) are
 * ever stored or persisted.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  WORKSPACE_LAYOUT_STORAGE_KEY,
  WorkspacePanelRegistry,
  applyLayoutSnapshot,
  calculateWorkspaceLayout,
  clampZoneSize,
  createDefaultPanelDefinitions,
  createLayoutSnapshot,
  getWorkspacePreset,
  parseLayoutSnapshot,
  serializeLayoutSnapshot,
  defaultWorkspacePresetId,
  type WorkspaceLayoutResult,
  type WorkspacePanelDefinition,
  type WorkspacePanelState,
  type WorkspacePreset,
  type WorkspacePresetId,
  type WorkspaceZoneId,
} from '@ubos/shared';
import type { DockTabId } from '../shell/types';
import {
  COMMAND_CENTER_PREFS_STORAGE_KEY,
  applyPresetToRegistry,
  bottomTabForPanel,
  createCommandCenterExtraPanelDefinitions,
  createDefaultCommandCenterPrefs,
  effectivePresetForLayout,
  operationsTabForPanel,
  parseCommandCenterPrefs,
  presetBottomTab,
  serializeCommandCenterPrefs,
} from './command-center-logic';
import type { OperationsTabId } from '../shell/types';

export type CommandCenterFullscreenTarget = 'program' | 'preview' | null;

export type CommandCenterZoneToggleId = Extract<
  WorkspaceZoneId,
  'left-dock' | 'right-dock' | 'bottom-workspace'
>;

const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

function createPopulatedRegistry(): WorkspacePanelRegistry {
  const registry = new WorkspacePanelRegistry();
  for (const definition of [
    ...createDefaultPanelDefinitions(),
    ...createCommandCenterExtraPanelDefinitions(),
  ]) {
    registry.registerPanel(definition);
  }
  return registry;
}

/**
 * Result of activatePanel — tells callers which tab (if any) to focus so
 * they can update their own React state without querying the registry again.
 */
export type ActivatePanelResult = {
  bottomTab: DockTabId | null;
  operationsTab: OperationsTabId | null;
};

export type CommandCenterWorkspace = {
  /** Attach to the element whose box drives layout geometry. */
  containerRef: (node: HTMLElement | null) => void;
  hydrated: boolean;
  activePresetId: WorkspacePresetId;
  preset: WorkspacePreset;
  layout: WorkspaceLayoutResult;
  panels: WorkspacePanelDefinition[];
  panelStates: ReadonlyMap<string, WorkspacePanelState>;
  isPanelVisible: (panelId: string) => boolean;
  isPanelCollapsed: (panelId: string) => boolean;
  isZoneCollapsed: (zoneId: WorkspaceZoneId) => boolean;
  activeBottomTab: DockTabId;
  layoutLocked: boolean;
  safeAreasVisible: boolean;
  fullscreenMonitor: CommandCenterFullscreenTarget;
  applyPreset: (presetId: WorkspacePresetId) => WorkspacePreset | null;
  togglePanelVisibility: (panelId: string) => void;
  setPanelVisible: (panelId: string, visible: boolean) => void;
  togglePanelCollapsed: (panelId: string) => void;
  toggleZone: (zoneId: CommandCenterZoneToggleId) => void;
  /**
   * Set a resizable zone to a specific size in pixels.
   * The size is clamped to the zone's min/max before being applied.
   * No-op when the layout is locked or the zone is not resizable.
   */
  setZoneSize: (zoneId: CommandCenterZoneToggleId, sizePx: number) => void;
  setActiveBottomTab: (tab: DockTabId) => void;
  setLayoutLocked: (locked: boolean) => void;
  toggleSafeAreas: () => void;
  setFullscreenMonitor: (target: CommandCenterFullscreenTarget) => void;
  saveLayout: () => void;
  resetLayout: () => void;
  /**
   * One Owner Rule enforcement: navigate to the primary home of a panel.
   *
   * Makes the panel visible, expands its zone, uncollpases it, and returns
   * the tab identifiers (if any) that the caller should activate to surface
   * the panel's primary editable home. No duplicate editors are created —
   * this only reveals the single registered instance.
   */
  activatePanel: (panelId: string) => ActivatePanelResult;
  /**
   * Activate a bottom workspace tab by id, expanding the zone if needed.
   * Replaces any shortcut that would render a duplicate editor inline.
   */
  activateWorkspace: (tabId: DockTabId) => void;
  /**
   * Move a registered panel to a different dock zone.
   * Expands the destination zone if it is currently collapsed.
   * No-op when the layout is locked or the move is not permitted by the registry.
   */
  movePanelToZone: (panelId: string, zoneId: WorkspaceZoneId) => void;
};

export function useCommandCenterWorkspace(): CommandCenterWorkspace {
  const registryRef = useRef<WorkspacePanelRegistry | null>(null);
  if (registryRef.current === null) {
    registryRef.current = createPopulatedRegistry();
  }
  const registry = registryRef.current;

  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((current) => current + 1), []);

  const [activePresetId, setActivePresetId] = useState<WorkspacePresetId>(defaultWorkspacePresetId);
  const [collapsedZoneOverrides, setCollapsedZoneOverrides] = useState<WorkspaceZoneId[]>([]);
  const [expandedZoneOverrides, setExpandedZoneOverrides] = useState<WorkspaceZoneId[]>([]);
  const [activeBottomTab, setActiveBottomTabState] = useState<DockTabId>('layers');
  const [layoutLocked, setLayoutLockedState] = useState(false);
  const [safeAreasVisible, setSafeAreasVisible] = useState(false);
  const [fullscreenMonitor, setFullscreenMonitor] = useState<CommandCenterFullscreenTarget>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [hydrated, setHydrated] = useState(false);
  /** User-chosen dock sizes (keyed by zone id, in px). Persisted as part of prefs. */
  const [zoneSizes, setZoneSizesState] = useState<Partial<Record<WorkspaceZoneId, number>>>({});
  // Ref so persist() always writes the latest zone sizes without taking them as deps.
  const zoneSizesRef = useRef(zoneSizes);
  zoneSizesRef.current = zoneSizes;
  // Timer ref for debounced zone-size writes.
  const zoneSizePersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const observerRef = useRef<ResizeObserver | null>(null);
  const containerRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setViewport({ width: Math.round(width), height: Math.round(height) });
      }
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  // Restore persisted layout metadata (metadata only — never runtime state).
  useEffect(() => {
    try {
      const storedSnapshot = window.localStorage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
      const snapshot = storedSnapshot ? parseLayoutSnapshot(storedSnapshot) : null;
      if (snapshot) {
        applyPresetToRegistry(registry, getWorkspacePreset(snapshot.activePresetId));
        applyLayoutSnapshot(registry, snapshot);
        setActivePresetId(snapshot.activePresetId);
        setCollapsedZoneOverrides(snapshot.collapsedZones);
        setActiveBottomTabState(presetBottomTab(getWorkspacePreset(snapshot.activePresetId)));
      }
      const storedPrefs = window.localStorage.getItem(COMMAND_CENTER_PREFS_STORAGE_KEY);
      const prefs = storedPrefs ? parseCommandCenterPrefs(storedPrefs) : null;
      if (prefs) {
        setActiveBottomTabState(prefs.activeBottomTab);
        setExpandedZoneOverrides(prefs.expandedZones);
        setLayoutLockedState(prefs.layoutLocked);
        setSafeAreasVisible(prefs.safeAreasVisible);
        if (Object.keys(prefs.zoneSizes).length > 0) {
          setZoneSizesState(prefs.zoneSizes);
        }
      }
    } catch {
      // Ignore storage failures; defaults already applied.
    }
    bump();
    setHydrated(true);
  }, [registry, bump]);

  const persist = useCallback(() => {
    try {
      window.localStorage.setItem(
        WORKSPACE_LAYOUT_STORAGE_KEY,
        serializeLayoutSnapshot(
          createLayoutSnapshot(registry, activePresetId, collapsedZoneOverrides),
        ),
      );
      window.localStorage.setItem(
        COMMAND_CENTER_PREFS_STORAGE_KEY,
        serializeCommandCenterPrefs({
          version: 2,
          activeBottomTab,
          expandedZones: expandedZoneOverrides,
          layoutLocked,
          safeAreasVisible,
          // Read from ref so zone sizes are always current without being in deps
          // (avoids running the normal persist path on every resize pointer-move).
          zoneSizes: zoneSizesRef.current,
        }),
      );
    } catch {
      // Storage unavailable (private mode, quota) — layout still works in-memory.
    }
  }, [
    registry,
    activePresetId,
    collapsedZoneOverrides,
    activeBottomTab,
    expandedZoneOverrides,
    layoutLocked,
    safeAreasVisible,
    // zoneSizes intentionally excluded — read from zoneSizesRef to avoid
    // running a full persist on every resize pointer-move event.
  ]);

  useEffect(() => {
    if (!hydrated) return;
    persist();
    // `revision` intentionally triggers persistence after registry mutations.
  }, [hydrated, persist, revision]);

  // Debounced persistence for zone-size changes. Zone sizes update on every
  // pointer-move event during a drag, so we throttle writes to ~400 ms.
  useEffect(() => {
    if (!hydrated) return;
    if (zoneSizePersistTimerRef.current !== null) {
      clearTimeout(zoneSizePersistTimerRef.current);
    }
    zoneSizePersistTimerRef.current = setTimeout(() => {
      zoneSizePersistTimerRef.current = null;
      persist();
    }, 400);
    return () => {
      if (zoneSizePersistTimerRef.current !== null) {
        clearTimeout(zoneSizePersistTimerRef.current);
        zoneSizePersistTimerRef.current = null;
      }
    };
  }, [hydrated, persist, zoneSizes]);

  const preset = useMemo(() => getWorkspacePreset(activePresetId), [activePresetId]);

  const layout = useMemo(
    () =>
      calculateWorkspaceLayout({
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        preset: effectivePresetForLayout(preset, expandedZoneOverrides),
        collapsedZones: collapsedZoneOverrides,
        zoneSizeOverrides: zoneSizes,
      }),
    [viewport, preset, expandedZoneOverrides, collapsedZoneOverrides, zoneSizes],
  );

  const panels = useMemo(() => registry.getAllPanels(), [registry]);

  const panelStates = useMemo(() => {
    void revision;
    return new Map(registry.getPanelStates().map((state) => [state.panelId, state]));
  }, [registry, revision]);

  const isPanelVisible = useCallback(
    (panelId: string) => panelStates.get(panelId)?.visible ?? false,
    [panelStates],
  );

  const isPanelCollapsed = useCallback(
    (panelId: string) => panelStates.get(panelId)?.collapsed ?? false,
    [panelStates],
  );

  const isZoneCollapsed = useCallback(
    (zoneId: WorkspaceZoneId) => layout.zones[zoneId]?.collapsed ?? false,
    [layout],
  );

  const ensureZoneExpanded = useCallback((zoneId: WorkspaceZoneId) => {
    setCollapsedZoneOverrides((current) => current.filter((zone) => zone !== zoneId));
    setExpandedZoneOverrides((current) =>
      current.includes(zoneId) ? current : [...current, zoneId],
    );
  }, []);

  const applyPreset = useCallback(
    (presetId: WorkspacePresetId): WorkspacePreset | null => {
      if (layoutLocked) return null;
      const nextPreset = getWorkspacePreset(presetId);
      applyPresetToRegistry(registry, nextPreset);
      setActivePresetId(presetId);
      setCollapsedZoneOverrides([]);
      setExpandedZoneOverrides([]);
      setActiveBottomTabState(presetBottomTab(nextPreset));
      bump();
      return nextPreset;
    },
    [registry, layoutLocked, bump],
  );

  const togglePanelVisibility = useCallback(
    (panelId: string) => {
      if (layoutLocked) return;
      const state = panelStates.get(panelId);
      try {
        registry.togglePanelVisibility(panelId);
      } catch {
        return;
      }
      if (state && !state.visible) {
        // Panel just became visible — make sure its zone is on screen.
        const zone = registry.getPanelState(panelId)?.zone;
        if (zone === 'left-dock' || zone === 'right-dock' || zone === 'bottom-workspace') {
          ensureZoneExpanded(zone);
        }
      }
      bump();
    },
    [registry, layoutLocked, panelStates, ensureZoneExpanded, bump],
  );

  const setPanelVisible = useCallback(
    (panelId: string, visible: boolean) => {
      const state = panelStates.get(panelId);
      if (!state || state.visible === visible) return;
      togglePanelVisibility(panelId);
    },
    [panelStates, togglePanelVisibility],
  );

  const togglePanelCollapsed = useCallback(
    (panelId: string) => {
      try {
        registry.togglePanelCollapsed(panelId);
      } catch {
        return;
      }
      bump();
    },
    [registry, bump],
  );

  const toggleZone = useCallback(
    (zoneId: CommandCenterZoneToggleId) => {
      if (layoutLocked) return;
      if (layout.zones[zoneId]?.collapsed) {
        ensureZoneExpanded(zoneId);
      } else {
        setExpandedZoneOverrides((current) => current.filter((zone) => zone !== zoneId));
        setCollapsedZoneOverrides((current) =>
          current.includes(zoneId) ? current : [...current, zoneId],
        );
      }
    },
    [layoutLocked, layout, ensureZoneExpanded],
  );

  const setZoneSize = useCallback(
    (zoneId: CommandCenterZoneToggleId, sizePx: number) => {
      if (layoutLocked) return;
      const clamped = clampZoneSize(zoneId, sizePx);
      setZoneSizesState((current) => {
        if (current[zoneId] === clamped) return current;
        return { ...current, [zoneId]: clamped };
      });
    },
    [layoutLocked],
  );

  const setActiveBottomTab = useCallback((tab: DockTabId) => {
    setActiveBottomTabState(tab);
  }, []);

  const setLayoutLocked = useCallback((locked: boolean) => {
    setLayoutLockedState(locked);
  }, []);

  const toggleSafeAreas = useCallback(() => {
    setSafeAreasVisible((current) => !current);
  }, []);

  const saveLayout = useCallback(() => {
    persist();
  }, [persist]);

  /**
   * One Owner Rule: navigate to the single registered primary home of a panel.
   * Secondary surfaces call this instead of rendering a duplicate full editor.
   */
  const activatePanel = useCallback(
    (panelId: string): ActivatePanelResult => {
      const state = panelStates.get(panelId);
      if (!state) return { bottomTab: null, operationsTab: null };

      // Reveal the panel if hidden.
      if (!state.visible) {
        try {
          registry.togglePanelVisibility(panelId);
          bump();
        } catch {
          // Non-closable panels are always visible; nothing to toggle.
        }
      }

      // Un-collapse if collapsed.
      if (state.collapsed) {
        try {
          registry.togglePanelCollapsed(panelId);
          bump();
        } catch {
          // Non-collapsible panels cannot be collapsed; safe to ignore.
        }
      }

      // Expand the zone if needed (applies to left-dock, right-dock, bottom-workspace).
      const zone = state.zone;
      if (zone === 'left-dock' || zone === 'right-dock' || zone === 'bottom-workspace') {
        ensureZoneExpanded(zone);
      }

      // Return tab identifiers so the calling shell can sync its own tab state.
      const bottomTab = bottomTabForPanel(panelId);
      if (bottomTab) setActiveBottomTabState(bottomTab);
      const operationsTab = operationsTabForPanel(panelId);

      return { bottomTab, operationsTab };
    },
    [panelStates, registry, bump, ensureZoneExpanded],
  );

  /**
   * One Owner Rule: activate a bottom-workspace tab and expand the zone.
   * Replaces any inline shortcut that would render a duplicate editor.
   */
  const activateWorkspace = useCallback(
    (tabId: DockTabId) => {
      setActiveBottomTabState(tabId);
      ensureZoneExpanded('bottom-workspace');
    },
    [ensureZoneExpanded],
  );

  const movePanelToZone = useCallback(
    (panelId: string, zoneId: WorkspaceZoneId) => {
      if (layoutLocked) return;
      try {
        registry.movePanelToZone(panelId, zoneId);
      } catch {
        return;
      }
      if (zoneId === 'left-dock' || zoneId === 'right-dock' || zoneId === 'bottom-workspace') {
        ensureZoneExpanded(zoneId);
      }
      bump();
    },
    [registry, layoutLocked, ensureZoneExpanded, bump],
  );

  const resetLayout = useCallback(() => {
    if (layoutLocked) return;
    try {
      window.localStorage.removeItem(WORKSPACE_LAYOUT_STORAGE_KEY);
      window.localStorage.removeItem(COMMAND_CENTER_PREFS_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
    const defaults = createDefaultCommandCenterPrefs();
    applyPresetToRegistry(registry, getWorkspacePreset(defaultWorkspacePresetId));
    setActivePresetId(defaultWorkspacePresetId);
    setCollapsedZoneOverrides([]);
    setExpandedZoneOverrides([]);
    setZoneSizesState({});
    setActiveBottomTabState(defaults.activeBottomTab);
    setSafeAreasVisible(defaults.safeAreasVisible);
    setFullscreenMonitor(null);
    bump();
  }, [registry, layoutLocked, bump]);

  return {
    containerRef,
    hydrated,
    activePresetId,
    preset,
    layout,
    panels,
    panelStates,
    isPanelVisible,
    isPanelCollapsed,
    isZoneCollapsed,
    activeBottomTab,
    layoutLocked,
    safeAreasVisible,
    fullscreenMonitor,
    applyPreset,
    togglePanelVisibility,
    setPanelVisible,
    togglePanelCollapsed,
    toggleZone,
    setZoneSize,
    setActiveBottomTab,
    setLayoutLocked,
    toggleSafeAreas,
    setFullscreenMonitor,
    saveLayout,
    resetLayout,
    activatePanel,
    activateWorkspace,
    movePanelToZone,
  };
}
