'use client';

import type { SceneControlSnapshot } from './SceneControlAdapter';
import { addScene, addSource } from '../scene-actions';

export function ScenePanel({
  snapshot,
  pending,
  selectPreviewScene,
  cutToProgram,
  autoTransition,
  takePreview,
}: {
  snapshot: SceneControlSnapshot;
  pending: boolean;
  selectPreviewScene: (sceneId: string) => void;
  cutToProgram: () => void;
  autoTransition: () => void;
  takePreview: () => void;
}) {
  const program = snapshot.scenes.find((scene) => scene.id === snapshot.currentProgramSceneId);
  const preview = snapshot.scenes.find((scene) => scene.id === snapshot.selectedPreviewSceneId);

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-4" aria-label="Scene control room">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ubos-border-subtle pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ubos-fg-muted">UBOS Control Room</p>
          <h1 className="text-xl font-semibold">Scene Control</h1>
        </div>
        <div className="flex gap-2" aria-label="Program controls">
          <button type="button" className="rounded bg-red-700 px-4 py-2 text-sm font-bold" onClick={cutToProgram} disabled={pending}>CUT</button>
          <button type="button" className="rounded bg-amber-700 px-4 py-2 text-sm font-bold" onClick={autoTransition} disabled={pending}>AUTO</button>
          <button type="button" className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold" onClick={takePreview} disabled={pending}>TAKE</button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2" aria-label="Program and preview monitors">
        <Monitor label="PROGRAM" sceneName={program?.name ?? 'No program scene'} tone="border-red-500" />
        <Monitor label="PREVIEW" sceneName={preview?.name ?? 'No preview scene'} tone="border-emerald-500" />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ubos-fg-muted">Scenes</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.scenes.map((scene) => {
            const isProgram = scene.id === snapshot.currentProgramSceneId;
            const isPreview = scene.id === snapshot.selectedPreviewSceneId;
            const sources = snapshot.sourceSummaries.filter((source) => source.sceneId === scene.id);
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => selectPreviewScene(scene.id)}
                className={`rounded border p-3 text-left ${isPreview ? 'border-emerald-400 bg-emerald-950/30' : 'border-ubos-border-subtle bg-ubos-midnight'} hover:border-ubos-fg-muted`}
                aria-pressed={isPreview}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{scene.name}</span>
                  <span className="text-xs text-ubos-fg-muted">{scene.layout}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-xs font-semibold">
                  {isProgram && <span className="rounded bg-red-900 px-2 py-0.5">PROGRAM</span>}
                  {isPreview && <span className="rounded bg-emerald-900 px-2 py-0.5">PREVIEW</span>}
                </div>
                <ul className="mt-3 space-y-1 text-xs text-ubos-fg-muted">
                  {sources.map((source) => <li key={source.id}>{source.name} · {source.type} · {source.runtimeStatus}</li>)}
                </ul>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 border-t border-ubos-border-subtle pt-4 lg:grid-cols-2">
        <form action={addScene} className="flex flex-wrap items-end gap-2" aria-label="Create scene">
          <input type="hidden" name="broadcastId" value="demo-broadcast" />
          <label className="flex flex-col gap-1 text-xs text-ubos-fg-muted">Scene name<input required name="name" className="rounded border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-sm text-ubos-fg-primary" /></label>
          <label className="flex flex-col gap-1 text-xs text-ubos-fg-muted">Type<select name="type" defaultValue="custom" className="rounded border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-sm text-ubos-fg-primary"><option value="custom">Custom</option><option value="camera">Camera</option><option value="screen_share">Screen share</option></select></label>
          <button type="submit" className="rounded border border-ubos-border-subtle px-3 py-1.5 text-sm">Add scene</button>
        </form>
        <form action={addSource} className="flex flex-wrap items-end gap-2" aria-label="Add source">
          <label className="flex flex-col gap-1 text-xs text-ubos-fg-muted">Source name<input required name="name" className="rounded border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-sm text-ubos-fg-primary" /></label>
          <label className="flex flex-col gap-1 text-xs text-ubos-fg-muted">Scene<select required name="sceneId" defaultValue={snapshot.selectedPreviewSceneId} className="rounded border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-sm text-ubos-fg-primary">{snapshot.scenes.map((scene) => <option key={scene.id} value={scene.id}>{scene.name}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-xs text-ubos-fg-muted">Type<select name="type" defaultValue="camera" className="rounded border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-sm text-ubos-fg-primary"><option value="camera">Camera</option><option value="screen">Screen</option><option value="media">Local media</option><option value="browser">Browser</option></select></label>
          <button type="submit" className="rounded border border-ubos-border-subtle px-3 py-1.5 text-sm">Add source</button>
        </form>
      </div>
      <p className="text-xs text-ubos-fg-muted">Scene controls use graph scene IDs only. Media is resolved by the runtime registry.</p>
    </section>
  );
}

function Monitor({ label, sceneName, tone }: { label: string; sceneName: string; tone: string }) {
  return <div className={`aspect-video rounded border-2 ${tone} bg-black p-4`}><p className="text-xs font-bold tracking-widest text-ubos-fg-muted">{label}</p><p className="mt-2 text-lg font-semibold">{sceneName}</p></div>;
}
