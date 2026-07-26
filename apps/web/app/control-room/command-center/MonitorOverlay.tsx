'use client';

/**
 * UBOS 3.15D-2 — compact monitor overlay.
 *
 * Renders small, non-obstructive telemetry chips in the four corners of a
 * monitor. The overlay is `pointer-events-none` throughout so it can never
 * block interaction with the underlying video surface, and it only displays
 * data that the production runtime already exposes — nothing is fabricated.
 * Secondary details are revealed on hover of the monitor cell (via the
 * `group/monitor` class on the host).
 *
 * Program overlay (per 3.15D-2 spec):
 *   Primary (always visible):   PGM/LIVE or STANDBY badge, scene name,
 *                                source name, resolution, FPS, audio level.
 *   Secondary (hover to reveal): REC status, STREAM status, latency,
 *                                dropped frames.
 *
 * Preview overlay (per 3.15D-2 spec):
 *   Primary (always visible):   PVW/READY badge, scene name, source name,
 *                                resolution, FPS, audio level.
 *   Secondary (hover to reveal): armed graphics count, transition type,
 *                                latency.
 *
 * Requirements:
 *   - Overlays must be compact and must not block the video.
 *   - Secondary details appear only on hover.
 *   - Red Program styling, emerald Preview styling.
 */
import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export type MonitorOverlayRole = 'program' | 'preview';

/** Serializable display strings only — never runtime handles. */
export type MonitorOverlayData = {
  /**
   * State badge text shown after the role prefix.
   * Program: 'LIVE' | 'STANDBY'
   * Preview: 'READY' | 'LIVE'
   */
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
  /** Latency label when the runtime exposes one (shown for both monitors). */
  latencyLabel?: string | undefined;
  /** Preview: number of armed graphics layers. */
  armedGraphicsCount?: number | undefined;
  /** Preview: active transition type label. */
  transitionLabel?: string | undefined;
};

const roleChrome = {
  program: {
    badge: 'border-ubos-program-border/60 bg-ubos-program text-white',
    badgeLive: 'animate-[ubos-status-pulse_1.5s_ease-in-out_infinite]',
    chip: 'border-ubos-program-border/40 bg-black/65 text-ubos-program-text',
    prefix: 'PGM',
  },
  preview: {
    badge: 'border-ubos-preview-border/60 bg-ubos-preview text-white',
    badgeLive: '',
    chip: 'border-ubos-preview-border/40 bg-black/65 text-ubos-preview-text',
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
        secondary &&
          'opacity-0 transition-opacity duration-[var(--ubos-duration-normal)] group-hover/monitor:opacity-100',
        className,
      )}
    >
      {children}
    </span>
  );
}

// UBDS color semantics (Step 92): mirrors the audio meter convention used
// elsewhere (clipping escalates to Program Red, elevated levels warn
// Warning Yellow, nominal level is healthy/success).
function MiniAudioBar({ level, className }: { level: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, level));
  const barColor =
    clamped > 85 ? 'bg-ubos-program' : clamped > 65 ? 'bg-ubos-warning' : 'bg-ubos-success';
  return (
    <span
      className={cn('inline-flex h-1 w-10 overflow-hidden rounded-full bg-white/15', className)}
      role="img"
      aria-label={`Audio level ${Math.round(clamped)}%`}
    >
      <span className={cn('h-full rounded-full', barColor)} style={{ width: `${clamped}%` }} />
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
  const isLive = data.stateLabel === 'LIVE';

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-10 select-none', className)}
      aria-hidden="true"
    >
      {/* ── Top-left: role badge + scene name ────────────────────────────
          Offset below the monitor header (top-7) so the existing warning
          strip is never obscured. Scene name uses the chip secondary reveal
          to keep the badge prominent. */}
      <div className="absolute left-1.5 top-7 flex max-w-[70%] flex-wrap items-center gap-1">
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-ubos-sm border px-1.5 py-px',
            'text-[9px] font-black uppercase tracking-[0.14em]',
            chrome.badge,
            isLive && chrome.badgeLive,
          )}
        >
          {chrome.prefix} · {data.stateLabel}
        </span>
        {data.sceneName ? (
          <OverlayChip className={chrome.chip}>{data.sceneName}</OverlayChip>
        ) : null}
      </div>

      {/* ── Top-right: resolution + fps ───────────────────────────────── */}
      <div className="absolute right-1.5 top-7 flex items-center gap-1">
        {data.resolution ? (
          <OverlayChip className={chrome.chip}>{data.resolution}</OverlayChip>
        ) : null}
        {data.fps ? (
          <OverlayChip className={chrome.chip}>{data.fps} fps</OverlayChip>
        ) : null}
      </div>

      {/* ── Bottom-left: source name + audio level ────────────────────── */}
      <div className="absolute bottom-1.5 left-1.5 flex max-w-[65%] flex-wrap items-center gap-1">
        {data.sourceName ? (
          <OverlayChip className={chrome.chip}>{data.sourceName}</OverlayChip>
        ) : null}
        {typeof data.audioLevel === 'number' ? (
          <OverlayChip className={chrome.chip}>
            <MiniAudioBar level={data.audioLevel} />
          </OverlayChip>
        ) : null}
      </div>

      {/* ── Bottom-right: secondary details (hover to reveal) ─────────── */}
      <div className="absolute bottom-1.5 right-1.5 flex flex-wrap items-end justify-end gap-1">
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
