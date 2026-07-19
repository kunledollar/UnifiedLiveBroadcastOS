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
  workspacePresets,
  normalizePresentation,
  createCustomWorkspace,
  createEmptyCustomWorkspaceRegistry,
  deleteCustomWorkspace,
  parseCustomWorkspaceRegistry,
  renameCustomWorkspace,
  saveCustomWorkspace,
  serializeCustomWorkspaceRegistry,
  CUSTOM_WORKSPACE_STORAGE_KEY,
  type CustomWorkspace,
  type CustomWorkspaceRegistry,
  workspaceState,
  type WorkspacePresentation,
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
  COMMAND_CENTER_SAVED_LAYOUTS_KEY,
  applyPresetToRegistry,
  bottomTabForPanel,
  createCommandCenterExtraPanelDefinitions,
  createDefaultCommandCenterPrefs,
  effectivePresetForLayout,
  operationsTabForPanel,
  parseCommandCenterPrefs,
  parseSavedLayoutsStore,
  presetBottomTab,
  serializeCommandCenterPrefs,
  serializeSavedLayoutsStore,
  type SavedLayoutsStore,
  type SavedPresetLayout,
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
  /**
   * Whether the current preset has a user-saved layout (explicit Save Layout).
   * False means the preset is showing its factory defaults.
   */
  hasUserSavedLayout: boolean;
  /** Factory, Saved, or Unsaved presentation state; never reflects runtime state. */
  layoutState: 'factory' | 'saved' | 'unsaved';
  customWorkspaces: CustomWorkspace[];
  activeCustomWorkspaceId: string | null;
  duplicateWorkspace: () => void;
  applyCustomWorkspace: (id: string) => void;
  renameCustomWorkspace: (id: string, name: string) => boolean;
  deleteCustomWorkspace: (id: string) => void;
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
  /**
   * Explicitly save the current layout for the active preset.
   * Writes to a per-preset store so saving Compact never overwrites Director,
   * and vice versa. The saved layout is restored when the preset is next
   * activated (including after a page reload when the preset is active).
   */
  saveLayout: () => void;
  /**
   * Restore the factory definition of the currently active preset.
   * Clears only this preset's user-saved geometry overrides; other presets
   * are unaffected. NOT blocked by layout lock (lock only prevents manual
   * drag-resize, not authoritative reset).
   */
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
  const [customRegistry, setCustomRegistry] = useState<CustomWorkspaceRegistry>(
    createEmptyCustomWorkspaceRegistry,
  );
  const [activeCustomWorkspaceId, setActiveCustomWorkspaceId] = useState<string | null>(null);
  const factoryPresentationRef = useRef<WorkspacePresentation | null>(null);
  // Ref so persist() always writes the latest zone sizes without taking them as deps.
  const zoneSizesRef = useRef(zoneSizes);
  zoneSizesRef.current = zoneSizes;
  // Timer ref for debounced zone-size writes.
  const zoneSizePersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Per-preset explicit saved layouts (written only on "Save Layout").
   * This is the source of truth for hasUserSavedLayout.
   */
  const [savedLayoutsStore, setSavedLayoutsStore] = useState<SavedLayoutsStore>({
    version: 1,
    presets: {},
  });
  // Ref so saveLayout/resetLayout always see the latest store without stale closure.
  const savedLayoutsStoreRef = useRef(savedLayoutsStore);
  savedLayoutsStoreRef.current = savedLayoutsStore;

  // Ref for activePresetId — lets saveLayout/resetLayout read current value without deps.
  const activePresetIdRef = useRef(activePresetId);
  activePresetIdRef.current = activePresetId;

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
      // 1. Restore per-preset saved layouts store (explicit Save Layout entries).
      const storedSaved = window.localStorage.getItem(COMMAND_CENTER_SAVED_LAYOUTS_KEY);
      const savedStore = storedSaved ? parseSavedLayoutsStore(storedSaved) : null;
      if (savedStore) {
        setSavedLayoutsStore(savedStore);
        savedLayoutsStoreRef.current = savedStore;
      }
      const storedCustom = window.localStorage.getItem(CUSTOM_WORKSPACE_STORAGE_KEY);
      const custom = storedCustom ? parseCustomWorkspaceRegistry(storedCustom) : null;
      if (custom) setCustomRegistry(custom);

      // 2. Restore active preset from the auto-persist snapshot.
      const storedSnapshot = window.localStorage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
      const snapshot = storedSnapshot ? parseLayoutSnapshot(storedSnapshot) : null;
      if (snapshot) {
        // Apply factory defaults for the preset first, then overlay the saved
        // panel state so registry rules (non-closable monitors, etc.) still win.
        applyPresetToRegistry(registry, getWorkspacePreset(snapshot.activePresetId));
        applyLayoutSnapshot(registry, snapshot);
        setActivePresetId(snapshot.activePresetId);
        activePresetIdRef.current = snapshot.activePresetId;
        setCollapsedZoneOverrides(snapshot.collapsedZones);
        setActiveBottomTabState(presetBottomTab(getWorkspacePreset(snapshot.activePresetId)));
      }

      // 3. Restore shell prefs (bottom tab, lock, safe areas, zone sizes).
      // These overlay the snapshot values; prefs always win for UI chrome state.
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

  /**
   * Write the current preset's layout into the per-preset saved-layouts store.
   * Reads active preset and zone sizes from refs so the callback stays stable.
   */
  const writeSavedLayoutEntry = useCallback(
    (presetId: WorkspacePresetId, collapseOverrides: WorkspaceZoneId[], bottomTab: DockTabId) => {
      const entry: SavedPresetLayout = {
        panelStates: registry.getPanelStates(),
        collapsedZones: collapseOverrides,
        zoneSizes: zoneSizesRef.current,
        activeBottomTab: bottomTab,
        savedAt: new Date().toISOString(),
      };
      const current = savedLayoutsStoreRef.current;
      const next: SavedLayoutsStore = {
        version: 1,
        presets: { ...current.presets, [presetId]: entry },
      };
      setSavedLayoutsStore(next);
      savedLayoutsStoreRef.current = next;
      try {
        window.localStorage.setItem(
          COMMAND_CENTER_SAVED_LAYOUTS_KEY,
          serializeSavedLayoutsStore(next),
        );
      } catch {
        // Storage unavailable — saved-layout store stays in memory.
      }
    },
    [registry],
  );

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

  const currentPresentation = useMemo<WorkspacePresentation>(
    () =>
      normalizePresentation({
        panelStates: [...panelStates.values()],
        collapsedZones: collapsedZoneOverrides,
        zoneSizes,
        activeBottomTab,
      }),
    [panelStates, collapsedZoneOverrides, zoneSizes, activeBottomTab],
  );

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
      // Layout lock prevents manual dragging/resizing but NEVER blocks preset selection.
      const nextPreset = getWorkspacePreset(presetId);
      setActiveCustomWorkspaceId(null);

      // Step 1: apply factory defaults for the new preset.
      applyPresetToRegistry(registry, nextPreset);
      factoryPresentationRef.current = normalizePresentation({
        panelStates: registry.getPanelStates(),
        collapsedZones: [],
        zoneSizes: {},
        activeBottomTab: presetBottomTab(nextPreset),
      });
      setActivePresetId(presetId);
      activePresetIdRef.current = presetId;

      // Step 2: if the operator has previously saved a layout for this preset,
      // overlay it on top of the factory defaults so their customizations are
      // restored when they switch back to it.
      const saved = savedLayoutsStoreRef.current.presets[presetId];
      if (saved) {
        try {
          registry.restorePanelStates(
            saved.panelStates.map((s) => ({
              panelId: s.panelId,
              zone: s.zone as WorkspaceZoneId,
              visible: s.visible,
              collapsed: s.collapsed,
            })),
          );
          setCollapsedZoneOverrides(saved.collapsedZones);
          if (Object.keys(saved.zoneSizes).length > 0) {
            setZoneSizesState(saved.zoneSizes);
          }
          setExpandedZoneOverrides([]);
          setActiveBottomTabState(saved.activeBottomTab);
        } catch {
          // Saved state invalid (e.g. registered panels changed) — use factory defaults.
          setCollapsedZoneOverrides([]);
          setExpandedZoneOverrides([]);
          setActiveBottomTabState(presetBottomTab(nextPreset));
        }
      } else {
        setCollapsedZoneOverrides([]);
        setExpandedZoneOverrides([]);
        setActiveBottomTabState(presetBottomTab(nextPreset));
      }

      bump();
      return nextPreset;
    },
    [registry, bump],
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
    if (activeCustomWorkspaceId) {
      const next = saveCustomWorkspace(
        customRegistry,
        activeCustomWorkspaceId,
        currentPresentation,
      );
      setCustomRegistry(next);
      try {
        window.localStorage.setItem(
          CUSTOM_WORKSPACE_STORAGE_KEY,
          serializeCustomWorkspaceRegistry(next),
        );
      } catch {
        /* in-memory state remains usable */
      }
      return;
    }
    // Auto-persist the full shell state (active preset + panel states + prefs).
    persist();
    // Additionally write a per-preset explicit save so switching away and back
    // restores this exact layout, and so resetting only this preset leaves
    // other presets' saved states untouched.
    writeSavedLayoutEntry(activePresetIdRef.current, collapsedZoneOverrides, activeBottomTab);
  }, [
    persist,
    writeSavedLayoutEntry,
    collapsedZoneOverrides,
    activeBottomTab,
    activeCustomWorkspaceId,
    customRegistry,
    currentPresentation,
  ]);

  const persistCustomRegistry = useCallback((next: CustomWorkspaceRegistry) => {
    setCustomRegistry(next);
    try {
      window.localStorage.setItem(
        CUSTOM_WORKSPACE_STORAGE_KEY,
        serializeCustomWorkspaceRegistry(next),
      );
    } catch {
      /* storage is optional */
    }
  }, []);

  const duplicateWorkspace = useCallback(() => {
    const source = activeCustomWorkspaceId ?? activePresetIdRef.current;
    const name = activeCustomWorkspaceId
      ? (customRegistry.workspaces[activeCustomWorkspaceId]?.name ?? 'Workspace')
      : getWorkspacePreset(activePresetIdRef.current).name;
    const workspace = createCustomWorkspace(source, `${name} copy`, currentPresentation);
    persistCustomRegistry({
      ...customRegistry,
      workspaces: { ...customRegistry.workspaces, [workspace.id]: workspace },
    });
    setActiveCustomWorkspaceId(workspace.id);
  }, [activeCustomWorkspaceId, customRegistry, currentPresentation, persistCustomRegistry]);

  const applyCustomWorkspace = useCallback(
    (id: string) => {
      const custom = customRegistry.workspaces[id];
      if (!custom) return;
      const sourceId = custom.sourceWorkspaceId;
      const base = (
        sourceId in workspacePresets ? sourceId : defaultWorkspacePresetId
      ) as WorkspacePresetId;
      applyPreset(base);
      try {
        registry.restorePanelStates(custom.presentation.panelStates);
      } catch {
        /* validated metadata only */
      }
      setCollapsedZoneOverrides(custom.presentation.collapsedZones);
      setZoneSizesState(custom.presentation.zoneSizes);
      setActiveBottomTabState(custom.presentation.activeBottomTab as DockTabId);
      setActiveCustomWorkspaceId(id);
      bump();
    },
    [customRegistry, applyPreset, registry, bump],
  );

  const renameCustom = useCallback(
    (id: string, name: string) => {
      if (!name.trim() || !customRegistry.workspaces[id]) return false;
      persistCustomRegistry(renameCustomWorkspace(customRegistry, id, name));
      return true;
    },
    [customRegistry, persistCustomRegistry],
  );

  const removeCustom = useCallback(
    (id: string) => {
      const custom = customRegistry.workspaces[id];
      if (!custom) return;
      persistCustomRegistry(deleteCustomWorkspace(customRegistry, id));
      if (activeCustomWorkspaceId === id) {
        setActiveCustomWorkspaceId(null);
        applyPreset(
          (custom.sourceWorkspaceId in workspacePresets
            ? custom.sourceWorkspaceId
            : defaultWorkspacePresetId) as WorkspacePresetId,
        );
      }
    },
    [customRegistry, persistCustomRegistry, activeCustomWorkspaceId, applyPreset],
  );

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
    if (activeCustomWorkspaceId) {
      const custom = customRegistry.workspaces[activeCustomWorkspaceId];
      if (custom) {
        const source = (
          custom.sourceWorkspaceId in workspacePresets
            ? custom.sourceWorkspaceId
            : defaultWorkspacePresetId
        ) as WorkspacePresetId;
        applyPreset(source);
        const presentation = normalizePresentation({
          panelStates: registry.getPanelStates(),
          collapsedZones: [],
          zoneSizes: {},
          activeBottomTab: presetBottomTab(getWorkspacePreset(source)),
        });
        const next = saveCustomWorkspace(customRegistry, activeCustomWorkspaceId, presentation);
        persistCustomRegistry(next);
      }
      return;
    }
    // Reset is NOT blocked by layout lock.
    // It restores the factory definition of the CURRENT preset (not director),
    // clears only this preset's user-saved geometry overrides, and leaves every
    // other preset's saved state untouched.
    const currentPresetId = activePresetIdRef.current;
    const factoryPreset = getWorkspacePreset(currentPresetId);

    // Remove the per-preset saved layout for the current preset only.
    const current = savedLayoutsStoreRef.current;
    if (current.presets[currentPresetId]) {
      const { [currentPresetId]: _removed, ...remaining } = current.presets;
      const next: SavedLayoutsStore = { version: 1, presets: remaining };
      setSavedLayoutsStore(next);
      savedLayoutsStoreRef.current = next;
      try {
        window.localStorage.setItem(
          COMMAND_CENTER_SAVED_LAYOUTS_KEY,
          serializeSavedLayoutsStore(next),
        );
      } catch {
        // Ignore storage failures.
      }
    }

    // Clear the auto-persist snapshot (it will be rewritten on next state change).
    try {
      window.localStorage.removeItem(WORKSPACE_LAYOUT_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }

    // Restore factory panel layout for the current preset.
    applyPresetToRegistry(registry, factoryPreset);
    factoryPresentationRef.current = normalizePresentation({
      panelStates: registry.getPanelStates(),
      collapsedZones: [],
      zoneSizes: {},
      activeBottomTab: presetBottomTab(factoryPreset),
    });
    setCollapsedZoneOverrides([]);
    setExpandedZoneOverrides([]);
    // Reset zone sizes for this preset only (clear all — per-preset size tracking
    // is not yet implemented, so clearing all sizes is the safe conservative choice).
    setZoneSizesState({});
    setActiveBottomTabState(presetBottomTab(factoryPreset));
    setFullscreenMonitor(null);
    // Do NOT change activePresetId — reset stays on the same preset.
    // Do NOT forcibly unlock — lock state is a separate setting.
    bump();
  }, [registry, bump, activeCustomWorkspaceId, customRegistry, applyPreset, persistCustomRegistry]);

  const hasUserSavedLayout = activePresetId in savedLayoutsStore.presets;
  const savedPresentation = savedLayoutsStore.presets[activePresetId]
    ? normalizePresentation({
        ...savedLayoutsStore.presets[activePresetId],
        panelStates: savedLayoutsStore.presets[activePresetId].panelStates.map((state) => ({
          ...state,
          zone: state.zone as WorkspaceZoneId,
        })),
      })
    : (factoryPresentationRef.current ?? currentPresentation);
  const currentWorkspaceState = workspaceState(
    currentPresentation,
    savedPresentation,
    hasUserSavedLayout,
  );

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
    hasUserSavedLayout,
    layoutState: currentWorkspaceState,
    customWorkspaces: Object.values(customRegistry.workspaces),
    activeCustomWorkspaceId,
    duplicateWorkspace,
    applyCustomWorkspace,
    renameCustomWorkspace: renameCustom,
    deleteCustomWorkspace: removeCustom,
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
