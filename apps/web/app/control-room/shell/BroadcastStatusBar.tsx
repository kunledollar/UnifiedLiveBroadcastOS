'use client';

import type { ReactNode } from 'react';
import { StatusBadge, TelemetryBadge, cn } from '@ubos/ui';

function HealthMenu({
  fps,
  cpu,
  dropped,
  upload,
  automationModeLabel,
  aiStatusLabel,
  outputHealthLabel,
  deviceHealthLabel,
  engineStatusLabel,
  clock,
}: {
  fps: string;
  cpu: string;
  dropped: string;
  upload: string;
  automationModeLabel?: string;
  aiStatusLabel?: string;
  outputHealthLabel?: string;
  deviceHealthLabel?: string;
  engineStatusLabel?: string;
  clock: string;
}) {
  const hasSecondaryLabels = Boolean(
    automationModeLabel ||
      aiStatusLabel ||
      outputHealthLabel ||
      deviceHealthLabel ||
      engineStatusLabel,
  );

  return (
    <details className="group relative shrink-0">
      <summary className="flex h-6 cursor-pointer list-none items-center gap-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight px-2 text-ubos-metadata font-medium text-ubos-fg-secondary hover:bg-ubos-slate">
        <span className="h-1.5 w-1.5 rounded-full bg-ubos-success" aria-hidden="true" />
        Health
        <span aria-hidden="true" className="text-ubos-fg-muted">
          ▾
        </span>
      </summary>
      <div className="absolute left-0 z-30 mt-1 grid min-w-56 gap-2 rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-3 text-ubos-caption text-ubos-fg-secondary shadow-ubos-raised">
        <div className="grid grid-cols-2 gap-1.5">
          <TelemetryBadge label="FPS" value={fps} variant="neutral" />
          <TelemetryBadge label="CPU" value={cpu} variant="neutral" />
          <TelemetryBadge label="DROP" value={dropped} variant="neutral" />
          <TelemetryBadge label="UP" value={upload} variant="neutral" />
        </div>
        {hasSecondaryLabels ? (
          <div className="flex flex-wrap gap-1 border-t border-ubos-border-subtle pt-2">
            {automationModeLabel ? (
              <StatusBadge variant="neutral">{automationModeLabel}</StatusBadge>
            ) : null}
            {aiStatusLabel ? <StatusBadge variant="neutral">{aiStatusLabel}</StatusBadge> : null}
            {outputHealthLabel ? (
              <StatusBadge variant="neutral">{outputHealthLabel}</StatusBadge>
            ) : null}
            {deviceHealthLabel ? (
              <StatusBadge variant="neutral">{deviceHealthLabel}</StatusBadge>
            ) : null}
            {engineStatusLabel ? (
              <StatusBadge variant="neutral">{engineStatusLabel}</StatusBadge>
            ) : null}
          </div>
        ) : null}
        <p className="border-t border-ubos-border-subtle pt-2 font-mono text-ubos-metadata text-ubos-fg-muted">
          {clock}
        </p>
      </div>
    </details>
  );
}

export function BroadcastStatusBar({
  sessionName,
  isLive,
  isRecording,
  runTime,
  clock,
  transitionActive,
  fps,
  cpu,
  dropped,
  upload,
  automationModeLabel,
  aiStatusLabel,
  outputHealthLabel,
  deviceHealthLabel,
  engineStatusLabel,
  toolsMenu,
  compactChrome = false,
  className,
}: {
  sessionName: string;
  isLive: boolean;
  isRecording: boolean;
  runTime: string;
  clock: string;
  transitionActive: boolean;
  fps: string;
  cpu: string;
  dropped: string;
  upload: string;
  automationModeLabel?: string;
  aiStatusLabel?: string;
  outputHealthLabel?: string;
  deviceHealthLabel?: string;
  engineStatusLabel?: string;
  toolsMenu?: ReactNode;
  compactChrome?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex h-[var(--ubos-status-bar-height)] shrink-0 items-center gap-ubos-2 border-b border-ubos-border-subtle bg-ubos-graphite px-ubos-3',
        compactChrome && 'gap-1 px-ubos-2',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-ubos-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-ubos-sm bg-ubos-selection-muted text-[0.625rem] font-bold text-ubos-selection-text">
          UB
        </span>
        <span
          className={cn(
            'ubos-truncate font-semibold text-ubos-fg-primary',
            compactChrome ? 'text-ubos-metadata' : 'text-ubos-section',
          )}
        >
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

      <div className="hidden shrink-0 items-center gap-1 xl:flex">
        <TelemetryBadge label="Renderer" value="Unavailable" variant="neutral" />
        <TelemetryBadge label="GPU" value="Unavailable" variant="neutral" />
        <TelemetryBadge label="Layers" value="Metadata" variant="neutral" />
        <TelemetryBadge label="Effects" value="Metadata" variant="neutral" />
        <TelemetryBadge label="Output" value="Unavailable" variant="neutral" />
        <TelemetryBadge label="Frame Queue" value="Unavailable" variant="neutral" />
      </div>

      <HealthMenu
        fps={fps}
        cpu={cpu}
        dropped={dropped}
        upload={upload}
        {...(automationModeLabel ? { automationModeLabel } : {})}
        {...(aiStatusLabel ? { aiStatusLabel } : {})}
        {...(outputHealthLabel ? { outputHealthLabel } : {})}
        {...(deviceHealthLabel ? { deviceHealthLabel } : {})}
        {...(engineStatusLabel ? { engineStatusLabel } : {})}
        clock={clock}
      />

      <div className="ml-auto flex shrink-0 items-center gap-1">{toolsMenu}</div>
    </header>
  );
}
