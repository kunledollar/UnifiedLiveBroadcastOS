'use client';

import { workspaceState } from '../../workspace/workspaceState';

type Layer = { id: string; type: string; name?: string; src?: string; text?: string };
type Scene = { id: string; name: string; layers?: Layer[] };

export function SceneInspector({ scene }: { scene: Scene | undefined }) {
  // Prefer engine layers when available (richer layer metadata)
  const engineScene = scene?.id ? workspaceState.sceneGraph.evaluateScene(scene.id) : null;
  if (!scene) {
    return (
      <div className="scene-inspector empty flex items-center justify-center py-4 text-[10px] text-ubos-fg-muted">
        No scene selected
      </div>
    );
  }

  return (
    // Inspector Body region — Level 2 elevation (Step 101), one step above
    // the Level 1 Navigation region below it.
    <div className="scene-inspector rounded-lg border border-ubos-border bg-ubos-slate shadow-ubos-elevation-2 p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Scene Details</h4>

      <div className="scene-meta mb-3 space-y-1 text-[10px]">
        <div className="flex gap-2"><span className="text-ubos-fg-muted">ID</span><span className="text-ubos-fg-secondary">{scene.id}</span></div>
        <div className="flex gap-2"><span className="text-ubos-fg-muted">Name</span><span className="text-ubos-fg-secondary">{scene.name}</span></div>
        <div className="flex gap-2"><span className="text-ubos-fg-muted">Layers</span><span className="text-ubos-fg-secondary">{(engineScene?.layers ?? scene.layers)?.length ?? 0}</span></div>
        {engineScene && (
          <div className="flex gap-2"><span className="text-ubos-fg-muted">Outputs</span><span className="text-ubos-fg-secondary">{engineScene.outputs.length}</span></div>
        )}
      </div>

      {/* Layer type badge uses Graphics Cyan: scene layers are visual/graphics content. */}
      <div className="scene-layers space-y-1">
        {(engineScene?.layers ?? scene.layers ?? []).map((layer) => (
          <div key={layer.id} className="scene-layer-item flex items-center gap-2 rounded bg-ubos-midnight px-2 py-1.5">
            <span className="rounded bg-ubos-graphics-muted px-1.5 py-0.5 text-[8px] font-bold uppercase text-ubos-graphics-text">{layer.type}</span>
            <span className="flex-1 truncate text-[10px] text-ubos-fg-secondary">{'name' in layer ? layer.name : layer.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
