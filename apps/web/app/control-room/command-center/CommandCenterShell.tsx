'use client';

/**
 * UBOS 3.15D-3 — Command Center shell.
 *
 * Non-intrusive layout orchestration for the Control Room. The shell places
 * EXISTING panel and monitor nodes (passed in as ReactNode props, exactly
 * like the previous layout received them) into zones registered with the
 * UBOS 3.15A Workspace Manager. It never creates, duplicates, or touches
 * ProductionGraph, media, camera, audio, recording, streaming, guest,
 * automation, or pipeline logic — it only decides where things appear.
 *
 * All geometry comes from `calculateWorkspaceLayout` (viewport + preset +
 * collapsed zones); nothing is hardcoded per monitor. Zones are laid out
 * with flexbox from that metadata, so panels can never overlap the Program
 * or Preview monitors.
 *
 * One Owner Rule (3.15C/D): every capability has exactly one primary editable
 * home. Secondary surfaces call `activatePanel(panelId)` or
 * `activateWorkspace(tabId)` to navigate to the primary home instead of
 * rendering a duplicate editor inline.
 *
 * 3.15D-3 additions:
 * - Professional menu system: File · Workspace · Production · Sources ·
 *   Graphics · Replay · Guests · Broadcast · Automation · Monitoring ·
 *   Tools · Window · Help
 * - Command Palette (Ctrl+K) wired to Workspace Manager
 * - Global keyboard shortcuts: Ctrl+1-5 presets, Ctrl+Shift+L reset, Esc close
 *
 * Responsive rules (3.15D-2):
 *   ≥1920px:     left dock visible, right dock visible, bottom workspace visible
 *   1440–1919px: left dock visible, right dock may collapse per preset
 *   1200–1439px: right dock collapsed by default, left dock compact, bottom tabbed
 *   <1200px:     secondary docks collapsed, Program/Preview side-by-side if ≥900px
 *   <900px:      compact mode — Program/Preview stacked, bottom workspace tab bar only
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { workspaceZoneDefinitions, type WorkspacePresetId } from '@ubos/shared';
import { ubosWorkspaceModes, type UbosWorkspaceModeId } from '../menu';
import type { DockTabId, NavItemId, OperationsTabId, SourceDockTabId } from '../shell/types';
import type { MonitorStatusInfo } from '../broadcast-command-center/CenterProgramPreviewDeck';
import type { OperationsDockSection } from '../broadcast-command-center/RightOperationsDock';
import { broadcastSurfaces } from '../broadcast-command-center/broadcast-theme';
import { CommandCenterBottomWorkspace } from './CommandCenterBottomWorkspace';
import { CommandCenterLeftDock } from './CommandCenterLeftDock';
import { CommandCenterLeftRail } from './CommandCenterLeftRail';
import { CommandCenterRightDock } from './CommandCenterRightDock';
import { CommandCenterStage } from './CommandCenterStage';
import { CommandCenterTopMenu } from './CommandCenterTopMenu';
import { CommandCenterTopRibbon } from './CommandCenterTopRibbon';
import { CommandPalette } from './CommandPalette';
import type { MonitorOverlayData } from './MonitorOverlay';
import { useWorkspaceKeyboard } from './useWorkspaceKeyboard';
import {
  operationsTabForPanel,
  panelForOperationsTab,
  panelGatingBottomTab,
  panelGatingSourceTab,
  presetBottomTab,
  presetOperationsTab,
  workspaceModeForPreset,
  type CommandCenterRailItem,
} from './command-center-logic';
import { sourceDockTabs } from '../broadcast-command-center/command-rail-constants';
import {
  useCommandCenterWorkspace,
  type CommandCenterZoneToggleId,
} from './useCommandCenterWorkspace';

export type CommandCenterShellProps = {
  statusBar: ReactNode;
  activeNav: NavItemId;
  onNavChange: (nav: NavItemId) => void;
  sourceDockContent: ReactNode;
  activeSourceDockTab: SourceDockTabId;
  onSourceDockTabChange: (tab: SourceDockTabId) => void;
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programStatus: MonitorStatusInfo;
  previewStatus: MonitorStatusInfo;
  switcherContent: ReactNode;
  operationsSections: OperationsDockSection[];
  bottomWorkspaceContent: ReactNode;
  activeOperationsTab: OperationsTabId;
  activeDockTab: DockTabId;
  onOperationsTabChange: (tab: OperationsTabId) => void;
  onDockTabChange: (tab: DockTabId) => void;
  layoutStyle?: CSSProperties | undefined;
  /** Extra overlay telemetry sourced from existing production state. */
  programOverlay?: Partial<MonitorOverlayData> | undefined;
  previewOverlay?: Partial<MonitorOverlayData> | undefined;
  /** Existing transition actions (wired straight to the existing switcher handlers). */
  onCut?: (() => void) | undefined;
  onTake?: (() => void) | undefined;
  onAuto?: (() => void) | undefined;
  onWorkspaceModeApplied?: ((mode: UbosWorkspaceModeId, compactChrome?: boolean) => void) | undefined;
  onSaveWorkspace?: (() => void) | undefined;
  onRestoreWorkspace?: (() => void) | undefined;
  onResetWorkspace?: (() => void) | undefined;
  onSeedDemo?: (() => void) | undefined;
  onSimulateDemo?: (() => void) | undefined;
  onResetDemo?: (() => void) | undefined;
};

