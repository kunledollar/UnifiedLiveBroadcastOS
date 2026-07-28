'use client';

type Reaction = { count: number; color: string };

export function ReactionHeatmap({ reactions }: { reactions: Reaction[] }) {
  return (
    <div className="eg-heatmap rounded-lg border border-[#1e2530] bg-[#0d1117] p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Reaction Heatmap</h4>
      {reactions.length === 0 ? (
        <div className="eg-empty text-[10px] text-[#334155]">No reactions</div>
      ) : (
        <div className="eg-heatmap-grid grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))' }}>
          {reactions.map((r, i) => (
            <div
              key={i}
              className="eg-heatmap-cell flex h-7 items-center justify-center rounded text-[9px] font-bold text-black"
              style={{ backgroundColor: r.color }}
              title={`Count: ${r.count}`}
            >
              {r.count > 99 ? '99+' : r.count}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
