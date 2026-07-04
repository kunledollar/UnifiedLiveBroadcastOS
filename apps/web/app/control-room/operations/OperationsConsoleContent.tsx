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
} from '@ubos/shared';
import { AIPanel } from './AIPanel';
import { GuestsPanel } from './GuestsPanel';
import { HealthPanel } from './HealthPanel';
import { InspectorPanel, deriveInspectorRoutes } from './InspectorPanel';
import { LogsPanelContainer } from './LogsPanelContainer';
import { OutputsPanel } from './OutputsPanel';
import { PreviewPanel } from './PreviewPanel';
import { RoutingPanel } from './RoutingPanel';
import { TeamPanel } from '../collaboration/TeamPanel';
import type { CollaborationAction, CollaborationState } from '../collaboration/collaboration-state';
import { HostDevicesSection } from './HostDevicesSection';

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
}) {
  const routeInfo = deriveInspectorRoutes(routes);

  return {
    guests: (
      <GuestsPanel
        guests={guests}
        invites={invites}
        broadcastId={broadcastId}
        routes={routes}
      />
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
          {...(routeInfo.verticalRouteName ? { verticalRouteName: routeInfo.verticalRouteName } : {})}
        />
        <HostDevicesSection />
      </>
    ),
    routing: (
      <RoutingPanel
        guests={guests}
        routes={routes}
        scenes={scenes}
        broadcastId={broadcastId}
      />
    ),
    outputs: <OutputsPanel destinations={destinations} />,
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
      <LogsPanelContainer
        workspaceId={workspaceId}
        broadcastId={broadcastId}
        messages={messages}
      />
    ),
    ai: <AIPanel />,
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
