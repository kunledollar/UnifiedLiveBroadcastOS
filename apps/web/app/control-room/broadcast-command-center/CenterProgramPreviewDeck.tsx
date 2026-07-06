'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { LayoutFocusMode } from '../workspaces/workspace-types';
import { AudioMeter } from '../audio-console/AudioMeter';
import {
  broadcastMonitor,
  broadcastSurfaces,
  DEFAULT_PREVIEW_FLEX,
  DEFAULT_PROGRAM_FLEX,
} from './broadcast-theme';

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

const tallyStyles = {
  program: broadcastMonitor.program,
  preview: broadcastMonitor.preview,
} as const;

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
        'inline-flex max-w-[10rem] items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        className,
      )}
      title={`${label}: ${value}`}
    >
      <span className="text-[9px] font-bold opacity-60">{label}</span>
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
      className="flex shrink-0 items-stretch border-l border-ubos-border-subtle bg-black/80 px-1 py-1.5"
      aria-hidden={level === null}
    >
      <AudioMeter level={level ?? 0} muted={muted ?? false} className="h-full min-h-[5rem] w-3.5" />
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
        'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-ubos-md border',
        broadcastSurfaces.monitorWell,
        styles.border,
        styles.glow,
        fullscreen && 'fixed inset-4 z-[80] shadow-2xl',
      )}
    >
      <header
        className={cn(
          'flex shrink-0 items-center gap-2 border-b px-2 py-1.5',
          styles.headerBg,
          styles.headerBorder,
        )}
      >
        <span
          className={cn(
            'shrink-0 text-xs font-black uppercase tracking-[0.2em]',
            styles.label,
          )}
        >
          {role === 'program' ? 'Program' : 'Preview'}
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <StatusChip label="Res" value={status.resolution} className={styles.chip} />
          <StatusChip label="FPS" value={status.fps} className={styles.chip} />
          <StatusChip label="Src" value={status.sourceName} className={styles.chip} />
          <span
            className={cn(
              'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]',
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
            'shrink-0 rounded-ubos-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors',
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
  programFlexWeight = DEFAULT_PROGRAM_FLEX,
  previewFlexWeight = DEFAULT_PREVIEW_FLEX,
  layoutFocus = 'full',
  compactChrome = false,
  className,
}: {
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programStatus: MonitorStatusInfo;
  previewStatus: MonitorStatusInfo;
  switcherContent: ReactNode;
  programFlexWeight?: number;
  previewFlexWeight?: number;
  layoutFocus?: LayoutFocusMode;
  compactChrome?: boolean;
  className?: string;
}) {
  const [fullscreenTarget, setFullscreenTarget] = useState<FullscreenTarget>(null);

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

  const showSwitcher = Boolean(switcherContent) && layoutFocus !== 'switcher';
  const monitorMinHeight =
    layoutFocus === 'audio' ? 'min-h-[12rem]' : layoutFocus === 'switcher' ? 'min-h-[20rem]' : 'min-h-[16rem]';

  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-1.5', className)}
      aria-label="Program and preview monitors"
    >
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 overflow-hidden xl:grid',
          monitorMinHeight,
        )}
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
            className="fixed inset-0 z-[70] bg-black/70"
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

      {showSwitcher ? (
        <div
          className={cn(
            'shrink-0 overflow-hidden rounded-ubos-md border shadow-ubos-raised',
            broadcastSurfaces.panel,
          )}
          style={{
            maxHeight: compactChrome ? '9rem' : 'var(--ubos-switcher-height, 11.5rem)',
          }}
        >
          {switcherContent}
        </div>
      ) : null}
    </section>
  );
}
