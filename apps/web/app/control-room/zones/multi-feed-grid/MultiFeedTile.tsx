'use client';

type Feed = {
  id: string;
  name: string;
  thumbnail?: string;
  source?: string;
  health?: 'healthy' | 'degraded' | 'offline';
  droppedFrames?: number;
};

const healthColor: Record<NonNullable<Feed['health']>, string> = {
  healthy:  'text-emerald-400',
  degraded: 'text-amber-400',
  offline:  'text-[#334155]',
};

const healthDot: Record<NonNullable<Feed['health']>, string> = {
  healthy:  'bg-emerald-400',
  degraded: 'bg-amber-400 animate-pulse',
  offline:  'bg-[#334155]',
};

export function MultiFeedTile({ feed }: { feed: Feed }) {
  const health = feed.health ?? 'offline';

  return (
    <div className="mfg-tile flex flex-col gap-2 overflow-hidden rounded-lg border border-[#1e2530] bg-[#0d1117] p-2">
      {/* Video area */}
      <div className="mfg-video relative h-[140px] w-full overflow-hidden rounded border border-[#1e3a5f] bg-black">
        {feed.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={feed.thumbnail} alt={feed.name} className="h-full w-full object-cover" />
        ) : (
          <div className="mfg-video-empty flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-[#1e3a5f]">
            No feed
          </div>
        )}
        {/* Health indicator */}
        <div className={`absolute right-1.5 top-1.5 flex items-center gap-1 text-[8px] font-bold uppercase ${healthColor[health]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${healthDot[health]}`} />
          {health}
        </div>
      </div>

      {/* Metadata */}
      <div className="mfg-meta flex flex-col gap-0.5 text-[10px]">
        <strong className="truncate font-semibold text-[#94a3b8]">{feed.name}</strong>
        <span className="text-[#334155]">ID: {feed.id}</span>
        <span className="text-[#334155]">Source: {feed.source ?? 'unknown'}</span>
        <div className="mt-0.5 flex items-center justify-between">
          <span className={`text-[9px] font-medium ${healthColor[health]}`}>Health: {health}</span>
          <span className={`text-[9px] ${(feed.droppedFrames ?? 0) > 0 ? 'text-amber-400' : 'text-[#334155]'}`}>
            Dropped: {feed.droppedFrames ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
