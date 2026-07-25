'use client';

import { workspaceState } from '../../workspace/workspaceState';

type Layer = { id: string; type: string; name?: string; src?: string; text?: string };
type Scene = { id: string; name: string; layers?: Layer[] };

export function SceneInspector({ scene }: { scene: Scene | undefined }) {
  // Prefer engine layers when available (richer layer metadata)
  const engineScene = scene?.id ? workspaceState.sceneGraph.evaluateScene(scene.id) : null;
  if (!scene) {
    return (
      <div className="scene-inspector empty flex items-center justify-center py-4 text-[10px] text-[#334155]">
        No scene selected
      </div>
    );
  }

  return (
    <div className="scene-inspector rounded-lg border border-[#1e2530] bg-[#0d1117] p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Scene Details</h4>

      <div className="scene-meta mb-3 space-y-1 text-[10px]">
        <div className="flex gap-2"><span className="text-[#334155]">ID</span><span className="text-[#94a3b8]">{scene.id}</span></div>
        <div className="flex gap-2"><span className="text-[#334155]">Name</span><span className="text-[#94a3b8]">{scene.name}</span></div>
        <div className="flex gap-2"><span className="text-[#334155]">Layers</span><span className="text-[#94a3b8]">{(engineScene?.layers ?? scene.layers)?.length ?? 0}</span></div>
        {engineScene && (
          <div className="flex gap-2"><span className="text-[#334155]">Outputs</span><span className="text-[#94a3b8]">{engineScene.outputs.length}</span></div>
        )}
      </div>

      <div className="scene-layers space-y-1">
        {(engineScene?.layers ?? scene.layers ?? []).map((layer) => (
          <div key={layer.id} className="scene-layer-item flex items-center gap-2 rounded bg-[#0a1628] px-2 py-1.5">
            <span className="rounded bg-[#7c6af7]/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#7c6af7]">{layer.type}</span>
            <span className="flex-1 truncate text-[10px] text-[#475569]">{'name' in layer ? layer.name : layer.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
