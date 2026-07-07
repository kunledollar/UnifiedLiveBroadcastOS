'use client';

/**
 * UBOS 3.15B — Command Center shell.
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
 */
import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspacePresetId, WorkspaceZoneId } from '@ubos/shared';
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
import type { MonitorOverlayData } from './MonitorOverlay';
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
        'flex h-full w-6 shrink-0 flex-col items-center overflow-hidden rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite py-2',
      )}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-col items-center gap-1 rounded px-0.5 py-1 text-[9px] font-bold uppercase tracking-wide text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary"
        aria-label={`Expand ${label}`}
        title={`Expand ${label}`}
      >
        <span className="text-[10px]" aria-hidden="true">
          {side === 'left' ? '⟩' : '⟨'}
        </span>
        <span className="[writing-mode:vertical-rl] rotate-180">{label}</span>
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
  } = workspace;

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
      const gatingPanel = panelGatingBottomTab(tab);
      if (gatingPanel) setPanelVisible(gatingPanel, true);
      if (bottomCollapsed) toggleZone('bottom-workspace');
      handleBottomTabChange(tab);
    },
    [setPanelVisible, bottomCollapsed, toggleZone, handleBottomTabChange],
  );

  // ----- left dock ----------------------------------------------------------
  const handleActivateSourceTab = useCallback(
    (tab: SourceDockTabId) => {
      const gatingPanel = panelGatingSourceTab(tab);
      if (gatingPanel) setPanelVisible(gatingPanel, true);
      if (leftCollapsed) toggleZone('left-dock');
      onSourceDockTabChange(tab);
    },
    [setPanelVisible, leftCollapsed, toggleZone, onSourceDockTabChange],
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
      setPanelVisible(panelId, true);
      if (isPanelCollapsed(panelId)) togglePanelCollapsed(panelId);
      if (rightCollapsed) toggleZone('right-dock');
      const opsTab = operationsTabForPanel(panelId);
      if (opsTab) onOperationsTabChange(opsTab);
    },
    [
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

  const monitorsStacked = layout.monitorsStacked || layout.zones['center-stage'].rect.width < 900;

  const zoneWidth = (zoneId: WorkspaceZoneId): number => layout.zones[zoneId]?.rect.width ?? 0;

  const isZoneToggleCollapsed = useCallback(
    (zoneId: CommandCenterZoneToggleId) => layout.zones[zoneId]?.collapsed ?? false,
    [layout],
  );

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col overflow-hidden text-sm', broadcastSurfaces.app)}
      style={layoutStyle}
      data-ubos-command-center="true"
    >
      <header className={cn('flex shrink-0 flex-col border-b', broadcastSurfaces.header)}>
        {statusBar}
        <CommandCenterTopMenu
          activePresetId={activePresetId}
          layoutLocked={layoutLocked}
          safeAreasVisible={safeAreasVisible}
          dockPanels={panels}
          isPanelVisible={isPanelVisible}
          onSelectPreset={handleSelectPreset}
          onTogglePanel={togglePanelVisibility}
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
          <div className="shrink-0" style={{ width: zoneWidth('left-rail') || 56 }}>
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
              style={{ width: Math.max(zoneWidth('left-dock'), 220) }}
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
              style={{ width: Math.max(zoneWidth('right-dock'), 260) }}
            >
              <CommandCenterRightDock
                sections={operationsSections}
                activeOperationsTab={activeOperationsTab}
                isPanelVisible={isPanelVisible}
                isPanelCollapsed={isPanelCollapsed}
                onToggleCollapsed={togglePanelCollapsed}
                onHidePanel={togglePanelVisibility}
              />
            </div>
          )}
        </div>

        <div
          className="min-h-0 shrink-0 overflow-hidden"
          style={bottomCollapsed ? undefined : { height: Math.max(bottomGeometry.rect.height, 180) }}
        >
          <CommandCenterBottomWorkspace
            activeTab={activeDockTab}
            onTabChange={handleBottomTabChange}
            collapsed={bottomCollapsed}
            onToggleCollapse={layoutLocked ? undefined : () => toggleZone('bottom-workspace')}
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
