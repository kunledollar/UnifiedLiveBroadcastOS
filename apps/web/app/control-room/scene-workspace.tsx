'use client';

import {
  LayoutSelector,
  ProductionDock,
  ProgramPreview,
  ProductionMultiview,
  getTallyState,
  PreviewMonitor,
  SceneList,
  SourceManager,
} from '@ubos/ui';
import {
  MediaExecutionEngine,
  MockMediaExecutionAdapter,
  WebRTCMediaExecutionAdapter,
  createWebRTCAdapterMetadata,
  requestLocalCamera,
  requestLocalMicrophone,
  requestScreenShare,
  stopAllTracks,
  createSceneCompositionFromGraph,
  diffSceneCompositions,
  getCompositionWarnings,
  createVideoRoutePlan,
  createVideoRouteGraph,
  validateVideoRoutePlan,
  type ExecutionRuntimeMode,
} from '@ubos/media-plane';
import {
  SceneType,
  type AudioChannel,
  type Guest,
  type ProductionAsset,
  type Scene,
  type SceneLayout,
  type SceneSource,
  type SceneSourceType,
  type MediaRoute,
  type MediaLayoutPreset,
  type ProductionSwitchingState,
  type TransitionType,
  LocalProductionCommandDispatcher,
  createBroadcastSession,
  selectBroadcastStatus,
  selectHealthSummary,
  selectRecordingState,
  type ProductionCommandType,
  createMockSyncScenario,
  createSyncSession,
  getStaleClients,
  isRealtimeSyncEnabled,
  createMockAuthorityScenario,
} from '@ubos/shared';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  addScene,
  addSource,
  deleteScene,
  deleteSource,
  duplicateScene,
  duplicateSource,
  moveScene,
  moveSource,
  renameScene,
  renameSource,
  updateProductionState,
  toggleSourceLock,
  toggleSourceVisibility,
} from './scene-actions';
import {
  seedDemoProductionState,
  simulateDemoProduction,
  resetDemoProductionState,
  setRouteMuted,
} from './media-route-actions';
import { ProductionSwitcher } from './production-switcher';

function MediaStreamPreview({
  stream,
  muted = true,
  label,
  status,
}: {
  stream?: MediaStream | undefined;
  muted?: boolean;
  label: string;
  status: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream ?? null;
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [stream]);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-black/40">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="aspect-video w-full object-cover"
      />
      <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
        <span>{label}</span>
        <span className="text-slate-400">{status}</span>
      </div>
    </div>
  );
}

function InspectorMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900/80 p-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="truncate font-mono text-xs font-bold text-slate-100">{value}</p>
    </div>
  );
}

