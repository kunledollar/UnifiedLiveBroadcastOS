'use client';

import {
  LayoutSelector,
  Badge,
  ProductionDock,
  ProgramPreview,
  SceneList,
  SourceManager,
  VerticalPreview,
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

const previewGridClasses: Record<ControlRoomViewMode, string> = {
  dual: 'grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]',
  program: 'grid gap-5',
  vertical: 'grid gap-5 justify-items-center xl:grid-cols-1',
  compact: 'grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,0.72fr)_14rem]',
};

function ViewModeSelector({
  selected,
  onSelect,
}: {
  selected: ControlRoomViewMode;
  onSelect: (mode: ControlRoomViewMode) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-black/20 backdrop-blur">
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
      <aside className="space-y-5">
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
      <section className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Broadcast Studio · safe shortcuts: Space Take, 1-9 Preview, C Cut, F Fade, M Mute
                route
              </p>
              <h1 className="text-2xl font-bold text-white">Launch Day Broadcast</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="live">LIVE</Badge>
              <Badge tone="neutral">Record placeholder</Badge>
              <button
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950"
                onClick={() => switchProgram(productionState.transitionType)}
              >
                Take
              </button>
              <button
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white"
                onClick={() => switchProgram('cut')}
              >
                Cut
              </button>
              <button
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white"
                onClick={() => switchProgram('fade')}
              >
                Fade
              </button>
              <select
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white"
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
              <input
                aria-label="Transition duration milliseconds"
                className="w-24 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white"
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
              <Badge tone={transitionActive ? 'warning' : 'success'}>
                {transitionActive ? 'Transition active' : 'Ready'}
              </Badge>
              <button className="rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-black text-white">
                Emergency Stop
              </button>
              <span className="rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <button
              className="rounded-lg bg-slate-800 px-3 py-1"
              onClick={() => startTransition(async () => seedDemoProductionState())}
            >
              Seed demo
            </button>
            <button
              className="rounded-lg bg-slate-800 px-3 py-1"
              onClick={() => startTransition(async () => simulateDemoProduction())}
            >
              Sim active speaker/live guests
            </button>
            <button
              className="rounded-lg bg-slate-800 px-3 py-1"
              onClick={() => startTransition(async () => resetDemoProductionState())}
            >
              Reset demo
            </button>
            <span>Preview: {previewScene.name}</span>
            <span>Program: {programScene.name}</span>
          </div>
        </div>
        <ViewModeSelector selected={viewMode} onSelect={selectViewMode} />
        <div className={previewGridClasses[viewMode]}>
          {viewMode !== 'vertical' ? (
            <div className={viewMode === 'compact' ? 'min-w-0 text-sm' : 'min-w-0'}>
              <ProgramPreview
                scene={programScene}
                routes={mediaRoutes}
                layoutPreset={layoutPreset}
                guests={guests}
              />
            </div>
          ) : null}
          {viewMode !== 'program' ? (
            <div
              className={
                viewMode === 'vertical'
                  ? 'w-full max-w-md min-w-0 xl:max-w-xl'
                  : viewMode === 'compact'
                    ? 'min-w-0 text-sm'
                    : 'min-w-0'
              }
            >
              <VerticalPreview
                scene={programScene}
                routes={mediaRoutes}
                layoutPreset={layoutPreset}
                guests={guests}
              />
            </div>
          ) : null}
        </div>
        <ProductionDock channels={channels} assets={assets} />
      </section>
    </>
  );
}
