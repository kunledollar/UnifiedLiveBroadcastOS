'use client';

import { useCallback, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import type { RoutingMatrixEdge } from '../workspace-canvas/types';
import type { DiagnosticMetric } from '../workspace-canvas/SystemDiagnosticsPanel';
import { useWorkspaceCanvasState } from '../workspace-canvas/useWorkspaceCanvasState';
import {
  isZoneVisible,
  ubosDockPanelRegistry,
  useUbosDockLayout,
  ubosWorkspaceModes,
  type UbosWorkspaceModeId,
} from '../menu';
import type { LayoutFocusMode } from '../workspaces/workspace-types';
import { applyWorkspaceProfile } from '../workspaces';
import { BottomWorkspaceDock, bottomWorkspaceTabBarHeightPx } from './BottomWorkspaceDock';
import { CenterProgramPreviewDeck, type MonitorStatusInfo } from './CenterProgramPreviewDeck';
import { DiagnosticsSummary } from './FloatingDiagnosticsPanel';
import { FloatingProductionGraphPanel } from './FloatingProductionGraphPanel';
import { LeftCommandRail } from './LeftCommandRail';
import { RightOperationsDock } from './RightOperationsDock';
import { TopBar } from './TopBar';

export type BroadcastCommandCenterLayoutProps = {
  statusBar: ReactNode;
  activeNav: NavItemId;
  onNavChange: (nav: NavItemId) => void;
  sourceDockContent: ReactNode;
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programStatus: MonitorStatusInfo;
  previewStatus: MonitorStatusInfo;
  switcherContent: ReactNode;
  routingEdges: RoutingMatrixEdge[];
  audioMixerContent: ReactNode;
  diagnosticsMetrics: DiagnosticMetric[];
  operationsTabs: Array<{ id: OperationsTabId; content: ReactNode }>;
  bottomWorkspaceContent: ReactNode;
  productionGraphContent?: ReactNode;
  graphRevision?: number;
  previewSlot?: ReactNode;
  layoutStyle?: CSSProperties;
  layoutFocus: LayoutFocusMode;
  compactChrome: boolean;
  onOperationsTabChange?: (tab: OperationsTabId) => void;
  onDockTabChange?: (tab: DockTabId) => void;
  activeOperationsTab?: OperationsTabId;
  activeDockTab?: DockTabId;
  onWorkspaceModeApplied?: (mode: UbosWorkspaceModeId, compactChrome?: boolean) => void;
  onLayoutFocusChange?: (focus: LayoutFocusMode) => void;
  onToggleCompactChrome?: () => void;
  onSaveWorkspace?: () => void;
  onRestoreWorkspace?: () => void;
  onResetWorkspace?: () => void;
  onSeedDemo?: () => void;
  onSimulateDemo?: () => void;
  onResetDemo?: () => void;
};

export function BroadcastCommandCenterLayout({
  statusBar,
  activeNav,
  onNavChange,
  sourceDockContent,
  programMonitor,
  previewMonitor,
  programStatus,
  previewStatus,
  switcherContent,
  routingEdges,
  diagnosticsMetrics,
  operationsTabs,
  bottomWorkspaceContent,
  productionGraphContent,
  graphRevision,
  previewSlot,
  layoutStyle,
  layoutFocus,
  compactChrome,
  onOperationsTabChange,
  onDockTabChange,
  activeOperationsTab: externalOpsTab,
  activeDockTab: externalDockTab,
  onWorkspaceModeApplied,
  onLayoutFocusChange,
  onToggleCompactChrome,
  onSaveWorkspace,
  onRestoreWorkspace,
  onResetWorkspace,
  onSeedDemo,
  onSimulateDemo,
  onResetDemo,
}: BroadcastCommandCenterLayoutProps) {
  const {
    state: dockLayout,
    selectWorkspaceMode,
    toggleDockPanel,
    toggleZone,
    setLayoutLocked,
    saveLayout: saveDockLayout,
    resetLayout: resetDockLayout,
  } = useUbosDockLayout();

  const {
    state: canvasState,
    preset,
    selectPreset,
    saveLayout: saveCanvasLayout,
    resetLayout: resetCanvasLayout,
    setActiveOperationsTab,
    setActiveDockTab,
  } = useWorkspaceCanvasState('technical-director');

  const activeOperationsTab = externalOpsTab ?? canvasState.activeOperationsTab;
  const activeDockTab = externalDockTab ?? canvasState.activeDockTab;

  const showLeft = isZoneVisible('left', dockLayout.dockPanels);
  const showRight = isZoneVisible('right', dockLayout.dockPanels);
  const showBottom = isZoneVisible('bottom', dockLayout.dockPanels);
  const showSwitcher =
    dockLayout.dockPanels['scene-transitions']?.visible &&
    !dockLayout.dockPanels['scene-transitions']?.collapsed;
  const showFloatingPipeline = false;

  const leftCollapsed = dockLayout.zoneCollapsed.left;
  const rightCollapsed = dockLayout.zoneCollapsed.right;
  const bottomCollapsed = dockLayout.zoneCollapsed.bottom;

  const leftWidth = showLeft ? (leftCollapsed ? 56 : (canvasState.zones.left?.flexWeight ?? 260)) : 0;
  const rightWidth = showRight ? (rightCollapsed ? 56 : (canvasState.zones.right?.flexWeight ?? 320)) : 0;
  const bottomExpandedHeight = canvasState.zones.bottom?.flexWeight ?? 140;
  const bottomHeight = showBottom
    ? bottomCollapsed
      ? bottomWorkspaceTabBarHeightPx()
      : bottomExpandedHeight
    : 0;

  const handleToggleDockPanel = useCallback(
    (panelId: Parameters<typeof toggleDockPanel>[0]) => {
      toggleDockPanel(panelId);
      const def = ubosDockPanelRegistry[panelId];
      if (!def) return;
      const willShow = !dockLayout.dockPanels[panelId]?.visible;
      if (!willShow) return;
      if (def.navItem) onNavChange(def.navItem);
      if (def.operationsTab) {
        setActiveOperationsTab(def.operationsTab);
        onOperationsTabChange?.(def.operationsTab);
      }
      if (def.dockTab) {
        setActiveDockTab(def.dockTab);
        onDockTabChange?.(def.dockTab);
      }
    },
    [
      toggleDockPanel,
      dockLayout.dockPanels,
      onNavChange,
      setActiveOperationsTab,
      setActiveDockTab,
      onOperationsTabChange,
      onDockTabChange,
    ],
  );

  const handleSelectWorkspaceMode = useCallback(
    (modeId: UbosWorkspaceModeId) => {
      const modeDef = selectWorkspaceMode(modeId);
      selectPreset(modeDef.canvasPresetId);
      const profile = applyWorkspaceProfile(modeDef.professionalWorkspaceId);
      onNavChange(profile.activeNav);
      setActiveOperationsTab(profile.activeOperationsTab);
      setActiveDockTab(profile.activeBottomDock);
      onOperationsTabChange?.(profile.activeOperationsTab);
      onDockTabChange?.(profile.activeBottomDock);
      onWorkspaceModeApplied?.(modeId, modeDef.compactChrome);
    },
    [
      selectWorkspaceMode,
      selectPreset,
      onNavChange,
      setActiveOperationsTab,
      setActiveDockTab,
      onOperationsTabChange,
      onDockTabChange,
      onWorkspaceModeApplied,
    ],
  );

  const handleResetLayout = useCallback(() => {
    if (dockLayout.layoutLocked) return;
    const modeDef = resetDockLayout();
    resetCanvasLayout();
    selectPreset(modeDef.canvasPresetId);
    const profile = applyWorkspaceProfile(modeDef.professionalWorkspaceId);
    onNavChange(profile.activeNav);
    setActiveOperationsTab(profile.activeOperationsTab);
    setActiveDockTab(profile.activeBottomDock);
    onOperationsTabChange?.(profile.activeOperationsTab);
    onDockTabChange?.(profile.activeBottomDock);
    onWorkspaceModeApplied?.('director', ubosWorkspaceModes.director.compactChrome);
  }, [
    dockLayout.layoutLocked,
    resetDockLayout,
    resetCanvasLayout,
    selectPreset,
    onNavChange,
    setActiveOperationsTab,
    setActiveDockTab,
    onOperationsTabChange,
    onDockTabChange,
    onWorkspaceModeApplied,
  ]);

  const handleSaveLayout = useCallback(() => {
    saveDockLayout();
    saveCanvasLayout();
    onSaveWorkspace?.();
  }, [saveDockLayout, saveCanvasLayout, onSaveWorkspace]);

  const handleOpsTabChange = (tab: OperationsTabId) => {
    setActiveOperationsTab(tab);
    onOperationsTabChange?.(tab);
  };

  const handleDockTabChange = (tab: DockTabId) => {
    setActiveDockTab(tab);
    onDockTabChange?.(tab);
  };

  const openBottomWorkspace = (panelId: Parameters<typeof toggleDockPanel>[0], tab: DockTabId) => {
    if (!dockLayout.dockPanels[panelId]?.visible) {
      toggleDockPanel(panelId);
    }
    if (bottomCollapsed) {
      toggleZone('bottom');
    }
    handleDockTabChange(tab);
  };

  const gridColumns = [
    showLeft ? `${leftWidth}px` : null,
    'minmax(0, 1fr)',
    showRight ? `${rightWidth}px` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const gridRows = showBottom ? `minmax(0, 1fr) ${bottomHeight}px` : 'minmax(0, 1fr)';

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#020408] text-xs text-ubos-fg-secondary"
      style={layoutStyle}
    >
      <TopBar
        statusBar={statusBar}
        dockLayout={dockLayout}
        activeWorkspaceMode={dockLayout.workspaceMode}
        layoutFocus={layoutFocus}
        compactChrome={compactChrome}
        onSelectWorkspaceMode={handleSelectWorkspaceMode}
        onToggleDockPanel={handleToggleDockPanel}
        onResetLayout={handleResetLayout}
        onSaveLayout={handleSaveLayout}
        onToggleLayoutLock={setLayoutLocked}
        onSelectLayoutFocus={(focus) => onLayoutFocusChange?.(focus)}
        onToggleCompactChrome={() => onToggleCompactChrome?.()}
        {...(onSaveWorkspace ? { onSaveWorkspace } : {})}
        {...(onRestoreWorkspace ? { onRestoreWorkspace } : {})}
        {...(onResetWorkspace ? { onResetWorkspace } : {})}
        {...(onSeedDemo ? { onSeedDemo } : {})}
        {...(onSimulateDemo ? { onSimulateDemo } : {})}
        {...(onResetDemo ? { onResetDemo } : {})}
      />

      <div
        className="grid min-h-0 flex-1 gap-1 overflow-hidden p-1"
        style={{
          gridTemplateColumns: gridColumns,
          gridTemplateRows: gridRows,
        }}
      >
        {showLeft ? (
          <div className="row-span-1 min-h-0 overflow-hidden">
            <LeftCommandRail
              activeNav={activeNav}
              onNavChange={onNavChange}
              sourceDockContent={sourceDockContent}
              diagnosticsSlot={<DiagnosticsSummary metrics={diagnosticsMetrics} />}
              collapsed={leftCollapsed}
              {...(!dockLayout.layoutLocked ? { onToggleCollapse: () => toggleZone('left') } : {})}
              className="h-full"
            />
          </div>
        ) : null}

        <div
          className={cn(
            'flex min-h-0 flex-col gap-0.5 overflow-hidden',
            !showLeft && !showRight ? 'col-span-1' : '',
          )}
          style={{
            gridColumn: !showLeft && !showRight ? '1 / -1' : undefined,
            gridRow: showBottom ? '1' : '1 / -1',
          }}
        >
          <CenterProgramPreviewDeck
            programMonitor={programMonitor}
            previewMonitor={previewMonitor}
            programStatus={programStatus}
            previewStatus={previewStatus}
            switcherContent={showSwitcher ? switcherContent : null}
            programFlexWeight={preset.programFlexWeight}
            previewFlexWeight={preset.previewFlexWeight}
            className="min-h-0 flex-1"
          />

          <div className="flex shrink-0 items-center gap-1 px-0.5 pb-0.5">
            <button
              type="button"
              onClick={() => openBottomWorkspace('system-status', 'system-status')}
              className="rounded-ubos-sm border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/20"
            >
              System Status
            </button>
            <button
              type="button"
              onClick={() => openBottomWorkspace('broadcast-io', 'routing')}
              className="rounded-ubos-sm border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300 hover:bg-indigo-500/20"
            >
              Routing Matrix
            </button>
            <button
              type="button"
              onClick={() => openBottomWorkspace('pipeline-inspector', 'production-graph')}
              className="rounded-ubos-sm border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300 hover:bg-indigo-500/20"
            >
              Production Graph
            </button>
          </div>
        </div>

        {showRight ? (
          <div className="row-span-1 min-h-0 overflow-hidden">
            <RightOperationsDock
              tabs={operationsTabs}
              activeTab={activeOperationsTab}
              onTabChange={handleOpsTabChange}
              previewSlot={previewSlot}
              telemetrySlot={<DiagnosticsSummary metrics={diagnosticsMetrics} />}
              collapsed={rightCollapsed}
              {...(!dockLayout.layoutLocked ? { onToggleCollapse: () => toggleZone('right') } : {})}
              className="h-full"
            />
          </div>
        ) : null}

        {showBottom ? (
          <div
            className="min-h-0 overflow-hidden"
            style={{ gridColumn: '1 / -1', gridRow: showBottom ? '2' : undefined }}
          >
            <BottomWorkspaceDock
              activeTab={activeDockTab}
              onTabChange={handleDockTabChange}
              collapsed={bottomCollapsed}
              {...(!dockLayout.layoutLocked
                ? { onToggleCollapse: () => toggleZone('bottom') }
                : {})}
              className="h-full"
            >
              {bottomWorkspaceContent}
            </BottomWorkspaceDock>
          </div>
        ) : null}
      </div>

      {showFloatingPipeline ? (
        <FloatingProductionGraphPanel
          {...(graphRevision !== undefined ? { revision: graphRevision } : {})}
          onClose={() => handleToggleDockPanel('pipeline-inspector')}
        >
          {productionGraphContent}
        </FloatingProductionGraphPanel>
      ) : null}
    </div>
  );
}
