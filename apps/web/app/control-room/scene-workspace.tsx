'use client';

import {
  LayoutSelector,
  Badge,
  ProductionDock,
  ProgramPreview,
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
import { useEffect, useOptimistic, useState, useTransition } from 'react';
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

const sceneTypes = Object.values(SceneType);
const sourceTypes: SceneSourceType[] = ['camera', 'screen', 'media', 'overlay', 'browser', 'audio'];

type ControlRoomViewMode = 'dual' | 'program' | 'vertical' | 'compact';

const controlRoomViewStorageKey = 'ubos.controlRoom.viewMode';

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
    value: 'quad',
    label: 'Quad View',
    description: 'Coming soon',
    disabled: true,
  },
];

const isControlRoomViewMode = (value: string | null): value is ControlRoomViewMode =>
  value === 'dual' || value === 'program' || value === 'vertical' || value === 'compact';

const monitorDeckClasses: Record<ControlRoomViewMode, string> = {
  dual: 'grid min-h-0 gap-2 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)] xl:grid-cols-[minmax(0,3.25fr)_minmax(17rem,1fr)]',
  program: 'grid min-h-0 gap-2 lg:grid-cols-[minmax(0,3.25fr)_minmax(16rem,0.95fr)]',
  vertical: 'grid min-h-0 gap-2 md:grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]',
  compact: 'grid min-h-0 gap-2 md:grid-cols-[minmax(0,2.7fr)_minmax(14rem,1fr)]',
};

