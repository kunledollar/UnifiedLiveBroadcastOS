'use client';

import type { ReactNode } from 'react';
import { StatusBadge, TelemetryBadge, cn } from '@ubos/ui';

export function BroadcastStatusBar({
  sessionName,
  isLive,
  isRecording,
  runTime,
  programSceneName,
  previewSceneName,
  clock,
  transitionActive,
  fps,
  cpu,
  dropped,
  upload,
  automationModeLabel,
  aiStatusLabel,
  toolsMenu,
  className,
}: {
  sessionName: string;
  isLive: boolean;
  isRecording: boolean;
  runTime: string;
  programSceneName: string;
  previewSceneName: string;
  clock: string;
  transitionActive: boolean;
  fps: string;
  cpu: string;
  dropped: string;
  upload: string;
  automationModeLabel?: string;
  aiStatusLabel?: string;
  toolsMenu?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex h-[var(--ubos-status-bar-height)] shrink-0 items-center gap-ubos-2 border-b border-ubos-border-subtle bg-ubos-graphite px-ubos-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-ubos-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-ubos-sm bg-ubos-selection-muted text-[0.625rem] font-bold text-ubos-selection-text">
          UB
        </span>
        <span className="ubos-truncate text-ubos-section font-semibold text-ubos-fg-primary">
          {sessionName}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <StatusBadge variant={isLive ? 'live' : 'neutral'} dot>
          {isLive ? 'LIVE' : 'LIVE idle'}
        </StatusBadge>
        <StatusBadge variant={isRecording ? 'rec' : 'neutral'}>
          {isRecording ? 'REC' : 'REC idle'}
        </StatusBadge>
      </div>

      <TelemetryBadge label="RUN" value={runTime} variant="neutral" />

      <StatusBadge variant={transitionActive ? 'warning' : 'success'}>
        {transitionActive ? 'Transition' : 'Ready'}
      </StatusBadge>

      {automationModeLabel ? (
        <StatusBadge variant="neutral">{automationModeLabel}</StatusBadge>
      ) : null}

      {aiStatusLabel ? (
        <StatusBadge variant="neutral">{aiStatusLabel}</StatusBadge>
      ) : null}

      <div className="hidden min-w-0 items-center gap-1 lg:flex">
        <TelemetryBadge label="FPS" value={fps} variant="neutral" />
        <TelemetryBadge label="CPU" value={cpu} variant="neutral" />
        <TelemetryBadge label="DROP" value={dropped} variant="neutral" />
        <TelemetryBadge label="UP" value={upload} variant="neutral" />
      </div>

      <span className="ml-auto hidden ubos-truncate font-mono text-ubos-metadata text-ubos-fg-muted xl:inline">
        {clock} · PGM {programSceneName} · PVW {previewSceneName}
      </span>

      {toolsMenu ? <div className="shrink-0">{toolsMenu}</div> : null}
    </header>
  );
}
