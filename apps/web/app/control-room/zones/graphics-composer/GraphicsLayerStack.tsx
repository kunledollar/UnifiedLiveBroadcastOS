'use client';

type Layer = { id: string; type: string; name: string };

export function GraphicsLayerStack({ layers }: { layers: Layer[] }) {
  return (
    <div className="gc-layer-stack flex flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#0d1117] p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Layers</h4>
      {layers.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-[#334155]">No layers</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {layers.map((layer) => (
            <div key={layer.id} className="gc-layer-item flex items-center gap-2 rounded bg-[#0a1628] px-2 py-1.5">
              <span className="rounded bg-[#7c6af7]/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#7c6af7]">{layer.type}</span>
              <span className="flex-1 truncate text-[10px] text-[#94a3b8]">{layer.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