function ViewModeSelector({
  selected,
  onSelect,
}: {
  selected: ControlRoomViewMode;
  onSelect: (mode: ControlRoomViewMode) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            View Mode
          </p>
          <h2 className="text-lg font-bold text-white">Control Room Previews</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {viewModeOptions.map((option) => {
            const isSelected = option.value === selected;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                aria-pressed={!option.disabled && isSelected}
                onClick={() => {
                  if (!option.disabled && isControlRoomViewMode(option.value))
                    onSelect(option.value);
                }}
                className={`rounded-xl border px-3 py-2 text-left transition ${
                  option.disabled
                    ? 'cursor-not-allowed border-white/5 bg-slate-950/30 text-slate-600'
                    : isSelected
                      ? 'border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-950/30'
                      : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-cyan-300/45 hover:bg-slate-800/80'
                }`}
              >
                <span className="block text-xs font-black uppercase tracking-[0.12em]">
                  {option.label}
                </span>
                <span className="mt-1 block text-[11px] text-slate-400">{option.description}</span>
              </button>
            );
          })}
        </div>
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
}: {
  initialScenes: Scene[];
  initialProductionState: ProductionSwitchingState;
  layouts: SceneLayout[];
  channels: AudioChannel[];
  assets: ProductionAsset[];
  mediaRoutes?: MediaRoute[];
  guests?: Guest[];
}) {
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ControlRoomViewMode>('dual');
  const [scenes, setScenes] = useOptimistic(initialScenes, (_current, next: Scene[]) => next);
  const [productionState, setProductionState] = useState(initialProductionState);
  const [transitionActive, setTransitionActive] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(mediaRoutes[0]?.id ?? null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  useEffect(() => {
    const storedViewMode = window.localStorage.getItem(controlRoomViewStorageKey);
    if (isControlRoomViewMode(storedViewMode)) setViewMode(storedViewMode);
  }, []);

  const selectViewMode = (mode: ControlRoomViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(controlRoomViewStorageKey, mode);
  };

  const refresh = (next: Scene[]) => startTransition(() => setScenes(next));
  const sorted = [...scenes].sort((a, b) => a.order - b.order);
  const programScene =
    sorted.find((scene) => scene.id === productionState.programSceneId) ??
    sorted.find((scene) => scene.isActive) ??
    sorted[0]!;
  const previewScene =
    sorted.find((scene) => scene.id === productionState.previewSceneId) ?? programScene;
  const activeScene = previewScene;
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
      if (event.key.toLowerCase() === 'f') switchProgram('fade');
      if (event.key.toLowerCase() === 'm' && selectedRouteId)
        startTransition(async () => {
          await setRouteMuted(selectedRouteId);
        });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [productionState, selectedRouteId, sorted]);

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
    <>
      <aside className="min-h-0 space-y-3 overflow-y-auto pr-1 max-xl:max-h-[34rem]">
        <button
          type="button"
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/75 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100"
        >
          {leftCollapsed ? 'Show scene/source panels' : 'Collapse scene/source panels'}
        </button>
        {!leftCollapsed ? (
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
        {!leftCollapsed ? (
          <SourceManager
            scene={activeScene}
            sourceTypes={sourceTypes}
            isPending={isPending}
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
        {!leftCollapsed ? <LayoutSelector layouts={layouts} /> : null}
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 text-sm text-slate-300">
          <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">
            Assets Library
          </button>
          <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">
            Overlay Controls
          </button>
        </div>
      </aside>
      <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <div className="shrink-0 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Broadcast Studio · Space Take · 1-9 Preview · C Cut · F Fade · M Mute route
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-white">Launch Day Broadcast</h1>
                <Badge tone="live">LIVE</Badge>
                <Badge tone={transitionActive ? 'warning' : 'success'}>
                  {transitionActive ? 'Transition active' : 'Ready'}
                </Badge>
                <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-[11px] text-slate-300">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <button
                className="rounded-md bg-slate-800 px-2.5 py-1 hover:bg-slate-700"
                onClick={() => startTransition(async () => seedDemoProductionState())}
              >
                Seed demo
              </button>
              <button
                className="rounded-md bg-slate-800 px-2.5 py-1 hover:bg-slate-700"
                onClick={() => startTransition(async () => simulateDemoProduction())}
              >
                Sim active speaker/live guests
              </button>
              <button
                className="rounded-md bg-slate-800 px-2.5 py-1 hover:bg-slate-700"
                onClick={() => startTransition(async () => resetDemoProductionState())}
              >
                Reset demo
              </button>
              <span className="hidden xl:inline">Preview: {previewScene.name}</span>
              <span className="hidden xl:inline">Program: {programScene.name}</span>
              <button className="rounded-md bg-rose-500/80 px-3 py-1.5 text-xs font-black text-white">
                Emergency Stop
              </button>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <ViewModeSelector selected={viewMode} onSelect={selectViewMode} />
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <div className={monitorDeckClasses[viewMode]}>
            <div className="min-w-0">
              <ProgramPreview
                scene={programScene}
                routes={mediaRoutes}
                layoutPreset={layoutPreset}
                guests={guests}
              />
            </div>
            <div className="min-w-0">
              <PreviewMonitor
                scene={previewScene}
                routes={mediaRoutes}
                layoutPreset={layoutPreset}
                guests={guests}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-2.5 py-2">
            <button
              className="rounded-md bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-950"
              onClick={() => switchProgram(productionState.transitionType)}
            >
              Auto
            </button>
            <button
              className="rounded-md bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-white/15"
              onClick={() => switchProgram('cut')}
            >
              Cut
            </button>
            <button
              className="rounded-md bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-white/15"
              onClick={() => switchProgram('fade')}
            >
              Fade
            </button>
            <select
              className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              value={productionState.transitionType}
              onChange={(e) =>
                persistProductionState(
                  { ...productionState, transitionType: e.target.value as TransitionType },
                  'stage',
                )
              }
            >
              <option value="cut">Cut</option>
              <option value="fade">Fade</option>
              <option value="dip">Dip placeholder</option>
              <option value="wipe">Wipe placeholder</option>
            </select>
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Duration
              <input
                aria-label="Transition duration milliseconds"
                className="w-24 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white"
                type="number"
                min={0}
                max={5000}
                step={100}
                value={productionState.transitionDuration}
                onChange={(e) =>
                  persistProductionState(
                    { ...productionState, transitionDuration: Number(e.target.value) },
                    'stage',
                  )
                }
              />
            </label>
          </div>
        </div>
        <div className="max-h-56 shrink-0 overflow-y-auto">
          <ProductionDock channels={channels} assets={assets} />
        </div>
      </section>
    </>
  );
}
