'use client';

type ChatMessage = {
  id: string;
  user: string;
  avatar?: string;
  platform: string;
  time: string;
  text: string;
  flagged?: boolean;
};

const platformColor: Record<string, string> = {
  youtube:   'bg-red-500/20 text-red-400',
  twitch:    'bg-[#9146ff]/20 text-[#9146ff]',
  facebook:  'bg-blue-500/20 text-blue-400',
  tiktok:    'bg-pink-500/20 text-pink-400',
  instagram: 'bg-fuchsia-500/20 text-fuchsia-400',
  x:         'bg-[#334155] text-[#94a3b8]',
};

function platformBadge(platform: string) {
  const key = platform.toLowerCase();
  return platformColor[key] ?? 'bg-[#1e2530] text-[#475569]';
}

export function UnifiedChatMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`uc-msg flex gap-2.5 rounded-lg border p-2 ${msg.flagged ? 'border-red-500/50 bg-red-500/5' : 'border-[#1e2530] bg-[#0d1117]'}`}>
      {/* Avatar */}
      <div className="uc-avatar h-8 w-8 shrink-0 overflow-hidden rounded-full">
        {msg.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={msg.avatar} alt={msg.user} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1e2530] text-[9px] font-bold uppercase text-[#475569]">
            {msg.user.charAt(0)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="uc-body min-w-0 flex-1">
        <div className="uc-header flex flex-wrap items-center gap-1.5 text-[10px]">
          <strong className="font-semibold text-[#e2e8f0]">{msg.user}</strong>
          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${platformBadge(msg.platform)}`}>
            {msg.platform}
          </span>
          <span className="text-[#334155]">{msg.time}</span>
        </div>
        <div className="uc-text mt-1 text-[11px] leading-relaxed text-[#94a3b8]">{msg.text}</div>
        {msg.flagged && (
          <div className="uc-flag mt-1 text-[9px] font-bold uppercase tracking-wide text-red-400">
            ⚑ Flagged for moderation
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="uc-actions flex shrink-0 flex-col gap-1">
        {['Mute', 'Ban', 'Clear'].map((action) => (
          <button
            key={action}
            type="button"
            className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${
              action === 'Ban'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-[#0a1628] text-[#475569] hover:bg-[#1e2530] hover:text-[#94a3b8]'
            }`}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
