'use client';

type Layer = { id: string; type: string; name: string };

export function GraphicsLayerStack({ layers }: { layers: Layer[] }) {
  return (
    <div className="gc-layer-stack flex flex-col overflow-hidden rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Layers</h4>
      {layers.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-ubos-fg-muted">No layers</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {layers.map((layer) => (
            <div key={layer.id} className="gc-layer-item flex items-center gap-2 rounded bg-ubos-midnight px-2 py-1.5">
              <span className="rounded bg-ubos-graphics-muted px-1.5 py-0.5 text-[8px] font-bold uppercase text-ubos-graphics-text">{layer.type}</span>
              <span className="flex-1 truncate text-[10px] text-ubos-fg-secondary">{layer.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