function MediaExecutionInspector({
  engine,
  graph,
}: {
  engine: MediaExecutionEngine;
  graph: ReturnType<typeof createBroadcastSession>['graph'];
}) {
  const enabled = process.env.NEXT_PUBLIC_UBOS_MEDIA_EXECUTION_INSPECTOR === 'true';
  const [refreshToken, setRefreshToken] = useState(0);
  const [permissionError, setPermissionError] = useState<string | undefined>();
  const webRTCAdapter = engine.getRegisteredAdapter('webrtc-media-execution-adapter');
  const webRTC = webRTCAdapter instanceof WebRTCMediaExecutionAdapter ? webRTCAdapter : undefined;
  const webRTCDiagnostics = webRTC?.getDiagnostics();
  const state = engine.getExecutionState();
  const programComposition = graph.program.sceneId
    ? createSceneCompositionFromGraph(graph, graph.program.sceneId, { target: 'program' })
    : undefined;
  const previewComposition = graph.preview.sceneId
    ? createSceneCompositionFromGraph(graph, graph.preview.sceneId, { target: 'preview' })
    : undefined;
  const compositionDiff = diffSceneCompositions(previewComposition, programComposition);
  const compositionWarnings = [
    ...(programComposition ? getCompositionWarnings(programComposition) : []),
    ...(previewComposition ? getCompositionWarnings(previewComposition) : []),
  ];
  const routePlan = createVideoRoutePlan(
    graph,
    [programComposition, previewComposition].filter((composition) => composition !== undefined),
    {
      includeRecording: graph.recording.status === 'recording',
      includeStreams: Object.values(graph.destinations).some((destination) => destination.enabled),
      includeConfidenceMonitor: true,
    },
  );
  const routeGraph = createVideoRouteGraph(routePlan);
  const routeValidation = validateVideoRoutePlan(
    routePlan,
    graph,
    [programComposition, previewComposition].filter((composition) => composition !== undefined),
  );
  const activeRoutes = routePlan.routes.filter((route) => route.enabled);
  const latestResult = state.lastResults.at(-1);
  const latestAdapter = latestResult?.adapterResponses.at(-1);
  const health = state.executionHealth;
  const adapters = state.adapterRegistry;
  const dryRunCount = state.latestEvents.filter(
    (event) => event.type === 'DRY_RUN_RECORDED',
  ).length;
  const skippedCount = state.latestEvents.filter(
    (event) => event.type === 'EXECUTION_SKIPPED' || event.type === 'ADAPTER_UNAVAILABLE',
  ).length;
  const failureCount = state.latestEvents.filter(
    (event) => event.type === 'EXECUTION_FAILED',
  ).length;
  const rerender = () => setRefreshToken((value) => value + 1);
  if (!enabled) return null;
  const setMode = (mode: ExecutionRuntimeMode) => {
    engine.setExecutionRuntimeMode(mode);
    rerender();
  };
  const requestAndRegister = async (
    kind: 'camera' | 'screen' | 'media',
    request: () => Promise<MediaStream>,
  ) => {
    if (!webRTC) return;
    setPermissionError(undefined);
    try {
      const stream = await request();
      webRTC.getSourceManager().registerStream(stream, {
        sourceId: `local-${kind}-${stream.id}`,
        kind,
      });
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Unknown media error');
    }
    rerender();
  };
  const stopLocalStreams = () => {
    webRTC
      ?.getSourceManager()
      .listSources()
      .forEach((source) => {
        const stream = webRTC.getSourceManager().getStream(source.sourceId);
        stopAllTracks(stream);
        webRTC.getSourceManager().updateSourceStatus(source.sourceId, 'disconnected');
      });
    rerender();
  };
  const registerTestStream = () => {
    if (!webRTC) return;
    const testStream = {
      id: `test-stream-${Date.now()}`,
      getAudioTracks: () => [],
      getVideoTracks: () => [],
      getTracks: () => [],
    } as unknown as MediaStream;
    webRTC.getSourceManager().registerStream(testStream, {
      sourceId: testStream.id,
      kind: 'browser',
    });
    rerender();
  };
  const configureLatencyPreset = (preset: 'instant' | 'steady' | 'warning') => {
    const activeMock = adapters.find((adapter) => adapter.isMock);
    if (preset === 'instant')
      engine.configureMockExecutionLatency({
        minLatencyMs: 0,
        maxLatencyMs: 0,
        failureRate: 0,
        warningRate: 0,
        seed: 1,
      });
    if (preset === 'steady')
      engine.configureMockExecutionLatency({
        minLatencyMs: 8,
        maxLatencyMs: 8,
        failureRate: 0,
        warningRate: 0,
        seed: 1,
      });
    if (preset === 'warning')
      engine.configureMockExecutionLatency({
        minLatencyMs: 12,
        maxLatencyMs: 18,
        failureRate: 0,
        warningRate: 1,
        seed: 42,
      });
    if (activeMock) engine.setAdapterEnabled(activeMock.id, true);
    rerender();
  };
  return (
    <details className="mb-2 rounded-xl border border-purple-300/20 bg-slate-950/80 p-3 text-xs text-slate-300">
      <summary className="cursor-pointer font-black uppercase tracking-[0.18em] text-purple-200">
        Media Execution Inspector
      </summary>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <InspectorMetric label="Revision" value={String(state.currentGraphRevision)} />
        <InspectorMetric label="Mode" value={state.runtimeMode} />
        <InspectorMetric label="Active Adapter" value={state.activeAdapter?.name ?? '—'} />
        <InspectorMetric label="Adapters" value={String(adapters.length)} />
        <InspectorMetric label="Health" value={health.isHealthy ? 'healthy' : 'warning'} />
        <InspectorMetric label="Executed" value={String(health.executedIntentCount)} />
        <InspectorMetric
          label="Skipped"
          value={String(skippedCount || health.skippedIntentCount)}
        />
        <InspectorMetric
          label="Failures"
          value={String(failureCount || health.failedIntentCount)}
        />
        <InspectorMetric label="Dry Runs" value={String(dryRunCount)} />
        <InspectorMetric label="Avg Latency" value={`${health.averageExecutionMs}ms`} />
        <InspectorMetric label="Latest Intent" value={state.lastIntents.at(-1)?.type ?? '—'} />
        <InspectorMetric
          label="Program Composition"
          value={
            programComposition
              ? `${programComposition.canvas.width}x${programComposition.canvas.height}`
              : '—'
          }
        />
        <InspectorMetric
          label="Preview Composition"
          value={
            previewComposition
              ? `${previewComposition.canvas.width}x${previewComposition.canvas.height}`
              : '—'
          }
        />
        <InspectorMetric
          label="Layout Preset"
          value={String(
            programComposition?.metadata.layoutPreset ??
              previewComposition?.metadata.layoutPreset ??
              '—',
          )}
        />
        <InspectorMetric
          label="Visible Layers"
          value={String(programComposition?.layers.filter((layer) => layer.visible).length ?? 0)}
        />
        <InspectorMetric
          label="Overlays"
          value={String(programComposition?.overlays.length ?? 0)}
        />
        <InspectorMetric label="Warnings" value={String(compositionWarnings.length)} />
        <InspectorMetric label="Video Routes" value={String(activeRoutes.length)} />
        <InspectorMetric
          label="Route Targets"
          value={activeRoutes.map((route) => route.target).join(', ') || '—'}
        />
        <InspectorMetric
          label="Route Fan-out"
          value={String(
            Math.max(0, ...Object.values(routeGraph.fanOut).map((routes) => routes.length)),
          )}
        />
        <InspectorMetric label="Route Rev" value={String(routeGraph.revision)} />
        <InspectorMetric
          label="Changed Layers"
          value={`${compositionDiff.changedLayers.length} Δ / +${compositionDiff.addedLayers.length} / -${compositionDiff.removedLayers.length}`}
        />
        <InspectorMetric
          label="Composition Rev"
          value={String(
            programComposition?.graphRevision ??
              previewComposition?.graphRevision ??
              state.currentGraphRevision,
          )}
        />
        <InspectorMetric
          label="Latest Adapter"
          value={latestAdapter?.adapterName ?? state.registeredAdapters.at(-1) ?? '—'}
        />
      </div>
      <div className="mt-3 rounded-lg border border-slate-800 bg-black/20 p-2">
        <p className="font-black uppercase tracking-[0.16em] text-slate-300">Video Routing</p>
        <div className="mt-2 grid gap-1 md:grid-cols-2">
          {activeRoutes.slice(0, 6).map((route) => (
            <div key={route.id} className="rounded border border-slate-800 bg-slate-950/70 p-2">
              <p className="font-bold text-slate-100">
                {route.target} → {route.targetId}
              </p>
              <p className="text-[10px] text-slate-400">
                {route.sourceCompositionId} · {route.status} · p{route.priority}
              </p>
            </div>
          ))}
        </div>
        {routeValidation.warnings.length > 0 ? (
          <p className="mt-2 text-[10px] text-amber-200">
            {routeValidation.warnings.slice(0, 3).join(' · ')}
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" data-refresh-token={refreshToken}>
        {(['disabled', 'dry_run', 'mock_live', 'live_ready'] as ExecutionRuntimeMode[]).map(
          (mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={`rounded border px-2 py-1 font-bold uppercase tracking-[0.12em] ${state.runtimeMode === mode ? 'border-purple-300 bg-purple-500/20 text-purple-100' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
            >
              {mode}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => {
            engine.clearExecutionLog();
            rerender();
          }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
        >
          Clear log
        </button>
        <button
          type="button"
          onClick={() => {
            engine.replayExecutionForRevision(state.currentGraphRevision);
            rerender();
          }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
        >
          Replay latest
        </button>
        {adapters.find((adapter) => adapter.isMock) ? (
          <button
            type="button"
            onClick={() => {
              const adapter = adapters.find((item) => item.isMock);
              if (adapter)
                engine.setAdapterEnabled(adapter.id, adapter.status !== 'disabled' ? false : true);
              rerender();
            }}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
          >
            Toggle mock adapter
          </button>
        ) : null}
        {(['instant', 'steady', 'warning'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => configureLatencyPreset(preset)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
          >
            {preset} latency
          </button>
        ))}
        <button
          type="button"
          onClick={() => requestAndRegister('camera', requestLocalCamera)}
          className="rounded border border-cyan-700 bg-cyan-950/40 px-2 py-1 font-bold uppercase tracking-[0.12em] text-cyan-200"
        >
          Request Camera
        </button>
        <button
          type="button"
          onClick={() => requestAndRegister('media', requestLocalMicrophone)}
          className="rounded border border-cyan-700 bg-cyan-950/40 px-2 py-1 font-bold uppercase tracking-[0.12em] text-cyan-200"
        >
          Request Microphone
        </button>
        <button
          type="button"
          onClick={() => requestAndRegister('screen', requestScreenShare)}
          className="rounded border border-cyan-700 bg-cyan-950/40 px-2 py-1 font-bold uppercase tracking-[0.12em] text-cyan-200"
        >
          Request Screen Share
        </button>
        <button
          type="button"
          onClick={stopLocalStreams}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
        >
          Stop Local Streams
        </button>
        <button
          type="button"
          onClick={registerTestStream}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
        >
          Register Test Stream
        </button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <InspectorMetric
          label="WebRTC"
          value={webRTCDiagnostics?.isAvailable ? 'available' : 'unavailable'}
        />
        <InspectorMetric
          label="Capture APIs"
          value={`cam:${webRTCDiagnostics?.supportsCamera ? 'yes' : 'no'} mic:${webRTCDiagnostics?.supportsMicrophone ? 'yes' : 'no'} screen:${webRTCDiagnostics?.supportsScreenShare ? 'yes' : 'no'}`}
        />
        <InspectorMetric
          label="Local Streams"
          value={String(webRTCDiagnostics?.activeLocalStreamCount ?? 0)}
        />
      </div>
      {permissionError ? (
        <p className="mt-2 rounded border border-red-500/30 bg-red-950/40 p-2 text-red-200">
          {permissionError}
        </p>
      ) : null}
      {webRTC ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {webRTC
            .getSourceManager()
            .listSources()
            .map((source) => (
              <MediaStreamPreview
                key={source.sourceId}
                stream={
                  webRTC.getSourceManager().getStream(source.sourceId) as MediaStream | undefined
                }
                label={source.sourceId}
                status={`${source.kind}:${source.status}`}
              />
            ))}
        </div>
      ) : null}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <pre className="overflow-auto rounded bg-black/40 p-2 text-[10px]">
          {JSON.stringify(
            {
              adapters,
              health,
              webRTCDiagnostics,
              compositionWarnings,
              routePlan,
              routeWarnings: routeValidation.warnings,
              latestEvents: state.latestEvents.slice(-6),
            },
            null,
            2,
          )}
        </pre>
        <pre className="overflow-auto rounded bg-black/40 p-2 text-[10px]">
          {JSON.stringify(
            {
              latestIntents: state.lastIntents.slice(-5),
              latestResult,
              programComposition,
              previewComposition,
              replay: engine.summarizeExecutionForRevision(state.currentGraphRevision),
            },
            null,
            2,
          )}
        </pre>
      </div>
    </details>
  );
}

function ProductionGraphInspector({
  session,
}: {
  session: ReturnType<typeof createBroadcastSession>;
}) {
  const enabled = process.env.NEXT_PUBLIC_UBOS_GRAPH_INSPECTOR === 'true';
  if (!enabled) return null;
  const graph = session.graph;
  const health = selectHealthSummary(graph);
  const recording = selectRecordingState(graph);
  const latestCommands = session.commandLog.slice(-3);
  const latestEvents = session.eventLog.slice(-3);
  const rejectedCommands = session.eventLog.filter(
    (event) => event.type === 'COMMAND_REJECTED',
  ).length;
  const latestEvent = latestEvents.at(-1);
  const latestCommandSequence = latestEvent?.metadata?.commandSequence;
  const latestEventRevision = latestEvent?.graphRevision;
  return (
    <details className="mb-2 rounded-xl border border-cyan-300/20 bg-slate-950/80 p-3 text-xs text-slate-300">
      <summary className="cursor-pointer font-black uppercase tracking-[0.18em] text-cyan-200">
        Production Graph Inspector
      </summary>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        <InspectorMetric label="Status" value={selectBroadcastStatus(graph)} />
        <InspectorMetric label="Graph ID" value={graph.metadata.graphId} />
        <InspectorMetric label="Revision" value={String(graph.metadata.revision)} />
        <InspectorMetric label="Created" value={graph.metadata.createdAt} />
        <InspectorMetric label="Updated" value={graph.metadata.updatedAt} />
        <InspectorMetric label="Graph" value={`${graph.graphVersion} / ${graph.schemaVersion}`} />
        <InspectorMetric label="Program" value={graph.program.sceneId ?? '—'} />
        <InspectorMetric label="Preview" value={graph.preview.sceneId ?? '—'} />
        <InspectorMetric label="Scenes" value={String(Object.keys(graph.scenes).length)} />
        <InspectorMetric label="Sources" value={String(Object.keys(graph.sources).length)} />
        <InspectorMetric label="Guests" value={String(Object.keys(graph.guests).length)} />
        <InspectorMetric
          label="Destinations"
          value={String(Object.keys(graph.destinations).length)}
        />
        <InspectorMetric label="Audio" value={String(Object.keys(graph.audioChannels).length)} />
        <InspectorMetric label="Recording" value={recording.status} />
        <InspectorMetric label="Health" value={health.status} />
        <InspectorMetric label="Accepted" value={String(session.commandLog.length)} />
        <InspectorMetric label="Rejected" value={String(rejectedCommands)} />
        <InspectorMetric
          label="Latest Seq"
          value={latestCommandSequence === undefined ? '—' : String(latestCommandSequence)}
        />
        <InspectorMetric
          label="Event Rev"
          value={latestEventRevision === undefined ? '—' : String(latestEventRevision)}
        />
        <InspectorMetric
          label="Logs"
          value={`${session.commandLog.length} cmd / ${session.eventLog.length} evt`}
        />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <pre className="overflow-auto rounded bg-black/40 p-2 text-[10px]">
          {JSON.stringify(latestCommands, null, 2)}
        </pre>
        <pre className="overflow-auto rounded bg-black/40 p-2 text-[10px]">
          {JSON.stringify(latestEvents, null, 2)}
        </pre>
      </div>
    </details>
  );
}

const sceneTypes = Object.values(SceneType);
const sourceTypes: SceneSourceType[] = ['camera', 'screen', 'media', 'overlay', 'browser', 'audio'];

type ControlRoomViewMode = 'dual' | 'program' | 'vertical' | 'compact' | 'multiview';
type WorkspacePresetId = 'default' | 'broadcast' | 'compact' | 'interview' | 'streaming';
type PanelId =
  | 'scenes'
  | 'sources'
  | 'guestManager'
  | 'programPreview'
  | 'audioMixer'
  | 'productionDock'
  | 'broadcastHealth'
  | 'chat'
  | 'outputs';
type PanelStatus = 'expanded' | 'collapsed' | 'hidden';
type WorkspaceLayout = {
  selectedPreset: WorkspacePresetId;
  panelState: Record<PanelId, PanelStatus>;
  sizes: { left: number; center: number; right: number; dock: number };
  viewMode: ControlRoomViewMode;
};
type WorkspacePreset = WorkspaceLayout & {
  id: WorkspacePresetId;
  label: string;
  description: string;
};

const controlRoomViewStorageKey = 'ubos.controlRoom.viewMode';
const workspaceStorageKey = 'ubos.controlRoom.workspace.v1';
const panelIds: PanelId[] = [
  'scenes',
  'sources',
  'guestManager',
  'programPreview',
  'audioMixer',
  'productionDock',
  'broadcastHealth',
  'chat',
  'outputs',
];
const panelLabels: Record<PanelId, string> = {
  scenes: 'Scenes',
  sources: 'Sources',
  guestManager: 'Guest Manager',
  programPreview: 'Program/Preview',
  audioMixer: 'Audio Mixer',
  productionDock: 'Production Dock',
  broadcastHealth: 'Broadcast Health',
  chat: 'Chat',
  outputs: 'Outputs',
};
const allExpanded = (): Record<PanelId, PanelStatus> =>
  Object.fromEntries(panelIds.map((id) => [id, 'expanded'])) as Record<PanelId, PanelStatus>;
const workspacePresets: Record<WorkspacePresetId, WorkspacePreset> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Balanced control room',
    selectedPreset: 'default',
    panelState: allExpanded(),
    sizes: { left: 288, center: 720, right: 352, dock: 176 },
    viewMode: 'dual',
  },
  broadcast: {
    id: 'broadcast',
    label: 'Broadcast',
    description: 'Program emphasis',
    selectedPreset: 'broadcast',
    panelState: { ...allExpanded(), chat: 'collapsed' },
    sizes: { left: 304, center: 900, right: 384, dock: 184 },
    viewMode: 'program',
  },
  compact: {
    id: 'compact',
    label: 'Compact',
    description: 'Laptop friendly',
    selectedPreset: 'compact',
    panelState: { ...allExpanded(), sources: 'collapsed', chat: 'hidden', outputs: 'hidden' },
    sizes: { left: 232, center: 620, right: 280, dock: 132 },
    viewMode: 'compact',
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    description: 'Guest manager focus',
    selectedPreset: 'interview',
    panelState: { ...allExpanded(), broadcastHealth: 'collapsed', outputs: 'hidden' },
    sizes: { left: 272, center: 760, right: 420, dock: 160 },
    viewMode: 'dual',
  },
  streaming: {
    id: 'streaming',
    label: 'Streaming',
    description: 'Chat and health focus',
    selectedPreset: 'streaming',
    panelState: { ...allExpanded(), outputs: 'collapsed' },
    sizes: { left: 260, center: 780, right: 400, dock: 168 },
    viewMode: 'vertical',
  },
};
const factoryWorkspace = workspacePresets.default;

function normalizeWorkspaceLayout(
  value: Partial<WorkspaceLayout> | null | undefined,
): WorkspaceLayout {
  const selectedPreset = value?.selectedPreset;
  const preset: WorkspacePresetId =
    selectedPreset && selectedPreset in workspacePresets
      ? (selectedPreset as WorkspacePresetId)
      : factoryWorkspace.selectedPreset;
  const storedViewMode = value?.viewMode ?? null;
  const viewMode: ControlRoomViewMode = isControlRoomViewMode(storedViewMode)
    ? storedViewMode
    : workspacePresets[preset].viewMode;

  return {
    ...workspacePresets[preset],
    ...value,
    selectedPreset: preset,
    viewMode,
    panelState: { ...factoryWorkspace.panelState, ...value?.panelState },
    sizes: { ...factoryWorkspace.sizes, ...value?.sizes },
  };
}

const viewModeOptions: Array<{
  value: ControlRoomViewMode | 'quad';
  label: string;
  description: string;
  disabled?: boolean;
}> = [
  {
    value: 'dual',
    label: 'Dual View',
    description: 'Program + vertical',
  },
  {
    value: 'program',
    label: 'Program Focus',
    description: 'Large 16:9 preview',
  },
  {
    value: 'vertical',
    label: 'Vertical Focus',
    description: 'Large 9:16 preview',
  },
  {
    value: 'compact',
    label: 'Compact View',
    description: 'More workspace room',
  },
  {
    value: 'multiview',
    label: 'Multiview',
    description: 'Production dashboard',
  },
  {
    value: 'quad',
    label: 'Quad View',
    description: 'Coming soon',
    disabled: true,
  },
];

const isControlRoomViewMode = (value: string | null): value is ControlRoomViewMode =>
  value === 'dual' ||
  value === 'program' ||
  value === 'vertical' ||
  value === 'compact' ||
  value === 'multiview';

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':');
}

const operatorBadgeToneClasses = {
  live: 'border-red-400/40 bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.36)]',
  recording: 'border-red-400/45 bg-red-500/10 text-red-100',
  ready: 'border-emerald-400/35 bg-emerald-400/12 text-emerald-100',
  warning: 'border-amber-300/45 bg-amber-400/15 text-amber-100',
  error: 'border-red-300/50 bg-red-500/20 text-red-100',
  neutral: 'border-slate-600/70 bg-slate-900 text-slate-200',
};

function OperatorStatusBadge({
  label,
  tone = 'neutral',
  pulse = false,
}: {
  label: string;
  tone?: keyof typeof operatorBadgeToneClasses;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${operatorBadgeToneClasses[tone]}`}
    >
      {pulse ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> : null}
      {label}
    </span>
  );
}

function OperatorMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-white/10 bg-slate-950/80 px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-100">{value}</span>
    </span>
  );
}

const monitorDeckClasses: Record<ControlRoomViewMode, string> = {
  dual: 'grid min-h-0 gap-1 lg:grid-cols-[minmax(0,3fr)_minmax(13rem,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(14rem,1fr)]',
  program: 'grid min-h-0 gap-1 lg:grid-cols-[minmax(0,3.4fr)_minmax(12rem,0.9fr)]',
  vertical: 'grid min-h-0 gap-1 md:grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(13rem,1fr)]',
  compact: 'grid min-h-0 gap-1 md:grid-cols-[minmax(0,3fr)_minmax(12rem,1fr)]',
  multiview: 'grid min-h-0 gap-1.5',
};

function ViewModeSelector({
  selected,
  onSelect,
}: {
  selected: ControlRoomViewMode;
  onSelect: (mode: ControlRoomViewMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 px-1 py-1">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        View
      </span>
      <div className="flex flex-wrap gap-1">
        {viewModeOptions.map((option) => {
          const isSelected = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              aria-pressed={!option.disabled && isSelected}
              title={option.description}
              onClick={() => {
                if (!option.disabled && isControlRoomViewMode(option.value)) onSelect(option.value);
              }}
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                option.disabled
                  ? 'cursor-not-allowed text-slate-600'
                  : isSelected
                    ? 'bg-cyan-400/20 text-cyan-200'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SceneWorkspace({
  initialScenes,
  layouts,
  channels,
  assets,
  mediaRoutes = [],
  guests = [],
  initialProductionState,
  rightSidebar,
}: {
  initialScenes: Scene[];
  initialProductionState: ProductionSwitchingState;
  layouts: SceneLayout[];
  channels: AudioChannel[];
  assets: ProductionAsset[];
  mediaRoutes?: MediaRoute[];
  guests?: Guest[];
  rightSidebar?: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [workspace, setWorkspace] = useState<WorkspaceLayout>(factoryWorkspace);
  const viewMode = workspace.viewMode;
  const [scenes, setScenes] = useOptimistic(initialScenes, (_current, next: Scene[]) => next);
  const [productionState, setProductionState] = useState(initialProductionState);
  const [transitionActive, setTransitionActive] = useState(false);
  const [lastTransitionLabel, setLastTransitionLabel] = useState('None');
  const [switcherFeedback, setSwitcherFeedback] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(mediaRoutes[0]?.id ?? null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clock, setClock] = useState('00:00:00');

  useEffect(() => {
    const storedViewMode = window.localStorage.getItem(controlRoomViewStorageKey);
    const storedWorkspace = window.localStorage.getItem(workspaceStorageKey);
    if (storedWorkspace) {
      try {
        const parsed = JSON.parse(storedWorkspace) as WorkspaceLayout;
        if (parsed?.selectedPreset && parsed?.panelState && parsed?.sizes) {
          setWorkspace(normalizeWorkspaceLayout(parsed));
          return;
        }
      } catch {
        window.localStorage.removeItem(workspaceStorageKey);
      }
    }
    if (isControlRoomViewMode(storedViewMode))
      setWorkspace((current) => ({ ...current, viewMode: storedViewMode }));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    const startedAt = Date.now();
    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setClock(new Date().toLocaleTimeString([], { hour12: false }));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const selectViewMode = (mode: ControlRoomViewMode) => {
    setWorkspace((current) => ({ ...current, viewMode: mode }));
    window.localStorage.setItem(controlRoomViewStorageKey, mode);
  };

  const applyWorkspace = (next: WorkspaceLayout) => {
    setWorkspace(next);
    window.localStorage.setItem(controlRoomViewStorageKey, next.viewMode);
  };
  const saveWorkspace = () =>
    window.localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));
  const restoreWorkspace = () => {
    const storedWorkspace = window.localStorage.getItem(workspaceStorageKey);
    if (!storedWorkspace) return applyWorkspace(factoryWorkspace);
    try {
      applyWorkspace(
        normalizeWorkspaceLayout(JSON.parse(storedWorkspace) as Partial<WorkspaceLayout>),
      );
    } catch {
      applyWorkspace(factoryWorkspace);
    }
  };
  const applyPreset = (id: WorkspacePresetId) => applyWorkspace(workspacePresets[id]);
  const resetWorkspace = () => {
    window.localStorage.removeItem(workspaceStorageKey);
    applyWorkspace(factoryWorkspace);
  };
  const setPanelStatus = (panel: PanelId, status: PanelStatus) =>
    setWorkspace((current) => ({
      ...current,
      panelState: { ...current.panelState, [panel]: status },
    }));
  const resizeWorkspace = (key: keyof WorkspaceLayout['sizes'], value: number) =>
    setWorkspace((current) => ({ ...current, sizes: { ...current.sizes, [key]: value } }));
  const isPanelVisible = (panel: PanelId) => workspace.panelState[panel] !== 'hidden';
  const isPanelExpanded = (panel: PanelId) => workspace.panelState[panel] === 'expanded';

  const refresh = useCallback(
    (next: Scene[]) => startTransition(() => setScenes(next)),
    [startTransition, setScenes],
  );
  const sorted = useMemo(() => [...scenes].sort((a, b) => a.order - b.order), [scenes]);
  const programScene =
    sorted.find((scene) => scene.id === productionState.programSceneId) ??
    sorted.find((scene) => scene.isActive) ??
    sorted[0]!;
  const previewScene =
    sorted.find((scene) => scene.id === productionState.previewSceneId) ?? programScene;
  const activeScene = previewScene;
  const activeSceneTallyState = getTallyState({
    id: activeScene.id,
    programId: productionState.programSceneId,
    previewId: productionState.previewSceneId,
  });
  const programRoute = mediaRoutes.find((route) => route.isOnProgram);
  const layoutPreset =
    (programRoute?.metadata.layoutPreset as MediaLayoutPreset | undefined) ?? 'full_screen';
  const mediaExecutionEngine = useMemo(() => {
    const engine = new MediaExecutionEngine();
    engine.registerAdapter(new MockMediaExecutionAdapter({ latencyMs: 8 }), {
      id: 'mock-media-execution-adapter',
      name: 'Mock Media Execution Adapter',
      type: 'mock',
      capabilities: [
        'SWITCH_PROGRAM_SCENE',
        'UPDATE_PREVIEW_SCENE',
        'START_RECORDING',
        'STOP_RECORDING',
      ],
      isMock: true,
      isLive: false,
    });
    const webRTCAdapter = new WebRTCMediaExecutionAdapter();
    engine.registerAdapter(webRTCAdapter, createWebRTCAdapterMetadata(webRTCAdapter));
    engine.setExecutionRuntimeMode('mock_live');
    return engine;
  }, []);
  const productionGraphDispatcher = useMemo(
    () =>
      new LocalProductionCommandDispatcher(
        createBroadcastSession({
          id: programScene.broadcastId,
          name: 'Control Room Session',
          operatorId: 'local-director',
        }),
        mediaExecutionEngine,
      ),
    [programScene.broadcastId, mediaExecutionEngine],
  );
  const productionGraphSession = productionGraphDispatcher.getSession();
  const syncDiagnosticsEnabled = process.env.NEXT_PUBLIC_ENABLE_SYNC_DIAGNOSTICS === 'true';
  const realtimeSyncEnabled = isRealtimeSyncEnabled(process.env);
  const realtimeSyncUrl = process.env.NEXT_PUBLIC_UBOS_SYNC_URL;
  const authorityDiagnostics = useMemo(() => {
    const store = createMockAuthorityScenario(productionGraphSession.id);
    const state = store.getAuthorityState();
    return {
      scopes: Object.values(state.scopes),
      activeLocks: store.listActiveLocks(),
      expiredLocks: store.listLocks().filter((lock) => lock.status === 'expired'),
      conflicts: store.listConflicts(),
      decisions: store.listRecentDecisions(),
      canOverride: ['OWNER', 'ADMIN'].includes('DIRECTOR'),
    };
  }, [productionGraphSession.id]);
  const syncDiagnostics = useMemo(() => {
    const syncSession = createMockSyncScenario(
      createSyncSession({
        id: `sync:${productionGraphSession.id}`,
        broadcastSessionId: productionGraphSession.id,
        productionGraphId: productionGraphSession.graph.id,
        currentGraphRevision: productionGraphSession.graph.metadata.revision,
      }),
    );
    const clients = Object.values(syncSession.clients);
    return {
      session: syncSession,
      clients,
      staleClientIds: new Set(getStaleClients(syncSession).map((client) => client.clientId)),
      acceptedCommands: productionGraphSession.commandLog.length,
      rejectedCommands: productionGraphSession.eventLog.filter(
        (event) => event.type === 'COMMAND_REJECTED',
      ).length,
      catchUpRequiredCount: clients.filter((client) => client.recoveryState === 'catching_up')
        .length,
      lastSyncMessage:
        clients.find((client) => client.lastSyncMessage)?.lastSyncMessage ?? 'CLIENT_HEARTBEAT',
      transport: realtimeSyncEnabled ? 'websocket' : 'local',
      connectionState: realtimeSyncEnabled ? 'configured' : 'local-simulation',
      syncUrl: realtimeSyncUrl ?? 'not configured',
      connectedClientsCount: clients.filter((client) => client.connectionState === 'connected')
        .length,
      lastReceivedMessage:
        clients.find((client) => client.lastSyncMessage)?.lastSyncMessage ?? 'CLIENT_HEARTBEAT',
      lastSentMessage: 'CLIENT_HEARTBEAT',
      lastHeartbeatAt: clients.find((client) => client.lastHeartbeatAt)?.lastHeartbeatAt ?? '—',
      reconnectAttempts: 0,
    };
  }, [productionGraphSession, realtimeSyncEnabled, realtimeSyncUrl]);
  const dispatchProductionGraphCommand = useCallback(
    (type: ProductionCommandType, payload: Record<string, unknown> = {}) => {
      productionGraphDispatcher.dispatch({
        id: `ui-${type.toLowerCase()}-${Date.now()}`,
        type,
        broadcastSessionId: programScene.broadcastId,
        actorId: 'local-director',
        actorRole: 'DIRECTOR',
        timestamp: new Date().toISOString(),
        payload,
      });
    },
    [productionGraphDispatcher, programScene.broadcastId],
  );

  const persistProductionState = (
    next: ProductionSwitchingState,
    action: 'stage' | 'take' | 'cut' | 'fade',
  ) => {
    setProductionState(next);
    startTransition(async () => {
      await updateProductionState({ ...next, broadcastId: programScene.broadcastId, action });
    });
  };

  const stageScene = (sceneId: string) => {
    dispatchProductionGraphCommand('SET_PREVIEW_SCENE', { sceneId });
    persistProductionState({ ...productionState, previewSceneId: sceneId }, 'stage');
  };
  const switchProgram = (type: TransitionType) => {
    dispatchProductionGraphCommand(type === 'cut' ? 'CUT_TO_PROGRAM' : 'TAKE_PREVIEW', {
      sceneId: productionState.previewSceneId,
      transitionType: type,
    });
    const duration = type === 'cut' ? 0 : productionState.transitionDuration;
    const label =
      type === 'cut'
        ? 'Cut Executed'
        : type === 'fade'
          ? 'Fade Executed'
          : `${type.toUpperCase()} Executed`;
    setLastTransitionLabel(label);
    setSwitcherFeedback(type === 'cut' ? 'Cut Complete' : 'Transition Complete');
    window.setTimeout(() => setSwitcherFeedback(null), 1600);
    const next = {
      ...productionState,
      programSceneId: productionState.previewSceneId,
      transitionType: type,
      transitionDuration: duration,
    };
    if (type !== 'cut') {
      setTransitionActive(true);
      window.setTimeout(() => setTransitionActive(false), Math.max(duration, 250));
    }
    refresh(sorted.map((scene) => ({ ...scene, isActive: scene.id === next.programSceneId })));
    persistProductionState(next, type === 'fade' ? 'fade' : type === 'cut' ? 'cut' : 'take');
  };

  const stageAdjacentScene = (direction: 'previous' | 'next') => {
    const currentIndex = sorted.findIndex((scene) => scene.id === productionState.previewSceneId);
    if (currentIndex < 0 || sorted.length === 0) return;
    const offset = direction === 'previous' ? -1 : 1;
    const nextIndex = (currentIndex + offset + sorted.length) % sorted.length;
    const nextScene = sorted[nextIndex];
    if (nextScene) stageScene(nextScene.id);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        switchProgram(productionState.transitionType);
      }
      if (/^[1-9]$/.test(event.key)) {
        const scene = sorted[Number(event.key) - 1];
        if (scene) stageScene(scene.id);
      }
      if (event.key.toLowerCase() === 'c') switchProgram('cut');
      if (event.key.toLowerCase() === 'a') switchProgram('fade');
      if (event.key.toLowerCase() === 'f') switchProgram('fade');
      if (event.key.toLowerCase() === 'm' && selectedRouteId)
        startTransition(async () => {
          await setRouteMuted(selectedRouteId);
        });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [productionState, selectedRouteId, sorted]);

  const activeRouteCount = useMemo(
    () => mediaRoutes.filter((route) => route.isOnProgram || route.isActive).length,
    [mediaRoutes],
  );

  const multiviewActiveRouteCount = useMemo(
    () => mediaRoutes.filter((route) => route.isActive).length,
    [mediaRoutes],
  );

  const safeHealthMetrics = useMemo(() => {
    const visibleRoutes = activeRouteCount;
    return {
      fps: '60',
      cpu: `${Math.min(72, 18 + visibleRoutes * 4)}%`,
      dropped: '0',
      upload: `${(6.2 + visibleRoutes * 0.4).toFixed(1)} Mbps`,
    };
  }, [activeRouteCount]);

  const multiviewHealthMetrics = useMemo(
    () => [
      { id: 'cpu', label: 'CPU', value: safeHealthMetrics.cpu, status: 'good' as const },
      { id: 'fps', label: 'FPS', value: safeHealthMetrics.fps, status: 'good' as const },
      {
        id: 'dropped',
        label: 'Dropped Frames',
        value: safeHealthMetrics.dropped,
        status: 'good' as const,
      },
      { id: 'recording', label: 'Recording', value: 'UI', status: 'good' as const },
      { id: 'rtmp', label: 'RTMP', value: 'Ready', status: 'good' as const },
      {
        id: 'webrtc',
        label: 'WebRTC',
        value: `${multiviewActiveRouteCount} routes`,
        status: 'good' as const,
      },
    ],
    [multiviewActiveRouteCount, safeHealthMetrics],
  );

  const rightSidebarVisible =
    Boolean(rightSidebar) &&
    (isPanelVisible('guestManager') ||
      isPanelVisible('broadcastHealth') ||
      isPanelVisible('chat') ||
      isPanelVisible('outputs'));
  const workspaceColumns = rightSidebarVisible
    ? `minmax(13rem, ${workspace.sizes.left}px) minmax(${workspace.sizes.center}px, 1fr) minmax(16rem, ${workspace.sizes.right}px)`
    : `minmax(13rem, ${workspace.sizes.left}px) minmax(${workspace.sizes.center}px, 1fr)`;

  const updateActiveSources = (updater: (sources: SceneSource[]) => SceneSource[]) => {
    refresh(
      sorted.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, sources: updater([...scene.sources].sort((a, b) => a.order - b.order)) }
          : scene,
      ),
    );
  };

  return (
    <div
      className={rightSidebar ? 'grid min-h-0 gap-2 xl:h-full max-xl:grid-cols-1' : 'contents'}
      style={rightSidebar ? { gridTemplateColumns: workspaceColumns } : undefined}
    >
      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 max-xl:max-h-[34rem]">
        <div className="rounded-xl border border-white/10 bg-slate-900/75 p-2">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            Panel Visibility
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                'scenes',
                'sources',
                'guestManager',
                'programPreview',
                'audioMixer',
                'productionDock',
                'broadcastHealth',
                'chat',
                'outputs',
              ] as PanelId[]
            ).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() =>
                  setPanelStatus(
                    panel,
                    workspace.panelState[panel] === 'hidden'
                      ? 'expanded'
                      : workspace.panelState[panel] === 'collapsed'
                        ? 'hidden'
                        : 'collapsed',
                  )
                }
                className={`rounded px-2 py-1 text-left text-[10px] font-bold ${workspace.panelState[panel] === 'hidden' ? 'bg-slate-950 text-slate-500' : workspace.panelState[panel] === 'collapsed' ? 'bg-amber-400/10 text-amber-200' : 'bg-cyan-400/10 text-cyan-100'}`}
              >
                {panelLabels[panel]}
              </button>
            ))}
          </div>
        </div>
        {isPanelVisible('scenes') && isPanelExpanded('scenes') ? (
          <SceneList
            scenes={sorted}
            sceneTypes={sceneTypes}
            isPending={isPending}
            onAdd={(data) => {
              const tempScene: Scene = {
                ...activeScene,
                id: `temp-${Date.now()}`,
                name: data.name,
                type: data.type,
                order: sorted.length,
                isActive: false,
                sources: [],
                overlays: [],
                audioConfig: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              refresh([...sorted, tempScene]);
              const formData = new FormData();
              formData.set('broadcastId', activeScene.broadcastId);
              formData.set('name', data.name);
              formData.set('type', data.type);
              startTransition(async () => {
                await addScene(formData);
              });
            }}
            onRename={(sceneId, name) => {
              const formData = new FormData();
              formData.set('sceneId', sceneId);
              formData.set('name', name);
              refresh(sorted.map((scene) => (scene.id === sceneId ? { ...scene, name } : scene)));
              startTransition(async () => {
                await renameScene(formData);
              });
            }}
            previewSceneId={productionState.previewSceneId}
            programSceneId={productionState.programSceneId}
            onSwitch={(sceneId) => {
              stageScene(sceneId);
            }}
            onDuplicate={(sceneId) => {
              const original = sorted.find((scene) => scene.id === sceneId);
              if (original)
                refresh([
                  ...sorted,
                  {
                    ...original,
                    id: `temp-${Date.now()}`,
                    name: `${original.name} Copy`,
                    isActive: false,
                    order: sorted.length,
                  },
                ]);
              startTransition(async () => {
                await duplicateScene(sceneId);
              });
            }}
            onDelete={(sceneId) => {
              const next = sorted
                .filter((scene) => scene.id !== sceneId)
                .map((scene, index) => ({ ...scene, order: index }));
              refresh(
                next.some((scene) => scene.isActive)
                  ? next
                  : next.map((scene, index) => ({ ...scene, isActive: index === 0 })),
              );
              startTransition(async () => {
                await deleteScene(sceneId);
              });
            }}
            onMove={(sceneId, direction) => {
              const index = sorted.findIndex((scene) => scene.id === sceneId);
              const swapIndex = direction === 'up' ? index - 1 : index + 1;
              if (index >= 0 && swapIndex >= 0 && swapIndex < sorted.length) {
                const next = [...sorted];
                [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
                refresh(next.map((scene, order) => ({ ...scene, order })));
              }
              startTransition(async () => {
                await moveScene(sceneId, direction);
              });
            }}
          />
        ) : null}
        {isPanelVisible('sources') && isPanelExpanded('sources') ? (
          <SourceManager
            scene={activeScene}
            sourceTypes={sourceTypes}
            isPending={isPending}
            tallyState={activeSceneTallyState}
            onAdd={(input) => {
              const tempSource: SceneSource = {
                id: `temp-${Date.now()}`,
                sceneId: input.sceneId,
                broadcastId: activeScene.broadcastId,
                name: input.name,
                label: input.name,
                type: input.type,
                order: activeScene.sources.length,
                visible: true,
                isVisible: true,
                isLocked: false,
                settings: {},
                transform: {},
              };
              updateActiveSources((sources) => [...sources, tempSource]);
              const formData = new FormData();
              formData.set('sceneId', input.sceneId);
              formData.set('name', input.name);
              formData.set('type', input.type);
              startTransition(async () => {
                await addSource(formData);
              });
            }}
            onRename={(sourceId, name) => {
              updateActiveSources((sources) =>
                sources.map((source) =>
                  source.id === sourceId ? { ...source, name, label: name } : source,
                ),
              );
              const formData = new FormData();
              formData.set('sourceId', sourceId);
              formData.set('name', name);
              startTransition(async () => {
                await renameSource(formData);
              });
            }}
            onDuplicate={(sourceId) => {
              updateActiveSources((sources) => {
                const source = sources.find((item) => item.id === sourceId);
                return source
                  ? [
                      ...sources,
                      {
                        ...source,
                        id: `temp-${Date.now()}`,
                        name: `${source.name} Copy`,
                        label: `${source.name} Copy`,
                        order: sources.length,
                      },
                    ]
                  : sources;
              });
              startTransition(async () => {
                await duplicateSource(sourceId);
              });
            }}
            onDelete={(sourceId) => {
              updateActiveSources((sources) =>
                sources
                  .filter((source) => source.id !== sourceId)
                  .map((source, order) => ({ ...source, order })),
              );
              startTransition(async () => {
                await deleteSource(sourceId);
              });
            }}
            onMove={(sourceId, direction) => {
              updateActiveSources((sources) => {
                const index = sources.findIndex((source) => source.id === sourceId);
                const swapIndex = direction === 'up' ? index - 1 : index + 1;
                if (index < 0 || swapIndex < 0 || swapIndex >= sources.length) return sources;
                const next = [...sources];
                [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
                return next.map((source, order) => ({ ...source, order }));
              });
              startTransition(async () => {
                await moveSource(sourceId, direction);
              });
            }}
            onToggleVisibility={(sourceId) => {
              updateActiveSources((sources) =>
                sources.map((source) =>
                  source.id === sourceId
                    ? { ...source, isVisible: !source.isVisible, visible: !source.isVisible }
                    : source,
                ),
              );
              startTransition(async () => {
                await toggleSourceVisibility(sourceId);
              });
            }}
            onToggleLock={(sourceId) => {
              updateActiveSources((sources) =>
                sources.map((source) =>
                  source.id === sourceId ? { ...source, isLocked: !source.isLocked } : source,
                ),
              );
              startTransition(async () => {
                await toggleSourceLock(sourceId);
              });
            }}
          />
        ) : null}
        {isPanelVisible('sources') && isPanelExpanded('sources') ? (
          <LayoutSelector layouts={layouts} />
        ) : null}
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 text-sm text-slate-300">
          <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">
            Assets Library
          </button>
          <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">
            Overlay Controls
          </button>
        </div>
        <input
          aria-label="Left sidebar width"
          className="w-full accent-cyan-300"
          type="range"
          min={208}
          max={360}
          value={workspace.sizes.left}
          onChange={(e) => resizeWorkspace('left', Number(e.target.value))}
        />
      </aside>
      <section className="flex min-h-0 flex-col gap-1 overflow-hidden">
        <div className="shrink-0 border-b border-white/10 bg-slate-950/95 px-2 py-1 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex min-h-8 items-center gap-1 overflow-x-auto whitespace-nowrap">
            <span className="hidden max-w-[10rem] truncate text-xs font-bold text-white md:inline">
              Launch Day
            </span>
            <div className="flex items-center gap-1 rounded-md border border-white/5 bg-black/20 p-0.5">
              <OperatorStatusBadge label="LIVE" tone="live" pulse />
              <OperatorStatusBadge label="REC" tone="recording" pulse />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-white/5 bg-black/20 p-0.5">
              <OperatorMetric label="RUN" value={formatElapsed(elapsedSeconds)} />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-white/5 bg-black/20 p-0.5">
              <OperatorStatusBadge
                label={transitionActive ? 'WARN Transition' : 'READY'}
                tone={transitionActive ? 'warning' : 'ready'}
              />
            </div>
            <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/10 sm:inline" />
            <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/10 md:inline" />
            <div className="hidden items-center gap-1 rounded-md border border-white/5 bg-black/20 p-0.5 lg:flex">
              <OperatorMetric label="FPS" value={safeHealthMetrics.fps} />
              <OperatorMetric label="CPU" value={safeHealthMetrics.cpu} />
              <OperatorMetric label="DROP" value={safeHealthMetrics.dropped} />
              <OperatorMetric label="UP" value={safeHealthMetrics.upload} />
            </div>
            <details className="group relative lg:hidden">
              <summary className="flex h-6 cursor-pointer list-none items-center rounded-md border border-white/10 bg-slate-950/80 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-slate-200">
                Health
              </summary>
              <div className="absolute right-0 z-20 mt-1 grid min-w-36 gap-1 rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
                <OperatorMetric label="FPS" value={safeHealthMetrics.fps} />
                <OperatorMetric label="CPU" value={safeHealthMetrics.cpu} />
                <OperatorMetric label="DROP" value={safeHealthMetrics.dropped} />
                <OperatorMetric label="UP" value={safeHealthMetrics.upload} />
              </div>
            </details>
            <span className="ml-auto hidden font-mono text-[10px] text-slate-500 xl:inline">
              {clock} · PGM {programScene.name} · PVW {previewScene.name}
            </span>
            <details className="group relative">
              <summary className="flex h-6 cursor-pointer list-none items-center rounded-md border border-cyan-400/20 bg-slate-900 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100 hover:bg-slate-800">
                Workspace
              </summary>
              <div className="absolute right-0 z-30 mt-1 grid min-w-48 gap-1 rounded-xl border border-white/10 bg-slate-950 p-2 text-[10px] text-slate-300 shadow-2xl">
                {Object.values(workspacePresets).map((preset) => (
                  <button
                    key={preset.id}
                    className="rounded px-2 py-1 text-left hover:bg-slate-800"
                    onClick={() => applyPreset(preset.id)}
                  >
                    {preset.label}
                    <span className="block text-[9px] text-slate-500">{preset.description}</span>
                  </button>
                ))}
                <div className="border-t border-white/10 pt-1">
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-slate-800"
                    onClick={saveWorkspace}
                  >
                    Save Current
                  </button>
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-slate-800"
                    onClick={restoreWorkspace}
                  >
                    Restore Last Workspace
                  </button>
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-slate-800"
                    onClick={resetWorkspace}
                  >
                    Reset Workspace
                  </button>
                </div>
              </div>
            </details>
            <details className="group relative">
              <summary className="flex h-6 cursor-pointer list-none items-center rounded-md border border-white/10 bg-slate-900 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300 hover:bg-slate-800">
                Tools
              </summary>
              <div className="absolute right-0 z-20 mt-1 grid min-w-40 gap-1 rounded-xl border border-white/10 bg-slate-950 p-2 text-[10px] text-slate-300 shadow-2xl">
                <button
                  className="rounded px-2 py-1 text-left hover:bg-slate-800"
                  onClick={() => startTransition(async () => seedDemoProductionState())}
                >
                  Seed demo
                </button>
                <button
                  className="rounded px-2 py-1 text-left hover:bg-slate-800"
                  onClick={() => startTransition(async () => simulateDemoProduction())}
                >
                  Simulate
                </button>
                <button
                  className="rounded px-2 py-1 text-left hover:bg-slate-800"
                  onClick={() => startTransition(async () => resetDemoProductionState())}
                >
                  Reset
                </button>
                {syncDiagnosticsEnabled ? (
                  <details className="rounded border border-amber-400/20 bg-amber-400/5 p-2">
                    <summary className="cursor-pointer font-bold text-amber-100">
                      Authority diagnostics
                    </summary>
                    <div className="mt-2 space-y-2 font-mono text-[9px] text-slate-400">
                      <div>
                        scopes {authorityDiagnostics.scopes.length} · active locks{' '}
                        {authorityDiagnostics.activeLocks.length} · expired{' '}
                        {authorityDiagnostics.expiredLocks.length}
                      </div>
                      <div>
                        conflicts {authorityDiagnostics.conflicts.length} · recent decisions{' '}
                        {authorityDiagnostics.decisions.length} · director override{' '}
                        {authorityDiagnostics.canOverride ? 'yes' : 'no'}
                      </div>
                      <div className="grid gap-1">
                        {authorityDiagnostics.scopes
                          .filter((node) => node.owner)
                          .slice(0, 6)
                          .map((node) => (
                            <div key={node.scope} className="rounded bg-slate-900 p-1">
                              {node.scope} → {node.owner?.displayName ?? node.owner?.operatorId} (
                              {node.owner?.role})
                            </div>
                          ))}
                      </div>
                      {[
                        ...authorityDiagnostics.activeLocks,
                        ...authorityDiagnostics.expiredLocks,
                      ].map((lock) => (
                        <div key={lock.id} className="rounded bg-slate-900 p-1">
                          {lock.scope} lock · {lock.ownerOperatorId} · {lock.status} · expires{' '}
                          {lock.expiresAt}
                        </div>
                      ))}
                      {authorityDiagnostics.conflicts.map((conflict) => (
                        <div key={conflict.id} className="rounded bg-slate-900 p-1 text-rose-200">
                          {conflict.type} · {conflict.scope} · {conflict.message}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
                {syncDiagnosticsEnabled ? (
                  <details className="rounded border border-cyan-400/20 bg-cyan-400/5 p-2">
                    <summary className="cursor-pointer font-bold text-cyan-100">
                      Sync diagnostics
                    </summary>
                    <div className="mt-2 space-y-2 font-mono text-[9px] text-slate-400">
                      <div>
                        transport {syncDiagnostics.transport} · state{' '}
                        {syncDiagnostics.connectionState}
                      </div>
                      <div>sync URL {syncDiagnostics.syncUrl}</div>
                      <div>
                        clients {syncDiagnostics.connectedClientsCount} · reconnects{' '}
                        {syncDiagnostics.reconnectAttempts}
                      </div>
                      <div>
                        last rx {syncDiagnostics.lastReceivedMessage} · last tx{' '}
                        {syncDiagnostics.lastSentMessage}
                      </div>
                      <div>heartbeat {syncDiagnostics.lastHeartbeatAt}</div>
                      <div>session {syncDiagnostics.session.id}</div>
                      <div>
                        revision {syncDiagnostics.session.currentGraphRevision} · last{' '}
                        {syncDiagnostics.lastSyncMessage}
                      </div>
                      <div>
                        accepted {syncDiagnostics.acceptedCommands} · rejected{' '}
                        {syncDiagnostics.rejectedCommands} · catch-up{' '}
                        {syncDiagnostics.catchUpRequiredCount}
                      </div>
                      <div className="space-y-1">
                        {syncDiagnostics.clients.map((client) => (
                          <div key={client.clientId} className="rounded bg-slate-900 p-1">
                            <span className="text-slate-200">{client.displayName}</span> rev{' '}
                            {client.observedGraphRevision} lag {client.revisionLag} ·{' '}
                            {syncDiagnostics.staleClientIds.has(client.clientId)
                              ? 'stale'
                              : client.connectionState}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ) : null}
                <div className="border-t border-white/10 pt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-slate-500">
                  Space Take · C Cut · A Auto/F Fade · 1-9 PVW · M Mute selected route
                </div>
              </div>
            </details>
            <button className="h-6 rounded bg-rose-600/90 px-2 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-rose-500">
              Stop
            </button>
          </div>
        </div>
        <div className="shrink-0">
          <ViewModeSelector selected={viewMode} onSelect={selectViewMode} />
          <label className="flex items-center gap-2 border-b border-white/5 px-1 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Center
            <input
              aria-label="Center workspace minimum width"
              className="min-w-40 flex-1 accent-cyan-300"
              type="range"
              min={520}
              max={1040}
              value={workspace.sizes.center}
              onChange={(e) => resizeWorkspace('center', Number(e.target.value))}
            />
          </label>
        </div>
        <ProductionSwitcher
          productionState={productionState}
          programSceneName={programScene.name}
          previewSceneName={previewScene.name}
          lastTransitionLabel={lastTransitionLabel}
          feedbackLabel={switcherFeedback}
          onTake={() => switchProgram(productionState.transitionType)}
          onCut={() => switchProgram('cut')}
          onAuto={() => switchProgram('fade')}
          onPrevious={() => stageAdjacentScene('previous')}
          onNext={() => stageAdjacentScene('next')}
          onTransitionChange={(transitionType) => {
            dispatchProductionGraphCommand('SET_TRANSITION', { transitionType });
            persistProductionState({ ...productionState, transitionType }, 'stage');
          }}
          onDurationChange={(transitionDuration) => {
            dispatchProductionGraphCommand('SET_TRANSITION_DURATION', {
              durationMs: transitionDuration,
            });
            persistProductionState({ ...productionState, transitionDuration }, 'stage');
          }}
        />
        <ProductionGraphInspector session={productionGraphSession} />
        <MediaExecutionInspector
          engine={mediaExecutionEngine}
          graph={productionGraphSession.graph}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {viewMode === 'multiview' ? (
            <ProductionMultiview
              programScene={programScene}
              previewScene={previewScene}
              routes={mediaRoutes}
              layoutPreset={layoutPreset}
              channels={channels}
              healthMetrics={multiviewHealthMetrics}
              guests={guests}
              preset="broadcast"
            />
          ) : (
            <div className={`min-h-0 flex-1 ${monitorDeckClasses[viewMode]}`}>
              <div className="flex min-h-0 min-w-0 flex-col">
                <ProgramPreview
                  scene={programScene}
                  routes={mediaRoutes}
                  layoutPreset={layoutPreset}
                  guests={guests}
                />
              </div>
              <div className="flex min-h-0 min-w-0 flex-col">
                <PreviewMonitor
                  scene={previewScene}
                  routes={mediaRoutes}
                  layoutPreset={layoutPreset}
                  guests={guests}
                />
              </div>
            </div>
          )}
        </div>
        {isPanelVisible('productionDock') ? (
          <div className="shrink-0 overflow-y-auto" style={{ maxHeight: workspace.sizes.dock }}>
            {isPanelExpanded('productionDock') ? (
              <ProductionDock channels={channels} assets={assets} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-900/75 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Production Dock collapsed
              </div>
            )}
          </div>
        ) : null}
        <input
          aria-label="Production dock height"
          className="w-full accent-cyan-300"
          type="range"
          min={96}
          max={280}
          value={workspace.sizes.dock}
          onChange={(e) => resizeWorkspace('dock', Number(e.target.value))}
        />
      </section>
      {rightSidebarVisible ? (
        <aside className="min-h-0 overflow-y-auto pr-1 max-xl:max-h-[42rem]">
          <input
            aria-label="Right sidebar width"
            className="mb-2 w-full accent-cyan-300"
            type="range"
            min={256}
            max={520}
            value={workspace.sizes.right}
            onChange={(e) => resizeWorkspace('right', Number(e.target.value))}
          />
          {rightSidebar}
        </aside>
      ) : null}
    </div>
  );
}
