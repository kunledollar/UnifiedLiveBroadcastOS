import { getProductionState, getScenes } from './scene-actions';
import { listGuests, listInvites } from './guest-actions';
import { loadMediaRoutes } from './media-route-actions';
import { ControlRoomShell } from './shell/ControlRoomShell';

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
  { id: 'asset-full-screen', name: 'Full Screen Topic Card', type: 'background', status: 'ready' },
  { id: 'asset-logo', name: 'PNG / SVG Logo Bug', type: 'overlay', status: 'ready' },
  { id: 'asset-ticker', name: 'Scrolling News Ticker', type: 'overlay', status: 'queued' },
  { id: 'asset-clock', name: 'Real Time Countdown Clock', type: 'overlay', status: 'ready' },
  { id: 'asset-scoreboard', name: 'Home Away Scoreboard', type: 'overlay', status: 'ready' },
  { id: 'asset-title', name: 'Animated Title Overlay', type: 'overlay', status: 'ready' },
  { id: 'asset-bg', name: 'Image Overlay Background', type: 'image', status: 'ready' },
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
    <ControlRoomShell
      scenes={scenes}
      productionState={productionState}
      layouts={layouts}
      channels={audioChannels}
      assets={assets}
      mediaRoutes={mediaRoutes}
      guests={guests}
      invites={invites}
      persistenceDiagnostics={persistenceDiagnostics}
      destinations={destinations}
      messages={messages}
      healthMetrics={healthMetrics}
    />
  );
}
