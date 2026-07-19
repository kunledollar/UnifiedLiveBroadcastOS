import { getProductionState, getScenes } from './scene-actions';
import { listGuests, listInvites } from './guest-actions';
import { loadMediaRoutes } from './media-route-actions';
import type { Scene, Guest, GuestInvite, MediaRoute, ProductionSwitchingState } from '@ubos/shared';
import { ControlRoomShell } from './shell/ControlRoomShell';
import { RuntimeManagerScreen } from './runtime-manager';
import { runtimeManager } from '../../lib/runtime/runtime-health';

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
  SceneType,
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

/** Demo scenes used when the database is unavailable. */
const DEMO_SCENES: Scene[] = [
  {
    id: 'scene-countdown',
    broadcastId: 'demo-broadcast',
    name: 'Opening Countdown',
    type: SceneType.Countdown,
    order: 0,
    isActive: false,
    thumbnailUrl: null,
    background: null,
    layout: 'screen_share',
    sources: [
      {
        id: 'src-pattern-countdown', workspaceId: 'demo-workspace', broadcastId: 'demo-broadcast', sceneId: 'scene-countdown',
        name: 'Scene A Test Pattern', label: 'Scene A Test Pattern', type: 'media', order: 0, visible: true, isVisible: true, isLocked: false,
        settings: { runtimeStatus: 'live', captureState: 'live', sourceKind: 'test-pattern', patternLabel: 'A', patternColor: '#dc2626' },
        transform: { x: 0, y: 0, width: 1, height: 1, zIndex: 0, opacity: 1, visible: true, locked: false },
        createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ],
    overlays: [],
    audioConfig: {},
    canvases: [
      { id: 'program', label: 'Program', aspectRatio: '16:9', destinationHint: 'Primary destinations' },
    ],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'scene-interview',
    broadcastId: 'demo-broadcast',
    name: 'Host + Guest Interview',
    type: SceneType.Interview,
    order: 1,
    isActive: true,
    thumbnailUrl: null,
    background: null,
    layout: 'interview',
    sources: [
      {
        id: 'src-pattern-interview', workspaceId: 'demo-workspace', broadcastId: 'demo-broadcast', sceneId: 'scene-interview',
        name: 'Scene B Test Pattern', label: 'Scene B Test Pattern', type: 'media', order: 2, visible: true, isVisible: true, isLocked: false,
        settings: { runtimeStatus: 'live', captureState: 'live', sourceKind: 'test-pattern', patternLabel: 'B', patternColor: '#16a34a' },
        transform: { x: 0, y: 0, width: 1, height: 1, zIndex: 2, opacity: 1, visible: true, locked: false },
        createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'src-camera-1',
        workspaceId: 'demo-workspace',
        broadcastId: 'demo-broadcast',
        sceneId: 'scene-interview',
        name: 'Camera 1',
        label: 'Camera 1',
        type: 'camera',
        order: 0,
        visible: true,
        isVisible: true,
        isLocked: false,
        settings: { runtimeStatus: 'permission_required', deviceId: null },
        transform: { x: 0, y: 0, width: 1, height: 1, zIndex: 0, opacity: 1, visible: true, locked: false },
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'src-screen-1',
        workspaceId: 'demo-workspace',
        broadcastId: 'demo-broadcast',
        sceneId: 'scene-interview',
        name: 'Screen Share',
        label: 'Screen Share',
        type: 'screen',
        order: 1,
        visible: true,
        isVisible: true,
        isLocked: false,
        settings: { runtimeStatus: 'permission_required', captureState: 'not_started' },
        transform: { x: 0, y: 0, width: 1, height: 1, zIndex: 1, opacity: 1, visible: true, locked: false },
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ],
    overlays: [],
    audioConfig: {},
    canvases: [
      { id: 'program', label: 'Program', aspectRatio: '16:9', destinationHint: 'Primary destinations' },
    ],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'scene-demo',
    broadcastId: 'demo-broadcast',
    name: 'Product Demo + PiP',
    type: SceneType.ScreenShare,
    order: 2,
    isActive: false,
    thumbnailUrl: null,
    background: null,
    layout: 'picture_in_picture',
    sources: [
      {
        id: 'src-pattern-demo', workspaceId: 'demo-workspace', broadcastId: 'demo-broadcast', sceneId: 'scene-demo',
        name: 'Scene C Test Pattern', label: 'Scene C Test Pattern', type: 'media', order: 0, visible: true, isVisible: true, isLocked: false,
        settings: { runtimeStatus: 'live', captureState: 'live', sourceKind: 'test-pattern', patternLabel: 'C', patternColor: '#2563eb' },
        transform: { x: 0, y: 0, width: 1, height: 1, zIndex: 0, opacity: 1, visible: true, locked: false },
        createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ],
    overlays: [],
    audioConfig: {},
    canvases: [
      { id: 'program', label: 'Program', aspectRatio: '16:9', destinationHint: 'Primary destinations' },
    ],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
];

const DEMO_PRODUCTION_STATE: ProductionSwitchingState = {
  programSceneId: 'scene-interview',
  previewSceneId: 'scene-demo',
  transitionType: 'cut',
  transitionDuration: 500,
};

const DEMO_GUESTS: Guest[] = [];
const DEMO_INVITES: GuestInvite[] = [];
const DEMO_MEDIA_ROUTES: MediaRoute[] = [];

export const dynamic = 'force-dynamic';

export default async function ControlRoomPage() {
  const runtimeHealth = await runtimeManager.check();
  if (runtimeHealth.status === 'blocked') {
    return <RuntimeManagerScreen initialHealth={runtimeHealth} />;
  }

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
