'use client';

import { LayoutSelector, ProductionDock, ProgramPreview, SceneList, VerticalPreview } from '@ubos/ui';
import { SceneType, type AudioChannel, type ProductionAsset, type Scene, type SceneLayout } from '@ubos/shared';
import { useOptimistic, useTransition } from 'react';
import { addScene, deleteScene, duplicateScene, moveScene, renameScene, switchScene } from './scene-actions';

const sceneTypes = Object.values(SceneType);

export function SceneWorkspace({ initialScenes, layouts, channels, assets }: { initialScenes: Scene[]; layouts: SceneLayout[]; channels: AudioChannel[]; assets: ProductionAsset[] }) {
  const [isPending, startTransition] = useTransition();
  const [scenes, setScenes] = useOptimistic(initialScenes, (_current, next: Scene[]) => next);

  const refresh = (next: Scene[]) => startTransition(() => setScenes(next));
  const sorted = [...scenes].sort((a, b) => a.order - b.order);
  const activeScene = sorted.find((scene) => scene.isActive) ?? sorted[0]!;

  return (
    <>
      <aside className="space-y-5">
        <SceneList
          scenes={sorted}
          sceneTypes={sceneTypes}
          isPending={isPending}
          onAdd={(data) => {
            const tempScene: Scene = { ...activeScene, id: `temp-${Date.now()}`, name: data.name, type: data.type, order: sorted.length, isActive: false, sources: [], overlays: [], audioConfig: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
            if (original) refresh([...sorted, { ...original, id: `temp-${Date.now()}`, name: `${original.name} Copy`, isActive: false, order: sorted.length }]);
            startTransition(async () => { await duplicateScene(sceneId); });
          }}
          onDelete={(sceneId) => {
            const next = sorted.filter((scene) => scene.id !== sceneId).map((scene, index) => ({ ...scene, order: index }));
            refresh(next.some((scene) => scene.isActive) ? next : next.map((scene, index) => ({ ...scene, isActive: index === 0 })));
            startTransition(async () => { await deleteScene(sceneId); });
          }}
          onMove={(sceneId, direction) => {
            const index = sorted.findIndex((scene) => scene.id === sceneId);
            const swapIndex = direction === 'up' ? index - 1 : index + 1;
            if (index >= 0 && swapIndex >= 0 && swapIndex < sorted.length) {
              const next = [...sorted];
              [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
              refresh(next.map((scene, order) => ({ ...scene, order })));
            }
            startTransition(async () => { await moveScene(sceneId, direction); });
          }}
        />
        <LayoutSelector layouts={layouts} />
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 text-sm text-slate-300">
          <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">Assets Library</button>
          <button className="rounded-xl bg-slate-950/70 p-3 text-left font-semibold hover:bg-slate-800">Overlay Controls</button>
        </div>
      </aside>
      <section className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <ProgramPreview scene={activeScene} />
          <VerticalPreview scene={activeScene} />
        </div>
        <ProductionDock channels={channels} assets={assets} />
      </section>
    </>
  );
}