/**
 * Collapsed zone indicator strip — 3.15C visual polish.
 * Renders a thin clickable strip with a vertical label and an expand chevron.
 * Shows a subtle hover accent so it's clearly interactive.
 */
function CollapsedZoneStrip({
  side,
  label,
  onExpand,
}: {
  side: 'left' | 'right';
  label: string;
  onExpand: () => void;
}) {
  return (
    <div
      className={cn(
        'flex h-full w-5 shrink-0 flex-col items-center overflow-hidden',
        'rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite/50',
        'transition-colors duration-[var(--ubos-duration-fast)]',
        'hover:border-ubos-border-default hover:bg-ubos-graphite',
      )}
    >
      <button
        type="button"
        onClick={onExpand}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-1',
          'rounded px-0.5 py-2',
          'text-[8px] font-black uppercase tracking-widest text-ubos-fg-muted',
          'transition-colors duration-[var(--ubos-duration-fast)]',
          'hover:text-ubos-fg-secondary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
        )}
        aria-label={`Expand ${label} dock`}
        title={`Expand ${label} (click or drag)`}
      >
        <span className="text-[10px] font-medium" aria-hidden="true">
          {side === 'left' ? '›' : '‹'}
        </span>
        <span className="[writing-mode:vertical-rl] rotate-180 leading-none">{label}</span>
      </button>
    </div>
  );
}

