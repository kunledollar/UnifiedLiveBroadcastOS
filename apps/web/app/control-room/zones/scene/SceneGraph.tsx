'use client';

type Scene = { id: string; name: string };

export function SceneGraph({
  scenes,
  currentScene,
}: {
  scenes: Scene[] | undefined;
  currentScene: string | null | undefined;
}) {
  if (!scenes || scenes.length === 0) {
    return (
      <div className="scene-graph flex items-center justify-center text-[10px] text-[#334155]">
        No scenes
      </div>
    );
  }

  return (
    <div className="scene-graph flex flex-col gap-1.5">
      {scenes.map((scene) => {
        const isActive = scene.id === currentScene;
        return (
          <div
            key={scene.id}
            className={`graph-node rounded px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              isActive
                ? 'bg-[#4da3ff] text-black'
                : 'bg-[#0d1117] text-[#475569] hover:bg-[#1e2530]'
            }`}
          >
            {scene.name}
          </div>
        );
      })}
    </div>
  );
}
