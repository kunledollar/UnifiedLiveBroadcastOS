'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { AudioMeter } from '../audio-console/AudioMeter';

export type MonitorStatusInfo = {
  resolution: string;
  fps: string;
  sourceName: string;
  state: 'live' | 'program' | 'preview' | 'standby';
  audioLevel?: number | null;
  audioMuted?: boolean;
};

type MonitorRole = 'program' | 'preview';

type FullscreenTarget = MonitorRole | null;

const tallyStyles: Record<
  MonitorRole,
  {
    border: string;
    glow: string;
    headerBg: string;
    headerBorder: string;
    label: string;
    chip: string;
    stateChip: string;
  }
> = {
  program: {
    border: 'border-red-600/55',
    glow: 'shadow-[0_0_48px_rgba(220,38,38,0.18)]',
    headerBg: 'bg-[#140608]/95',
    headerBorder: 'border-red-900/45',
    label: 'text-red-400',
    chip: 'border-red-900/50 bg-red-950/60 text-red-100/90',
    stateChip: 'border-red-500/40 bg-red-500/15 text-red-200',
  },
  preview: {
    border: 'border-emerald-500/55',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.14)]',
    headerBg: 'bg-[#06120c]/95',
    headerBorder: 'border-emerald-900/40',
    label: 'text-emerald-400',
    chip: 'border-emerald-900/45 bg-emerald-950/55 text-emerald-100/90',
    stateChip: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-200',
  },
};

function StatusChip({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-[9rem] items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide',
        className,
      )}
      title={`${label}: ${value}`}
    >
      <span className="text-[8px] font-bold opacity-60">{label}</span>
      <span className="truncate">{value}</span>
    </span>
  );
}

function MonitorEdgeMeter({
  level,
  muted,
}: {
  level: number | null | undefined;
  muted?: boolean;
}) {
  if (level === undefined) return null;

  return (
    <div
      className="flex shrink-0 items-stretch border-l border-white/8 bg-black/70 px-0.5 py-1"
      aria-hidden={level === null}
    >
      <AudioMeter level={level ?? 0} muted={muted ?? false} className="h-full min-h-[4.5rem] w-3" />
    </div>
  );
}

function MonitorBayCell({
  role,
  monitor,
  status,
  fullscreen,
  onToggleFullscreen,
}: {
  role: MonitorRole;
  monitor: ReactNode;
  status: MonitorStatusInfo;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const styles = tallyStyles[role];
  const stateLabel =
    status.state === 'live'
      ? 'LIVE'
      : status.state === 'program'
        ? 'PROGRAM'
        : status.state === 'preview'
          ? 'PREVIEW'
          : 'STANDBY';

  return (
    <div
      {...(role === 'program' ? { 'data-ubos-program-monitor': 'true' } : {})}
      className={cn(
        'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-ubos-md border bg-black',
        styles.border,
        styles.glow,
        fullscreen && 'fixed inset-3 z-[80] shadow-2xl',
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center gap-1.5 border-b px-1.5 py-1',
          styles.headerBg,
          styles.headerBorder,
        )}
      >
        <span
          className={cn(
            'shrink-0 text-[10px] font-black uppercase tracking-[0.18em]',
            styles.label,
          )}
        >
          {role === 'program' ? 'Program' : 'Preview'}
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <StatusChip label="Res" value={status.resolution} className={styles.chip} />
          <StatusChip label="FPS" value={status.fps} className={styles.chip} />
          <StatusChip label="Src" value={status.sourceName} className={styles.chip} />
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]',
              styles.stateChip,
              status.state === 'live' && role === 'program' && 'animate-pulse',
            )}
          >
            {stateLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className={cn(
            'shrink-0 rounded-ubos-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors',
            styles.chip,
            'hover:bg-white/10',
          )}
          aria-label={fullscreen ? `Exit ${role} fullscreen` : `Fullscreen ${role}`}
        >
          {fullscreen ? 'Exit' : 'Full'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">{monitor}</div>
        <MonitorEdgeMeter
          level={status.audioLevel}
          {...(status.audioMuted !== undefined ? { muted: status.audioMuted } : {})}
        />
      </div>
    </div>
  );
}

export function CenterProgramPreviewDeck({
  programMonitor,
  previewMonitor,
  programStatus,
  previewStatus,
  switcherContent,
  programFlexWeight = 64,
  previewFlexWeight = 36,
  className,
}: {
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programStatus: MonitorStatusInfo;
  previewStatus: MonitorStatusInfo;
  switcherContent: ReactNode;
  programFlexWeight?: number;
  previewFlexWeight?: number;
  className?: string;
}) {
  const [fullscreenTarget, setFullscreenTarget] = useState<FullscreenTarget>(null);
  const [dualMonitorHint, setDualMonitorHint] = useState(false);

  const toggleFullscreen = useCallback((target: MonitorRole) => {
    setFullscreenTarget((current) => (current === target ? null : target));
  }, []);

  const monitors = {
    program: {
      monitor: programMonitor,
      status: programStatus,
    },
    preview: {
      monitor: previewMonitor,
      status: previewStatus,
    },
  } as const;

  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-1', className)}
      aria-label="Program and preview monitors"
    >
      <div className="flex shrink-0 items-center justify-end gap-1 px-0.5">
        {dualMonitorHint ? (
          <span className="mr-auto rounded-ubos-sm border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">
            Dual monitor output routing — coming soon
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setDualMonitorHint((value) => !value)}
          className="rounded-ubos-sm border border-white/12 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300 transition-colors hover:border-white/25 hover:bg-white/10"
          aria-label="Dual monitor output placeholder"
        >
          Dual Monitor
        </button>
      </div>

      <div
        className="grid min-h-0 flex-1 gap-1.5 overflow-hidden"
        style={{ gridTemplateColumns: `${programFlexWeight}fr ${previewFlexWeight}fr` }}
      >
        <MonitorBayCell
          role="program"
          monitor={monitors.program.monitor}
          status={monitors.program.status}
          fullscreen={false}
          onToggleFullscreen={() => toggleFullscreen('program')}
        />
        <MonitorBayCell
          role="preview"
          monitor={monitors.preview.monitor}
          status={monitors.preview.status}
          fullscreen={false}
          onToggleFullscreen={() => toggleFullscreen('preview')}
        />
      </div>

      {fullscreenTarget ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/65"
            aria-label="Close fullscreen monitor"
            onClick={() => setFullscreenTarget(null)}
          />
          <MonitorBayCell
            role={fullscreenTarget}
            monitor={monitors[fullscreenTarget].monitor}
            status={monitors[fullscreenTarget].status}
            fullscreen
            onToggleFullscreen={() => toggleFullscreen(fullscreenTarget)}
          />
        </>
      ) : null}

      <div className="shrink-0 overflow-hidden rounded-ubos-md border border-ubos-border-subtle bg-[#060a12] shadow-ubos-raised">
        {switcherContent}
      </div>
    </section>
  );
}
