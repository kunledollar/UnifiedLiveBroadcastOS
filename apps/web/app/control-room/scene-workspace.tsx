'use client';

import { cn, getTallyState } from '@ubos/ui';
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
  createAudioRoutePlan,
  createAudioRouteGraph,
  validateAudioRoutePlan,
  type ExecutionRuntimeMode,
  BrowserMediaRenderer,
  BrowserRendererAdapter,
  createBrowserRendererAdapterMetadata,
  isBrowserRendererEnabled,
  createClock,
  MediaSyncStore,
  SyncDriftMonitor,
  isMediaSyncEnabled,
  createStreamingPlan,
  prepareStreaming,
  connectStreaming,
  startStreaming,
  summarizeStreamingHealth,
  createMultiviewPlan,
  summarizeMultiviewHealth,
  createConfidenceMonitor,
  summarizeConfidenceStatus,
  createEncoderPlan,
  prepareEncoder,
  startEncoder,
  summarizeEncoderHealth,
  createFFmpegStreamingPlan,
  FFmpegStreamingRuntime,
  RuntimeSupervisor,
  summarizeProductionRuntimeHealth,
  HardwareRuntime,
  isHardwareRuntimeEnabled,
  ProductionEngine,
  isProductionEngineEnabled,
} from '@ubos/media-plane';
import {
  SceneType,
  type AudioChannel,
  type ChatMessage,
  type Destination,
  type Guest,
  type GuestInvite,
  type ProductionAsset,
  type Scene,
  type SceneLayout,
  type SceneSource,
  type SceneSourceType,
  type MediaRoute,
  type MediaLayoutPreset,
  type ProductionSwitchingState,
  type StreamHealthMetric,
  AutoCommand,
  CutCommand,
  PreviewCommand,
  ProgramCommand,
  ProductionRuntime,
  type TransitionType,
  LocalProductionCommandDispatcher,
  createBroadcastSession,
  createInitialProductionGraph,
  selectBroadcastStatus,
  selectHealthSummary,
  selectRecordingState,
  selectAudioChannels,
  type ProductionCommandType,
  type ProductionBroadcastSession,
  type SceneNode,
  type SourceNode,
  createProductionPipelineModel,
  createMockSyncScenario,
  createSyncSession,
  getStaleClients,
  isRealtimeSyncEnabled,
  createMockAuthorityScenario,
} from '@ubos/shared';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useMediaCapture } from '../../lib/media/use-media-capture';
import {
  addScene,
  addSource,
  deleteScene,
  deleteSource,
  duplicateScene,
  duplicateSource,
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
import {
  type MonitorStatusInfo,
  SourceDockPanel,
  preferredSourceDockTab,
} from './broadcast-command-center';
import { CommandCenterShell } from './command-center';
import { DiagnosticsSummary } from './broadcast-command-center/FloatingDiagnosticsPanel';
import type { OperationsDockSection } from './broadcast-command-center/RightOperationsDock';
import type { OperationsInspectorSelection } from './operations/operations-inspector-selection';
import {
  ProductionGraphTreeSummary,
  RoutingPatchMatrix,
  SystemStatusWorkspace,
  buildSystemStatusMetrics,
  normalizeDockTabId,
} from './broadcast-workspaces';
import {
  type RoutingMatrixEdge,
  type DiagnosticMetric,
} from './workspace-canvas';
import { ProfessionalSwitcher } from './switcher';
import { BroadcastStatusBar } from './shell/BroadcastStatusBar';
import {
  statusBarHeightForLayout,
  switcherHeightForLayout,
} from './shell/control-room-layout';
import { DockPanelEmpty, ProfessionalAudioMixer } from './audio-console';
import { OperationsConsoleContent } from './operations';
import { LogsPanel } from './operations/LogsPanel';
import { RoutingPanel } from './operations/RoutingPanel';
import type { BrowserRecordingPanelState } from './operations/RecordingRuntimePanel';
import type {
  BrowserStreamingPanelState,
  StreamingPanelAction,
} from './operations/StreamingRuntimePanel';
import type { DockTabId, NavItemId, OperationsTabId, SourceDockTabId } from './shell/types';
import {
  applyWorkspaceProfile,
  defaultSafeAreaToggles,
  defaultWorkspaceId,
  normalizeWorkspaceId,
  workspaceProfiles,
  type LayoutFocusMode,
  type ProfessionalWorkspaceId,
  type SafeAreaToggles,
} from './workspaces';
import { ubosWorkspaceModes, type UbosWorkspaceModeId } from './menu';
import { PreviewMonitorCompact, ProgramMonitor } from './workspace/OutputViewRenderer';
import {
  deriveMonitorTelemetry,
  normalizeOutputViewMode,
  outputViewModes,
  type OutputViewMode,
} from './workspace/monitor-state';
import {
  GraphicsLayerStack,
  GraphicsPreviewControls,
  GraphicsWorkspace,
  createBuiltInLowerThirdTemplates,
  createDefaultLowerThirdTemplate,
  ensureSceneComposition,
  graphicsCompositionReducer,
  initialGraphicsCompositionState,
} from './graphics';
import {
  ClipBrowser,
  MediaBin,
  MediaPreviewControls,
  MediaWorkspace,
  PlaylistManager,
  ReplayWorkspace,
  ensureSceneMediaComposition,
  getPreviewMediaOverlayItems,
  getProgramMediaOverlayItems,
  initialMediaCompositionState,
  mediaCompositionReducer,
  productionAssetToMediaAsset,
} from './media';
import {
  CollaborationWorkspace,
  TeamPanel,
  buildRemoteProductionState,
  collaborationReducer,
  conflictsToEvents,
  createLocalOperatorPresence,
  initialCollaborationState,
  isCollaborationDemoEnabled,
  mapAuthorityLockToProductionLock,
  mapCollaborationOperatorToPresence,
} from './collaboration';
import { createMockCollaborationOperators, createDefaultRunOfShow } from '@ubos/shared';
import {
  createDefaultAIAssistantState,
  createSampleAIRecommendations,
  createSampleAIRiskSignals,
} from '@ubos/shared';
import type { LowerThirdTemplate } from '@ubos/shared';
import {
  AutomationPanel,
  AutomationWorkspace,
  automationModeLabel,
  automationReducer,
  createInitialAutomationState,
  createSampleMacros,
  enrichRunOfShowWithSampleCues,
  getCurrentSegment,
  getNextSegment,
} from './automation';
import {
  AIAssistantWorkspace,
  aiReducer,
  aiStatusLabel,
  createInitialAIState,
  getProductionSummaryLines,
  getSuggestedRecommendations,
} from './ai';
import {
  DistributionWorkspace,
  createInitialDistributionState,
  distributionReducer,
  outputHealthSummaryLabel,
} from './distribution';
import {
  createDistributionManifest,
  createSampleOutputHealth,
  createDeviceManifest,
} from '@ubos/shared';
import {
  DeviceManagerWorkspace,
  createInitialDeviceState,
  deviceHealthSummaryLabel,
  deviceReducer,
} from './devices';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function warnMediaDiagnostic(
  message: string,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  if (isAbortError(error)) {
    return;
  }
  console.warn(`[UBOS media runtime] ${message}`, { ...details, error });
}

function describeCaptureError(error: unknown): string {
  if (error instanceof DOMException) return `${error.name}: ${error.message}`;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

function getFirstVisibleLiveVideoSource(scene: Scene): SceneSource | null {
  return (
    scene.sources.find(
      (source) => (source.type === 'camera' || source.type === 'screen') && source.isVisible,
    ) ?? null
  );
}

function getPrimarySourceName(scene: Scene): string {
  const visible = scene.sources.find((source) => source.isVisible);
  return visible?.name ?? scene.name;
}

function isLiveMediaStream(stream: MediaStream | null | undefined): stream is MediaStream {
  return Boolean(
    stream?.active && stream.getVideoTracks().some((track) => track.readyState === 'live'),
  );
}

const SMOKE_CAMERA_SOURCE_ID = 'ubos-smoke-camera';

function findFirstLiveVideoStream(streams: Record<string, MediaStream>): MediaStream | null {
  for (const stream of Object.values(streams)) {
    if (isLiveMediaStream(stream)) return stream;
  }
  return null;
}

function findSourceName(
  sourceId: string,
  scenes: Scene[],
): string | undefined {
  for (const scene of scenes) {
    const source = scene.sources.find((item) => item.id === sourceId);
    if (source) return source.name;
  }
  return undefined;
}

function toMixerSourceType(
  type: string | undefined,
): 'camera' | 'screen' | 'media' | 'browser' | 'guest' | 'master' {
  if (
    type === 'screen' ||
    type === 'media' ||
    type === 'browser' ||
    type === 'guest' ||
    type === 'master'
  ) {
    return type;
  }
  return 'camera';
}

function pauseVideoSafely(video: HTMLVideoElement, details?: Record<string, unknown>): void {
  try {
    video.pause();
  } catch (error) {
    warnMediaDiagnostic('video pause failed', error, details);
  }
}

function exitPictureInPictureSafely(details?: Record<string, unknown>): void {
  if (typeof document === 'undefined' || !document.pictureInPictureElement) {
    return;
  }

  try {
    void document.exitPictureInPicture().catch((error) => {
      warnMediaDiagnostic('picture-in-picture exit failed', error, details);
    });
  } catch (error) {
    warnMediaDiagnostic('picture-in-picture exit failed', error, details);
  }
}

function configureInlineVideoPlayback(video: HTMLVideoElement, muted: boolean): void {
  video.disablePictureInPicture = true;
  video.playsInline = true;
  video.muted = muted;
  video.autoplay = true;
}

function assignVideoStreamSafely(
  video: HTMLVideoElement,
  stream: MediaStream | null,
  details?: Record<string, unknown>,
): void {
  try {
    if (stream) {
      exitPictureInPictureSafely(details);
    }
    video.srcObject = stream;
  } catch (error) {
    warnMediaDiagnostic(
      stream ? 'video stream attach failed' : 'video stream cleanup failed',
      error,
      details,
    );
  }
}

function playVideoSafely(
  video: HTMLVideoElement,
  details?: Record<string, unknown>,
  onStarted?: () => void,
  onFailed?: (reason: string) => void,
): void {
  try {
    const playPromise = video.play();
    if (playPromise) {
      void playPromise
        .then(() => {
          onStarted?.();
        })
        .catch((error) => {
          const reason = describeCaptureError(error);
          warnMediaDiagnostic('video play failed', error, details);
          onFailed?.(reason);
        });
      return;
    }
    onStarted?.();
  } catch (error) {
    const reason = describeCaptureError(error);
    warnMediaDiagnostic('video play failed', error, details);
    onFailed?.(reason);
  }
}

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
    const video = videoRef.current;
    if (!video) return;
    const details = { target: label, streamId: stream?.id, active: stream?.active };
    configureInlineVideoPlayback(video, muted);
    pauseVideoSafely(video, details);
    if (stream) {
      video.onloadedmetadata = () => playVideoSafely(video, details);
    }
    assignVideoStreamSafely(video, stream ?? null, details);
    return () => {
      video.onloadedmetadata = null;
      pauseVideoSafely(video, { ...details, cleanup: true });
      assignVideoStreamSafely(video, null, { ...details, cleanup: true });
    };
  }, [label, muted, stream]);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-black/40">
      <video
        ref={videoRef}
        autoPlay
        disablePictureInPicture
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

function LiveMediaMonitor({
  title,
  sceneName,
  stream,
  active,
  role,
  sourceId,
  sourceType,
  deckMode = false,
}: {
  title: string;
  sceneName: string;
  stream: MediaStream | null;
  active: boolean;
  role: 'program' | 'preview';
  sourceId?: string | null;
  sourceType?: SceneSourceType | null | undefined;
  deckMode?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextStream = active ? stream : null;
    const details = {
      target: role,
      sourceId,
      streamId: nextStream?.id,
      active: nextStream?.active,
    };
    configureInlineVideoPlayback(video, role === 'preview');
    pauseVideoSafely(video, details);
    if (nextStream) {
      video.onloadedmetadata = () => playVideoSafely(video, details);
    }
    assignVideoStreamSafely(video, nextStream, details);
    return () => {
      video.onloadedmetadata = null;
      const cleanupDetails = { ...details, cleanup: true };
      pauseVideoSafely(video, cleanupDetails);
      assignVideoStreamSafely(video, null, cleanupDetails);
    };
  }, [active, role, sourceId, stream]);
  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 flex-col overflow-hidden bg-black',
        !deckMode &&
          `rounded-xl border ${role === 'program' ? 'border-red-500/50' : 'border-emerald-400/50'}`,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        disablePictureInPicture
        playsInline
        muted={role === 'preview'}
        className="absolute inset-0 z-[1] h-full w-full object-contain"
      />
      {!active ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center text-xs uppercase tracking-[0.18em] text-slate-500">
          Add/start a camera source to see live video here.
        </div>
      ) : null}
      {!deckMode ? (
        <div className="relative z-30 mt-auto flex items-center justify-between border-t border-white/10 bg-black/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em]">
          <span className={role === 'program' ? 'text-red-200' : 'text-emerald-100'}>{title}</span>
          {sourceType === 'screen' ? (
            <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-100">SCREEN LIVE</span>
          ) : sourceType === 'camera' ? (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-100">
              CAMERA LIVE
            </span>
          ) : null}
          <span className="text-slate-300">{sceneName}</span>
        </div>
      ) : null}
    </div>
  );
}

function SmokeCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-ubos-sm bg-ubos-midnight px-2 py-1 text-ubos-caption">
      <span className="text-ubos-fg-secondary">{label}</span>
      <span className={ok ? 'text-emerald-300' : 'text-amber-300'}>{ok ? 'PASS' : 'TODO'}</span>
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
  const browserRendererFlagEnabled = isBrowserRendererEnabled(process.env);
  const mediaSyncEnabled = isMediaSyncEnabled(process.env);
  const mediaClock = useMemo(() => createClock({ frameRate: 30 }), []);
  const mediaSyncStore = useMemo(() => new MediaSyncStore(mediaClock), [mediaClock]);
  const driftMonitor = useMemo(() => new SyncDriftMonitor(undefined, 20), []);
  const browserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const browserRenderer = useMemo(
    () => new BrowserMediaRenderer({ target: 'debug_composition_preview', debug: true }),
    [],
  );
  const [browserDebug, setBrowserDebug] = useState(true);
  const webRTCAdapter = engine.getRegisteredAdapter('webrtc-media-execution-adapter');
  const webRTC = webRTCAdapter instanceof WebRTCMediaExecutionAdapter ? webRTCAdapter : undefined;
  const webRTCDiagnostics = webRTC?.getDiagnostics();
  const state = engine.getExecutionState();
  const productionRuntime = useMemo(() => {
    const supervisor = new RuntimeSupervisor();
    const base = {
      required: false,
      state: 'ready' as const,
      health: 'healthy' as const,
      degradedModes: [],
      diagnostics: {},
    };
    supervisor.register({
      ...base,
      id: 'recording-runtime',
      type: 'recording',
      label: 'Recording Runtime',
      health: graph.recording.status === 'recording' ? 'healthy' : 'degraded',
      degradedModes: graph.recording.status === 'recording' ? [] : ['diagnostics_only_mode'],
    });
    supervisor.register({
      ...base,
      id: 'streaming-runtime',
      type: 'streaming',
      label: 'Streaming Runtime',
      health: Object.values(graph.destinations).some((destination) => destination.enabled)
        ? 'healthy'
        : 'degraded',
      degradedModes: Object.values(graph.destinations).some((destination) => destination.enabled)
        ? []
        : ['output_disabled_mode'],
    });
    supervisor.register({
      ...base,
      id: 'encoder-runtime',
      type: 'encoder',
      label: 'Encoder Layer',
    });
    supervisor.register({ ...base, id: 'ffmpeg-runtime', type: 'ffmpeg', label: 'FFmpeg Runtime' });
    supervisor.register({ ...base, id: 'webrtc-runtime', type: 'webrtc', label: 'WebRTC Runtime' });
    supervisor.register({
      ...base,
      id: 'browser-renderer-runtime',
      type: 'browser_renderer',
      label: 'Browser Renderer Runtime',
    });
    supervisor.register({ ...base, id: 'gpu-runtime', type: 'gpu', label: 'GPU Runtime' });
    supervisor.register({ ...base, id: 'output-runtime', type: 'output', label: 'Output Engine' });
    supervisor.start();
    return supervisor.getRuntime();
  }, [graph]);
  const productionRuntimeHealth = summarizeProductionRuntimeHealth(productionRuntime);
  const hardwareRuntime = useMemo(() => new HardwareRuntime(process.env), []);
  const hardwareDashboard = useMemo(() => hardwareRuntime.manifest(), [hardwareRuntime]);
  const hardwareEnabled = isHardwareRuntimeEnabled(process.env);
  const productionEngineEnabled = isProductionEngineEnabled(process.env);
  const productionEngineDashboard = useMemo(() => {
    const engine = new ProductionEngine(process.env);
    engine.scheduleFrame(100);
    return engine.dashboard();
  }, [state.currentGraphRevision]);
  const orchestration = state.orchestrationDiagnostics;
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
  useEffect(() => {
    if (!browserRendererFlagEnabled || !browserCanvasRef.current) return;
    browserRenderer.setCanvas(browserCanvasRef.current);
    browserRenderer.setDebug(browserDebug);
    if (programComposition) browserRenderer.setComposition(programComposition);
  }, [browserRendererFlagEnabled, browserDebug, browserRenderer, programComposition]);
  const browserHealth = browserRenderer.getHealth();
  const browserDiagnostics = browserRenderer.getRendererDiagnostics();
  const syncState = mediaSyncStore.getState();
  const syncSummary = syncState.syncHealthSummary;
  const resetDriftStats = () => {
    driftMonitor.reset();
    rerender();
  };
  const audioRoutePlan = createAudioRoutePlan(graph, {
    includeRecording: graph.recording.status === 'recording',
    includeStreams: Object.values(graph.destinations).some((destination) => destination.enabled),
    includeMonitor: true,
    includeGuestReturns: true,
  });
  const audioRouteGraph = createAudioRouteGraph(audioRoutePlan);
  const audioRouteValidation = validateAudioRoutePlan(audioRoutePlan, graph);
  const activeAudioRoutes = audioRoutePlan.routes.filter((route) => route.enabled);
  const mutedAudioRoutes = audioRoutePlan.routes.filter((route) => route.muted);
  const soloedAudioRoutes = audioRoutePlan.routes.filter((route) => route.solo);
  const guestReturnRoutes = audioRoutePlan.routes.filter(
    (route) => route.target === 'guest_return',
  );
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
  const streamingPlan = createStreamingPlan({
    graph,
    videoRoutePlan: routePlan,
    audioRoutePlan,
    outputEngineId: 'output-engine:developer-inspector',
    ...(graph.recording.status === 'recording'
      ? { recordingEngineId: 'recording-engine:simultaneous' }
      : {}),
    mediaClock,
    frameId: mediaClock.getCurrentFrame(),
  });
  const preparedStream = prepareStreaming(streamingPlan).session;
  const connectedStream = connectStreaming(preparedStream).session;
  const streamingSession = startStreaming(connectedStream).session;
  const streamingHealth = summarizeStreamingHealth(streamingSession);
  const primaryStreamTarget = streamingSession.targets[0];
  const primaryDestination = streamingPlan.destinations.find(
    (destination) => destination.id === primaryStreamTarget?.destinationId,
  );
  const multiviewPlan = createMultiviewPlan({
    graph,
    preset: 'quad',
    videoRoutePlan: routePlan,
    audioRoutePlan,
    mediaClock,
    frameId: mediaClock.getCurrentFrame(),
  });
  const multiviewHealth = summarizeMultiviewHealth(multiviewPlan);
  const confidenceMonitor = createConfidenceMonitor({
    plan: multiviewPlan,
    signals: {
      stream: streamingHealth.health === 'healthy' ? 'healthy' : streamingHealth.health,
      recording: graph.recording.status === 'recording' ? 'healthy' : 'unknown',
      audio: audioRouteValidation.valid ? 'healthy' : 'warning',
      network: streamingHealth.warnings.length ? 'warning' : 'healthy',
      renderer: browserDiagnostics.rendererHealth.isHealthy ? 'healthy' : 'degraded',
    },
  });
  const confidenceSummary = summarizeConfidenceStatus(confidenceMonitor);
  const encoderPlan = createEncoderPlan({
    graph,
    videoRoutePlan: routePlan,
    audioRoutePlan,
    outputId: streamingPlan.broadcastOutputPlanId,
    ...(graph.recording.activeRecordingId
      ? { recordingId: graph.recording.activeRecordingId }
      : {}),
    ...(primaryStreamTarget ? { streamId: primaryStreamTarget.id } : {}),
    mediaClock,
    frameId: mediaClock.getCurrentFrame(),
  });
  const ffmpegStreamingPlan = createFFmpegStreamingPlan({
    streamingPlan,
    encoderPlan,
    enabled: false,
    runtimeMode: 'dry_run',
    dryRun: true,
  });
  const ffmpegStreamingDiagnostics = new FFmpegStreamingRuntime({
    enabled: false,
    runtimeMode: 'dry_run',
    dryRun: true,
  }).getDiagnostics();
  const encoderSession = startEncoder(prepareEncoder(encoderPlan).session).session;
  const encoderHealth = summarizeEncoderHealth(encoderSession);
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
        <InspectorMetric label="Runtime State" value={productionRuntime.state} />
        <InspectorMetric
          label="Runtime Active"
          value={String(productionRuntimeHealth.activeSubsystems)}
        />
        <InspectorMetric label="Runtime Health" value={productionRuntimeHealth.health} />
        <InspectorMetric
          label="Recording Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.recording ?? '—')}
        />
        <InspectorMetric
          label="Streaming Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.streaming ?? '—')}
        />
        <InspectorMetric
          label="Encoder Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.encoder ?? '—')}
        />
        <InspectorMetric
          label="FFmpeg Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.ffmpeg ?? '—')}
        />
        <InspectorMetric
          label="WebRTC Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.webrtc ?? '—')}
        />
        <InspectorMetric
          label="Browser Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.browser_renderer ?? '—')}
        />
        <InspectorMetric
          label="GPU Runtime"
          value={String(productionRuntimeHealth.subsystemHealth.gpu ?? '—')}
        />
        <InspectorMetric
          label="Hardware Runtime"
          value={
            hardwareEnabled ? hardwareDashboard.diagnostics.health.status : 'software fallback'
          }
        />
        <InspectorMetric
          label="Hardware GPUs"
          value={String(hardwareDashboard.diagnostics.devices.length)}
        />
        <InspectorMetric
          label="Hardware Encoders"
          value={
            hardwareDashboard.diagnostics.devices
              .map((device) => `${device.api}:${device.capabilities.encoderCount}`)
              .join(', ') || '—'
          }
        />
        <InspectorMetric
          label="Hardware Temp"
          value={hardwareDashboard.diagnostics.devices
            .map((device) => device.temperatureC ?? '—')
            .join(', ')}
        />
        <InspectorMetric
          label="Hardware Util"
          value={
            hardwareDashboard.diagnostics.devices
              .map((device) => `${Math.round(device.utilization * 100)}%`)
              .join(', ') || '—'
          }
        />
        <InspectorMetric
          label="Hardware Caps"
          value={
            hardwareDashboard.capabilities
              .map((capability) => capability.apis.join('/'))
              .join(', ') || 'software'
          }
        />
        <InspectorMetric
          label="Production Engine"
          value={
            productionEngineEnabled
              ? productionEngineDashboard.productionEngine
              : 'feature disabled'
          }
        />
        <InspectorMetric
          label="Engine Timeline"
          value={String(productionEngineDashboard.executionTimeline.length)}
        />
        <InspectorMetric
          label="Frame Scheduler"
          value={`${productionEngineDashboard.frameScheduler.length} frames`}
        />
        <InspectorMetric
          label="Sync Drift"
          value={`${productionEngineDashboard.synchronizationView.driftMs}ms`}
        />
        <InspectorMetric
          label="Engine Resources"
          value={`${productionEngineDashboard.resourceView.cpu}% CPU / ${productionEngineDashboard.resourceView.gpu}% GPU`}
        />
        <InspectorMetric
          label="Performance"
          value={`${productionEngineDashboard.performanceMetrics.pipelineLatencyMs}ms pipeline`}
        />
        <InspectorMetric
          label="Recovery Status"
          value={productionEngineDashboard.recoveryStatus.at(-1) ?? 'ready'}
        />
        <InspectorMetric
          label="Session Inspector"
          value={String(productionEngineDashboard.sessionInspector.sessionId)}
        />
        <InspectorMetric
          label="Runtime Degraded"
          value={productionRuntimeHealth.degradedModes.join(', ') || '—'}
        />
        <InspectorMetric
          label="Runtime Failure"
          value={productionRuntimeHealth.latestFailure?.code ?? '—'}
        />
        <InspectorMetric
          label="Runtime Frame"
          value={String(productionRuntimeHealth.latestFrameId ?? '—')}
        />
        <InspectorMetric
          label="Runtime Graph Rev"
          value={String(productionRuntimeHealth.latestGraphRevision ?? state.currentGraphRevision)}
        />
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
        <InspectorMetric label="Audio Buses" value={String(audioRoutePlan.buses.length)} />
        <InspectorMetric label="Audio Routes" value={String(activeAudioRoutes.length)} />
        <InspectorMetric label="Muted Audio" value={String(mutedAudioRoutes.length)} />
        <InspectorMetric label="Soloed Audio" value={String(soloedAudioRoutes.length)} />
        <InspectorMetric label="Guest Returns" value={String(guestReturnRoutes.length)} />
        <InspectorMetric label="Mix-minus" value={audioRoutePlan.returns.length ? 'ready' : '—'} />
        <InspectorMetric
          label="Audio Warnings"
          value={String(audioRouteValidation.warnings.length)}
        />
        <InspectorMetric label="Audio Rev" value={String(audioRouteGraph.revision)} />
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

      <div className="mt-3 rounded-lg border border-sky-700/40 bg-sky-950/20 p-2">
        <p className="font-black uppercase tracking-[0.16em] text-sky-200">Streaming</p>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <InspectorMetric
            label="Protocol"
            value={primaryStreamTarget?.transport.protocol ?? '—'}
          />
          <InspectorMetric label="Destination" value={primaryDestination?.name ?? '—'} />
          <InspectorMetric label="Status" value={streamingSession.status} />
          <InspectorMetric label="Connected" value={String(streamingHealth.connectedTargets)} />
          <InspectorMetric
            label="Latency"
            value={
              primaryStreamTarget?.transport.latencyMs
                ? `${primaryStreamTarget.transport.latencyMs}ms`
                : 'mock'
            }
          />
          <InspectorMetric label="Health" value={streamingHealth.health} />
          <InspectorMetric label="Warnings" value={String(streamingHealth.warnings.length)} />
          <InspectorMetric label="Active Streams" value={String(streamingHealth.activeTargets)} />
          <InspectorMetric
            label="Real Output"
            value={ffmpegStreamingPlan.enabled ? 'enabled' : 'disabled'}
          />
          <InspectorMetric
            label="Destination URL"
            value={ffmpegStreamingPlan.targets[0]?.sanitizedUrl ?? '—'}
          />
          <InspectorMetric label="FFmpeg" value={ffmpegStreamingPlan.ffmpegPath} />
          <InspectorMetric
            label="Process"
            value={String(ffmpegStreamingDiagnostics.processState)}
          />
          <InspectorMetric
            label="Reconnects"
            value={String(ffmpegStreamingDiagnostics.reconnectAttempts)}
          />
          <InspectorMetric label="Manifest" value={ffmpegStreamingDiagnostics.manifestStatus} />
          <InspectorMetric
            label="Runtime Health"
            value={String(ffmpegStreamingDiagnostics.health)}
          />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-sky-300/80">
          FFmpeg live output diagnostics are sanitized and feature-flagged; dry-run/mock defaults do
          not publish or retain process handles.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-2">
        <p className="font-black uppercase tracking-[0.16em] text-emerald-200">
          Multiview Confidence
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <InspectorMetric label="Preset" value={multiviewPlan.preset} />
          <InspectorMetric label="Tiles" value={String(multiviewPlan.tiles.length)} />
          <InspectorMetric label="Program Conf" value={confidenceMonitor.signals.program} />
          <InspectorMetric label="Stream Conf" value={confidenceMonitor.signals.stream} />
          <InspectorMetric label="Recording Conf" value={confidenceMonitor.signals.recording} />
          <InspectorMetric label="Audio Conf" value={confidenceMonitor.signals.audio} />
          <InspectorMetric label="Network Conf" value={confidenceMonitor.signals.network} />
          <InspectorMetric label="Unhealthy Tiles" value={String(multiviewHealth.unhealthyTiles)} />
          <InspectorMetric
            label="Warnings"
            value={String(multiviewHealth.warnings.length + confidenceSummary.warnings.length)}
          />
          <InspectorMetric label="Latest Frame" value={String(multiviewPlan.frameId)} />
          <InspectorMetric label="Graph Rev" value={String(multiviewPlan.graphRevision)} />
          <InspectorMetric label="Overall" value={confidenceSummary.status} />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-emerald-300/80">
          Metadata-only mock diagnostics; existing browser renderer/composition paths remain the
          rendering boundary.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-amber-700/40 bg-amber-950/20 p-2">
        <p className="font-black uppercase tracking-[0.16em] text-amber-200">Encoder</p>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <InspectorMetric label="Status" value={encoderSession.status} />
          <InspectorMetric label="Active ID" value={encoderSession.id} />
          <InspectorMetric label="Backend" value={encoderPlan.backend} />
          <InspectorMetric label="Video Codec" value={encoderPlan.profile.videoCodec} />
          <InspectorMetric label="Audio Codec" value={encoderPlan.profile.audioCodec} />
          <InspectorMetric label="Bitrate" value={`${encoderSession.estimatedBitrateKbps}kbps`} />
          <InspectorMetric
            label="Resolution"
            value={`${encoderPlan.profile.resolution.width}x${encoderPlan.profile.resolution.height}`}
          />
          <InspectorMetric label="FPS" value={String(encoderSession.estimatedFps)} />
          <InspectorMetric label="Target Output" value={encoderPlan.target.outputId} />
          <InspectorMetric
            label="Recording/Stream"
            value={encoderPlan.recordingId ?? encoderPlan.streamId ?? '—'}
          />
          <InspectorMetric label="Health" value={encoderHealth.health} />
          <InspectorMetric
            label="Warn/Fail"
            value={`${encoderHealth.warningCount}/${encoderHealth.failureCount}`}
          />
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-amber-300/80">
          Mock lifecycle metadata only; no FFmpeg, WebCodecs, GPU APIs, raw media, or encoded
          packets are created.
        </p>
      </div>

      {orchestration ? (
        <div className="mt-3 rounded-lg border border-fuchsia-700/40 bg-fuchsia-950/20 p-2">
          <p className="font-black uppercase tracking-[0.16em] text-fuchsia-200">
            Media Orchestration
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <InspectorMetric
              label="Active Intents"
              value={String(orchestration.activeIntents.length)}
            />
            <InspectorMetric
              label="Frame Plans"
              value={String(orchestration.activeFramePlans.length)}
            />
            <InspectorMetric
              label="Dependency Edges"
              value={String(orchestration.dependencyGraph?.edges.length ?? 0)}
            />
            <InspectorMetric label="Conflicts" value={String(orchestration.conflicts.length)} />
            <InspectorMetric label="Frame Align" value={orchestration.frameAlignmentStatus} />
            <InspectorMetric
              label="Queued/Dropped"
              value={String(orchestration.droppedOrQueuedIntents)}
            />
            <InspectorMetric
              label="Subsystems"
              value={Object.entries(orchestration.subsystemStateSnapshot)
                .map(([key, value]) => `${key}:${value}`)
                .join(' · ')}
            />
            <InspectorMetric
              label="Latest Plan"
              value={orchestration.activeFramePlans.at(-1)?.id ?? '—'}
            />
          </div>
          <div className="mt-2 rounded border border-fuchsia-900/70 bg-slate-950/60 p-2 font-mono text-[10px] text-fuchsia-100">
            {(orchestration.activeFramePlans.at(-1)?.orderedExecutionSteps ?? [])
              .slice(0, 6)
              .map((intent) => (
                <div key={intent.id}>
                  {intent.targetSubsystem} → {intent.executionType} · deps{' '}
                  {intent.dependencies.length}
                </div>
              ))}
            {orchestration.conflicts.slice(0, 3).map((conflict) => (
              <div key={conflict.id}>
                conflict {conflict.type}: {conflict.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mediaSyncEnabled ? (
        <div className="mt-3 rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-2">
          <p className="font-black uppercase tracking-[0.16em] text-emerald-200">
            Media Sync Diagnostics
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <InspectorMetric label="Current Frame" value={String(syncSummary.currentFrame)} />
            <InspectorMetric label="FPS" value={String(syncSummary.fps)} />
            <InspectorMetric label="Video Drift" value={`${syncSummary.drift.videoDriftMs}ms`} />
            <InspectorMetric label="Audio Drift" value={`${syncSummary.drift.audioDriftMs}ms`} />
            <InspectorMetric label="Render Drift" value={`${syncSummary.drift.renderDriftMs}ms`} />
            <InspectorMetric label="Output Drift" value={`${syncSummary.drift.outputDriftMs}ms`} />
            <InspectorMetric
              label="Last Tick"
              value={
                syncState.lastTickResult ? String(syncState.lastTickResult.broadcastTime) : '—'
              }
            />
            <InspectorMetric label="Jitter" value={`${syncSummary.jitterEstimate}ms`} />
            <InspectorMetric label="Dropped" value={String(syncSummary.droppedFramesCount)} />
            <InspectorMetric label="Clock" value={syncState.clockState.status} />
            <InspectorMetric label="Health Score" value={String(syncSummary.healthScore)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                mediaClock.pauseClock();
                rerender();
              }}
              className="rounded border border-emerald-700 bg-emerald-950/40 px-2 py-1 font-bold uppercase tracking-[0.12em] text-emerald-200"
            >
              Pause clock
            </button>
            <button
              type="button"
              onClick={() => {
                mediaClock.resumeClock();
                rerender();
              }}
              className="rounded border border-emerald-700 bg-emerald-950/40 px-2 py-1 font-bold uppercase tracking-[0.12em] text-emerald-200"
            >
              Resume clock
            </button>
            <button
              type="button"
              onClick={resetDriftStats}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Reset drift stats
            </button>
          </div>
        </div>
      ) : null}
      {browserRendererFlagEnabled ? (
        <div className="mt-3 rounded-lg border border-cyan-700/40 bg-cyan-950/20 p-2">
          <p className="font-black uppercase tracking-[0.16em] text-cyan-200">Browser Renderer</p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <InspectorMetric label="Enabled" value="true" />
            <InspectorMetric
              label="Targets"
              value={programComposition?.renderTargets.join(', ') ?? '—'}
            />
            <InspectorMetric label="Composition" value={browserHealth.compositionId ?? '—'} />
            <InspectorMetric label="Layers" value={String(browserHealth.layerCount)} />
            <InspectorMetric
              label="Runtime Sources"
              value={String(webRTCDiagnostics?.activeLocalStreamCount ?? 0)}
            />
            <InspectorMetric label="Frames" value={String(browserHealth.stats.frameCount)} />
            <InspectorMetric label="Target FPS" value={String(browserHealth.stats.targetFps)} />
            <InspectorMetric label="Est FPS" value={String(browserHealth.stats.estimatedFps)} />
            <InspectorMetric
              label="Last Render"
              value={`${browserHealth.stats.lastRenderDurationMs}ms`}
            />
            <InspectorMetric label="Missing Sources" value={String(compositionWarnings.length)} />
            <InspectorMetric label="Latest Error" value={browserHealth.latestError?.code ?? '—'} />
            <InspectorMetric label="Backend" value={browserDiagnostics.activeBackend} />
            <InspectorMetric label="Fallback" value={browserDiagnostics.fallbackStatus} />
            <InspectorMetric label="Frame Budget" value={`${browserDiagnostics.frameBudget}ms`} />
            <InspectorMetric
              label="Over Budget"
              value={String(browserDiagnostics.overBudgetFrameCount)}
            />
            <InspectorMetric
              label="Dirty Layers"
              value={String(browserDiagnostics.dirtyLayerCount)}
            />
            <InspectorMetric
              label="Cache"
              value={`${browserDiagnostics.cacheSummary.layers} layers ${browserDiagnostics.cacheSummary.hits}/${browserDiagnostics.cacheSummary.misses}`}
            />
            <InspectorMetric
              label="Pipeline"
              value={browserDiagnostics.pipelineStages.stages.join(' → ')}
            />
            <InspectorMetric
              label="Health"
              value={browserDiagnostics.rendererHealth.isHealthy ? 'healthy' : 'degraded'}
            />
          </div>
          <canvas
            ref={browserCanvasRef}
            className="mt-2 aspect-video w-full rounded border border-cyan-500/30 bg-black"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                browserRenderer.start();
                rerender();
              }}
              className="rounded border border-cyan-700 bg-cyan-950/40 px-2 py-1 font-bold uppercase tracking-[0.12em] text-cyan-200"
            >
              Start renderer
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.stop();
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Stop renderer
            </button>
            <button
              type="button"
              onClick={() => {
                if (programComposition)
                  browserRenderer.render(programComposition, { debug: browserDebug });
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Render frame
            </button>
            <button
              type="button"
              onClick={() => {
                setBrowserDebug((value) => !value);
                browserRenderer.setDebug(!browserDebug);
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Toggle guides
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.clearStats();
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Clear renderer stats
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.switchBackend('canvas2d_default');
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Use Canvas2D
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.switchBackend('webgl_preview');
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Try WebGL
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.switchBackend('webgpu_preview');
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Try WebGPU
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.clearRenderCache();
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Clear render cache
            </button>
            <button
              type="button"
              onClick={() => {
                browserRenderer.forceFullRender();
                if (programComposition)
                  browserRenderer.render(programComposition, { debug: browserDebug });
                rerender();
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-bold uppercase tracking-[0.12em] text-slate-300"
            >
              Force full redraw
            </button>
          </div>
        </div>
      ) : null}
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
      <div className="mt-3 rounded-lg border border-slate-800 bg-black/20 p-2">
        <p className="font-black uppercase tracking-[0.16em] text-slate-300">Audio Routing</p>
        <div className="mt-2 grid gap-1 md:grid-cols-2">
          {activeAudioRoutes.slice(0, 6).map((route) => (
            <div key={route.id} className="rounded border border-slate-800 bg-slate-950/70 p-2">
              <p className="font-bold text-slate-100">
                {route.sourceType} → {route.target}
              </p>
              <p className="text-[10px] text-slate-400">
                {route.busId} · {route.status} · gain {route.gain}
              </p>
            </div>
          ))}
        </div>
        {audioRouteValidation.warnings.length > 0 ? (
          <p className="mt-2 text-[10px] text-amber-200">
            {audioRouteValidation.warnings.slice(0, 3).join(' · ')}
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
              audioRoutePlan,
              audioRouteWarnings: audioRouteValidation.warnings,
              latestEvents: state.latestEvents.slice(-6),
              rendererDiagnostics: browserDiagnostics,
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
        <InspectorMetric
          label="Recording File"
          value={String(recording.metadata?.currentFile ?? '—')}
        />
        <InspectorMetric
          label="Recording Folder"
          value={String(recording.metadata?.outputFolder ?? '—')}
        />
        <InspectorMetric
          label="Recording Bitrate"
          value={String(recording.metadata?.bitrateKbps ?? '—')}
        />
        <InspectorMetric label="Recording FPS" value={String(recording.metadata?.fps ?? '—')} />
        <InspectorMetric
          label="Recording Size"
          value={String(recording.metadata?.currentSizeBytes ?? '—')}
        />
        <InspectorMetric
          label="Recording Health"
          value={String(recording.metadata?.health ?? recording.status)}
        />
        <InspectorMetric
          label="Recording Drops"
          value={String(recording.metadata?.droppedFrames ?? '—')}
        />
        <InspectorMetric
          label="Recording Disk"
          value={String(recording.metadata?.diskUsageBytes ?? '—')}
        />
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

type ControlRoomWorkspaceState = {
  selectedWorkspace: ProfessionalWorkspaceId;
  viewMode: OutputViewMode;
  splitRatio: number;
  sizes: { left: number; center: number; right: number; dock: number; operations: number };
  safeAreaToggles: SafeAreaToggles;
  compactChrome: boolean;
  layoutFocus: LayoutFocusMode;
};

const controlRoomViewStorageKey = 'ubos.controlRoom.viewMode';
const workspaceStorageKey = 'ubos.controlRoom.workspace.v2';

const factoryWorkspace: ControlRoomWorkspaceState = {
  selectedWorkspace: defaultWorkspaceId,
  viewMode: workspaceProfiles.director.defaultViewMode,
  splitRatio: 0.72,
  sizes: { left: 288, center: 640, right: 352, dock: 204, operations: 288 },
  safeAreaToggles: defaultSafeAreaToggles,
  compactChrome: false,
  layoutFocus: 'full',
};

function normalizeControlRoomWorkspace(
  value: (Partial<ControlRoomWorkspaceState> & { selectedPreset?: string }) | null | undefined,
): ControlRoomWorkspaceState {
  const selectedWorkspace = normalizeWorkspaceId(
    value?.selectedWorkspace ?? value?.selectedPreset ?? null,
  );
  const profile = workspaceProfiles[selectedWorkspace];
  const storedViewMode = value?.viewMode ?? null;

  return {
    ...factoryWorkspace,
    ...value,
    selectedWorkspace,
    viewMode: normalizeOutputViewMode(
      typeof storedViewMode === 'string' ? storedViewMode : profile.defaultViewMode,
    ),
    safeAreaToggles: { ...defaultSafeAreaToggles, ...value?.safeAreaToggles },
    sizes: { ...factoryWorkspace.sizes, ...value?.sizes },
    compactChrome: value?.compactChrome ?? factoryWorkspace.compactChrome,
    layoutFocus: value?.layoutFocus ?? factoryWorkspace.layoutFocus,
  };
}

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

const MIN_AUTO_TRANSITION_DURATION_MS = 100;
const DEFAULT_TRANSITION_DURATION_MS = 500;

function normalizeTransitionDuration(
  transitionType: TransitionType,
  value: unknown,
  fallback = DEFAULT_TRANSITION_DURATION_MS,
) {
  const raw = typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value);
  if (transitionType === 'cut') return 0;
  const normalizedFallback =
    Number.isFinite(fallback) && fallback >= MIN_AUTO_TRANSITION_DURATION_MS
      ? fallback
      : DEFAULT_TRANSITION_DURATION_MS;
  if (!Number.isFinite(raw)) return normalizedFallback;
  return Math.min(Math.max(Math.round(raw), MIN_AUTO_TRANSITION_DURATION_MS), 5000);
}
interface CurrentProgramState {
  sceneId: string;
  transitionType: TransitionType;
  transitionDuration: number;
}

interface CurrentPreviewState {
  sceneId: string;
}

class ProgramOutputController {
  constructor(private readonly state: CurrentProgramState) {}
  get sceneId() {
    return this.state.sceneId;
  }
}

class PreviewOutputController {
  constructor(private readonly state: CurrentPreviewState) {}
  get sceneId() {
    return this.state.sceneId;
  }
}

class SceneSelectionController {
  constructor(
    private readonly dispatch: (
      type: ProductionCommandType,
      payload?: Record<string, unknown>,
    ) => unknown,
  ) {}
  select(sceneId: string) {
    return this.dispatch('SET_PREVIEW_SCENE', { sceneId });
  }
}

class TransitionController {
  constructor(
    private readonly dispatch: (
      type: ProductionCommandType,
      payload?: Record<string, unknown>,
    ) => unknown,
  ) {}
  execute(type: TransitionType, previewSceneId: string, durationMs: number) {
    return this.dispatch(
      type === 'cut' ? 'CUT_TO_PROGRAM' : type === 'fade' ? 'AUTO_TRANSITION' : 'TAKE_PREVIEW',
      {
        sceneId: previewSceneId,
        transitionType: type,
        durationMs: type === 'cut' ? 0 : durationMs,
      },
    );
  }
}

class ProgramPreviewSynchronizer {
  static fromSwitchingState(state: ProductionSwitchingState) {
    return {
      program: new ProgramOutputController({
        sceneId: state.programSceneId,
        transitionType: state.transitionType,
        transitionDuration: state.transitionDuration,
      }),
      preview: new PreviewOutputController({ sceneId: state.previewSceneId }),
    };
  }
}

function createProductionGraphSessionFromScenes(input: {
  scenes: Scene[];
  productionState: ProductionSwitchingState;
  broadcastId: string;
}): ProductionBroadcastSession {
  const timestamp = new Date().toISOString();
  const graph = createInitialProductionGraph({
    broadcastSessionId: input.broadcastId,
    name: 'Control Room Session',
    operatorId: 'local-director',
    timestamp,
  });
  const scenesById: Record<string, SceneNode> = Object.fromEntries(
    input.scenes.map((scene) => [
      scene.id,
      {
        id: scene.id,
        name: scene.name,
        order: scene.order,
        sourceIds: scene.sources.map((source) => source.id),
        canvasIds: scene.canvases.map((canvas) => canvas.id),
        overlayIds: scene.overlays.map((overlay) => String(overlay.id)),
        metadata: { type: scene.type, layout: scene.layout },
        createdAt: scene.createdAt,
        updatedAt: scene.updatedAt,
      },
    ]),
  );
  const sourcesById: Record<string, SourceNode> = Object.fromEntries(
    input.scenes.flatMap((scene) =>
      scene.sources.map((source) => [
        source.id,
        {
          id: source.id,
          name: source.name,
          type: source.type,
          enabled: source.isVisible,
          ...(source.muted === undefined ? {} : { muted: source.muted }),
          metadata: { ...source.settings, sceneId: scene.id, transform: source.transform },
        } satisfies SourceNode,
      ]),
    ),
  );
  const fallbackSceneId =
    input.scenes.find((scene) => scene.isActive)?.id ?? input.scenes[0]?.id ?? 'scene-empty';
  const programSceneId = scenesById[input.productionState.programSceneId]
    ? input.productionState.programSceneId
    : fallbackSceneId;
  const previewSceneId = scenesById[input.productionState.previewSceneId]
    ? input.productionState.previewSceneId
    : programSceneId;
  const overlayEntries = input.scenes.flatMap((scene) =>
    scene.overlays.map((overlay) => [
      String(overlay.id),
      {
        id: String(overlay.id),
        name: String(overlay.name ?? 'Graphics Overlay'),
        enabled: overlay.isVisible !== false,
        sceneId: scene.id,
        sourceId: String(overlay.id),
        metadata: { type: overlay.type, zIndex: overlay.zIndex },
      },
    ]),
  );
  const audioEntries = Object.values(sourcesById)
    .filter(
      (source) => source.type === 'audio' || source.type === 'camera' || source.type === 'guest',
    )
    .map((source) => [
      `mix-${source.id}`,
      {
        id: `mix-${source.id}`,
        label: source.name,
        gain: 0.8,
        muted: Boolean(source.muted),
        sourceId: source.id,
        metadata: { followsSource: true },
      },
    ]);
  const session = createBroadcastSession({
    id: input.broadcastId,
    name: 'Control Room Session',
    operatorId: 'local-director',
    timestamp,
  });
  return {
    ...session,
    eventLog: [
      ...session.eventLog,
      {
        id: `${input.broadcastId}:automation-ready`,
        type: 'WORKSPACE_CHANGED',
        broadcastSessionId: input.broadcastId,
        actorId: 'automation-engine',
        timestamp,
        commandId: 'system:automation-ready',
        payload: { macroId: 'macro-opening-roll', action: 'automation_execution' },
        graphRevision: graph.metadata.revision,
        previousRevision: graph.metadata.revision,
        nextRevision: graph.metadata.revision,
      },
    ],
    graph: {
      ...graph,
      scenes: scenesById,
      sources: sourcesById,
      overlays: Object.fromEntries(overlayEntries),
      audioChannels: Object.fromEntries(audioEntries),
      destinations: {
        'stream-primary': {
          id: 'stream-primary',
          name: 'Primary Stream',
          platform: 'rtmp',
          enabled: true,
          status: 'ready',
          metadata: { destination: 'metadata-only' },
        },
        'broadcast-sdi-1': {
          id: 'broadcast-sdi-1',
          name: 'SDI Program Out',
          platform: 'broadcast-io',
          enabled: true,
          status: 'ready',
          metadata: { connector: 'SDI-1' },
        },
      },
      recording: { ...graph.recording, metadata: { route: 'program-output' } },
      automation: {
        enabled: true,
        activeMacroIds: ['macro-opening-roll'],
        metadata: { mode: 'manual-confirm' },
      },
      plugins: { ...graph.plugins, replayActive: true, monitorWall: 'program-preview-grid' },
      program: {
        ...graph.program,
        sceneId: programSceneId,
        transitionType: input.productionState.transitionType,
        transitionDurationMs: input.productionState.transitionDuration,
      },
      preview: { ...graph.preview, sceneId: previewSceneId },
    },
  };
}

export function SceneWorkspace({
  initialScenes,
  layouts,
  channels,
  assets,
  mediaRoutes = [],
  guests = [],
  invites = [],
  destinations = [],
  messages = [],
  streamHealthMetrics = [],
  persistenceDiagnostics = {},
  broadcastId = 'demo-broadcast',
  workspaceId = 'demo-workspace',
  initialProductionState,
  operationsTabs,
}: {
  initialScenes: Scene[];
  initialProductionState: ProductionSwitchingState;
  layouts: SceneLayout[];
  channels: AudioChannel[];
  assets: ProductionAsset[];
  mediaRoutes?: MediaRoute[];
  guests?: Guest[];
  invites?: GuestInvite[];
  destinations?: Destination[];
  messages?: ChatMessage[];
  streamHealthMetrics?: StreamHealthMetric[];
  persistenceDiagnostics?: Record<string, unknown> & { currentGraphRevision?: number };
  broadcastId?: string;
  workspaceId?: string;
  operationsTabs?: Array<{ id: OperationsTabId; content: ReactNode }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [workspace, setWorkspace] = useState<ControlRoomWorkspaceState>(factoryWorkspace);
  const viewMode = workspace.viewMode;
  const selectedWorkspace = workspace.selectedWorkspace;
  const [scenes, setScenes] = useOptimistic(initialScenes, (_current, next: Scene[]) => next);
  const [productionState, setProductionState] = useState(initialProductionState);
  const [transitionActive, setTransitionActive] = useState(false);
  const [lastTransitionLabel, setLastTransitionLabel] = useState('None');
  const [transitionHistory, setTransitionHistory] = useState<string[]>([]);
  const [switcherFeedback, setSwitcherFeedback] = useState<string | null>(null);
  const [runtime] = useState(
    () =>
      new ProductionRuntime({
        currentProgram: initialProductionState.programSceneId,
        currentPreview: initialProductionState.previewSceneId,
        currentScene: initialProductionState.programSceneId,
      }),
  );
  const [runtimeView, setRuntimeView] = useState(runtime.state);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(mediaRoutes[0]?.id ?? null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clock, setClock] = useState('00:00:00');

  useEffect(() => {
    const storedViewMode = window.localStorage.getItem(controlRoomViewStorageKey);
    const storedWorkspace = window.localStorage.getItem(workspaceStorageKey);
    const legacyWorkspace = window.localStorage.getItem('ubos.controlRoom.workspace.v1');
    const rawWorkspace = storedWorkspace ?? legacyWorkspace;
    if (rawWorkspace) {
      try {
        const parsed = JSON.parse(rawWorkspace) as Partial<ControlRoomWorkspaceState> & {
          selectedPreset?: string;
        };
        if (parsed) {
          setWorkspace(normalizeControlRoomWorkspace(parsed));
          return;
        }
      } catch {
        window.localStorage.removeItem(workspaceStorageKey);
      }
    }
    if (storedViewMode) {
      setWorkspace((current) => ({
        ...current,
        viewMode: normalizeOutputViewMode(storedViewMode),
      }));
    }
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

  const selectViewMode = (mode: OutputViewMode) => {
    setWorkspace((current) => ({ ...current, viewMode: mode }));
    window.localStorage.setItem(controlRoomViewStorageKey, mode);
  };

  const applyWorkspace = (next: ControlRoomWorkspaceState) => {
    setWorkspace(next);
    window.localStorage.setItem(controlRoomViewStorageKey, next.viewMode);
  };

  const selectProfessionalWorkspace = (id: ProfessionalWorkspaceId) => {
    const profile = applyWorkspaceProfile(id);
    setActiveNav(profile.activeNav);
    setActiveOperationsTab(profile.activeOperationsTab);
    setActiveBottomDock(normalizeDockTabId(profile.activeBottomDock));
    setWorkspace((current) => ({
      ...current,
      selectedWorkspace: profile.selectedWorkspace,
      viewMode: profile.viewMode,
    }));
    window.localStorage.setItem(controlRoomViewStorageKey, profile.viewMode);
  };

  const setCompactChrome = (compactChrome: boolean) => {
    setWorkspace((current) => ({ ...current, compactChrome }));
  };

  const applyMenuWorkspaceMode = (modeId: UbosWorkspaceModeId, compactChrome?: boolean) => {
    const modeDef = ubosWorkspaceModes[modeId];
    selectProfessionalWorkspace(modeDef.professionalWorkspaceId);
    if (compactChrome !== undefined) {
      setCompactChrome(compactChrome);
    }
  };

  const saveWorkspace = () =>
    window.localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace));

  const restoreWorkspace = () => {
    const storedWorkspace = window.localStorage.getItem(workspaceStorageKey);
    if (!storedWorkspace) return applyWorkspace(factoryWorkspace);
    try {
      applyWorkspace(
        normalizeControlRoomWorkspace(
          JSON.parse(storedWorkspace) as Partial<ControlRoomWorkspaceState>,
        ),
      );
    } catch {
      applyWorkspace(factoryWorkspace);
    }
  };

  const resetWorkspace = () => {
    window.localStorage.removeItem(workspaceStorageKey);
    selectProfessionalWorkspace(defaultWorkspaceId);
    applyWorkspace(factoryWorkspace);
  };

  const refresh = useCallback(
    (next: Scene[]) => startTransition(() => setScenes(next)),
    [startTransition, setScenes],
  );
  const smokeMedia = useMediaCapture();
  const [programStreamOnAir, setProgramStreamOnAir] = useState(false);
  const [cameraCaptureError, setCameraCaptureError] = useState('');
  const [liveSourceStreams, setLiveSourceStreams] = useState<Record<string, MediaStream>>({});
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingState, setRecordingState] = useState<
    'idle' | 'preparing' | 'recording' | 'stopping' | 'completed' | 'failed' | 'unsupported'
  >('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<string | null>(null);
  const [recordingStoppedAt, setRecordingStoppedAt] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [recordingFileSize, setRecordingFileSize] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingSourceType, setRecordingSourceType] =
    useState<BrowserRecordingPanelState['sourceType']>('none');
  const [recordingFilename, setRecordingFilename] = useState<string | null>(null);
  const [recordingHistory, setRecordingHistory] = useState<BrowserRecordingPanelState['history']>(
    [],
  );
  const mediaRecorderSupported = typeof window !== 'undefined' && 'MediaRecorder' in window;
  const [streamingState, setStreamingState] = useState<BrowserStreamingPanelState>({
    lifecycle: 'idle',
    destination: {
      id: 'stream-destination:default',
      platform: 'YouTube',
      rtmpUrl: '',
      streamKey: '',
      enabled: true,
      resolution: '1920x1080',
      bitrateKbps: 4500,
      audioBitrateKbps: 160,
    },
    durationMs: 0,
    startedAt: null,
    stoppedAt: null,
    bitrateEstimateKbps: 0,
    droppedFrameEstimate: 0,
    error: null,
    history: [],
    browserOnly: true,
    adapters: [
      'BrowserStreamingAdapter',
      'FFmpegStreamingAdapter',
      'NativeDesktopStreamingAdapter',
    ],
  });
  const streamingStartRef = useRef<string | null>(null);

  const validateStreamingDestination = useCallback(
    (destination: BrowserStreamingPanelState['destination']) => {
      if (!destination.enabled) return 'Enable the streaming destination before starting.';
      if (!destination.rtmpUrl.trim()) return 'Add an RTMP server URL before starting streaming.';
      if (!/^rtmps?:\/\/[^\s]+$/i.test(destination.rtmpUrl.trim()))
        return 'Enter a valid RTMP or RTMPS server URL.';
      if (!destination.streamKey.trim()) return 'Add a stream key before starting streaming.';
      return null;
    },
    [],
  );

  const dispatchStreaming = useCallback(
    (action: StreamingPanelAction) => {
      if (action.type === 'updateDestination') {
        setStreamingState((current) => ({
          ...current,
          error: null,
          destination: { ...current.destination, ...action.patch },
        }));
        return;
      }
      if (action.type === 'start') {
        setStreamingState((current) => {
          const error = validateStreamingDestination(current.destination);
          if (error) return { ...current, lifecycle: 'failed', error };
          const startedAt = new Date().toISOString();
          streamingStartRef.current = startedAt;
          return {
            ...current,
            lifecycle: 'preparing',
            startedAt,
            stoppedAt: null,
            durationMs: 0,
            bitrateEstimateKbps: 0,
            droppedFrameEstimate: 0,
            error:
              'Browser-only mode cannot transmit RTMP. Lifecycle is simulated until backend/native FFmpeg support is connected.',
          };
        });
        window.setTimeout(
          () =>
            setStreamingState((current) =>
              current.lifecycle === 'preparing' ? { ...current, lifecycle: 'connecting' } : current,
            ),
          400,
        );
        window.setTimeout(
          () =>
            setStreamingState((current) =>
              current.lifecycle === 'connecting'
                ? {
                    ...current,
                    lifecycle: 'streaming',
                    bitrateEstimateKbps:
                      current.destination.bitrateKbps + current.destination.audioBitrateKbps,
                  }
                : current,
            ),
          900,
        );
        return;
      }
      if (action.type === 'stop') {
        setStreamingState((current) => {
          const stoppedAt = new Date().toISOString();
          const startedAt = current.startedAt ?? stoppedAt;
          const durationMs = Math.max(0, Date.parse(stoppedAt) - Date.parse(startedAt));
          return {
            ...current,
            lifecycle: 'stopped',
            stoppedAt,
            durationMs,
            bitrateEstimateKbps: 0,
            history: [
              {
                platform: current.destination.platform,
                startedAt,
                stoppedAt,
                durationMs,
                state: 'stopped' as const,
                failureReason: null,
              },
              ...current.history,
            ].slice(0, 10),
          };
        });
      }
    },
    [validateStreamingDestination],
  );

  const liveSourceStreamsRef = useRef<Record<string, MediaStream>>({});

  useEffect(() => {
    liveSourceStreamsRef.current = liveSourceStreams;
  }, [liveSourceStreams]);

  useEffect(
    () => () => {
      Object.values(liveSourceStreamsRef.current).forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
    },
    [],
  );

  const patchCaptureSourceStatus = useCallback(
    (runtimeStatus: string, sourceId?: string, message?: string) => {
      refresh(
        scenes.map((scene) => ({
          ...scene,
          sources: scene.sources.map((source) =>
            (source.type === 'camera' || source.type === 'screen' || source.type === 'audio') &&
            (!sourceId || source.id === sourceId)
              ? {
                  ...source,
                  settings: {
                    ...source.settings,
                    runtimeStatus,
                    ...(message ? { message } : {}),
                  },
                }
              : source,
          ),
        })),
      );
    },
    [refresh, scenes],
  );

  const stopLiveSourceStream = useCallback((sourceId: string) => {
    setLiveSourceStreams((current) => {
      const stream = current[sourceId];
      if (!stream) return current;
      stream.getTracks().forEach((track) => track.stop());
      const { [sourceId]: _removed, ...remaining } = current;
      return remaining;
    });
  }, []);

  const markLiveSourceOffline = useCallback(
    (sourceId: string, message = 'Capture track ended') => {
      setLiveSourceStreams((current) => {
        const { [sourceId]: _removed, ...remaining } = current;
        return remaining;
      });
      patchCaptureSourceStatus('offline', sourceId, message);
    },
    [patchCaptureSourceStatus],
  );

  const retainLiveSourceStream = useCallback(
    (sourceId: string, stream: MediaStream) => {
      setLiveSourceStreams((current) => {
        current[sourceId]?.getTracks().forEach((track) => track.stop());
        return { ...current, [sourceId]: stream };
      });
      stream.getTracks().forEach((track) => {
        track.addEventListener('ended', () => markLiveSourceOffline(sourceId), { once: true });
      });
    },
    [markLiveSourceOffline],
  );

  const startScreenCapture = useCallback(
    async (sourceId: string) => {
      patchCaptureSourceStatus('connecting', sourceId);
      if (!navigator.mediaDevices?.getDisplayMedia) {
        patchCaptureSourceStatus(
          'unavailable',
          sourceId,
          'Display capture is not supported in this browser.',
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        if (isLiveMediaStream(stream)) {
          retainLiveSourceStream(sourceId, stream);
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack?.getSettings();
          refresh(
            scenes.map((scene) => ({
              ...scene,
              sources: scene.sources.map((source) =>
                source.id === sourceId
                  ? {
                      ...source,
                      settings: {
                        ...source.settings,
                        runtimeStatus: 'live',
                        captureState: 'live',
                        sourceKind: 'screen',
                        audioEnabled: stream.getAudioTracks().length > 0,
                        ...(settings?.width && settings?.height
                          ? { resolution: `${settings.width}x${settings.height}` }
                          : {}),
                        ...(settings?.frameRate ? { fps: Math.round(settings.frameRate) } : {}),
                      },
                    }
                  : source,
              ),
            })),
          );
        } else {
          patchCaptureSourceStatus(
            'unavailable',
            sourceId,
            'getDisplayMedia did not return a live display stream.',
          );
        }
      } catch (error) {
        const failureReason = describeCaptureError(error);
        patchCaptureSourceStatus(
          isAbortError(error) ? 'permission_required' : 'unavailable',
          sourceId,
          failureReason,
        );
      }
    },
    [patchCaptureSourceStatus, refresh, retainLiveSourceStream, scenes],
  );

  const startCameraCapture = useCallback(
    async (sourceId: string) => {
      patchCaptureSourceStatus('connecting', sourceId);
      setCameraCaptureError('');
      if (!navigator.mediaDevices?.getUserMedia) {
        patchCaptureSourceStatus(
          'unavailable',
          sourceId,
          'Camera capture is not supported in this browser.',
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isLiveMediaStream(stream)) {
          retainLiveSourceStream(sourceId, stream);
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack?.getSettings();
          refresh(
            scenes.map((scene) => ({
              ...scene,
              sources: scene.sources.map((source) =>
                source.id === sourceId
                  ? {
                      ...source,
                      settings: {
                        ...source.settings,
                        runtimeStatus: 'live',
                        captureState: 'live',
                        sourceKind: 'camera',
                        audioEnabled: stream.getAudioTracks().length > 0,
                        ...(settings?.width && settings?.height
                          ? { resolution: `${settings.width}x${settings.height}` }
                          : {}),
                        ...(settings?.frameRate ? { fps: Math.round(settings.frameRate) } : {}),
                      },
                    }
                  : source,
              ),
            })),
          );
        } else {
          const failureReason = 'getUserMedia did not return an active camera stream.';
          patchCaptureSourceStatus('unavailable', sourceId, failureReason);
          setCameraCaptureError(failureReason);
        }
      } catch (error) {
        const failureReason = describeCaptureError(error);
        patchCaptureSourceStatus(
          isAbortError(error) ? 'permission_required' : 'unavailable',
          sourceId,
          failureReason,
        );
        setCameraCaptureError(failureReason);
      }
    },
    [patchCaptureSourceStatus, refresh, retainLiveSourceStream, scenes],
  );

  const startSmokeCapture = useCallback(
    async (sourceId: string) => {
      patchCaptureSourceStatus('connecting', sourceId);
      try {
        const stream = await smokeMedia.startPreview({ withAudio: true });
        if (isLiveMediaStream(stream)) {
          retainLiveSourceStream(sourceId, stream);
          patchCaptureSourceStatus('live', sourceId);
        } else {
          const failureReason =
            smokeMedia.getLastErrorMessage() ||
            'getUserMedia did not return an active camera stream.';
          patchCaptureSourceStatus('unavailable', sourceId, failureReason);
        }
      } catch (error) {
        const failureReason = describeCaptureError(error);
        patchCaptureSourceStatus('unavailable', sourceId, failureReason);
      }
    },
    [patchCaptureSourceStatus, retainLiveSourceStream, smokeMedia],
  );

  const sorted = useMemo(() => [...scenes].sort((a, b) => a.order - b.order), [scenes]);
  const programScene =
    sorted.find((scene) => scene.id === productionState.programSceneId) ??
    sorted.find((scene) => scene.isActive) ??
    sorted[0]!;
  const previewScene =
    sorted.find((scene) => scene.id === productionState.previewSceneId) ?? programScene;
  const activeScene = previewScene;
  const previewLiveVideoSource = getFirstVisibleLiveVideoSource(previewScene);
  const programLiveVideoSource = getFirstVisibleLiveVideoSource(programScene);
  const previewCameraSourceId = previewLiveVideoSource?.id ?? null;
  const programCameraSourceId = programLiveVideoSource?.id ?? null;
  const previewCameraStream = previewCameraSourceId
    ? liveSourceStreams[previewCameraSourceId]
    : null;
  const programCameraStream = programCameraSourceId
    ? liveSourceStreams[programCameraSourceId]
    : null;
  const firstLiveVideoStream = useMemo(
    () => findFirstLiveVideoStream(liveSourceStreams),
    [liveSourceStreams],
  );
  const directCameraLive = isLiveMediaStream(firstLiveVideoStream);
  const previewStreamToShow = previewCameraStream ?? firstLiveVideoStream;
  const programStreamToShow =
    programCameraStream ?? (directCameraLive && programStreamOnAir ? firstLiveVideoStream : null);
  const previewHasCameraSource = Boolean(previewCameraSourceId) || directCameraLive;
  const programHasCameraSource =
    Boolean(programCameraSourceId) || (directCameraLive && programStreamOnAir);
  const livePreviewVisible = isLiveMediaStream(previewStreamToShow);
  const liveProgramVisible = isLiveMediaStream(programStreamToShow);

  const createProgramRecordingStream = useCallback(() => {
    const directStream = programStreamToShow ?? (programStreamOnAir ? firstLiveVideoStream : null);
    if (isLiveMediaStream(directStream)) {
      return {
        stream: directStream,
        sourceType: programLiveVideoSource?.type ?? 'camera',
      } as const;
    }
    const programRoot = document.querySelector('[data-ubos-program-monitor=\"true\"]');
    const programVideo = programRoot?.querySelector('video') as
      | (HTMLVideoElement & {
          captureStream?: () => MediaStream;
          mozCaptureStream?: () => MediaStream;
        })
      | null;
    const captured = programVideo?.captureStream?.() ?? programVideo?.mozCaptureStream?.();
    if (captured?.getVideoTracks().length) {
      const mixed = new MediaStream(captured.getVideoTracks());
      const addedTrackIds = new Set(mixed.getAudioTracks().map((track) => track.id));
      Object.values(liveSourceStreamsRef.current).forEach((stream) => {
        stream
          .getAudioTracks()
          .filter((track) => track.readyState === 'live' && !addedTrackIds.has(track.id))
          .forEach((track) => {
            mixed.addTrack(track);
            addedTrackIds.add(track.id);
          });
      });
      return {
        stream: mixed,
        sourceType: programScene.sources.find((source) => source.isVisible)?.type ?? 'media',
      } as const;
    }
    return null;
  }, [
    firstLiveVideoStream,
    programLiveVideoSource?.type,
    programScene.sources,
    programStreamOnAir,
    programStreamToShow,
  ]);

  const startSmokeRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') return;
    if (!mediaRecorderSupported) {
      setRecordingState('failed');
      setRecordingError('MediaRecorder is not supported in this browser.');
      return;
    }
    setRecordingState('preparing');
    setRecordingError(null);
    const source = createProgramRecordingStream();
    if (!source) {
      setRecordingState('failed');
      setRecordingError(
        'No capturable Program video is available. Start a camera, screen, or supported media source first.',
      );
      return;
    }
    recordedChunksRef.current = [];
    setRecordingFileSize(0);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    const startedAt = new Date().toISOString();
    const filename = `ubos-program-${startedAt.replace(/[:.]/g, '-')}.webm`;
    setRecordingStartedAt(startedAt);
    setRecordingStoppedAt(null);
    setRecordingDurationMs(0);
    setRecordingFilename(filename);
    setRecordingSourceType(source.sourceType);
    const recorderOptions = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? { mimeType: 'video/webm;codecs=vp9,opus' }
      : MediaRecorder.isTypeSupported('video/webm')
        ? { mimeType: 'video/webm' }
        : undefined;
    const recorder = new MediaRecorder(source.stream, recorderOptions);
    recordingStreamRef.current = source.stream;
    const stopForEndedSource = () => {
      if (recorder.state === 'recording') recorder.stop();
    };
    source.stream
      .getTracks()
      .forEach((track) => track.addEventListener('ended', stopForEndedSource, { once: true }));
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
        setRecordingFileSize((size) => size + event.data.size);
      }
    };
    recorder.onerror = () => {
      setRecordingState('failed');
      setRecordingError('The browser recording pipeline reported an error.');
    };
    recorder.onstop = () => {
      const stoppedAt = new Date().toISOString();
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const durationMs = startedAt
        ? Date.parse(stoppedAt) - Date.parse(startedAt)
        : recordingDurationMs;
      setRecordedUrl(URL.createObjectURL(blob));
      setRecordingStoppedAt(stoppedAt);
      setRecordingDurationMs(Math.max(0, durationMs));
      setRecordingFileSize(blob.size);
      setRecordingState('completed');
      setRecordingHistory((history) =>
        [
          {
            filename,
            durationMs: Math.max(0, durationMs),
            startedAt,
            stoppedAt,
            sourceType: source.sourceType,
            fileSizeBytes: blob.size,
          },
          ...history,
        ].slice(0, 10),
      );
      recorderRef.current = null;
      recordingStreamRef.current = null;
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecordingState('recording');
  }, [createProgramRecordingStream, mediaRecorderSupported, recordedUrl, recordingDurationMs]);

  const stopSmokeRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      setRecordingState('stopping');
      recorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    if (streamingState.lifecycle !== 'streaming' || !streamingState.startedAt) return;
    const tick = () =>
      setStreamingState((current) => ({
        ...current,
        durationMs: Date.now() - Date.parse(streamingState.startedAt!),
        bitrateEstimateKbps: current.destination.bitrateKbps + current.destination.audioBitrateKbps,
        droppedFrameEstimate: Math.floor(
          (Date.now() - Date.parse(streamingState.startedAt!)) / 60000,
        ),
      }));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [streamingState.lifecycle, streamingState.startedAt]);

  useEffect(() => {
    if (recordingState !== 'recording' || !recordingStartedAt) return;
    const tick = () => setRecordingDurationMs(Date.now() - Date.parse(recordingStartedAt));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [recordingStartedAt, recordingState]);

  const browserRecordingPanelState = useMemo<BrowserRecordingPanelState>(
    () => ({
      state: recordingState === 'unsupported' ? 'failed' : recordingState,
      filename: recordingFilename,
      durationMs: recordingDurationMs,
      startedAt: recordingStartedAt,
      stoppedAt: recordingStoppedAt,
      sourceType: recordingSourceType,
      fileSizeBytes: recordingFileSize,
      downloadUrl: recordedUrl,
      error: recordingError,
      history: recordingHistory,
      supported: mediaRecorderSupported,
    }),
    [
      mediaRecorderSupported,
      recordedUrl,
      recordingDurationMs,
      recordingError,
      recordingFileSize,
      recordingFilename,
      recordingHistory,
      recordingSourceType,
      recordingStartedAt,
      recordingState,
      recordingStoppedAt,
    ],
  );

  useEffect(() => {
    const stream = previewStreamToShow ?? firstLiveVideoStream;
    if (!stream?.getAudioTracks().length) {
      setAudioLevel(0);
      return;
    }
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const audioContext = new AudioContextConstructor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      const peak = data.reduce((max, value) => Math.max(max, Math.abs(value - 128)), 0);
      setAudioLevel(Math.min(100, Math.round((peak / 64) * 100)));
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.cancelAnimationFrame(frame);
      source.disconnect();
      void audioContext.close();
    };
  }, [firstLiveVideoStream, previewStreamToShow]);
  const liveAudioChannels = useMemo<AudioChannel[]>(() => {
    const entries = Object.entries(liveSourceStreams).filter(([, stream]) =>
      stream.getAudioTracks().some((track) => track.readyState === 'live'),
    );
    return entries.map(([sourceId]) => ({
      id: `live-${sourceId}`,
      label: findSourceName(sourceId, sorted) ?? `Live Source (${sourceId.slice(0, 8)})`,
      level: audioLevel,
      muted: false,
      kind: 'mic' as const,
    }));
  }, [audioLevel, liveSourceStreams, sorted]);

  const effectiveAudioChannels = useMemo(
    () => [...channels, ...liveAudioChannels],
    [channels, liveAudioChannels],
  );

  const synchronizedOutputs = ProgramPreviewSynchronizer.fromSwitchingState(productionState);
  const activeSceneTallyState = getTallyState({
    id: activeScene.id,
    programId: synchronizedOutputs.program.sceneId,
    previewId: synchronizedOutputs.preview.sceneId,
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
    if (isBrowserRendererEnabled(process.env)) {
      const browserAdapter = new BrowserRendererAdapter(
        new BrowserMediaRenderer({ target: 'preview' }),
        'mock_live',
      );
      engine.registerAdapter(browserAdapter, createBrowserRendererAdapterMetadata(browserAdapter));
    }
    engine.setExecutionRuntimeMode('mock_live');
    return engine;
  }, []);
  const [productionGraphSession, setProductionGraphSession] = useState(() =>
    createProductionGraphSessionFromScenes({
      scenes: sorted,
      productionState: initialProductionState,
      broadcastId: programScene.broadcastId,
    }),
  );
  const productionGraphDispatcher = useMemo(
    () => new LocalProductionCommandDispatcher(productionGraphSession, mediaExecutionEngine),
    [productionGraphSession, mediaExecutionEngine],
  );
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
      const transition = productionGraphDispatcher.dispatch({
        id: `ui-${type.toLowerCase()}-${Date.now()}`,
        type,
        broadcastSessionId: programScene.broadcastId,
        actorId: 'local-director',
        actorRole: 'DIRECTOR',
        timestamp: new Date().toISOString(),
        payload,
      });
      setProductionGraphSession(productionGraphDispatcher.getSession());
      return transition;
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
    new SceneSelectionController(dispatchProductionGraphCommand).select(sceneId);
    runtime.dispatch(PreviewCommand(sceneId, 'local-director'));
    setRuntimeView({ ...runtime.state });
    persistProductionState({ ...productionState, previewSceneId: sceneId }, 'stage');
  };
  const switchProgram = (type: TransitionType) => {
    if (type === 'cut') runtime.dispatch(CutCommand('local-director'));
    else runtime.dispatch(AutoCommand('local-director'));
    setRuntimeView({ ...runtime.state });
    new TransitionController(dispatchProductionGraphCommand).execute(
      type,
      productionState.previewSceneId,
      normalizeTransitionDuration(type, productionState.transitionDuration),
    );
    const duration = normalizeTransitionDuration(type, productionState.transitionDuration);
    const label =
      type === 'cut'
        ? 'Cut Executed'
        : type === 'fade'
          ? 'Fade Executed'
          : `${type.toUpperCase()} Executed`;
    const historyLabel = type === 'cut' ? 'CUT' : type === 'fade' ? 'AUTO' : type.toUpperCase();
    setLastTransitionLabel(label);
    setTransitionHistory((current) => [historyLabel, ...current].slice(0, 8));
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
    if (isLiveMediaStream(previewStreamToShow)) {
      setProgramStreamOnAir(true);
    }
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
    void activeRouteCount;
    return {
      fps: 'unavailable',
      cpu: 'unavailable',
      dropped: 'unavailable',
      upload: 'unavailable',
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
      { id: 'recording', label: 'Recording', value: 'idle', status: 'warning' as const },
      {
        id: 'streaming',
        label: 'Streaming',
        value: activeRouteCount > 0 ? 'routes active' : 'not configured',
        status: 'warning' as const,
      },
      {
        id: 'webrtc',
        label: 'WebRTC',
        value: `${multiviewActiveRouteCount} routes`,
        status: 'good' as const,
      },
    ],
    [activeRouteCount, multiviewActiveRouteCount, safeHealthMetrics],
  );

  const [activeNav, setActiveNav] = useState<NavItemId>('dashboard');
  const [activeSourceDockTab, setActiveSourceDockTab] = useState<SourceDockTabId>('scenes');
  const [activeBottomDock, setActiveBottomDock] = useState<DockTabId>('audio');
  const [activeOperationsTab, setActiveOperationsTab] = useState<OperationsTabId>('guests');
  const [professionalRightTab, setProfessionalRightTab] = useState<
    'guests' | 'outputs' | 'chat' | 'inspector' | 'health' | 'smoke'
  >('guests');
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const safeAreaToggles = workspace.safeAreaToggles;
  const [graphicsState, dispatchGraphics] = useReducer(
    graphicsCompositionReducer,
    initialGraphicsCompositionState,
  );
  const [mediaState, dispatchMedia] = useReducer(
    mediaCompositionReducer,
    initialMediaCompositionState,
  );
  const [selectedGraphicsLayerId, setSelectedGraphicsLayerId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedMediaAssetId, setSelectedMediaAssetId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedReplayClipId, setSelectedReplayClipId] = useState<string | null>(null);
  const [collaborationState, dispatchCollaboration] = useReducer(
    collaborationReducer,
    initialCollaborationState,
  );
  const [automationState, dispatchAutomation] = useReducer(
    automationReducer,
    createInitialAutomationState(
      enrichRunOfShowWithSampleCues(createDefaultRunOfShow()),
      createSampleMacros(),
    ),
  );
  const [aiState, dispatchAI] = useReducer(
    aiReducer,
    createInitialAIState({
      assistant: createDefaultAIAssistantState(),
      recommendations: createSampleAIRecommendations(),
      riskSignals: createSampleAIRiskSignals(),
    }),
  );
  const distributionManifest = useMemo(() => createDistributionManifest(), []);
  const [distributionState, dispatchDistribution] = useReducer(
    distributionReducer,
    createInitialDistributionState({
      destinations: distributionManifest.destinations,
      streamProfiles: distributionManifest.streamProfiles,
      outputRoutes: distributionManifest.outputRoutes,
      outputHealth: createSampleOutputHealth(distributionManifest.destinations),
    }),
  );
  const deviceManifest = useMemo(() => createDeviceManifest(), []);
  const [deviceState, dispatchDevice] = useReducer(
    deviceReducer,
    createInitialDeviceState(deviceManifest),
  );
  const [lowerThirdTemplates, setLowerThirdTemplates] = useState<LowerThirdTemplate[]>(() => [
    createDefaultLowerThirdTemplate('Broadcast Lower Third'),
    ...createBuiltInLowerThirdTemplates(),
  ]);

  const updateActiveSources = (updater: (sources: SceneSource[]) => SceneSource[]) => {
    refresh(
      sorted.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, sources: updater([...scene.sources].sort((a, b) => a.order - b.order)) }
          : scene,
      ),
    );
  };

  const activateDirectCamera = useCallback(async () => {
    setProgramStreamOnAir(false);
    await startCameraCapture(SMOKE_CAMERA_SOURCE_ID);
  }, [startCameraCapture]);

  const graphicsAssets = useMemo(
    () => assets.filter((asset) => ['overlay', 'lower_third', 'background'].includes(asset.type)),
    [assets],
  );

  const binMediaAssets = useMemo(
    () => assets.filter((asset) => ['video', 'image', 'audio'].includes(asset.type)),
    [assets],
  );

  const previewSceneComposition = useMemo(
    () => ensureSceneComposition(graphicsState.compositions, previewScene.id),
    [graphicsState.compositions, previewScene.id],
  );

  const programSceneComposition = useMemo(
    () => ensureSceneComposition(graphicsState.compositions, programScene.id),
    [graphicsState.compositions, programScene.id],
  );

  const previewSceneMediaComposition = useMemo(
    () => ensureSceneMediaComposition(mediaState.compositions, previewScene.id),
    [mediaState.compositions, previewScene.id],
  );

  useEffect(() => {
    const registered = binMediaAssets.map((asset) =>
      productionAssetToMediaAsset(asset, previewScene.id),
    );
    dispatchMedia({ type: 'REGISTER_ASSETS', sceneId: previewScene.id, assets: registered });
  }, [binMediaAssets, previewScene.id]);

  const collaborationDemoEnabled = isCollaborationDemoEnabled();
  const remoteProductionOperators = useMemo(() => {
    if (collaborationDemoEnabled) {
      return createMockCollaborationOperators(productionGraphSession.graph.metadata.revision).map(
        (operator) => mapCollaborationOperatorToPresence(operator, true),
      );
    }
    return [
      createLocalOperatorPresence({
        workspaceId: selectedWorkspace,
        currentPanel: activeOperationsTab,
      }),
    ];
  }, [
    collaborationDemoEnabled,
    productionGraphSession.graph.metadata.revision,
    selectedWorkspace,
    activeOperationsTab,
  ]);

  const remoteProductionLocks = useMemo(
    () => authorityDiagnostics.activeLocks.map(mapAuthorityLockToProductionLock),
    [authorityDiagnostics.activeLocks],
  );

  const remoteProductionEvents = useMemo(
    () => conflictsToEvents(authorityDiagnostics.conflicts),
    [authorityDiagnostics.conflicts],
  );

  useEffect(() => {
    dispatchCollaboration({
      type: 'SET_REMOTE_PRODUCTION',
      state: buildRemoteProductionState({
        operators: remoteProductionOperators,
        locks: remoteProductionLocks,
        notes: collaborationState.remoteProduction.notes,
        events: remoteProductionEvents,
        collaborationEnabled: collaborationDemoEnabled || remoteProductionOperators.length > 0,
      }),
    });
  }, [
    remoteProductionOperators,
    remoteProductionLocks,
    remoteProductionEvents,
    collaborationDemoEnabled,
  ]);

  const programMediaOverlayItems = useMemo(
    () => getProgramMediaOverlayItems(previewSceneMediaComposition),
    [previewSceneMediaComposition],
  );

  const previewMediaOverlayItems = useMemo(
    () => getPreviewMediaOverlayItems(previewSceneMediaComposition),
    [previewSceneMediaComposition],
  );

  const graphicsWorkspaceContent = (
    <GraphicsWorkspace
      sceneId={previewScene.id}
      sceneName={previewScene.name}
      composition={previewSceneComposition}
      assets={assets}
      templates={lowerThirdTemplates}
      brandKit={null}
      selectedLayerId={selectedGraphicsLayerId}
      onSelectLayer={setSelectedGraphicsLayerId}
      dispatch={dispatchGraphics}
    />
  );

  const mediaWorkspaceContent = (
    <MediaWorkspace
      sceneId={previewScene.id}
      sceneName={previewScene.name}
      composition={previewSceneMediaComposition}
      assets={binMediaAssets}
      selectedAssetId={selectedMediaAssetId}
      selectedClipId={selectedClipId}
      selectedReplayClipId={selectedReplayClipId}
      onSelectAsset={setSelectedMediaAssetId}
      onSelectClip={setSelectedClipId}
      onSelectReplayClip={setSelectedReplayClipId}
      dispatch={dispatchMedia}
    />
  );

  const collaborationWorkspaceContent = (
    <CollaborationWorkspace
      state={collaborationState.remoteProduction}
      guests={guests}
      invites={invites}
      routes={mediaRoutes}
      messages={messages}
      activeRouteCount={activeRouteCount}
      outputHealth={safeHealthMetrics.upload}
      productionStatus={productionGraphSession.status}
      recoveryStatus={selectHealthSummary(productionGraphSession.graph).status}
      conflictCount={authorityDiagnostics.conflicts.length}
      dispatch={dispatchCollaboration}
    />
  );

  const automationWorkspaceContent = (
    <AutomationWorkspace state={automationState} dispatch={dispatchAutomation} />
  );

  const aiSummaryLines = useMemo(
    () =>
      getProductionSummaryLines({
        programSceneName: programScene.name,
        previewSceneName: previewScene.name,
        guestCount: guests.length,
        ...(getCurrentSegment(automationState.runOfShow)?.name
          ? { automationSegmentName: getCurrentSegment(automationState.runOfShow)!.name }
          : {}),
        riskCount: aiState.riskSignals.length,
        recommendationCount: getSuggestedRecommendations(aiState.recommendations).length,
      }),
    [
      programScene.name,
      previewScene.name,
      guests.length,
      automationState.runOfShow,
      aiState.riskSignals.length,
      aiState.recommendations,
    ],
  );

  const aiWorkspaceContent = (
    <AIAssistantWorkspace state={aiState} dispatch={dispatchAI} summaryLines={aiSummaryLines} />
  );

  const distributionWorkspaceContent = (
    <DistributionWorkspace state={distributionState} dispatch={dispatchDistribution} />
  );

  const deviceWorkspaceContent = (
    <DeviceManagerWorkspace state={deviceState} dispatch={dispatchDevice} />
  );

  const replayWorkspacePanels = useMemo(
    () => ({
      clipBrowser: (
        <ClipBrowser
          clips={previewSceneMediaComposition.clips}
          assets={previewSceneMediaComposition.assets}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          onSendToPreview={(clipId) =>
            dispatchMedia({ type: 'SEND_CLIP_TO_PREVIEW', sceneId: previewScene.id, clipId })
          }
          onTakeLive={(clipId) =>
            dispatchMedia({ type: 'TAKE_CLIP_TO_PROGRAM', sceneId: previewScene.id, clipId })
          }
          onDuplicate={(clipId) =>
            dispatchMedia({ type: 'DUPLICATE_CLIP', sceneId: previewScene.id, clipId })
          }
          onRemove={(clipId) => {
            dispatchMedia({ type: 'REMOVE_CLIP', sceneId: previewScene.id, clipId });
            if (selectedClipId === clipId) setSelectedClipId(null);
          }}
        />
      ),
      playlist: (
        <PlaylistManager
          playlists={previewSceneMediaComposition.playlists}
          assets={previewSceneMediaComposition.assets}
          clips={previewSceneMediaComposition.clips}
          onCreatePlaylist={() =>
            dispatchMedia({
              type: 'CREATE_PLAYLIST',
              sceneId: previewScene.id,
              name: 'Replay Playlist',
            })
          }
          onClearPlaylist={(playlistId) =>
            dispatchMedia({ type: 'CLEAR_PLAYLIST', sceneId: previewScene.id, playlistId })
          }
        />
      ),
      replay: (
        <ReplayWorkspace
          replayBuffer={previewSceneMediaComposition.replayBuffer}
          replayClips={previewSceneMediaComposition.replayClips}
          selectedReplayClipId={selectedReplayClipId}
          onSelectReplayClip={setSelectedReplayClipId}
          onSendToPreview={(clipId) =>
            dispatchMedia({ type: 'SEND_REPLAY_TO_PREVIEW', sceneId: previewScene.id, clipId })
          }
          onTakeLive={(clipId) =>
            dispatchMedia({ type: 'TAKE_REPLAY_TO_PROGRAM', sceneId: previewScene.id, clipId })
          }
        />
      ),
    }),
    [previewSceneMediaComposition, previewScene.id, selectedClipId, selectedReplayClipId],
  );

  const outputViewModeLabel =
    outputViewModes.find((mode) => mode.value === viewMode)?.label ?? viewMode;

  const graphHealth = useMemo(
    () => selectHealthSummary(productionGraphSession.graph),
    [productionGraphSession.graph],
  );

  const productionPipeline = useMemo(
    () =>
      createProductionPipelineModel(productionGraphSession.graph, productionGraphSession.eventLog),
    [productionGraphSession.graph, productionGraphSession.eventLog],
  );

  const operationsInspectorSelection = useMemo((): OperationsInspectorSelection => {
    if (selectedSourceId) {
      const previewMatch = previewScene.sources.find((source) => source.id === selectedSourceId);
      if (previewMatch) {
        return { kind: 'source', source: previewMatch, sceneName: previewScene.name };
      }
      const programMatch = programScene.sources.find((source) => source.id === selectedSourceId);
      if (programMatch) {
        return { kind: 'source', source: programMatch, sceneName: programScene.name };
      }
    }

    if (selectedRouteId) {
      const route = mediaRoutes.find((item) => item.id === selectedRouteId);
      if (route) {
        const pipelineRoute = productionPipeline.state.outputRouting.find(
          (item) => item.label === route.displayName || item.id === route.id,
        );
        if (pipelineRoute) {
          return { kind: 'pipeline-route', route: pipelineRoute };
        }
        return { kind: 'route', route };
      }
    }

    if (selectedGraphicsLayerId) {
      const layer = previewSceneComposition.layers.find((item) => item.id === selectedGraphicsLayerId);
      if (layer) {
        return {
          kind: 'graphics-layer',
          layerId: layer.id,
          layerName: layer.name,
        };
      }
    }

    if (selectedMediaAssetId) {
      const asset = previewSceneMediaComposition.assets.find(
        (item) => item.id === selectedMediaAssetId,
      );
      if (asset) {
        return {
          kind: 'media-asset',
          assetId: asset.id,
          assetName: asset.name,
        };
      }
    }

    return null;
  }, [
    selectedSourceId,
    selectedRouteId,
    selectedGraphicsLayerId,
    selectedMediaAssetId,
    previewScene,
    programScene,
    mediaRoutes,
    productionPipeline,
    previewSceneComposition.layers,
    previewSceneMediaComposition.assets,
  ]);

  const handleSelectSource = useCallback((sourceId: string) => {
    setSelectedSourceId(sourceId);
    setActiveOperationsTab('inspector');
  }, []);

  const operationsPanels = useMemo(
    () =>
      OperationsConsoleContent({
        broadcastId,
        workspaceId,
        guests,
        invites,
        scenes: sorted,
        routes: mediaRoutes,
        destinations,
        messages,
        streamHealthMetrics: streamHealthMetrics.length
          ? streamHealthMetrics
          : multiviewHealthMetrics,
        programScene,
        previewScene,
        graphRevision:
          persistenceDiagnostics.currentGraphRevision ??
          productionGraphSession.graph.metadata.revision,
        outputViewMode: outputViewModeLabel,
        sourceCount: previewScene.sources.length,
        warnings: transitionActive ? ['Transition active'] : [],
        runtimeStatus: productionGraphSession.status,
        recoveryStatus: graphHealth.status,
        commandCount: productionGraphSession.commandLog.length,
        eventCount: productionGraphSession.eventLog.length,
        activeLocks: authorityDiagnostics.activeLocks.length,
        conflicts: authorityDiagnostics.conflicts.length,
        unavailableSubsystems: [
          safeHealthMetrics.fps === 'unavailable' ? 'FPS telemetry' : null,
          safeHealthMetrics.cpu === 'unavailable' ? 'CPU telemetry' : null,
        ].filter((item): item is string => Boolean(item)),
        previewMonitor: (
          <PreviewMonitorCompact
            scene={previewScene}
            routes={mediaRoutes}
            layoutPreset={layoutPreset}
            guests={guests}
            graph={productionGraphSession.graph}
            healthFps={safeHealthMetrics.fps}
            showSafeAreas={showSafeAreas}
          />
        ),
        collaborationState,
        collaborationConflictCount: authorityDiagnostics.conflicts.length,
        onCollaborationDispatch: dispatchCollaboration,
        automationState,
        onAutomationDispatch: dispatchAutomation,
        aiState,
        onAIDispatch: dispatchAI,
        aiSummaryLines,
        distributionState,
        onDistributionDispatch: dispatchDistribution,
        deviceState,
        onDeviceDispatch: dispatchDevice,
        runtimeState: runtimeView,
        runtimeHealth: runtime.session.health(),
        runtimeSnapshots: runtime.session.history.history,
        browserRecordingState: browserRecordingPanelState,
        browserStreamingState: streamingState,
        onStreamingDispatch: dispatchStreaming,
        onStartBrowserRecording: startSmokeRecording,
        onStopBrowserRecording: stopSmokeRecording,
        pipeline: productionPipeline,
        inspectorSelection: operationsInspectorSelection,
      }),
    [
      broadcastId,
      workspaceId,
      guests,
      invites,
      sorted,
      mediaRoutes,
      destinations,
      messages,
      streamHealthMetrics,
      multiviewHealthMetrics,
      programScene,
      previewScene,
      persistenceDiagnostics.currentGraphRevision,
      productionGraphSession,
      outputViewModeLabel,
      transitionActive,
      graphHealth.status,
      authorityDiagnostics,
      safeHealthMetrics,
      layoutPreset,
      showSafeAreas,
      collaborationState,
      automationState,
      aiState,
      aiSummaryLines,
      distributionState,
      deviceState,
      runtimeView,
      runtime,
      browserRecordingPanelState,
      streamingState,
      dispatchStreaming,
      startSmokeRecording,
      stopSmokeRecording,
      productionPipeline,
      operationsInspectorSelection,
    ],
  );

  const operationsTabsResolved = useMemo(() => {
    if (operationsTabs?.length) return operationsTabs;
    const panelIds: OperationsTabId[] = [
      'guests',
      'team',
      'automation',
      'devices',
      'engine',
      'compositor',
      'runtime',
      'recording',
      'streaming',
      'security',
      'monitoring',
      'cluster',
      'plugins',
      'cloud',
      'analytics',
      'enterprise-admin',
      'inspector',
      'routing',
      'outputs',
      'health',
      'preview',
      'logs',
      'ai-director',
      'ai',
    ];
    return panelIds.map((id) => ({
      id,
      content: operationsPanels[id],
    }));
  }, [operationsTabs, operationsPanels]);

  const previewMonitor = (
    <PreviewMonitorCompact
      scene={previewScene}
      routes={mediaRoutes}
      layoutPreset={layoutPreset}
      guests={guests}
      graph={productionGraphSession.graph}
      healthFps={safeHealthMetrics.fps}
      showSafeAreas={showSafeAreas}
      graphicsLayers={previewSceneComposition.layers.filter(
        (layer) => layer.previewState === 'preview' || layer.programState === 'live',
      )}
      mediaOverlayItems={previewMediaOverlayItems}
    />
  );

  const toolsMenu = null;

  const graphAudioChannels = useMemo(
    () => selectAudioChannels(productionGraphSession.graph),
    [productionGraphSession.graph],
  );

  const recordingActive = useMemo(
    () => selectRecordingState(productionGraphSession.graph).status === 'recording',
    [productionGraphSession.graph],
  );

  const workspaceMonitorContext = useMemo(
    () => ({
      programScene,
      previewScene,
      routes: mediaRoutes,
      layoutPreset,
      guests,
      channels,
      healthMetrics: multiviewHealthMetrics,
      graph: productionGraphSession.graph,
      healthFps: safeHealthMetrics.fps,
      showSafeAreas,
      safeAreaToggles,
      programGraphicsLayers: programSceneComposition.layers.filter(
        (layer) => layer.programState === 'live',
      ),
      previewGraphicsLayers: previewSceneComposition.layers.filter(
        (layer) => layer.previewState === 'preview',
      ),
      programMediaOverlayItems,
      previewMediaOverlayItems,
      replayBuffer: previewSceneMediaComposition.replayBuffer,
      ...(collaborationState.remoteProduction.operators.find(
        (operator) => operator.role === 'director',
      )?.name
        ? {
            collaborationDirectorName: collaborationState.remoteProduction.operators.find(
              (operator) => operator.role === 'director',
            )!.name,
          }
        : {}),
      collaborationLockCount: collaborationState.remoteProduction.locks.filter(
        (lock) => Date.parse(lock.expiresAt) > Date.now(),
      ).length,
      collaborationOpenNoteCount: collaborationState.remoteProduction.notes.filter(
        (note) => note.status === 'open',
      ).length,
      ...(collaborationState.remoteProduction.operators.find((operator) =>
        operator.currentPanel?.toLowerCase().includes('preview'),
      )?.name
        ? {
            collaborationPreviewChangedBy: collaborationState.remoteProduction.operators.find(
              (operator) => operator.currentPanel?.toLowerCase().includes('preview'),
            )!.name,
          }
        : {}),
      ...(getCurrentSegment(automationState.runOfShow)?.name
        ? { automationCurrentSegmentName: getCurrentSegment(automationState.runOfShow)!.name }
        : {}),
      ...(getNextSegment(automationState.runOfShow)?.name
        ? { automationNextSegmentName: getNextSegment(automationState.runOfShow)!.name }
        : {}),
      automationModeLabel: automationModeLabel(automationState.automationMode),
    }),
    [
      programScene,
      previewScene,
      mediaRoutes,
      layoutPreset,
      guests,
      channels,
      multiviewHealthMetrics,
      productionGraphSession.graph,
      safeHealthMetrics.fps,
      showSafeAreas,
      safeAreaToggles,
      previewSceneComposition,
      programSceneComposition,
      programMediaOverlayItems,
      previewMediaOverlayItems,
      previewSceneMediaComposition.replayBuffer,
      collaborationState.remoteProduction,
      automationState,
    ],
  );

  const mixerSources = useMemo(() => {
    const liveEntries = Object.entries(liveSourceStreams)
      .filter(([, stream]) =>
        stream.getAudioTracks().some((track) => track.readyState === 'live'),
      )
      .map(([sourceId, stream]) => {
        const source = sorted
          .flatMap((scene) => scene.sources)
          .find((item) => item.id === sourceId);
        return {
          id: sourceId,
          name: source?.name ?? findSourceName(sourceId, sorted) ?? `Source ${sourceId.slice(0, 8)}`,
          type: toMixerSourceType(source?.type),
          stream,
        };
      });

    const staticChannels = [
      { id: 'media', name: 'Media Playback', type: 'media' as const, stream: null },
      { id: 'browser', name: 'Browser Source', type: 'browser' as const, stream: null },
      { id: 'guest', name: 'Guest Audio', type: 'guest' as const, stream: null },
      { id: 'master', name: 'Master Output', type: 'master' as const, stream: null },
    ];

    return liveEntries.length > 0 ? [...liveEntries, ...staticChannels] : staticChannels;
  }, [liveSourceStreams, sorted]);

  const routingEdges = useMemo<RoutingMatrixEdge[]>(
    () =>
      mediaRoutes.map((route) => {
        const gain =
          typeof route.metadata.gainDb === 'number' ? route.metadata.gainDb : undefined;
        return {
          id: route.id,
          sourceId: route.sourceId ?? route.id,
          sourceLabel: route.displayName,
          destinationId: route.routeType,
          destinationLabel: route.routeType.replace(/_/g, ' '),
          active: route.isActive,
          ...(gain !== undefined ? { gain } : {}),
        };
      }),
    [mediaRoutes],
  );

  const diagnosticsMetrics = useMemo<DiagnosticMetric[]>(
    () =>
      buildSystemStatusMetrics({
        fps: String(safeHealthMetrics.fps),
        cpu: String(safeHealthMetrics.cpu),
        dropped: String(safeHealthMetrics.dropped),
        upload: String(safeHealthMetrics.upload),
        recordingState,
        streamingLifecycle: streamingState.lifecycle,
        activeRouteCount,
        graph: productionGraphSession.graph,
        pipelineHealth: productionPipeline.health,
      }),
    [
      safeHealthMetrics,
      recordingState,
      streamingState.lifecycle,
      activeRouteCount,
      productionGraphSession.graph,
      productionPipeline.health,
    ],
  );

  const leftNavContent = (
    <SourceDockPanel
      activeTab={activeSourceDockTab}
      scenes={sorted}
      sceneTypes={sceneTypes}
      guests={guests}
      programSceneId={productionState.programSceneId}
      previewSceneId={productionState.previewSceneId}
      previewScene={previewScene}
      previewSceneName={previewScene.name}
      sourceTypes={sourceTypes}
      tallyState={activeSceneTallyState}
      layouts={layouts}
      assets={assets}
      mediaRouteCount={mediaRoutes.length}
      isPending={isPending}
      directCameraLive={directCameraLive}
      diagnosticsMetrics={diagnosticsMetrics}
      onSceneAdd={(data) => {
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
      onSceneRename={(sceneId, name) => {
        const formData = new FormData();
        formData.set('sceneId', sceneId);
        formData.set('name', name);
        refresh(sorted.map((scene) => (scene.id === sceneId ? { ...scene, name } : scene)));
        startTransition(async () => {
          await renameScene(formData);
        });
      }}
      onSceneSwitch={(sceneId) => {
        stageScene(sceneId);
      }}
      onSceneDuplicate={(sceneId) => {
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
      onSceneDelete={(sceneId) => {
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
      onSourceAdd={(input) => {
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
          settings:
            input.settings ??
            (input.type === 'camera' || input.type === 'screen'
              ? { runtimeStatus: 'connecting' }
              : input.type === 'browser'
                ? {
                    runtimeStatus: input.url ? 'loading' : 'failed',
                    url: input.url ?? null,
                    muted: true,
                    lastLoadedAt: null,
                    message: input.url
                      ? 'Browser source is loading.'
                      : 'Enter a valid http:// or https:// URL for this Browser source.',
                    iframeBlockedWarning:
                      'Some sites block iframe embedding. If the preview stays blank, try another page or use screen capture.',
                  }
                : {}),
          transform: {},
        };
        updateActiveSources((sources) => [...sources, tempSource]);
        const formData = new FormData();
        formData.set('sceneId', input.sceneId);
        formData.set('name', input.name);
        formData.set('type', input.type);
        if (input.url) formData.set('url', input.url);
        if (input.type === 'camera') void startCameraCapture(tempSource.id);
        else if (input.type === 'screen') void startScreenCapture(tempSource.id);
        else if (input.type === 'audio') void startSmokeCapture(tempSource.id);
        startTransition(async () => {
          await addSource(formData);
        });
      }}
      onSourceRename={(sourceId, name) => {
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
      onSourceDuplicate={(sourceId) => {
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
      onSourceDelete={(sourceId) => {
        stopLiveSourceStream(sourceId);
        updateActiveSources((sources) =>
          sources
            .filter((source) => source.id !== sourceId)
            .map((source, order) => ({ ...source, order })),
        );
        startTransition(async () => {
          await deleteSource(sourceId);
        });
      }}
      onSourceToggleVisibility={(sourceId) => {
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
      onReloadBrowserSource={(sourceId) => {
        updateActiveSources((sources) =>
          sources.map((source) =>
            source.id === sourceId
              ? {
                  ...source,
                  settings: {
                    ...source.settings,
                    runtimeStatus: 'loading',
                    reloadNonce: Date.now(),
                    lastLoadedAt: null,
                  },
                }
              : source,
          ),
        );
      }}
      onSourceToggleMute={(sourceId) => {
        updateActiveSources((sources) =>
          sources.map((source) =>
            source.id === sourceId
              ? {
                  ...source,
                  muted: !(source.muted || source.settings?.muted !== false),
                  settings: {
                    ...source.settings,
                    muted: !(source.muted || source.settings?.muted !== false),
                  },
                }
              : source,
          ),
        );
      }}
      onSourceToggleLock={(sourceId) => {
        updateActiveSources((sources) =>
          sources.map((source) =>
            source.id === sourceId ? { ...source, isLocked: !source.isLocked } : source,
          ),
        );
        startTransition(async () => {
          await toggleSourceLock(sourceId);
        });
      }}
      onGraphicsAddToScene={(asset) =>
        dispatchGraphics({ type: 'ADD_LAYER', sceneId: previewScene.id, asset })
      }
      graphicsTemplates={lowerThirdTemplates}
      mediaAssets={previewSceneMediaComposition.assets}
      mediaComposition={previewSceneMediaComposition}
      selectedMediaAssetId={selectedMediaAssetId}
      selectedReplayClipId={selectedReplayClipId}
      selectedSourceId={selectedSourceId}
      onSelectMediaAsset={setSelectedMediaAssetId}
      onSelectReplayClip={setSelectedReplayClipId}
      onSelectSource={handleSelectSource}
    />
  );

  const operationsSections = useMemo((): OperationsDockSection[] => {
    const recordingBadge =
      recordingState === 'recording' || browserRecordingPanelState.state === 'recording'
        ? 'REC'
        : undefined;
    const streamingBadge =
      streamingState.lifecycle === 'streaming' || streamingState.lifecycle === 'connecting'
        ? 'LIVE'
        : undefined;

    return [
      {
        id: 'unified-chat',
        content: operationsPanels.logs,
        ...(messages.length ? { badge: String(messages.length) } : {}),
        defaultCollapsed: true,
      },
      {
        id: 'guests',
        content: operationsPanels.guests,
        ...(guests.length ? { badge: String(guests.length) } : {}),
      },
      {
        id: 'inspector',
        content: operationsPanels.inspector,
        ...(operationsInspectorSelection ? { badge: '●' } : {}),
      },
      {
        id: 'recording',
        content: operationsPanels.recording,
        ...(recordingBadge ? { badge: recordingBadge } : {}),
      },
      {
        id: 'streaming',
        content: operationsPanels.streaming,
        ...(streamingBadge ? { badge: streamingBadge } : {}),
      },
      {
        id: 'outputs',
        content: operationsPanels.outputs,
        defaultCollapsed: true,
      },
      {
        id: 'telemetry',
        content: <DiagnosticsSummary metrics={diagnosticsMetrics} />,
        defaultCollapsed: true,
      },
      {
        id: 'system-health',
        content: operationsPanels.health,
        defaultCollapsed: true,
      },
    ];
  }, [
    operationsPanels,
    messages.length,
    guests.length,
    operationsInspectorSelection,
    recordingState,
    browserRecordingPanelState.state,
    streamingState.lifecycle,
    diagnosticsMetrics,
  ]);

  const bottomDockContent = (
    <>
      {activeBottomDock === 'layers' ? (
        activeScene.sources.length ? (
          <div className="grid gap-1 px-ubos-2 py-ubos-2 text-ubos-caption text-ubos-fg-secondary">
            {activeScene.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-ubos-sm bg-ubos-midnight px-2 py-1"
              >
                <span className="ubos-truncate">{source.name}</span>
                <span className="font-mono text-ubos-metadata text-ubos-fg-muted">
                  {source.isVisible ? 'READY' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-ubos-2 py-ubos-2">
            <DockPanelEmpty message="No layers in preview scene." />
          </div>
        )
      ) : null}
      {activeBottomDock === 'audio' ? (
        <ProfessionalAudioMixer sources={mixerSources} compact />
      ) : null}
      {activeBottomDock === 'graphics' ? (
        <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden px-ubos-2 py-ubos-2">
          <GraphicsPreviewControls
            previewCount={previewSceneComposition.previewLayerIds.length}
            programCount={previewSceneComposition.programLayerIds.length}
            onSendToPreview={() => {
              if (selectedGraphicsLayerId) {
                dispatchGraphics({
                  type: 'SEND_TO_PREVIEW',
                  sceneId: previewScene.id,
                  layerId: selectedGraphicsLayerId,
                });
              }
            }}
            onTakeLive={() => {
              if (selectedGraphicsLayerId) {
                dispatchGraphics({
                  type: 'TAKE_TO_PROGRAM',
                  sceneId: previewScene.id,
                  layerId: selectedGraphicsLayerId,
                });
              }
            }}
            onRemoveFromProgram={() => {
              if (selectedGraphicsLayerId) {
                dispatchGraphics({
                  type: 'REMOVE_FROM_PROGRAM',
                  sceneId: previewScene.id,
                  layerId: selectedGraphicsLayerId,
                });
              }
            }}
            onClearPreview={() =>
              dispatchGraphics({ type: 'CLEAR_PREVIEW', sceneId: previewScene.id })
            }
            onClearProgram={() =>
              dispatchGraphics({ type: 'CLEAR_PROGRAM', sceneId: previewScene.id })
            }
          />
          <GraphicsLayerStack
            layers={previewSceneComposition.layers}
            assets={graphicsAssets.map((asset) => ({
              id: asset.id,
              name: asset.name,
              type:
                asset.type === 'lower_third'
                  ? 'lower_third'
                  : asset.type === 'overlay'
                    ? 'text'
                    : 'image',
              status:
                asset.status === 'ready'
                  ? 'ready'
                  : asset.status === 'disabled'
                    ? 'disabled'
                    : 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))}
            selectedLayerId={selectedGraphicsLayerId}
            onSelectLayer={setSelectedGraphicsLayerId}
            onToggleVisibility={(layerId) =>
              dispatchGraphics({ type: 'TOGGLE_VISIBILITY', sceneId: previewScene.id, layerId })
            }
            onToggleLock={(layerId) =>
              dispatchGraphics({ type: 'TOGGLE_LOCK', sceneId: previewScene.id, layerId })
            }
            onMoveUp={(layerId) =>
              dispatchGraphics({
                type: 'MOVE_LAYER',
                sceneId: previewScene.id,
                layerId,
                direction: 'up',
              })
            }
            onMoveDown={(layerId) =>
              dispatchGraphics({
                type: 'MOVE_LAYER',
                sceneId: previewScene.id,
                layerId,
                direction: 'down',
              })
            }
            onDuplicate={(layerId) =>
              dispatchGraphics({ type: 'DUPLICATE_LAYER', sceneId: previewScene.id, layerId })
            }
            onRemove={(layerId) => {
              dispatchGraphics({ type: 'REMOVE_LAYER', sceneId: previewScene.id, layerId });
              if (selectedGraphicsLayerId === layerId) setSelectedGraphicsLayerId(null);
            }}
            className="min-h-0 flex-1"
          />
        </div>
      ) : null}
      {activeBottomDock === 'replay' ? (
        <div className="h-full min-h-0 overflow-hidden px-ubos-2 py-ubos-2">
          <ReplayWorkspace
            replayBuffer={previewSceneMediaComposition.replayBuffer}
            replayClips={previewSceneMediaComposition.replayClips}
            selectedReplayClipId={selectedReplayClipId}
            onSelectReplayClip={setSelectedReplayClipId}
            onSendToPreview={(clipId) =>
              dispatchMedia({ type: 'SEND_REPLAY_TO_PREVIEW', sceneId: previewScene.id, clipId })
            }
            onTakeLive={(clipId) =>
              dispatchMedia({ type: 'TAKE_REPLAY_TO_PROGRAM', sceneId: previewScene.id, clipId })
            }
            onAddSampleClip={() =>
              dispatchMedia({
                type: 'ADD_REPLAY_CLIP',
                sceneId: previewScene.id,
                clip: {
                  id: `replay-${Date.now()}`,
                  sourceId: 'program-feed',
                  name: 'Sample Replay Clip',
                  startTimeMs: 0,
                  endTimeMs: 5000,
                  durationMs: 5000,
                  speed: 1,
                  markers: [],
                  angle: 'A',
                  programState: 'idle',
                  previewState: 'idle',
                  status: 'ready',
                },
              })
            }
            className="h-full"
          />
        </div>
      ) : null}
      {activeBottomDock === 'automation' ? (
        <div className="h-full min-h-0 overflow-hidden px-ubos-2 py-ubos-2">
          <AutomationPanel
            state={automationState}
            dispatch={dispatchAutomation}
            className="h-full"
          />
        </div>
      ) : null}
      {activeBottomDock === 'routing' ? (
        <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
          <RoutingPatchMatrix edges={routingEdges} className="max-h-40 shrink-0" />
          <div className="min-h-0 flex-1 overflow-hidden px-ubos-2 pb-ubos-2">
            <RoutingPanel
              broadcastId={broadcastId}
              guests={guests}
              scenes={sorted}
              routes={mediaRoutes}
            />
          </div>
        </div>
      ) : null}
      {activeBottomDock === 'production-graph' ? (
        <div className="space-y-2 px-ubos-2 py-ubos-2">
          <ProductionGraphTreeSummary session={productionGraphSession} />
          <ProductionGraphInspector session={productionGraphSession} />
          <MediaExecutionInspector
            engine={mediaExecutionEngine}
            graph={productionGraphSession.graph}
          />
        </div>
      ) : null}
      {activeBottomDock === 'logs' ? (
        <div className="space-y-2 px-ubos-2 py-ubos-2">
          <LogsPanel messages={messages} />
          {productionGraphSession.eventLog.length ? (
            <div className="rounded-ubos-sm border border-white/6 bg-ubos-midnight p-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ubos-fg-muted">
                Graph Events
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-[10px] text-ubos-fg-secondary">
                {productionGraphSession.eventLog.slice(-12).map((event, index) => (
                  <li key={`${event.type}-${index}`} className="font-mono">
                    rev {event.graphRevision} · {event.type}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {activeBottomDock === 'system-status' ? (
        <SystemStatusWorkspace metrics={diagnosticsMetrics} />
      ) : null}
      {activeBottomDock === 'media' ? (
        <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden px-ubos-2 py-ubos-2">
          <MediaPreviewControls
            previewCount={
              previewSceneMediaComposition.previewAssetIds.length +
              previewSceneMediaComposition.previewClipIds.length
            }
            programCount={
              previewSceneMediaComposition.programAssetIds.length +
              previewSceneMediaComposition.programClipIds.length
            }
            onSendToPreview={() => {
              if (selectedClipId) {
                dispatchMedia({
                  type: 'SEND_CLIP_TO_PREVIEW',
                  sceneId: previewScene.id,
                  clipId: selectedClipId,
                });
              } else if (selectedMediaAssetId) {
                dispatchMedia({
                  type: 'SEND_ASSET_TO_PREVIEW',
                  sceneId: previewScene.id,
                  assetId: selectedMediaAssetId,
                });
              }
            }}
            onTakeLive={() => {
              if (selectedClipId) {
                dispatchMedia({
                  type: 'TAKE_CLIP_TO_PROGRAM',
                  sceneId: previewScene.id,
                  clipId: selectedClipId,
                });
              } else if (selectedMediaAssetId) {
                dispatchMedia({
                  type: 'TAKE_ASSET_TO_PROGRAM',
                  sceneId: previewScene.id,
                  assetId: selectedMediaAssetId,
                });
              }
            }}
            onClearPreview={() =>
              dispatchMedia({ type: 'CLEAR_PREVIEW', sceneId: previewScene.id })
            }
            onClearProgram={() =>
              dispatchMedia({ type: 'CLEAR_PROGRAM', sceneId: previewScene.id })
            }
          />
          <MediaBin
            assets={previewSceneMediaComposition.assets}
            sceneName={previewScene.name}
            selectedAssetId={selectedMediaAssetId}
            onSelectAsset={setSelectedMediaAssetId}
            onAssign={(assetId) =>
              dispatchMedia({ type: 'ASSIGN_ASSET_TO_SCENE', sceneId: previewScene.id, assetId })
            }
            onSendToPreview={(assetId) =>
              dispatchMedia({ type: 'SEND_ASSET_TO_PREVIEW', sceneId: previewScene.id, assetId })
            }
            onTakeLive={(assetId) =>
              dispatchMedia({ type: 'TAKE_ASSET_TO_PROGRAM', sceneId: previewScene.id, assetId })
            }
            onRemove={(assetId) =>
              dispatchMedia({ type: 'REMOVE_ASSET', sceneId: previewScene.id, assetId })
            }
            className="min-h-0 flex-1"
          />
        </div>
      ) : null}
      {activeBottomDock === 'collaboration' ? (
        <div className="h-full min-h-0 overflow-hidden px-ubos-2 py-ubos-2">
          <TeamPanel
            state={collaborationState.remoteProduction}
            conflictCount={authorityDiagnostics.conflicts.length}
            dispatch={dispatchCollaboration}
            className="h-full"
          />
        </div>
      ) : null}
    </>
  );

  const layoutStyle = {
    '--ubos-status-bar-height': statusBarHeightForLayout(workspace.compactChrome),
    '--ubos-switcher-height': switcherHeightForLayout(
      workspace.layoutFocus,
      workspace.compactChrome,
    ),
  } as CSSProperties;

  const rightTabContent = {
    guests: operationsPanels.guests,
    outputs: operationsPanels.outputs,
    chat: (
      <div className="space-y-2 text-ubos-caption text-ubos-fg-secondary">
        {messages.length ? (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-2"
            >
              <div className="font-bold text-ubos-fg-primary">{message.authorName}</div>
              <div>{message.body}</div>
            </div>
          ))
        ) : (
          <div className="rounded-ubos-md border border-dashed border-ubos-border-subtle p-4 text-center">
            No chat messages yet.
          </div>
        )}
      </div>
    ),
    inspector: operationsPanels.inspector,
    health: operationsPanels.health,
    smoke: (
      <div className="space-y-ubos-2">
        <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-3">
          <p className="text-ubos-caption font-black uppercase tracking-[0.16em] text-ubos-fg-primary">
            UBOS 3.1 Client-Ready Media Smoke Test
          </p>
          <p className="mt-1 text-ubos-caption text-ubos-fg-muted">
            Browser camera, microphone, preview/program, audio meter, and WebM recording run
            locally. RTMP streaming is unavailable until a real backend is configured.
          </p>
        </div>
        <div className="grid gap-1">
          <SmokeCheck label="Camera active" ok={directCameraLive} />
          <SmokeCheck
            label="Microphone active"
            ok={Boolean(
              firstLiveVideoStream?.getAudioTracks().some((t) => t.readyState === 'live'),
            )}
          />
          <SmokeCheck label="Preview visible" ok={livePreviewVisible} />
          <SmokeCheck label="Program visible" ok={liveProgramVisible} />
          <SmokeCheck label="Audio meter moving" ok={audioLevel > 2} />
          <SmokeCheck label="Recording works" ok={recordingState === 'completed'} />
          <SmokeCheck label="No camera errors" ok={!cameraCaptureError} />
        </div>
        <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-3">
          <div className="mb-2 flex items-center justify-between text-ubos-caption text-ubos-fg-secondary">
            <span>Mic level</span>
            <span>{audioLevel}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ubos-midnight">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
        {cameraCaptureError ? (
          <p className="text-ubos-caption text-ubos-error-text">Last Error: {cameraCaptureError}</p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-ubos-sm bg-cyan-400 px-2 py-2 text-xs font-black text-slate-950"
            onClick={() => {
              void activateDirectCamera();
            }}
          >
            Start camera + mic
          </button>
          <button
            type="button"
            className="rounded-ubos-sm bg-ubos-midnight px-2 py-2 text-xs font-bold text-ubos-fg-primary"
            onClick={() => {
              Object.keys(liveSourceStreams).forEach((sourceId) => stopLiveSourceStream(sourceId));
              smokeMedia.stopAll();
              setProgramStreamOnAir(false);
              setLiveSourceStreams({});
              setCameraCaptureError('');
            }}
          >
            Stop devices
          </button>
          <button
            type="button"
            className="rounded-ubos-sm bg-red-500 px-2 py-2 text-xs font-black text-white disabled:opacity-50"
            disabled={
              recordingState === 'recording' ||
              recordingState === 'preparing' ||
              recordingState === 'stopping'
            }
            onClick={startSmokeRecording}
          >
            Start WebM REC
          </button>
          <button
            type="button"
            className="rounded-ubos-sm bg-ubos-midnight px-2 py-2 text-xs font-bold text-ubos-fg-primary disabled:opacity-50"
            disabled={recordingState !== 'recording'}
            onClick={stopSmokeRecording}
          >
            Stop REC
          </button>
        </div>
        {recordedUrl ? (
          <a
            className="block rounded-ubos-sm bg-emerald-400 px-2 py-2 text-center text-xs font-black text-slate-950"
            href={recordedUrl}
            download={recordingFilename ?? 'ubos-smoke-test.webm'}
          >
            Download recorded WebM
          </a>
        ) : null}
      </div>
    ),
  } satisfies Record<typeof professionalRightTab, ReactNode>;

  const monitorTelemetry = useMemo(
    () =>
      deriveMonitorTelemetry({
        routes: mediaRoutes,
        graph: productionGraphSession.graph,
        healthFps: safeHealthMetrics.fps,
      }),
    [mediaRoutes, productionGraphSession.graph, safeHealthMetrics.fps],
  );

  const programMonitorStatus = useMemo<MonitorStatusInfo>(
    () => ({
      resolution: monitorTelemetry.resolution,
      fps: monitorTelemetry.fps,
      sourceName: liveProgramVisible
        ? (programLiveVideoSource?.name ?? getPrimarySourceName(programScene))
        : getPrimarySourceName(programScene),
      state: liveProgramVisible ? 'live' : 'program',
      audioLevel: liveProgramVisible ? audioLevel : null,
      audioMuted: false,
    }),
    [
      monitorTelemetry.fps,
      monitorTelemetry.resolution,
      liveProgramVisible,
      programLiveVideoSource?.name,
      programScene,
      audioLevel,
    ],
  );

  const previewMonitorStatus = useMemo<MonitorStatusInfo>(
    () => ({
      resolution: monitorTelemetry.resolution,
      fps: monitorTelemetry.fps,
      sourceName: livePreviewVisible
        ? (previewLiveVideoSource?.name ?? getPrimarySourceName(previewScene))
        : getPrimarySourceName(previewScene),
      state: livePreviewVisible ? 'live' : 'preview',
      audioLevel: livePreviewVisible ? audioLevel : null,
      audioMuted: false,
    }),
    [
      monitorTelemetry.fps,
      monitorTelemetry.resolution,
      livePreviewVisible,
      previewLiveVideoSource?.name,
      previewScene,
      audioLevel,
    ],
  );

  const programMonitorNode = liveProgramVisible ? (
    <LiveMediaMonitor
      title="Program"
      sceneName={programScene.name}
      stream={programStreamToShow}
      active={liveProgramVisible}
      role="program"
      sourceId={programCameraSourceId}
      sourceType={programLiveVideoSource?.type}
      deckMode
    />
  ) : (
    <ProgramMonitor
      scene={programScene}
      routes={mediaRoutes}
      layoutPreset={layoutPreset}
      guests={guests}
      graph={productionGraphSession.graph}
      healthFps={safeHealthMetrics.fps}
      showSafeAreas={showSafeAreas}
      graphicsLayers={programSceneComposition.layers.filter(
        (layer) => layer.programState === 'live',
      )}
      mediaOverlayItems={programMediaOverlayItems}
      deckMode
    />
  );

  const previewMonitorNode = livePreviewVisible ? (
    <LiveMediaMonitor
      title="Preview"
      sceneName={previewScene.name}
      stream={previewStreamToShow}
      active={livePreviewVisible}
      role="preview"
      sourceId={previewCameraSourceId}
      sourceType={previewLiveVideoSource?.type}
      deckMode
    />
  ) : (
    <ProgramMonitor
      scene={previewScene}
      routes={mediaRoutes}
      layoutPreset={layoutPreset}
      guests={guests}
      graph={productionGraphSession.graph}
      healthFps={safeHealthMetrics.fps}
      showSafeAreas={showSafeAreas}
      graphicsLayers={previewSceneComposition.layers.filter(
        (layer) => layer.previewState === 'preview' || layer.programState === 'live',
      )}
      mediaOverlayItems={previewMediaOverlayItems}
      role="preview"
      deckMode
    />
  );

  const switcherNode = (
    <ProfessionalSwitcher
      productionState={productionState}
      programSceneName={programScene.name}
      previewSceneName={previewScene.name}
      lastTransitionLabel={lastTransitionLabel}
      feedbackLabel={switcherFeedback}
      transitionActive={transitionActive}
      transitionHistory={transitionHistory}
      switcherReady={!isPending && !transitionActive}
      transitionReady={!transitionActive}
      programLocked={authorityDiagnostics.activeLocks.some((lock) => lock.scope === 'program')}
      automationMode={productionGraphSession.graph.automation.enabled ? 'automation' : 'manual'}
      runtimeStatus={runtimeView.status}
      queueSize={runtimeView.executionQueue.length}
      compactChrome
      detailsDefaultOpen={false}
      onTake={() => switchProgram(productionState.transitionType)}
      onCut={() => switchProgram('cut')}
      onAuto={() => switchProgram('fade')}
      onPrevious={() => stageAdjacentScene('previous')}
      onNext={() => stageAdjacentScene('next')}
      onTransitionChange={(transitionType) => {
        const transitionDuration = normalizeTransitionDuration(
          transitionType,
          productionState.transitionDuration,
        );
        dispatchProductionGraphCommand('SET_TRANSITION', { transitionType });
        dispatchProductionGraphCommand('SET_TRANSITION_DURATION', {
          durationMs: transitionDuration,
        });
        persistProductionState(
          { ...productionState, transitionType, transitionDuration },
          'stage',
        );
      }}
      onDurationChange={(transitionDuration) => {
        const normalizedDuration = normalizeTransitionDuration(
          productionState.transitionType,
          transitionDuration,
          productionState.transitionDuration,
        );
        dispatchProductionGraphCommand('SET_TRANSITION_DURATION', {
          durationMs: normalizedDuration,
        });
        persistProductionState(
          { ...productionState, transitionDuration: normalizedDuration },
          'stage',
        );
      }}
    />
  );

  // Derive latency label from the first active output destination that
  // has a measured latency value. Used by the Program monitor overlay.
  const primaryOutputLatencyMs = distributionState.outputHealth.find(
    (h) => h.latencyMs != null,
  )?.latencyMs;

  return (
    <CommandCenterShell
      layoutStyle={layoutStyle}
      statusBar={
        <BroadcastStatusBar
          sessionName="Launch Day"
          isLive={activeRouteCount > 0}
          isRecording={recordingState === 'recording'}
          runTime={formatElapsed(elapsedSeconds)}
          clock={clock}
          transitionActive={transitionActive}
          fps={safeHealthMetrics.fps}
          cpu={safeHealthMetrics.cpu}
          dropped={safeHealthMetrics.dropped}
          upload={safeHealthMetrics.upload}
          automationModeLabel={automationModeLabel(automationState.automationMode)}
          aiStatusLabel={aiStatusLabel(aiState.assistant)}
          outputHealthLabel={outputHealthSummaryLabel({
            destinations: distributionState.destinations,
            health: distributionState.outputHealth,
          })}
          deviceHealthLabel={deviceHealthSummaryLabel(deviceState.devices)}
          engineStatusLabel="Unavailable"
          compactChrome={workspace.compactChrome}
          toolsMenu={toolsMenu}
        />
      }
      activeNav={activeNav}
      onNavChange={(nav) => {
        setActiveNav(nav);
        const dockTab = preferredSourceDockTab(nav);
        if (dockTab) setActiveSourceDockTab(dockTab);
        if (nav === 'production-graph') {
          setActiveBottomDock(normalizeDockTabId('production-graph'));
        }
        if (nav === 'outputs') {
          setActiveOperationsTab('outputs');
        }
        if (nav === 'settings') {
          setActiveOperationsTab('inspector');
        }
      }}
      sourceDockContent={leftNavContent}
      activeSourceDockTab={activeSourceDockTab}
      onSourceDockTabChange={setActiveSourceDockTab}
      programMonitor={programMonitorNode}
      previewMonitor={previewMonitorNode}
      programStatus={programMonitorStatus}
      previewStatus={previewMonitorStatus}
      switcherContent={switcherNode}
      operationsSections={operationsSections}
      activeOperationsTab={activeOperationsTab}
      activeDockTab={activeBottomDock}
      onOperationsTabChange={setActiveOperationsTab}
      onDockTabChange={(tab) => setActiveBottomDock(normalizeDockTabId(tab))}
      onWorkspaceModeApplied={applyMenuWorkspaceMode}
      onSaveWorkspace={saveWorkspace}
      onRestoreWorkspace={restoreWorkspace}
      onResetWorkspace={resetWorkspace}
      onSeedDemo={() => startTransition(async () => seedDemoProductionState())}
      onSimulateDemo={() => startTransition(async () => simulateDemoProduction())}
      onResetDemo={() => startTransition(async () => resetDemoProductionState())}
      bottomWorkspaceContent={bottomDockContent}
      onCut={() => switchProgram('cut')}
      onTake={() => switchProgram(productionState.transitionType)}
      onAuto={() => switchProgram('fade')}
      programOverlay={{
        sceneName: programScene.name,
        recordingLabel:
          recordingState === 'recording' || browserRecordingPanelState.state === 'recording'
            ? 'ON'
            : undefined,
        streamingLabel:
          streamingState.lifecycle === 'streaming'
            ? 'LIVE'
            : streamingState.lifecycle === 'connecting'
              ? 'CONNECTING'
              : undefined,
        droppedLabel:
          safeHealthMetrics.dropped !== 'unavailable' ? safeHealthMetrics.dropped : undefined,
        latencyLabel:
          primaryOutputLatencyMs != null ? `${primaryOutputLatencyMs}ms` : 'unavailable',
      }}
      previewOverlay={{
        sceneName: previewScene.name,
        transitionLabel: productionState.transitionType,
        armedGraphicsCount: previewSceneComposition.layers.filter(
          (layer) => layer.previewState === 'preview',
        ).length,
        latencyLabel:
          primaryOutputLatencyMs != null ? `${primaryOutputLatencyMs}ms` : 'unavailable',
      }}
    />
  );
}
