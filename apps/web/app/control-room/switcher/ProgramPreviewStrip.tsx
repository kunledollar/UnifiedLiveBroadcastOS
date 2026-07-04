'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { TransitionType } from '@ubos/shared';
import { transitionDisplayLabel } from './switcher-config';

export function ProgramPreviewStrip({
  programSceneName,
  previewSceneName,
  transitionType,
  lastTransitionLabel,
  ready,
  className,
}: {
  programSceneName: string;
  previewSceneName: string;
  transitionType: TransitionType;
  lastTransitionLabel: string;
  ready: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid min-w-0 grid-cols-2 gap-ubos-2 sm:grid-cols-3 lg:grid-cols-5',
        className,
      )}
    >
      <StatusCell label="Program" value={programSceneName} variant="live" />
      <StatusCell label="Preview" value={previewSceneName} variant="preview" />
      <StatusCell label="Transition" value={transitionDisplayLabel(transitionType)} variant="neutral" />
      <StatusCell label="Previous" value={lastTransitionLabel} variant="neutral" className="hidden sm:block" />
      <div className="hidden min-w-0 flex-col gap-0.5 lg:flex">
        <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Ready</span>
        <StatusBadge variant={ready ? 'success' : 'warning'}>
          {ready ? 'Ready' : 'Busy'}
        </StatusBadge>
      </div>
    </div>
  );
}

function StatusCell({
  label,
  value,
  variant,
  className,
}: {
  label: string;
  value: string;
  variant: 'live' | 'preview' | 'neutral';
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-ubos-2 py-1', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{label}</span>
      <div className="mt-0.5 flex min-w-0 items-center gap-1">
        {variant === 'live' ? <StatusBadge variant="live">PGM</StatusBadge> : null}
        {variant === 'preview' ? <StatusBadge variant="preview">PVW</StatusBadge> : null}
        <span className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {value}
        </span>
      </div>
    </div>
  );
}
