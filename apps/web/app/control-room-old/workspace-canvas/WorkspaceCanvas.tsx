'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { DockTabId, OperationsTabId } from '../shell/types';
import type { RoutingMatrixEdge, WorkspacePanel } from './types';
import { AssetSourceTreePanel } from './AssetSourceTreePanel';
import { BottomWorkspaceDeck } from './BottomWorkspaceDeck';
import { CompactAudioMixerDeck } from './CompactAudioMixerDeck';
import { RightOperationsDock } from './RightOperationsDock';
import { SplitMonitorBay } from './SplitMonitorBay';
import { StreamPatchMatrixPanel } from './StreamPatchMatrixPanel';
import { SystemDiagnosticsPanel, type DiagnosticMetric } from './SystemDiagnosticsPanel';
import { WorkspaceTopRibbon } from './WorkspaceTopRibbon';
import { useWorkspaceCanvasState } from './useWorkspaceCanvasState';
import type { WorkspacePresetId } from './types';

export type WorkspaceCanvasProps = {
  initialPresetId?: WorkspacePresetId;
  statusBar: ReactNode;
  toolsSlot?: ReactNode;
  assetTreeContent: ReactNode;
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programLabel: string;
  previewLabel: string;
  switcherContent: ReactNode;
  routingEdges: RoutingMatrixEdge[];
  audioMixerContent: ReactNode;
  audioChannelCount: number;
  audioLiveLevel?: number;
  diagnosticsMetrics: DiagnosticMetric[];
  operationsTabs: Array<{ id: OperationsTabId; content: ReactNode }>;
  bottomDeckContent: ReactNode;
  previewSlot?: ReactNode;
  layoutStyle?: CSSProperties;
  onNavChange?: (nav: string) => void;
  onOperationsTabChange?: (tab: OperationsTabId) => void;
  onDockTabChange?: (tab: DockTabId) => void;
  activeOperationsTab?: OperationsTabId;
  activeDockTab?: DockTabId;
};

function panelProps(
  panel: WorkspacePanel | undefined,
  collapsePanel: (id: string) => void,
  undockPanel: (id: string) => void,
) {
  if (!panel) {
    return {
      collapsed: false as const,
      undocked: false as const,
      onToggleCollapse: () => {},
      onToggleUndock: () => {},
    };
  }
  return {
    collapsed: panel.collapsed,
    undocked: panel.undocked,
    onToggleCollapse: () => collapsePanel(panel.id),
    onToggleUndock: () => undockPanel(panel.id),
  };
}

