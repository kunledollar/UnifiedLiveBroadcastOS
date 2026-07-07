'use client';

/**
 * UBOS 3.15C — compact monitor overlay.
 *
 * Renders small, non-obstructive telemetry chips in the four corners of a
 * monitor. The overlay is `pointer-events-none` throughout so it can never
 * block interaction with the underlying video surface, and it only displays
 * data that the production runtime already exposes — nothing is fabricated.
 * Secondary details are revealed on hover of the monitor cell (via the
 * `group/monitor` class on the host).
 *
 * 3.15C changes (polish only):
 * - Chip backdrop uses slightly more opaque background for contrast on busy video
 * - LIVE badge animates via ubos-status-pulse keyframe
 * - Hover reveal uses improved opacity transition timing
 * - Audio bar uses ubos design tokens for clip color
 */
import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export type MonitorOverlayRole = 'program' | 'preview';

/** Serializable display strings only — never runtime handles. */
export type MonitorOverlayData = {
  /** e.g. 'LIVE' | 'READY' | 'PROGRAM' | 'PREVIEW' */
  stateLabel: string;
  sceneName?: string | undefined;
  sourceName?: string | undefined;
  resolution?: string | undefined;
  fps?: string | undefined;
  /** 0-100, already derived by existing metering. */
  audioLevel?: number | null | undefined;
  /** Program: recording state label when available. */
  recordingLabel?: string | undefined;
  /** Program: streaming state label when available. */
  streamingLabel?: string | undefined;
  /** Program: dropped frame counter label when available. */
  droppedLabel?: string | undefined;
  /** Latency label when the runtime exposes one. */
  latencyLabel?: string | undefined;
  /** Preview: number of armed graphics layers. */
  armedGraphicsCount?: number | undefined;
  /** Preview: active transition type. */
  transitionLabel?: string | undefined;
};

const roleChrome = {
  program: {
    badge: 'border-ubos-program-border/60 bg-ubos-program text-white',
    chip: 'border-ubos-program-border/40 bg-black/60 text-ubos-program-text',
    prefix: 'PGM',
  },
  preview: {
    badge: 'border-ubos-preview-border/60 bg-ubos-preview text-white',
    chip: 'border-ubos-preview-border/40 bg-black/60 text-ubos-preview-text',
    prefix: 'PVW',
  },
} as const;

function OverlayChip({
  children,
  className,
  secondary = false,
}: {
  children: ReactNode;
  className?: string;
  secondary?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-[14rem] items-center gap-1 truncate rounded-ubos-sm border px-1.5 py-px',
        'font-mono text-[9px] uppercase tracking-wide',
        'backdrop-blur-sm',
        secondary && 'opacity-0 transition-opacity duration-[var(--ubos-duration-normal)] group-hover/monitor:opacity-100',
        className,
      )}
    >
      {children}
    </span>
  );
}

function MiniAudioBar({ level, className }: { level: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, level));
  return (
    <span
      className={cn(
        'inline-flex h-1 w-10 overflow-hidden rounded-full bg-white/15',
        className,
      )}
      role="img"
      aria-label={`Audio level ${Math.round(clamped)}%`}
    >
      <span
        className={cn('h-full rounded-full', clamped > 85 ? 'bg-red-400' : 'bg-emerald-400')}
        style={{ width: `${clamped}%` }}
      />
    </span>
  );
}

export function MonitorOverlay({
  role,
  data,
  className,
}: {
  role: MonitorOverlayRole;
  data: MonitorOverlayData;
  className?: string;
}) {
  const chrome = roleChrome[role];

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-10 select-none', className)}
      aria-hidden="true"
    >
      {/* Top-left: role badge + scene name. Offset below the top edge so the
          existing monitor warning strip is never obscured. */}
      <div className="absolute left-1.5 top-7 flex max-w-[70%] items-center gap-1">
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-ubos-sm border px-1.5 py-px text-[9px] font-black uppercase tracking-[0.14em]',
            chrome.badge,
            role === 'program' && data.stateLabel === 'LIVE' && 'animate-pulse',
          )}
        >
          {chrome.prefix} · {data.stateLabel}
        </span>
        {data.sceneName ? <OverlayChip className={chrome.chip}>{data.sceneName}</OverlayChip> : null}
      </div>

      {/* Top-right: resolution + fps. */}
      <div className="absolute right-1.5 top-7 flex items-center gap-1">
        {data.resolution ? <OverlayChip className={chrome.chip}>{data.resolution}</OverlayChip> : null}
        {data.fps ? <OverlayChip className={chrome.chip}>{data.fps} fps</OverlayChip> : null}
      </div>

      {/* Bottom-left: source + audio level. */}
      <div className="absolute bottom-1.5 left-1.5 flex max-w-[70%] items-center gap-1">
        {data.sourceName ? <OverlayChip className={chrome.chip}>{data.sourceName}</OverlayChip> : null}
        {typeof data.audioLevel === 'number' ? (
          <OverlayChip className={chrome.chip}>
            <MiniAudioBar level={data.audioLevel} />
          </OverlayChip>
        ) : null}
      </div>

      {/* Bottom-right: secondary details (hover to reveal). */}
      <div className="absolute bottom-1.5 right-1.5 flex flex-wrap items-center justify-end gap-1">
        {role === 'program' ? (
          <>
            {data.recordingLabel ? (
              <OverlayChip className={chrome.chip} secondary>
                REC {data.recordingLabel}
              </OverlayChip>
            ) : null}
            {data.streamingLabel ? (
              <OverlayChip className={chrome.chip} secondary>
                STR {data.streamingLabel}
              </OverlayChip>
            ) : null}
            {data.droppedLabel ? (
              <OverlayChip className={chrome.chip} secondary>
                DROP {data.droppedLabel}
              </OverlayChip>
            ) : null}
          </>
        ) : (
          <>
            {typeof data.armedGraphicsCount === 'number' ? (
              <OverlayChip className={chrome.chip} secondary>
                GFX {data.armedGraphicsCount} armed
              </OverlayChip>
            ) : null}
            {data.transitionLabel ? (
              <OverlayChip className={chrome.chip} secondary>
                TRN {data.transitionLabel}
              </OverlayChip>
            ) : null}
          </>
        )}
        {data.latencyLabel ? (
          <OverlayChip className={chrome.chip} secondary>
            LAT {data.latencyLabel}
          </OverlayChip>
        ) : null}
      </div>
    </div>
  );
}
