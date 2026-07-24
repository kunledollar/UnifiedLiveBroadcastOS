'use client';

type Scene = { id: string; name: string };

export function GraphInspector({
  scenes,
  currentScene,
}: {
  scenes: Scene[] | undefined;
  currentScene: string | null | undefined;
}) {
  return (
    <div className="graph-inspector rounded-lg border border-[#1e2530] bg-[#0d1117] p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Scene Graph</h4>

      {!scenes || scenes.length === 0 ? (
        <p className="text-[10px] text-[#334155]">No scenes</p>
      ) : (
        <div className="space-y-1">
          {scenes.map((scene) => {
            const isActive = scene.id === currentScene;
            return (
              <div
                key={scene.id}
                className={`graph-inspector-node rounded px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'bg-[#4da3ff] text-black' : 'bg-[#0a1628] text-[#475569]'
                }`}
              >
                {scene.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
