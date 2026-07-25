'use client';

type Platform = { name: string; value: number };

const platformAccent: Record<string, string> = {
  youtube:   'bg-red-500/70',
  twitch:    'bg-[#9146ff]/70',
  facebook:  'bg-blue-500/70',
  tiktok:    'bg-pink-500/70',
  instagram: 'bg-fuchsia-500/70',
  x:         'bg-[#475569]/70',
};

export function PlatformBars({ platforms }: { platforms: Platform[] }) {
  return (
    <div className="eg-platform-bars rounded-lg border border-[#1e2530] bg-[#0d1117] p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Platform Engagement</h4>
      {platforms.length === 0 ? (
        <div className="eg-empty text-[10px] text-[#334155]">No platform data</div>
      ) : (
        <div className="flex flex-col gap-2">
          {platforms.map((p) => {
            const key = p.name.toLowerCase();
            const fill = platformAccent[key] ?? 'bg-[#4da3ff]/70';
            return (
              <div key={p.name} className="eg-platform-item">
                <div className="mb-0.5 flex items-center justify-between text-[9px]">
                  <span className="eg-platform-label text-[#94a3b8]">{p.name}</span>
                  <span className="text-[#475569]">{p.value}%</span>
                </div>
                <div className="eg-platform-bar h-1.5 overflow-hidden rounded-full bg-[#0a1628]">
                  <div
                    className={`eg-platform-fill h-full rounded-full transition-all ${fill}`}
                    style={{ width: `${Math.min(p.value, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
