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
} from '@ubos/shared';
import { type ReactNode, useEffect, useMemo, useOptimistic, useState, useTransition } from 'react';
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

const sceneTypes = Object.values(SceneType);
const sourceTypes: SceneSourceType[] = ['camera', 'screen', 'media', 'overlay', 'browser', 'audio'];

type ControlRoomViewMode = 'dual' | 'program' | 'vertical' | 'compact';

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
  dual: 'grid min-h-0 gap-1.5 lg:grid-cols-[minmax(0,3.5fr)_minmax(14rem,1fr)] xl:grid-cols-[minmax(0,3.75fr)_minmax(15rem,1fr)]',
  program: 'grid min-h-0 gap-1.5 lg:grid-cols-[minmax(0,4fr)_minmax(13rem,0.85fr)]',
  vertical: 'grid min-h-0 gap-1.5 md:grid-cols-1 lg:grid-cols-[minmax(0,3.5fr)_minmax(14rem,1fr)]',
  compact: 'grid min-h-0 gap-1.5 md:grid-cols-[minmax(0,3fr)_minmax(12rem,1fr)]',
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
          setWorkspace({
            ...factoryWorkspace,
            ...parsed,
            panelState: { ...factoryWorkspace.panelState, ...parsed.panelState },
            sizes: { ...factoryWorkspace.sizes, ...parsed.sizes },
          });
          return;
        }
      } catch {}
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
      applyWorkspace(JSON.parse(storedWorkspace) as WorkspaceLayout);
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

  const refresh = (next: Scene[]) => startTransition(() => setScenes(next));
  const sorted = [...scenes].sort((a, b) => a.order - b.order);
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

  const persistProductionState = (
    next: ProductionSwitchingState,
    action: 'stage' | 'take' | 'cut' | 'fade',
  ) => {
    setProductionState(next);
    startTransition(async () => {
      await updateProductionState({ ...next, broadcastId: programScene.broadcastId, action });
    });
  };

  const stageScene = (sceneId: string) =>
    persistProductionState({ ...productionState, previewSceneId: sceneId }, 'stage');
  const switchProgram = (type: TransitionType) => {
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

  const safeHealthMetrics = useMemo(() => {
    const visibleRoutes = mediaRoutes.filter((route) => route.isOnProgram || route.isActive).length;
    return {
      fps: '60',
      cpu: `${Math.min(72, 18 + visibleRoutes * 4)}%`,
      dropped: '0',
      upload: `${(6.2 + visibleRoutes * 0.4).toFixed(1)} Mbps`,
    };
  }, [mediaRoutes]);

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
        value: `${mediaRoutes.filter((route) => route.isActive).length} routes`,
        status: 'good' as const,
      },
    ],
    [mediaRoutes, safeHealthMetrics],
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
          <div className="flex min-h-8 items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <span className="hidden max-w-[10rem] truncate text-xs font-bold text-white md:inline">
              Launch Day
            </span>
            <OperatorStatusBadge label="LIVE" tone="live" pulse />
            <OperatorStatusBadge label="REC" tone="recording" pulse />
            <OperatorMetric label="RUN" value={formatElapsed(elapsedSeconds)} />
            <OperatorStatusBadge
              label={transitionActive ? 'WARN Transition' : 'READY'}
              tone={transitionActive ? 'warning' : 'ready'}
            />
            <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/10 sm:inline" />
            <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/10 md:inline" />
            <div className="hidden items-center gap-1 lg:flex">
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
                <div className="border-t border-white/10 pt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-slate-500">
                  Space Take · A Auto · 1-9 PVW · C Cut · F Fade · M Mute
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
          onTransitionChange={(transitionType) =>
            persistProductionState({ ...productionState, transitionType }, 'stage')
          }
          onDurationChange={(transitionDuration) =>
            persistProductionState({ ...productionState, transitionDuration }, 'stage')
          }
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
