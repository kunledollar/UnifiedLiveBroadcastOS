'use client';

import {
  LayoutSelector,
  ProductionDock,
  ProgramPreview,
  SceneList,
  SourceManager,
  VerticalPreview,
} from '@ubos/ui';
import {
  SceneType,
  type AudioChannel,
  type ProductionAsset,
  type Scene,
  type SceneLayout,
  type SceneSource,
  type SceneSourceType,
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
  switchScene,
  toggleSourceLock,
  toggleSourceVisibility,
} from './scene-actions';

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
}: {
  initialScenes: Scene[];
  layouts: SceneLayout[];
  channels: AudioChannel[];
  assets: ProductionAsset[];
}) {
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ControlRoomViewMode>('dual');
  const [scenes, setScenes] = useOptimistic(initialScenes, (_current, next: Scene[]) => next);

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
  const activeScene = sorted.find((scene) => scene.isActive) ?? sorted[0]!;

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
          onSwitch={(sceneId) => {
            refresh(sorted.map((scene) => ({ ...scene, isActive: scene.id === sceneId })));
            startTransition(async () => {
              await switchScene(sceneId);
            });
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
        <LayoutSelector layouts={layouts} />
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
        <ViewModeSelector selected={viewMode} onSelect={selectViewMode} />
        <div className={previewGridClasses[viewMode]}>
          {viewMode !== 'vertical' ? (
            <div className={viewMode === 'compact' ? 'min-w-0 text-sm' : 'min-w-0'}>
              <ProgramPreview scene={activeScene} />
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
              <VerticalPreview scene={activeScene} />
            </div>
          ) : null}
        </div>
        <ProductionDock channels={channels} assets={assets} />
      </section>
    </>
  );
}
