'use client';

/**
 * /external/preview — External monitor zone for the Preview output.
 *
 * Opened by the "Pop Out" button on the Preview monitor in the Control Room.
 * Displays only the Preview panel with no dock, shell, or workspace chrome.
 */

import { useEffect, useState } from 'react';

type PreviewState = {
  sceneName: string;
  resolution: string;
  fps: string;
};

const DEFAULT_STATE: PreviewState = {
  sceneName: 'Next Scene',
  resolution: '1920×1080',
  fps: '59.94',
};

function useClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function ExternalPreviewPage() {
  const [state] = useState<PreviewState>(DEFAULT_STATE);
  const time = useClock();

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-black"
      data-ubos-external-monitor="preview"
    >
      {/* Preview tally border glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ boxShadow: 'inset 0 0 0 3px rgba(34,197,94,0.80), inset 0 0 48px rgba(34,197,94,0.14)' }}
        aria-hidden="true"
      />

      {/* Video surface placeholder */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_25%,rgba(34,197,94,0.10),transparent_55%),radial-gradient(ellipse_at_35%_75%,rgba(0,80,40,0.16),transparent_55%),linear-gradient(160deg,#0a0d0a,#000)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="select-none text-[clamp(3rem,8vw,7rem)] font-black uppercase tracking-[0.2em]"
            style={{ color: 'rgba(34,197,94,0.12)' }}
          >
            PREVIEW
          </span>
        </div>
      </div>

      {/* Header bar */}
      <header className="relative z-20 flex shrink-0 items-center gap-3 border-b border-green-900/60 bg-black/80 px-4 py-2 backdrop-blur-sm">
        {/* Ready badge */}
        <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
          style={{ background: 'rgba(34,197,94,0.85)', color: '#fff' }}>
          ◈ READY
        </span>

        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-widest text-green-200/80">
          Preview · {state.sceneName}
        </span>

        {/* Metadata chips */}
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-mono text-green-300/70">
          <span>{state.resolution}</span>
          <span className="text-green-900/60">·</span>
          <span>{state.fps} fps</span>
          <span className="text-green-300/50">{time}</span>
        </div>
      </header>

      {/* Safe-area guides */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[2.25rem] z-20" aria-hidden="true">
        {/* Action safe 90% */}
        <div className="absolute inset-[5%] border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
        {/* Title safe 80% */}
        <div className="absolute inset-[10%] border border-dotted" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Footer bar */}
      <footer className="relative z-20 mt-auto flex shrink-0 items-center justify-between border-t border-green-900/50 bg-black/80 px-4 py-1.5 text-[10px] backdrop-blur-sm">
        <span className="font-mono uppercase tracking-widest text-green-400/70">
          UBOS External Monitor · Preview
        </span>
        <span className="font-mono text-green-300/40">
          Standby — next transition ready
        </span>
      </footer>
    </div>
  );
}
