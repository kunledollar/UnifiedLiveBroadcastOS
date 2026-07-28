'use client';

type TimelineItem = { id: string; time: string; label: string };

export function GraphicsTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <div className="gc-timeline flex flex-col overflow-hidden rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-2">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Timeline</h4>
      {timeline.length === 0 ? (
        <div className="gc-empty px-1 text-[10px] text-ubos-fg-muted">No timeline events</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {timeline.map((item) => (
            <div key={item.id} className="gc-timeline-item flex items-center gap-2 rounded bg-ubos-midnight px-2 py-1.5">
              <span className="text-[9px] text-ubos-graphics-text">{item.time}</span>
              <span className="flex-1 truncate text-[10px] text-ubos-fg-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
