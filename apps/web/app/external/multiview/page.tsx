'use client';

/**
 * /external/multiview — External monitor zone for the Multiview output.
 *
 * Opened by the "Pop Out" button on the Multiview panel in the Control Room.
 * Displays a full-viewport multiview grid with no dock, shell, or workspace
 * chrome.
 *
 * The grid renders production source tiles in the standard broadcast
 * multiview layout: Program (dominant, red tally) and Preview (green tally)
 * plus secondary source tiles.
 */

import { useEffect, useState } from 'react';

type TallyColor = 'program' | 'preview' | 'idle' | 'offline';

type Tile = {
  id: string;
  label: string;
  tally: TallyColor;
  resolution: string;
  fps: string;
  dominant?: boolean;
};

const TILES: Tile[] = [
  { id: 'program', label: 'Program', tally: 'program', resolution: '1920×1080', fps: '59.94', dominant: true },
  { id: 'preview', label: 'Preview', tally: 'preview', resolution: '1920×1080', fps: '59.94' },
  { id: 'cam1', label: 'Camera 1', tally: 'program', resolution: '3840×2160', fps: '59.94' },
  { id: 'cam2', label: 'Camera 2', tally: 'preview', resolution: '3840×2160', fps: '59.94' },
  { id: 'screen', label: 'Screen Share', tally: 'idle', resolution: '2560×1440', fps: '30' },
  { id: 'media', label: 'Media Player', tally: 'idle', resolution: '1920×1080', fps: '29.97' },
  { id: 'replay', label: 'Replay', tally: 'offline', resolution: '1920×1080', fps: '59.94' },
  { id: 'graphics', label: 'Graphics', tally: 'idle', resolution: '1920×1080', fps: '60' },
];

const TALLY_STYLES: Record<TallyColor, { border: string; glow: string; badge: string; label: string; bg: string }> = {
  program: {
    border: 'border-red-500',
    glow: 'shadow-[0_0_18px_rgba(239,68,68,0.4)]',
    badge: 'bg-red-600 text-white',
    label: 'PROGRAM',
    bg: 'from-red-950/40',
  },
  preview: {
    border: 'border-green-500',
    glow: 'shadow-[0_0_18px_rgba(34,197,94,0.35)]',
    badge: 'bg-green-600 text-white',
    label: 'PREVIEW',
    bg: 'from-green-950/40',
  },
  idle: {
    border: 'border-zinc-700',
    glow: '',
    badge: 'bg-zinc-800 text-zinc-300',
    label: 'IDLE',
    bg: 'from-zinc-900/30',
  },
  offline: {
    border: 'border-zinc-800',
    glow: '',
    badge: 'bg-zinc-900 text-zinc-500',
    label: 'OFFLINE',
    bg: 'from-zinc-950/20',
  },
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

function MultiviewTile({ tile }: { tile: Tile }) {
  const styles = TALLY_STYLES[tile.tally];
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border-2 bg-zinc-950 ${styles.border} ${styles.glow}`}
    >
      {/* Video surface */}
      <div className={`relative flex-1 bg-gradient-to-br ${styles.bg} to-black`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="select-none font-black uppercase tracking-widest"
            style={{ fontSize: 'clamp(0.6rem, 2.5vw, 1.4rem)', opacity: 0.15, color: tile.tally === 'program' ? '#ef4444' : tile.tally === 'preview' ? '#22c55e' : '#71717a' }}
          >
            {tile.label}
          </span>
        </div>
      </div>

      {/* Tile footer */}
      <div className="flex shrink-0 items-center gap-1.5 border-t border-white/10 bg-black/80 px-2 py-1">
        <span className={`shrink-0 rounded px-1.5 py-px text-[8px] font-black uppercase tracking-wider ${styles.badge}`}>
          {styles.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[9px] font-semibold uppercase tracking-wide text-white/70">
          {tile.label}
        </span>
        <span className="shrink-0 font-mono text-[8px] text-white/30">
          {tile.fps}fps
        </span>
      </div>
    </div>
  );
}

export default function ExternalMultiviewPage() {
  const time = useClock();

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950"
      data-ubos-external-monitor="multiview"
    >
      {/* Header bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/90 px-4 py-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/80">
          UBOS
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          Multiview
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[10px] text-white/30">{time}</span>
      </header>

      {/* Multiview grid */}
      <div className="flex min-h-0 flex-1 gap-1 overflow-hidden p-1">
        {/* Program — dominant left column */}
        <div className="flex w-[40%] shrink-0 flex-col gap-1">
          <div className="flex min-h-0 flex-1">
            <MultiviewTile tile={TILES[0] as Tile} />
          </div>
          <div className="flex min-h-0 flex-1">
            <MultiviewTile tile={TILES[1] as Tile} />
          </div>
        </div>

        {/* Secondary sources grid — 3 columns × 2 rows */}
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1" style={{ gridTemplateRows: '1fr 1fr' }}>
          {TILES.slice(2).map((tile) => (
            <MultiviewTile key={tile.id} tile={tile} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-between border-t border-white/10 bg-black/90 px-4 py-1 text-[9px] font-mono text-white/25">
        <span>UBOS External Monitor · Multiview</span>
        <span>{TILES.filter((t) => t.tally === 'program').length} PGM · {TILES.filter((t) => t.tally === 'preview').length} PVW · {TILES.length} sources</span>
      </footer>
    </div>
  );
}
