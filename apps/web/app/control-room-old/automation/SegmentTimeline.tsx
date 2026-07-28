'use client';

import type { AutomationMode, RunOfShow } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { AutomationEmptyState } from './AutomationEmptyState';
import {
  automationModeLabel,
  formatDurationMs,
  getCurrentSegment,
  getNextSegment,
  getRemainingDurationMs,
} from './automation-utils';

export function SegmentTimeline({
  runOfShow,
  automationMode,
  className,
}: {
  runOfShow: RunOfShow;
  automationMode: AutomationMode;
  className?: string;
}) {
  const current = getCurrentSegment(runOfShow);
  const next = getNextSegment(runOfShow);

  if (!runOfShow.segments.length) {
    return <AutomationEmptyState message="Rundown unavailable" {...(className ? { className } : {})} />;
  }

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Segment Timeline</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Timer unavailable · Metadata timeline only
        </p>
      </div>
      <div className="space-y-ubos-2 p-ubos-2">
        <div className="flex flex-wrap gap-1 overflow-x-auto">
          {runOfShow.segments.map((segment) => (
            <div
              key={segment.id}
              className={cn(
                'min-w-[5rem] rounded-ubos-sm border px-2 py-1 text-center',
                segment.id === runOfShow.currentSegmentId
                  ? 'border-ubos-selection-border bg-ubos-selection-muted'
                  : 'border-ubos-border-subtle bg-ubos-midnight/50',
              )}
            >
              <div className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-primary')}>{segment.name}</div>
              <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                {formatDurationMs(segment.durationMs)}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-ubos-caption text-ubos-fg-secondary">
          <div>Current: <b>{current?.name ?? 'No active segment'}</b></div>
          <div>Next: <b>{next?.name ?? 'unavailable'}</b></div>
          <div>Remaining: <b>{formatDurationMs(getRemainingDurationMs(runOfShow))}</b></div>
          <div>Est. show: <b>{formatDurationMs(runOfShow.estimatedDurationMs)}</b></div>
        </div>
        <StatusBadge variant="neutral">Mode: {automationModeLabel(automationMode)}</StatusBadge>
      </div>
    </BroadcastPanel>
  );
}
