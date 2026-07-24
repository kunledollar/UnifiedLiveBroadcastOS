'use client';

type TimelineItem = { id: string; time: string; label: string };

export function GraphicsTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <div className="gc-timeline flex flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#0d1117] p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Timeline</h4>
      {timeline.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-[#334155]">No timeline events</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {timeline.map((item) => (
            <div key={item.id} className="gc-timeline-item flex items-center gap-2 rounded bg-[#0a1628] px-2 py-1.5">
              <span className="text-[9px] text-[#7c6af7]">{item.time}</span>
              <span className="flex-1 truncate text-[10px] text-[#94a3b8]">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
