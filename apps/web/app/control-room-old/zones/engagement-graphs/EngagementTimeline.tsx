'use client';

type TimelinePoint = { time: string; value: number };

export function EngagementTimeline({ timeline }: { timeline: TimelinePoint[] }) {
  const max = Math.max(...timeline.map((p) => p.value), 1);

  return (
    <div className="eg-timeline rounded-lg border border-[#1e2530] bg-[#0d1117] p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Viewer Timeline</h4>
      {timeline.length === 0 ? (
        <div className="eg-empty text-[10px] text-[#334155]">No timeline data</div>
      ) : (
        <div className="eg-timeline-graph flex h-20 items-end gap-0.5 overflow-hidden">
          {timeline.map((point, i) => (
            <div
              key={`${point.time}-${i}`}
              className="eg-timeline-point w-1.5 min-w-[4px] flex-1 rounded-t bg-[#4da3ff]/70 transition-all"
              style={{ height: `${Math.round((point.value / max) * 100)}%` }}
              title={`${point.time}: ${point.value}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
