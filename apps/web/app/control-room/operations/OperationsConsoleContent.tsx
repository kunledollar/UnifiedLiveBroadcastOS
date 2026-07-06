'use client';

import type { ReactNode } from 'react';
import type {
  ChatMessage,
  Destination,
  Guest,
  GuestInvite,
  MediaRoute,
  Scene,
  StreamHealthMetric,
  RuntimeHealth,
  RuntimeSnapshot,
  RuntimeState,
  MediaRuntimeState,
  MediaRuntimeHealth,
  RecordingRuntimeState,
} from '@ubos/shared';
import { AIAssistantPanel } from '../ai/AIAssistantPanel';
import type { AIAction, AIState } from '../ai/ai-state';
import { createDefaultAIAssistantState } from '@ubos/shared';
import { createInitialAIState } from '../ai/ai-state';
import { GuestsPanel } from './GuestsPanel';
import { HealthPanel } from './HealthPanel';
import { InspectorPanel, deriveInspectorRoutes } from './InspectorPanel';
import { LogsPanelContainer } from './LogsPanelContainer';
import { OutputsPanel } from './OutputsPanel';
import { PreviewPanel } from './PreviewPanel';
import { RoutingPanel } from './RoutingPanel';
import { TeamPanel } from '../collaboration/TeamPanel';
import type { CollaborationAction, CollaborationState } from '../collaboration/collaboration-state';
import { AutomationPanel } from '../automation/AutomationPanel';
import type { AutomationAction, AutomationState } from '../automation/automation-state';
import { HostDevicesSection } from './HostDevicesSection';
import type { DistributionAction, DistributionState } from '../distribution/distribution-state';
import { createDistributionManifest } from '@ubos/shared';
import { createInitialDistributionState } from '../distribution/distribution-state';
import { DevicePanel } from '../devices/DevicePanel';
import { RuntimeDashboard } from '../runtime/RuntimeDashboard';
import { MediaRuntimePanel } from './MediaRuntimePanel';
import { createMediaRuntimeState } from '@ubos/shared';
import { EngineWorkspace } from '../engine';
import { CompositorPanel } from './CompositorPanel';
import { RuntimeRenderPanel } from './RuntimeRenderPanel';
import { RecordingRuntimePanel, type BrowserRecordingPanelState } from './RecordingRuntimePanel';
import { SecurityPanel } from './SecurityPanel';
import { MonitoringPanel } from './MonitoringPanel';
import { ClusterPanel } from './ClusterPanel';
import { PluginPanel } from './PluginPanel';
import { CloudPanel } from './CloudPanel';
import { AIDirectorPanel } from './AIDirectorPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { EnterpriseAdminPanel } from './EnterpriseAdminPanel';
import type { DeviceAction, DeviceState } from '../devices/device-state';
import { createDeviceManifest } from '@ubos/shared';
import { createInitialDeviceState } from '../devices/device-state';