export function CommandCenterShell({
  statusBar,
  activeNav,
  onNavChange,
  sourceDockContent,
  activeSourceDockTab,
  onSourceDockTabChange,
  programMonitor,
  previewMonitor,
  programStatus,
  previewStatus,
  switcherContent,
  operationsSections,
  bottomWorkspaceContent,
  activeOperationsTab,
  activeDockTab,
  onOperationsTabChange,
  onDockTabChange,
  layoutStyle,
  programOverlay,
  previewOverlay,
  onCut,
  onTake,
  onAuto,
  onWorkspaceModeApplied,
  onSaveWorkspace,
  onRestoreWorkspace,
  onResetWorkspace,
  onSeedDemo,
  onSimulateDemo,
  onResetDemo,
}: CommandCenterShellProps) {
  const workspace = useCommandCenterWorkspace();
  const {
    containerRef,
    layout,
    preset,
    activePresetId,
    panels,
    isPanelVisible,
    isPanelCollapsed,
    layoutLocked,
    safeAreasVisible,
    fullscreenMonitor,
    applyPreset,
    togglePanelVisibility,
    setPanelVisible,
    togglePanelCollapsed,
    toggleZone,
    setActiveBottomTab,
    setLayoutLocked,
    toggleSafeAreas,
    setFullscreenMonitor,
    saveLayout,
    resetLayout,
    activatePanel,
    activateWorkspace,
  } = workspace;

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  const leftDockGeometry = layout.zones['left-dock'];
  const rightDockGeometry = layout.zones['right-dock'];
  const bottomGeometry = layout.zones['bottom-workspace'];

  const leftCollapsed = leftDockGeometry.collapsed;
  const rightCollapsed = rightDockGeometry.collapsed;
  const bottomCollapsed = bottomGeometry.collapsed;

  // ----- preset switching ---------------------------------------------------
  const handleSelectPreset = useCallback(
    (presetId: WorkspacePresetId) => {
      const nextPreset = applyPreset(presetId);
      if (!nextPreset) return; // layout locked
      const bottomTab = presetBottomTab(nextPreset);
      onDockTabChange(bottomTab);
      const opsTab = presetOperationsTab(presetId);
      if (opsTab) onOperationsTabChange(opsTab);
      const mode = workspaceModeForPreset(presetId);
      onWorkspaceModeApplied?.(mode, ubosWorkspaceModes[mode].compactChrome);
    },
    [applyPreset, onDockTabChange, onOperationsTabChange, onWorkspaceModeApplied],
  );

  // ----- bottom workspace ---------------------------------------------------
  const handleBottomTabChange = useCallback(
    (tab: DockTabId) => {
      setActiveBottomTab(tab);
      onDockTabChange(tab);
    },
    [setActiveBottomTab, onDockTabChange],
  );

  // Keep layout metadata in sync when other parts of the app switch the tab.
  useEffect(() => {
    setActiveBottomTab(activeDockTab);
  }, [activeDockTab, setActiveBottomTab]);

  const handleActivateBottomTab = useCallback(
    (tab: DockTabId) => {
      // One Owner Rule: activateWorkspace expands the zone and sets the tab
      // without rendering any duplicate editor inline.
      activateWorkspace(tab);
      const gatingPanel = panelGatingBottomTab(tab);
      if (gatingPanel) setPanelVisible(gatingPanel, true);
      handleBottomTabChange(tab);
    },
    [activateWorkspace, setPanelVisible, handleBottomTabChange],
  );

  // ----- left dock ----------------------------------------------------------
  const handleActivateSourceTab = useCallback(
    (tab: SourceDockTabId) => {
      const gatingPanel = panelGatingSourceTab(tab);
      if (gatingPanel) {
        // One Owner Rule: route through activatePanel so the panel is
        // un-collapsed and its zone is expanded — matching the right-dock
        // path that uses activatePanel for all operations panels.
        activatePanel(gatingPanel);
      } else if (leftCollapsed) {
        // No gating panel for this tab: still expand the zone if collapsed.
        toggleZone('left-dock');
      }
      onSourceDockTabChange(tab);
    },
    [activatePanel, leftCollapsed, toggleZone, onSourceDockTabChange],
  );

  const handleHideSourcePanel = useCallback(
    (panelId: string) => {
      togglePanelVisibility(panelId);
      if (panelGatingSourceTab(activeSourceDockTab) === panelId) {
        const fallback = sourceDockTabs.find((tab) => {
          if (tab.id === activeSourceDockTab) return false;
          const gate = panelGatingSourceTab(tab.id);
          return gate === null || (gate !== panelId && isPanelVisible(gate));
        });
        if (fallback) onSourceDockTabChange(fallback.id);
      }
    },
    [togglePanelVisibility, activeSourceDockTab, isPanelVisible, onSourceDockTabChange],
  );

  // ----- right dock ---------------------------------------------------------
  const handleActivateOperationsPanel = useCallback(
    (panelId: string) => {
      // One Owner Rule: activatePanel reveals the single registered instance
      // of this panel without rendering any duplicate editor inline.
      const result = activatePanel(panelId);
      if (result.operationsTab) onOperationsTabChange(result.operationsTab);
      else {
        // Fallback for panels without an operations tab mapping.
        setPanelVisible(panelId, true);
        if (isPanelCollapsed(panelId)) togglePanelCollapsed(panelId);
        if (rightCollapsed) toggleZone('right-dock');
      }
    },
    [
      activatePanel,
      setPanelVisible,
      isPanelCollapsed,
      togglePanelCollapsed,
      rightCollapsed,
      toggleZone,
      onOperationsTabChange,
    ],
  );

  // When another surface focuses an operations tab, reveal the mapped panel
  // (mirrors the previous dock behavior). Only react to real tab changes so
  // manual collapse choices are respected afterwards.
  const previousOpsTab = useRef(activeOperationsTab);
  useEffect(() => {
    if (previousOpsTab.current === activeOperationsTab) return;
    previousOpsTab.current = activeOperationsTab;
    const panelId = panelForOperationsTab(activeOperationsTab);
    if (!panelId) return;
    setPanelVisible(panelId, true);
    if (isPanelCollapsed(panelId)) togglePanelCollapsed(panelId);
  }, [activeOperationsTab, setPanelVisible, isPanelCollapsed, togglePanelCollapsed]);

  // ----- left rail ----------------------------------------------------------
  const handleRailItem = useCallback(
    (item: CommandCenterRailItem) => {
      if (item.preset) {
        handleSelectPreset(item.preset);
        return;
      }
      if (item.nav) onNavChange(item.nav);
      if (item.sourceTab) handleActivateSourceTab(item.sourceTab);
      if (item.bottomTab) handleActivateBottomTab(item.bottomTab);
    },
    [handleSelectPreset, onNavChange, handleActivateSourceTab, handleActivateBottomTab],
  );

  // ----- overlays -----------------------------------------------------------
  const programOverlayData: MonitorOverlayData = {
    stateLabel: programStatus.state === 'live' ? 'LIVE' : 'STANDBY',
    sourceName: programStatus.sourceName,
    resolution: programStatus.resolution,
    fps: programStatus.fps,
    audioLevel: programStatus.audioLevel,
    ...programOverlay,
  };

  const previewOverlayData: MonitorOverlayData = {
    stateLabel: previewStatus.state === 'live' ? 'LIVE' : 'READY',
    sourceName: previewStatus.sourceName,
    resolution: previewStatus.resolution,
    fps: previewStatus.fps,
    audioLevel: previewStatus.audioLevel,
    ...previewOverlay,
  };

  // Stacking policy (3.15D-2):
  //   <900px center width  → Program above Preview (stacked)
  //   ≥900px center width  → Program left, Preview right (side-by-side)
  // layout.monitorsStacked is set by calculateWorkspaceLayout when the
  // MONITOR_STACK_WIDTH threshold is crossed; we also check the raw rect.
  const monitorsStacked = layout.monitorsStacked || layout.zones['center-stage'].rect.width < 900;

  // Responsive bottom collapse: at <900px the bottom workspace shows tab bar
  // only (the zone collapses to its collapsedSize = tab bar height).
  const viewportWidth = layout.zones['center-stage'].rect.width +
    (leftCollapsed ? 0 : (leftDockGeometry.rect.width || workspaceZoneDefinitions['left-dock'].defaultSize)) +
    (rightCollapsed ? 0 : (rightDockGeometry.rect.width || workspaceZoneDefinitions['right-dock'].defaultSize)) +
    (layout.zones['left-rail'].rect.width || workspaceZoneDefinitions['left-rail'].defaultSize);

  // At <900px viewport we force the bottom workspace to collapsed (tab bar only)
  // so it never covers Program/Preview on very small screens.
  const forceBottomCollapsed = viewportWidth < 900;

  // Zone geometry from Workspace Manager. Rail uses a fixed width from the
  // zone definition. Docks use their stored/preset width (falling back to
  // defaultSize) and are floored at minSize so they never underflow.
  const railWidth =
    layout.zones['left-rail'].rect.width || workspaceZoneDefinitions['left-rail'].defaultSize;
  const leftDockWidth = Math.max(
    leftDockGeometry.rect.width || workspaceZoneDefinitions['left-dock'].defaultSize,
    workspaceZoneDefinitions['left-dock'].minSize,
  );
  const rightDockWidth = Math.max(
    rightDockGeometry.rect.width || workspaceZoneDefinitions['right-dock'].defaultSize,
    workspaceZoneDefinitions['right-dock'].minSize,
  );
  const bottomHeight = Math.max(
    bottomGeometry.rect.height || workspaceZoneDefinitions['bottom-workspace'].defaultSize,
    workspaceZoneDefinitions['bottom-workspace'].minSize,
  );

  const isZoneToggleCollapsed = useCallback(
    (zoneId: CommandCenterZoneToggleId) => layout.zones[zoneId]?.collapsed ?? false,
    [layout],
  );

  // ----- global keyboard shortcuts (3.15D-3) --------------------------------
  // Close overlays (palette, fullscreen) on Esc
  const handleCloseOverlays = useCallback(() => {
    setCommandPaletteOpen(false);
    setFullscreenMonitor(null);
  }, [setFullscreenMonitor]);

  useWorkspaceKeyboard({
    layoutLocked,
    onSelectPreset: handleSelectPreset,
    onResetLayout: resetLayout,
    onOpenCommandPalette: openCommandPalette,
    onCloseOverlays: handleCloseOverlays,
    onSaveLayout: saveLayout,
    onCut,
    onTake,
    onAuto,
  });

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden',
        'text-sm antialiased',
        broadcastSurfaces.app,
      )}
      style={layoutStyle}
      data-ubos-command-center="3.15d-3"
      data-ubos-version="3.15d-3"
    >
      {/* Command Palette — rendered at root so it overlays everything */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={closeCommandPalette}
        activePresetId={activePresetId}
        layoutLocked={layoutLocked}
        onSelectPreset={handleSelectPreset}
        onActivateBottomTab={handleActivateBottomTab}
        onActivateSourceTab={handleActivateSourceTab}
        onActivateOperationsPanel={handleActivateOperationsPanel}
        onToggleZone={toggleZone}
        onResetLayout={resetLayout}
        onSaveLayout={saveLayout}
        onToggleLayoutLock={() => setLayoutLocked(!layoutLocked)}
        onNavChange={onNavChange}
        onFullscreenProgram={() => setFullscreenMonitor('program')}
        onFullscreenPreview={() => setFullscreenMonitor('preview')}
      />

      <header
        className={cn(
          'flex shrink-0 flex-col border-b',
          broadcastSurfaces.header,
          'shadow-[var(--ubos-elevation-rail)]',
        )}
      >
        {statusBar}
        <CommandCenterTopMenu
          activePresetId={activePresetId}
          layoutLocked={layoutLocked}
          safeAreasVisible={safeAreasVisible}
          dockPanels={panels}
          isPanelVisible={isPanelVisible}
          isZoneCollapsed={isZoneToggleCollapsed}
          onSelectPreset={handleSelectPreset}
          onTogglePanel={togglePanelVisibility}
          onToggleZone={toggleZone}
          onResetLayout={resetLayout}
          onToggleLayoutLock={() => setLayoutLocked(!layoutLocked)}
          onSaveLayout={saveLayout}
          onFullscreenProgram={() => setFullscreenMonitor('program')}
          onFullscreenPreview={() => setFullscreenMonitor('preview')}
          onToggleSafeAreas={toggleSafeAreas}
          onActivateBottomTab={handleActivateBottomTab}
          onActivateSourceTab={handleActivateSourceTab}
          onActivateOperationsPanel={handleActivateOperationsPanel}
          onNavChange={onNavChange}
          onOpenCommandPalette={openCommandPalette}
          onCut={onCut}
          onTake={onTake}
          onAuto={onAuto}
          onSaveWorkspace={onSaveWorkspace}
          onRestoreWorkspace={onRestoreWorkspace}
          onResetWorkspace={onResetWorkspace}
          onSeedDemo={onSeedDemo}
          onSimulateDemo={onSimulateDemo}
          onResetDemo={onResetDemo}
        />
        <CommandCenterTopRibbon
          activePresetId={activePresetId}
          layoutLocked={layoutLocked}
          isZoneCollapsed={isZoneToggleCollapsed}
          onSelectPreset={handleSelectPreset}
          onToggleZone={toggleZone}
          onToggleLayoutLock={() => setLayoutLocked(!layoutLocked)}
          onSaveLayout={saveLayout}
          onResetLayout={resetLayout}
        />
      </header>

      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-1"
      >
        <div className="flex min-h-0 min-w-0 flex-1 gap-1 overflow-hidden">
          <div className="shrink-0" style={{ width: railWidth }}>
            <CommandCenterLeftRail activeNav={activeNav} onSelectItem={handleRailItem} />
          </div>

          {leftCollapsed ? (
            <CollapsedZoneStrip
              side="left"
              label="Sources"
              onExpand={() => toggleZone('left-dock')}
            />
          ) : (
            <div
              className="min-h-0 shrink-0 overflow-hidden"
              style={{ width: leftDockWidth }}
            >
              <CommandCenterLeftDock
                activeTab={activeSourceDockTab}
                onTabChange={handleActivateSourceTab}
                isPanelVisible={isPanelVisible}
                onHidePanel={handleHideSourcePanel}
              >
                {sourceDockContent}
              </CommandCenterLeftDock>
            </div>
          )}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CommandCenterStage
              programMonitor={programMonitor}
              previewMonitor={previewMonitor}
              programOverlay={programOverlayData}
              previewOverlay={previewOverlayData}
              switcherContent={switcherContent}
              emphasis={preset.centerEmphasis}
              stacked={monitorsStacked}
              safeAreasVisible={safeAreasVisible}
              fullscreenMonitor={fullscreenMonitor}
              onFullscreenChange={setFullscreenMonitor}
            />
          </div>

          {rightCollapsed ? (
            <CollapsedZoneStrip
              side="right"
              label="Operations"
              onExpand={() => toggleZone('right-dock')}
            />
          ) : (
            <div
              className="min-h-0 shrink-0 overflow-hidden"
              style={{ width: rightDockWidth }}
            >
              <CommandCenterRightDock
                sections={operationsSections}
                activeOperationsTab={activeOperationsTab}
                isPanelVisible={isPanelVisible}
                isPanelCollapsed={isPanelCollapsed}
                getPanelTitle={(panelId) => panels.find((panel) => panel.id === panelId)?.title}
                onToggleCollapsed={togglePanelCollapsed}
                onHidePanel={togglePanelVisibility}
              />
            </div>
          )}
        </div>

        <div
          className="min-h-0 shrink-0 overflow-hidden"
          style={bottomCollapsed || forceBottomCollapsed ? undefined : { height: bottomHeight }}
        >
          <CommandCenterBottomWorkspace
            activeTab={activeDockTab}
            onTabChange={handleBottomTabChange}
            collapsed={bottomCollapsed || forceBottomCollapsed}
            onToggleCollapse={
              layoutLocked || forceBottomCollapsed ? undefined : () => toggleZone('bottom-workspace')
            }
            isPanelVisible={isPanelVisible}
            className="h-full"
          >
            {bottomWorkspaceContent}
          </CommandCenterBottomWorkspace>
        </div>
      </div>
    </div>
  );
}