export function WorkspaceCanvas({
  initialPresetId = 'technical-director',
  statusBar,
  toolsSlot,
  assetTreeContent,
  programMonitor,
  previewMonitor,
  programLabel,
  previewLabel,
  switcherContent,
  routingEdges,
  audioMixerContent,
  audioChannelCount,
  audioLiveLevel,
  diagnosticsMetrics,
  operationsTabs,
  bottomDeckContent,
  previewSlot,
  layoutStyle,
  onOperationsTabChange,
  onDockTabChange,
  activeOperationsTab: externalOpsTab,
  activeDockTab: externalDockTab,
}: WorkspaceCanvasProps) {
  const {
    state,
    preset,
    selectPreset,
    saveLayout,
    resetLayout,
    collapsePanel,
    undockPanel,
    setActiveOperationsTab,
    setActiveDockTab,
  } = useWorkspaceCanvasState(initialPresetId);

  const activeOperationsTab = externalOpsTab ?? state.activeOperationsTab;
  const activeDockTab = externalDockTab ?? state.activeDockTab;

  const handleOpsTabChange = (tab: OperationsTabId) => {
    setActiveOperationsTab(tab);
    onOperationsTabChange?.(tab);
  };

  const handleDockTabChange = (tab: DockTabId) => {
    setActiveDockTab(tab);
    onDockTabChange?.(tab);
  };

  const leftZone = state.zones.left;
  const centerZone = state.zones.center;
  const rightZone = state.zones.right;
  const bottomZone = state.zones.bottom;

  const assetTreePanel = state.panels['asset-tree'];
  const splitMonitorPanel = state.panels['split-monitor'];
  const switcherPanel = state.panels['switcher'];
  const streamPatchPanel = state.panels['stream-patch'];
  const audioMixerPanel = state.panels['audio-mixer'];
  const diagnosticsPanel = state.panels['system-diagnostics'];
  const bottomDeckPanel = state.panels['bottom-deck'];
  const operationsPanel = state.panels['operations-dock'];

  const leftWidth = leftZone?.collapsed ? 48 : (leftZone?.flexWeight ?? 260);
  const rightWidth = rightZone?.collapsed ? 48 : (rightZone?.flexWeight ?? 340);
  const bottomHeight = bottomZone?.collapsed ? 36 : (bottomZone?.flexWeight ?? 180);

  return (
    <div
      className="group flex h-full min-h-0 flex-col overflow-hidden bg-[#030508] text-xs text-slate-200"
      style={layoutStyle}
    >
      {statusBar}

      <WorkspaceTopRibbon
        activePresetId={state.presetId}
        onSelectPreset={selectPreset}
        onSaveLayout={saveLayout}
        onResetLayout={resetLayout}
        toolsSlot={toolsSlot}
      />

      <div
        className="grid min-h-0 flex-1 gap-2 overflow-hidden p-2"
        style={{
          gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${rightWidth}px`,
          gridTemplateRows: `minmax(0, 1fr) ${bottomHeight}px`,
        }}
      >
        {/* Left zone — asset tree */}
        {assetTreePanel?.visible !== false ? (
          <div className="row-span-1 min-h-0 overflow-hidden">
            <AssetSourceTreePanel
              title={assetTreePanel?.title ?? 'Assets & Sources'}
              {...panelProps(assetTreePanel, collapsePanel, undockPanel)}
            >
              {assetTreeContent}
            </AssetSourceTreePanel>
          </div>
        ) : (
          <div className="min-h-0" />
        )}

        {/* Center zone — monitors, switcher, patch */}
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
          {splitMonitorPanel?.visible !== false ? (
            <div className="min-h-0 flex-[3_1_0] overflow-hidden">
              <SplitMonitorBay
                programMonitor={programMonitor}
                previewMonitor={previewMonitor}
                programLabel={programLabel}
                previewLabel={previewLabel}
                programFlexWeight={preset.programFlexWeight}
                previewFlexWeight={preset.previewFlexWeight}
                {...panelProps(splitMonitorPanel, collapsePanel, undockPanel)}
              />
            </div>
          ) : null}

          {switcherPanel?.visible !== false ? (
            <div className="shrink-0 overflow-hidden rounded-xl border border-white/8 bg-[#070b12] shadow-xl">
              {!switcherPanel?.collapsed ? switcherContent : (
                <button
                  type="button"
                  onClick={() => collapsePanel('switcher')}
                  className="w-full px-3 py-1.5 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Switcher (collapsed)
                </button>
              )}
            </div>
          ) : null}

          {streamPatchPanel?.visible ? (
            <div className="min-h-0 max-h-40 shrink-0 overflow-hidden">
              <StreamPatchMatrixPanel
                edges={routingEdges}
                {...panelProps(streamPatchPanel, collapsePanel, undockPanel)}
              />
            </div>
          ) : null}
        </div>

        {/* Right zone — operations dock */}
        {operationsPanel?.visible !== false ? (
          <div className="row-span-1 min-h-0 overflow-hidden">
            <RightOperationsDock
              tabs={operationsTabs}
              activeTab={activeOperationsTab}
              onTabChange={handleOpsTabChange}
              previewSlot={previewSlot}
              {...panelProps(operationsPanel, collapsePanel, undockPanel)}
            />
          </div>
        ) : (
          <div className="min-h-0" />
        )}

        {/* Bottom zone — audio, diagnostics, deck */}
        <div
          className="col-span-3 grid min-h-0 gap-2 overflow-hidden"
          style={{
            gridColumn: '1 / -1',
            gridTemplateColumns: `${
              audioMixerPanel?.visible !== false ? '1fr' : '0'
            } ${diagnosticsPanel?.visible ? '280px' : '0'} minmax(0, 2fr)`,
          }}
        >
          {audioMixerPanel?.visible !== false ? (
            <CompactAudioMixerDeck
              channelCount={audioChannelCount}
              {...(audioLiveLevel !== undefined ? { liveLevel: audioLiveLevel } : {})}
              {...panelProps(audioMixerPanel, collapsePanel, undockPanel)}
            >
              {audioMixerContent}
            </CompactAudioMixerDeck>
          ) : null}

          {diagnosticsPanel?.visible ? (
            <SystemDiagnosticsPanel
              metrics={diagnosticsMetrics}
              {...panelProps(diagnosticsPanel, collapsePanel, undockPanel)}
            />
          ) : null}

          {bottomDeckPanel?.visible !== false ? (
            <BottomWorkspaceDeck
              title={bottomDeckPanel?.title ?? 'Production Deck'}
              activeTab={activeDockTab}
              onTabChange={handleDockTabChange}
              {...panelProps(bottomDeckPanel, collapsePanel, undockPanel)}
            >
              {bottomDeckContent}
            </BottomWorkspaceDeck>
          ) : null}
        </div>
      </div>

      {/* Floating undocked panels */}
      {state.undockedPanelIds.map((panelId, index) => {
        const panel = state.panels[panelId];
        if (!panel) return null;
        const top = 80 + index * 24;
        const left = 80 + index * 24;
        return (
          <div
            key={panelId}
            className="pointer-events-auto fixed z-50 w-72"
            style={{ top, left }}
          >
            <AssetSourceTreePanel
              title={panel.title}
              collapsed={panel.collapsed}
              undocked
              onToggleCollapse={() => collapsePanel(panelId)}
              onToggleUndock={() => undockPanel(panelId)}
            >
              <p className="p-2 text-slate-500">Undocked: {panel.title}</p>
            </AssetSourceTreePanel>
          </div>
        );
      })}
    </div>
  );
}
