'use client';

type TimelineItem = { id: string; time: string; label: string };
type Scene = { id: string; name: string; timeline?: TimelineItem[] };

export function SceneTimeline({ scene }: { scene: Scene | undefined }) {
  if (!scene) {
    return (
      <div className="scene-timeline empty flex h-full items-center justify-center text-[10px] text-[#334155]">
        No scene selected
      </div>
    );
  }

  if (!scene.timeline || scene.timeline.length === 0) {
    return (
      <div className="scene-timeline empty flex h-full items-center justify-center text-[10px] text-[#334155]">
        No timeline events for {scene.name}
      </div>
    );
  }

  return (
    <div className="scene-timeline flex flex-row gap-2 overflow-x-auto">
      {scene.timeline.map((item) => (
        <div
          key={item.id}
          className="timeline-item shrink-0 rounded bg-[#0d1117] px-2.5 py-1.5 text-[10px]"
        >
          <span className="timeline-time mr-1.5 text-[#7c6af7]">{item.time}</span>
          <span className="timeline-label text-[#94a3b8]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
