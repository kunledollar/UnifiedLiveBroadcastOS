'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import type { RoutingMatrixEdge, WorkspacePresetId } from '../workspace-canvas/types';
import type { DiagnosticMetric } from '../workspace-canvas/SystemDiagnosticsPanel';
import { useWorkspaceCanvasState } from '../workspace-canvas/useWorkspaceCanvasState';
import { BottomWorkspaceDock } from './BottomWorkspaceDock';
import { CenterProgramPreviewDeck } from './CenterProgramPreviewDeck';
import { DiagnosticsSummary, FloatingDiagnosticsPanel } from './FloatingDiagnosticsPanel';
import { FloatingProductionGraphPanel } from './FloatingProductionGraphPanel';
import { FloatingRoutingMatrixPanel } from './FloatingRoutingMatrixPanel';
import { LeftCommandRail } from './LeftCommandRail';
import { RightOperationsDock } from './RightOperationsDock';
import { TopBar } from './TopBar';

export type BroadcastCommandCenterLayoutProps = {
  initialPresetId?: WorkspacePresetId;
  statusBar: ReactNode;
  toolsSlot?: ReactNode;
  activeNav: NavItemId;
  onNavChange: (nav: NavItemId) => void;
  sourceDockContent: ReactNode;
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programLabel: string;
  previewLabel: string;
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
  onOperationsTabChange?: (tab: OperationsTabId) => void;
  onDockTabChange?: (tab: DockTabId) => void;
  activeOperationsTab?: OperationsTabId;
  activeDockTab?: DockTabId;
};

export function BroadcastCommandCenterLayout({
  initialPresetId = 'technical-director',
  statusBar,
  toolsSlot,
  activeNav,
  onNavChange,
  sourceDockContent,
  programMonitor,
  previewMonitor,
  programLabel,
  previewLabel,
  switcherContent,
  routingEdges,
  diagnosticsMetrics,
  operationsTabs,
  bottomWorkspaceContent,
  productionGraphContent,
  graphRevision,
  previewSlot,
  layoutStyle,
  onOperationsTabChange,
  onDockTabChange,
  activeOperationsTab: externalOpsTab,
  activeDockTab: externalDockTab,
}: BroadcastCommandCenterLayoutProps) {
  const {
    state,
    preset,
    selectPreset,
    saveLayout,
    resetLayout,
    setActiveOperationsTab,
    setActiveDockTab,
  } = useWorkspaceCanvasState(initialPresetId);

  const activeOperationsTab = externalOpsTab ?? state.activeOperationsTab;
  const activeDockTab = externalDockTab ?? state.activeDockTab;

  const [sourceDockCollapsed, setSourceDockCollapsed] = useState(false);
  const [showFloatingDiagnostics, setShowFloatingDiagnostics] = useState(false);
  const [showFloatingRouting, setShowFloatingRouting] = useState(false);
  const [showFloatingGraph, setShowFloatingGraph] = useState(false);

  const leftWidth = state.zones.left?.collapsed ? 56 : (state.zones.left?.flexWeight ?? 280);
  const rightWidth = state.zones.right?.collapsed ? 56 : (state.zones.right?.flexWeight ?? 360);
  const bottomHeight = state.zones.bottom?.collapsed ? 40 : (state.zones.bottom?.flexWeight ?? 200);

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
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[#020408] text-xs text-ubos-fg-secondary"
      style={layoutStyle}
    >
      <TopBar
        statusBar={statusBar}
        activePresetId={state.presetId}
        onSelectPreset={selectPreset}
        onSaveLayout={saveLayout}
        onResetLayout={resetLayout}
        toolsSlot={toolsSlot}
      />

      <div
        className="grid min-h-0 flex-1 gap-1.5 overflow-hidden p-1.5"
        style={{
          gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${rightWidth}px`,
          gridTemplateRows: `minmax(0, 1fr) ${bottomHeight}px`,
        }}
      >
        <div className="row-span-1 min-h-0 overflow-hidden">
          <LeftCommandRail
            activeNav={activeNav}
            onNavChange={onNavChange}
            sourceDockContent={sourceDockContent}
            diagnosticsSlot={<DiagnosticsSummary metrics={diagnosticsMetrics} />}
            collapsed={sourceDockCollapsed}
            onToggleCollapse={() => setSourceDockCollapsed((value) => !value)}
            className="h-full"
          />
        </div>

        <div className="flex min-h-0 flex-col gap-1.5 overflow-hidden">
          <CenterProgramPreviewDeck
            programMonitor={programMonitor}
            previewMonitor={previewMonitor}
            programLabel={programLabel}
            previewLabel={previewLabel}
            switcherContent={switcherContent}
            programFlexWeight={preset.programFlexWeight}
            previewFlexWeight={preset.previewFlexWeight}
            className="min-h-0 flex-1"
          />

          <div className="flex shrink-0 items-center gap-1 px-1">
            <button
              type="button"
              onClick={() => setShowFloatingDiagnostics((value) => !value)}
              className="rounded-ubos-sm border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/20"
            >
              System Status
            </button>
            <button
              type="button"
              onClick={() => setShowFloatingRouting((value) => !value)}
              className="rounded-ubos-sm border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300 hover:bg-indigo-500/20"
            >
              Routing Matrix
            </button>
            <button
              type="button"
              onClick={() => setShowFloatingGraph((value) => !value)}
              className="rounded-ubos-sm border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300 hover:bg-indigo-500/20"
            >
              Production Graph
            </button>
          </div>
        </div>

        <div className="row-span-1 min-h-0 overflow-hidden">
          <RightOperationsDock
            tabs={operationsTabs}
            activeTab={activeOperationsTab}
            onTabChange={handleOpsTabChange}
            previewSlot={previewSlot}
            telemetrySlot={<DiagnosticsSummary metrics={diagnosticsMetrics} />}
            className="h-full"
          />
        </div>

        <div className="col-span-3 min-h-0 overflow-hidden">
          <BottomWorkspaceDock
            activeTab={activeDockTab}
            onTabChange={handleDockTabChange}
            className="h-full"
          >
            {bottomWorkspaceContent}
          </BottomWorkspaceDock>
        </div>
      </div>

      {showFloatingDiagnostics ? (
        <FloatingDiagnosticsPanel
          metrics={diagnosticsMetrics}
          onClose={() => setShowFloatingDiagnostics(false)}
        />
      ) : null}

      {showFloatingRouting ? (
        <FloatingRoutingMatrixPanel
          edges={routingEdges}
          onClose={() => setShowFloatingRouting(false)}
        />
      ) : null}

      {showFloatingGraph ? (
        <FloatingProductionGraphPanel
          {...(graphRevision !== undefined ? { revision: graphRevision } : {})}
          onClose={() => setShowFloatingGraph(false)}
        >
          {productionGraphContent}
        </FloatingProductionGraphPanel>
      ) : null}
    </div>
  );
}
