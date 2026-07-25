'use client';

type Camera = {
  id: string;
  name: string;
  thumbnail?: string;
  status?: 'live' | 'recording' | 'standby' | 'offline';
  resolution?: string;
};

const statusColor: Record<NonNullable<Camera['status']>, string> = {
  live:      'bg-red-500/20 text-red-400',
  recording: 'bg-red-500/20 text-red-400',
  standby:   'bg-amber-500/20 text-amber-400',
  offline:   'bg-[#1e2530] text-[#334155]',
};

const statusDot: Record<NonNullable<Camera['status']>, string> = {
  live:      'bg-red-500',
  recording: 'bg-red-500 animate-pulse',
  standby:   'bg-amber-400',
  offline:   'bg-[#334155]',
};

export function CameraGridItem({ camera }: { camera: Camera }) {
  const status = camera.status ?? 'standby';

  return (
    <div className="cg-item flex flex-col gap-2 overflow-hidden rounded-lg border border-[#1e2530] bg-[#0d1117] p-2">
      {/* Video thumbnail */}
      <div className="cg-video relative h-[120px] w-full overflow-hidden rounded border border-[#1e3a5f] bg-black">
        {camera.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={camera.thumbnail} alt={camera.name} className="h-full w-full object-cover" />
        ) : (
          <div className="cg-video-empty flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-[#1e3a5f]">
            No feed
          </div>
        )}
        {/* Status badge */}
        <div className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${statusColor[status]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
          {status}
        </div>
      </div>

      {/* Metadata */}
      <div className="cg-meta flex flex-col gap-0.5 text-[10px]">
        <strong className="truncate font-semibold text-[#94a3b8]">{camera.name}</strong>
        <span className="text-[#334155]">ID: {camera.id}</span>
        {camera.resolution && (
          <span className="text-[#334155]">{camera.resolution}</span>
        )}
      </div>

      {/* Controls */}
      <div className="cg-controls flex gap-1">
        {['Replay', 'Mark', 'Focus'].map((action) => (
          <button
            key={action}
            type="button"
            className="flex-1 rounded bg-[#0a1628] px-1.5 py-1 text-[9px] font-medium text-[#475569] transition-colors hover:bg-[#7c6af7]/15 hover:text-[#7c6af7]"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
