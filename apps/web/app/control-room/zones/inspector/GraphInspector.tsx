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
    <div className="graph-inspector rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Scene Graph</h4>

      {!scenes || scenes.length === 0 ? (
        <p className="text-[10px] text-ubos-fg-muted">No scenes</p>
      ) : (
        <div className="space-y-1">
          {scenes.map((scene) => {
            const isActive = scene.id === currentScene;
            return (
              <div
                key={scene.id}
                className={`graph-inspector-node rounded px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                  // Active Blue = the currently selected scene (operator focus).
                  isActive ? 'bg-ubos-selection text-white' : 'bg-ubos-midnight text-ubos-fg-secondary'
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