export function OperationsConsoleContent({
  broadcastId,
  workspaceId,
  guests,
  invites,
  scenes,
  routes,
  destinations,
  messages,
  streamHealthMetrics,
  programScene,
  previewScene,
  graphRevision,
  outputViewMode,
  sourceCount,
  warnings,
  runtimeStatus,
  recoveryStatus,
  commandCount,
  eventCount,
  activeLocks,
  conflicts,
  unavailableSubsystems,
  previewMonitor,
  collaborationState,
  collaborationConflictCount,
  onCollaborationDispatch,
  automationState,
  onAutomationDispatch,
  aiState,
  onAIDispatch,
  aiSummaryLines,
  distributionState,
  onDistributionDispatch,
  deviceState,
  onDeviceDispatch,
  runtimeState,
  runtimeHealth,
  runtimeSnapshots,
  mediaRuntimeState,
  mediaRuntimeHealth,
  recordingRuntimeState,
  browserRecordingState,
  onStartBrowserRecording,
  onStopBrowserRecording,
}: {
  broadcastId: string;
  workspaceId: string;
  guests: Guest[];
  invites: GuestInvite[];
  scenes: Scene[];
  routes: MediaRoute[];
  destinations: Destination[];
  messages: ChatMessage[];
  streamHealthMetrics: StreamHealthMetric[];
  programScene: Scene;
  previewScene: Scene;
  graphRevision?: number;
  outputViewMode: string;
  sourceCount: number;
  warnings: string[];
  runtimeStatus: string;
  recoveryStatus: string;
  commandCount: number;
  eventCount: number;
  activeLocks: number;
  conflicts: number;
  unavailableSubsystems: string[];
  previewMonitor: ReactNode;
  collaborationState?: CollaborationState;
  collaborationConflictCount?: number;
  onCollaborationDispatch?: (action: CollaborationAction) => void;
  automationState?: AutomationState;
  onAutomationDispatch?: (action: AutomationAction) => void;
  aiState?: AIState;
  onAIDispatch?: (action: AIAction) => void;
  aiSummaryLines?: string[];
  distributionState?: DistributionState;
  onDistributionDispatch?: (action: DistributionAction) => void;
  deviceState?: DeviceState;
  onDeviceDispatch?: (action: DeviceAction) => void;
  runtimeState?: RuntimeState;
  runtimeHealth?: RuntimeHealth;
  runtimeSnapshots?: RuntimeSnapshot[];
  mediaRuntimeState?: MediaRuntimeState;
  mediaRuntimeHealth?: MediaRuntimeHealth;
  recordingRuntimeState?: RecordingRuntimeState;
  browserRecordingState?: BrowserRecordingPanelState;
  onStartBrowserRecording?: () => void;
  onStopBrowserRecording?: () => void;
}) {
  const routeInfo = deriveInspectorRoutes(routes);

  return {
    guests: (
      <GuestsPanel guests={guests} invites={invites} broadcastId={broadcastId} routes={routes} />
    ),
    inspector: (
      <>
        <InspectorPanel
          programScene={programScene}
          previewScene={previewScene}
          outputViewMode={outputViewMode}
          activeRouteCount={routes.filter((route) => route.isOnProgram || route.isActive).length}
          sourceCount={sourceCount}
          guestCount={guests.length}
          warnings={warnings}
          {...(graphRevision !== undefined ? { graphRevision } : {})}
          {...(routeInfo.programRouteName ? { programRouteName: routeInfo.programRouteName } : {})}
          {...(routeInfo.verticalRouteName
            ? { verticalRouteName: routeInfo.verticalRouteName }
            : {})}
        />
        <HostDevicesSection />
      </>
    ),
    routing: (
      <RoutingPanel guests={guests} routes={routes} scenes={scenes} broadcastId={broadcastId} />
    ),
    outputs:
      distributionState && onDistributionDispatch ? (
        <OutputsPanel state={distributionState} dispatch={onDistributionDispatch} />
      ) : (
        <OutputsPanel
          state={createInitialDistributionState({
            destinations: [],
            streamProfiles: createDistributionManifest().streamProfiles,
            outputRoutes: [],
            outputHealth: [],
          })}
          dispatch={() => undefined}
        />
      ),
    devices:
      deviceState && onDeviceDispatch ? (
        <DevicePanel state={deviceState} dispatch={onDeviceDispatch} />
      ) : (
        <DevicePanel
          state={createInitialDeviceState(createDeviceManifest({ devices: [] }))}
          dispatch={() => undefined}
        />
      ),
    engine: <EngineWorkspace compact />,
    compositor: <CompositorPanel />,
    runtime: (
      <div className="space-y-ubos-2">
        {runtimeState && runtimeHealth ? (
          <RuntimeDashboard
            state={runtimeState}
            health={runtimeHealth}
            snapshots={runtimeSnapshots ?? []}
          />
        ) : null}
        <MediaRuntimePanel
          state={mediaRuntimeState ?? createMediaRuntimeState()}
          health={mediaRuntimeHealth ?? createMediaRuntimeState().health}
        />
        <RuntimeRenderPanel />
      </div>
    ),
    security: <SecurityPanel />,
    monitoring: <MonitoringPanel />,
    cluster: <ClusterPanel />,
    plugins: <PluginPanel />,
    cloud: <CloudPanel />,
    analytics: <AnalyticsPanel />,
    'enterprise-admin': <EnterpriseAdminPanel />, 
    recording: recordingRuntimeState ? (
      <RecordingRuntimePanel
        state={recordingRuntimeState}
        {...(browserRecordingState ? { browserState: browserRecordingState } : {})}
        {...(onStartBrowserRecording ? { onStart: onStartBrowserRecording } : {})}
        {...(onStopBrowserRecording ? { onStop: onStopBrowserRecording } : {})}
      />
    ) : (
      <RecordingRuntimePanel
        {...(browserRecordingState ? { browserState: browserRecordingState } : {})}
        {...(onStartBrowserRecording ? { onStart: onStartBrowserRecording } : {})}
        {...(onStopBrowserRecording ? { onStop: onStopBrowserRecording } : {})}
      />
    ),
    health: (
      <HealthPanel
        streamMetrics={streamHealthMetrics}
        runtimeStatus={runtimeStatus}
        recoveryStatus={recoveryStatus}
        commandCount={commandCount}
        eventCount={eventCount}
        activeLocks={activeLocks}
        conflicts={conflicts}
        warnings={warnings}
        unavailableSubsystems={unavailableSubsystems}
      />
    ),
    preview: <PreviewPanel monitor={previewMonitor} />,
    logs: (
      <LogsPanelContainer workspaceId={workspaceId} broadcastId={broadcastId} messages={messages} />
    ),
    'ai-director': <AIDirectorPanel />,
    ai:
      aiState && onAIDispatch ? (
        <AIAssistantPanel
          state={aiState}
          dispatch={onAIDispatch}
          {...(aiSummaryLines ? { summaryLines: aiSummaryLines } : {})}
        />
      ) : (
        <AIAssistantPanel
          state={createInitialAIState({
            assistant: { ...createDefaultAIAssistantState(), status: 'disabled' },
            recommendations: [],
            riskSignals: [],
          })}
          dispatch={() => undefined}
        />
      ),
    automation:
      automationState && onAutomationDispatch ? (
        <AutomationPanel state={automationState} dispatch={onAutomationDispatch} />
      ) : (
        <AutomationPanel
          state={{
            runOfShow: {
              id: 'empty',
              name: 'Run of Show',
              status: 'draft',
              segments: [],
              estimatedDurationMs: 0,
              updatedAt: new Date().toISOString(),
            },
            macros: [],
            automationMode: 'manual',
            selectedSegmentId: null,
            selectedCueId: null,
            commandLog: [],
          }}
          dispatch={() => undefined}
        />
      ),
    team:
      collaborationState && onCollaborationDispatch ? (
        <TeamPanel
          state={collaborationState.remoteProduction}
          conflictCount={collaborationConflictCount ?? 0}
          dispatch={onCollaborationDispatch}
        />
      ) : (
        <TeamPanel
          state={{
            operators: [],
            locks: [],
            notes: [],
            events: [],
            collaborationEnabled: false,
            containsRuntimeHandles: false,
          }}
          conflictCount={0}
          dispatch={() => undefined}
        />
      ),
  };
}
