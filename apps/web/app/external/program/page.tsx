'use client';

/**
 * /external/program — External monitor zone for the Program output.
 *
 * Opened by the "Pop Out" button on the Program monitor in the Control Room.
 * Displays only the Program panel with no dock, shell, or workspace chrome.
 *
 * The panel renders a full-viewport program monitor surface with live status
 * indicators. When real production state becomes available via a shared-state
 * mechanism (e.g. BroadcastChannel, SSE, or shared workers), this component
 * can be wired to it without altering the Control Room.
 */

import { useEffect, useState } from 'react';

type ProgramState = {
  sceneName: string;
  isLive: boolean;
  resolution: string;
  fps: string;
  outputStatus: string;
  recordingStatus: 'idle' | 'recording';
};

const DEFAULT_STATE: ProgramState = {
  sceneName: 'Main Scene',
  isLive: true,
  resolution: '1920×1080',
  fps: '59.94',
  outputStatus: 'active',
  recordingStatus: 'recording',
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

export default function ExternalProgramPage() {
  const [state] = useState<ProgramState>(DEFAULT_STATE);
  const time = useClock();

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-black"
      data-ubos-external-monitor="program"
    >
      {/* Program tally border glow */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ boxShadow: 'inset 0 0 0 3px rgba(239,68,68,0.85), inset 0 0 48px rgba(239,68,68,0.18)' }}
        aria-hidden="true"
      />

      {/* Video surface placeholder */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(239,68,68,0.12),transparent_55%),radial-gradient(ellipse_at_70%_80%,rgba(120,0,0,0.18),transparent_55%),linear-gradient(160deg,#0d0d0d,#000)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="select-none text-[clamp(3rem,8vw,7rem)] font-black uppercase tracking-[0.2em]"
            style={{ color: 'rgba(239,68,68,0.14)' }}
          >
            PROGRAM
          </span>
        </div>
      </div>

      {/* Header bar */}
      <header className="relative z-20 flex shrink-0 items-center gap-3 border-b border-red-900/60 bg-black/80 px-4 py-2 backdrop-blur-sm">
        {/* Live badge */}
        <span className="shrink-0 animate-pulse rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
          ● LIVE
        </span>

        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-widest text-red-200/80">
          Program · {state.sceneName}
        </span>

        {/* Metadata chips */}
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-mono text-red-300/70">
          <span>{state.resolution}</span>
          <span className="text-red-900/60">·</span>
          <span>{state.fps} fps</span>
          <span className="text-red-900/60">·</span>
          <span
            className="rounded px-1.5 py-px text-[9px] font-bold uppercase"
            style={{ background: state.recordingStatus === 'recording' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)', color: state.recordingStatus === 'recording' ? '#fca5a5' : '#6b7280' }}
          >
            {state.recordingStatus === 'recording' ? '● REC' : 'REC idle'}
          </span>
          <span className="text-red-300/50">{time}</span>
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
      <footer className="relative z-20 mt-auto flex shrink-0 items-center justify-between border-t border-red-900/50 bg-black/80 px-4 py-1.5 text-[10px] backdrop-blur-sm">
        <span className="font-mono uppercase tracking-widest text-red-400/70">
          UBOS External Monitor · Program
        </span>
        <span className="font-mono text-red-300/40">
          Output: {state.outputStatus}
        </span>
      </footer>
    </div>
  );
}
