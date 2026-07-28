'use client';

type Scene = {
  id: string;
  name: string;
  layers?: unknown[];
  outputs?: string[];
};

export function SceneCard({ scene, active }: { scene: Scene; active: boolean }) {
  return (
    <div
      className={`scene-card min-w-[140px] rounded-lg border p-2 transition-colors ${
        active
          ? 'border-[#4da3ff] bg-[#0d1f38]'
          : 'border-[#1e2530] bg-[#0d1117] hover:border-[#1e3a5f]'
      }`}
    >
      <div className={`scene-card-title truncate text-[11px] font-semibold ${active ? 'text-[#4da3ff]' : 'text-[#94a3b8]'}`}>
        {scene.name}
      </div>
      <div className="scene-card-meta mt-1 flex items-center gap-2 text-[9px] text-[#334155]">
        <span>{scene.layers?.length ?? 0} layers</span>
        <span>·</span>
        <span>{scene.outputs?.length ?? 0} outputs</span>
      </div>
    </div>
  );
}
