'use client';

import { useCallback, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { DockTabId, NavItemId, OperationsTabId, SourceDockTabId } from '../shell/types';
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
import { broadcastSurfaces } from './broadcast-theme';
import { CenterProgramPreviewDeck, type MonitorStatusInfo } from './CenterProgramPreviewDeck';
import { FloatingProductionGraphPanel } from './FloatingProductionGraphPanel';
import { LeftCommandRail } from './LeftCommandRail';
import { RightOperationsDock, type OperationsDockSection } from './RightOperationsDock';
import { TopBar } from './TopBar';
import { ZoneResizeHandle } from './ZoneResizeHandle';
import {
  LEFT_RAIL_COLLAPSED_PX,
  LEFT_RAIL_DEFAULT_PX,
  RIGHT_OPS_COLLAPSED_PX,
  RIGHT_OPS_DEFAULT_PX,
} from '../shell/control-room-layout';

export type BroadcastCommandCenterLayoutProps = {
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
  routingEdges: RoutingMatrixEdge[];
  audioMixerContent: ReactNode;
  diagnosticsMetrics: DiagnosticMetric[];
  operationsSections: OperationsDockSection[];
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
  activeSourceDockTab,
  onSourceDockTabChange,
  programMonitor,
  previewMonitor,
  programStatus,
  previewStatus,
  switcherContent,
  routingEdges,
  diagnosticsMetrics,
  operationsSections,
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
    resizeZone,
    resizeMonitorSplit,
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
  const layoutLocked = dockLayout.layoutLocked;
  const canResizeLayout = !layoutLocked;

  const leftWidth = showLeft
    ? leftCollapsed
      ? LEFT_RAIL_COLLAPSED_PX
      : (canvasState.zones.left?.flexWeight ?? LEFT_RAIL_DEFAULT_PX)
    : 0;
  const rightWidth = showRight
    ? rightCollapsed
      ? RIGHT_OPS_COLLAPSED_PX
      : (canvasState.zones.right?.flexWeight ?? RIGHT_OPS_DEFAULT_PX)
    : 0;
  const bottomExpandedHeight =
    layoutFocus === 'audio'
      ? Math.max(canvasState.zones.bottom?.flexWeight ?? 140, 200)
      : layoutFocus === 'switcher'
        ? Math.min(canvasState.zones.bottom?.flexWeight ?? 140, 100)
        : (canvasState.zones.bottom?.flexWeight ?? 140);
  const bottomHeight = showBottom
    ? bottomCollapsed
      ? bottomWorkspaceTabBarHeightPx()
      : bottomExpandedHeight
    : 0;
  const programFlexWeight = canvasState.programFlexWeight ?? preset.programFlexWeight;
  const previewFlexWeight = canvasState.previewFlexWeight ?? preset.previewFlexWeight;

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
      if (dockLayout.layoutLocked) return;
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
      dockLayout.layoutLocked,
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

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col overflow-hidden text-sm', broadcastSurfaces.app)}
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {showLeft ? (
            <div
              className="shrink-0 min-h-0 overflow-hidden"
              style={{ width: leftWidth }}
            >
              <LeftCommandRail
                activeNav={activeNav}
                onNavChange={onNavChange}
                sourceDockContent={sourceDockContent}
                activeSourceDockTab={activeSourceDockTab}
                onSourceDockTabChange={onSourceDockTabChange}
                collapsed={leftCollapsed}
                {...(canResizeLayout ? { onToggleCollapse: () => toggleZone('left') } : {})}
                className="h-full"
              />
            </div>
          ) : null}

          {showLeft && !leftCollapsed && canResizeLayout ? (
            <ZoneResizeHandle
              orientation="vertical"
              label="Resize left command rail"
              onResizeDelta={(delta) => resizeZone('left', delta)}
            />
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CenterProgramPreviewDeck
              programMonitor={programMonitor}
              previewMonitor={previewMonitor}
              programStatus={programStatus}
              previewStatus={previewStatus}
              switcherContent={showSwitcher ? switcherContent : null}
              programFlexWeight={programFlexWeight}
              previewFlexWeight={previewFlexWeight}
              resizable={canResizeLayout}
              onMonitorSplitDelta={resizeMonitorSplit}
              layoutFocus={layoutFocus}
              compactChrome={compactChrome}
              className="min-h-0 flex-1"
            />
          </div>

          {showRight && !rightCollapsed && canResizeLayout ? (
            <ZoneResizeHandle
              orientation="vertical"
              label="Resize operations dock"
              onResizeDelta={(delta) => resizeZone('right', -delta)}
            />
          ) : null}

          {showRight ? (
            <div
              className="shrink-0 min-h-0 overflow-hidden"
              style={{ width: rightWidth }}
            >
              <RightOperationsDock
                sections={operationsSections}
                activeTab={activeOperationsTab}
                onTabChange={handleOpsTabChange}
                collapsed={rightCollapsed}
                {...(canResizeLayout ? { onToggleCollapse: () => toggleZone('right') } : {})}
                className="h-full"
              />
            </div>
          ) : null}
        </div>

        {showBottom && !bottomCollapsed && canResizeLayout ? (
          <ZoneResizeHandle
            orientation="horizontal"
            label="Resize bottom workspace dock"
            onResizeDelta={(delta) => resizeZone('bottom', -delta)}
          />
        ) : null}

        {showBottom ? (
          <div
            className="shrink-0 min-h-0 overflow-hidden"
            style={{ height: bottomHeight }}
          >
            <BottomWorkspaceDock
              activeTab={activeDockTab}
              onTabChange={handleDockTabChange}
              collapsed={bottomCollapsed}
              {...(canResizeLayout ? { onToggleCollapse: () => toggleZone('bottom') } : {})}
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
