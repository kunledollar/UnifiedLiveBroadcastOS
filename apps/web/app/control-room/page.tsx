import { getProductionState, getScenes } from './scene-actions';
import { SceneWorkspace } from './scene-workspace';
import { GuestManagement } from './guest-management';
import { listGuests, listInvites } from './guest-actions';
import { loadMediaRoutes } from './media-route-actions';
import { MediaRoutingPanel } from './media-routing-panel';
import { ControlRoomRealtime } from './_components/control-room-realtime';
import { HostDeviceControls } from './_components/host-device-controls';
import { ProductionTeamPanel } from './_components/production-team-panel';
import { RightSidebarTabs } from './right-sidebar-tabs';

import { CrossFollowPanel, DestinationPanel, StreamHealthPanel, UnifiedChatPanel } from '@ubos/ui';
import {
  type AudioChannel,
  type ChatMessage,
  type Destination,
  type ProductionAsset,
  type SceneLayout,
  createBroadcastSessionRecord,
  createGraphSnapshot,
  createInitialProductionGraph,
  createInMemoryPersistentBroadcastRepositories,
  createPersistenceDiagnostics,
  getRecoveryPlan,
  type StreamHealthMetric,
} from '@ubos/shared';

const layouts: SceneLayout[] = [
  'solo',
  'interview',
  'grid',
  'screen_share',
  'vertical_split',
  'picture_in_picture',
];

const destinations: Destination[] = [];
const messages: ChatMessage[] = [];
const healthMetrics: StreamHealthMetric[] = [];
const audioChannels: AudioChannel[] = [];

const assets: ProductionAsset[] = [
  { id: 'asset-intro', name: 'Intro Sting', type: 'video', status: 'ready' },
  { id: 'asset-lower-third', name: 'Guest Lower Third', type: 'lower_third', status: 'ready' },
  { id: 'asset-bg', name: 'Gradient Background', type: 'background', status: 'ready' },
  { id: 'asset-logo', name: 'Sponsor Bug', type: 'overlay', status: 'queued' },
];

function loadPersistenceDiagnostics() {
  const graph = createInitialProductionGraph({
    broadcastSessionId: 'demo-broadcast',
    name: 'Demo Broadcast',
    operatorId: 'director',
    timestamp: '2026-07-01T00:00:00.000Z',
  });
  const repositories = createInMemoryPersistentBroadcastRepositories();
  const session = repositories.sessions.upsert(
    createBroadcastSessionRecord({
      graph,
      ownerOperatorId: 'director',
      activeOperatorIds: ['director'],
    }),
  );
  const latestSnapshot = repositories.snapshots.append(
    createGraphSnapshot(graph, { reason: 'manual' }),
  );
  const recoveryPlan = getRecoveryPlan({
    sessionId: session.id,
    currentRevision: session.currentGraphRevision,
    snapshots: repositories.snapshots,
    events: repositories.events,
    commands: repositories.commands,
  });

  return createPersistenceDiagnostics({
    session,
    latestSnapshot,
    commandCount: repositories.commands.list(session.id).length,
    eventCount: repositories.events.list(session.id).length,
    collaborationEventCount: repositories.collaboration.listEvents(session.id).length,
    activeLocksCount: repositories.authority.listActiveLocks(session.id).length,
    conflictsCount: repositories.authority.listConflicts(session.id).length,
    syncCheckpointCount: repositories.collaboration.listCheckpoints(session.id).length,
    recoveryStatus: recoveryPlan.status,
  });
}

export const dynamic = 'force-dynamic';

export default async function ControlRoomPage() {
  const persistenceDiagnostics = loadPersistenceDiagnostics();
  const [scenes, productionState, guests, invites, mediaRoutes] = await Promise.all([
    getScenes(),
    getProductionState(),
    listGuests(),
    listInvites(),
    loadMediaRoutes(),
  ]);

  return (
    <main className="min-h-screen overflow-y-auto xl:h-screen xl:overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(79,70,229,.18),transparent_30%),#020617] p-1.5 text-slate-100 md:p-2">
      <div className="h-full min-h-0 w-full">
        <SceneWorkspace
          initialScenes={scenes}
          initialProductionState={productionState}
          layouts={layouts}
          channels={audioChannels}
          assets={assets}
          mediaRoutes={mediaRoutes}
          guests={guests}
          rightSidebar={
            <RightSidebarTabs
              tabs={[
                {
                  id: 'guests',
                  label: 'Guests',
                  content: (
                    <GuestManagement
                      guests={guests}
                      invites={invites}
                      broadcastId="demo-broadcast"
                    />
                  ),
                },
                {
                  id: 'outputs',
                  label: 'Outputs',
                  content: (
                    <div className="space-y-3">
                      <MediaRoutingPanel
                        guests={guests}
                        routes={mediaRoutes}
                        scenes={scenes}
                        broadcastId="demo-broadcast"
                      />
                      <DestinationPanel destinations={destinations} />
                    </div>
                  ),
                },
                {
                  id: 'chat',
                  label: 'Chat',
                  content: (
                    <div className="space-y-3">
                      <UnifiedChatPanel messages={messages} />
                      <CrossFollowPanel platforms={[]} />
                    </div>
                  ),
                },
                { id: 'audio', label: 'Audio', content: <HostDeviceControls /> },
                {
                  id: 'health',
                  label: 'Health',
                  content: (
                    <div className="space-y-3">
                      <ControlRoomRealtime
                        workspaceId="demo-workspace"
                        broadcastId="demo-broadcast"
                      />
                      <StreamHealthPanel metrics={healthMetrics} />
                    </div>
                  ),
                },
                {
                  id: 'logs',
                  label: 'Logs',
                  content: (
                    <div className="space-y-3">
                      <ProductionTeamPanel
                        currentGraphRevision={persistenceDiagnostics.currentGraphRevision}
                      />
                      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        {Object.entries(persistenceDiagnostics).map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-white/10 bg-slate-950/50 p-2"
                          >
                            <dt className="font-bold uppercase tracking-[0.12em] text-slate-500">
                              {label}
                            </dt>
                            <dd className="mt-1 truncate font-mono text-cyan-200">
                              {String(value ?? 'none')}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ),
                },
                {
                  id: 'ai',
                  label: 'AI',
                  content: (
                    <div className="rounded-2xl border border-dashed border-cyan-300/20 bg-cyan-300/5 p-4 text-sm text-slate-300">
                      AI operator assist workspace ready. Automation cards stay hidden until
                      configured.
                    </div>
                  ),
                },
              ]}
            />
          }
        />
      </div>
    </main>
  );
}
