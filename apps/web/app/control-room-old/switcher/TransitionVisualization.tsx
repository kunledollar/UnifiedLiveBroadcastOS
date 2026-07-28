'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';
import type { TransitionType } from '@ubos/shared';
import { transitionDisplayLabel, formatDurationLabel } from './switcher-config';

export function TransitionVisualization({
  programSceneName,
  previewSceneName,
  transitionType,
  durationMs,
  className,
}: {
  programSceneName: string;
  previewSceneName: string;
  transitionType: TransitionType;
  durationMs: number;
  className?: string;
}) {
  const transitionLabel =
    transitionType === 'cut'
      ? 'CUT'
      : `${transitionDisplayLabel(transitionType)} ${formatDurationLabel(durationMs)}s`;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-ubos-3 py-1.5',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex w-full min-w-0 items-center gap-ubos-2">
        <Bar label="Program" scene={programSceneName} tone="program" />
        <FlowArrow />
        <span className={cn(ubosTypographyClasses.metadata, 'shrink-0 font-bold text-ubos-fg-secondary')}>
          {transitionLabel}
        </span>
        <FlowArrow />
        <Bar label="Preview" scene={previewSceneName} tone="preview" />
      </div>
    </div>
  );
}

function Bar({
  label,
  scene,
  tone,
}: {
  label: string;
  scene: string;
  tone: 'program' | 'preview';
}) {
  return (
    <div className="min-w-0 flex-1">
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{label}</span>
      <div
        className={cn(
          'mt-0.5 h-1.5 rounded-full',
          tone === 'program' ? 'bg-ubos-program/80' : 'bg-ubos-preview/80',
        )}
      />
      <span className={cn(ubosTypographyClasses.metadata, 'mt-0.5 block ubos-truncate text-ubos-fg-secondary')}>
        {scene}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <span className={cn(ubosTypographyClasses.metadata, 'shrink-0 text-ubos-fg-muted')} aria-hidden="true">
      ↓
    </span>
  );
}
