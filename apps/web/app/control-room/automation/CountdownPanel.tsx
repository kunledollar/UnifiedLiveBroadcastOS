'use client';

import type { ProductionCue, RunOfShow } from '@ubos/shared';
import { ConsoleSection, InspectorRow, cn, ubosTypographyClasses } from '@ubos/ui';
import { AutomationEmptyState } from './AutomationEmptyState';
import {
  formatDurationMs,
  getCurrentSegment,
  getNextSegment,
  getRemainingDurationMs,
} from './automation-utils';

export function CountdownPanel({
  runOfShow,
  nextCue,
  className,
}: {
  runOfShow: RunOfShow;
  nextCue?: ProductionCue | null;
  className?: string;
}) {
  const current = getCurrentSegment(runOfShow);
  const next = getNextSegment(runOfShow);

  if (!current && !nextCue) {
    return <AutomationEmptyState message="Countdown not active" {...(className ? { className } : {})} />;
  }

  return (
    <ConsoleSection title="Countdown">
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Timer unavailable · Metadata only</p>
      <InspectorRow label="Segment countdown" value={current ? formatDurationMs(current.durationMs) : 'No timed cue'} />
      <InspectorRow label="Show countdown" value={formatDurationMs(getRemainingDurationMs(runOfShow))} />
      <InspectorRow
        label="Cue countdown"
        value={nextCue?.timing === 'countdown' ? formatDurationMs(nextCue.offsetMs) : 'No timed cue'}
      />
      <InspectorRow label="Next cue" value={nextCue?.name ?? 'unavailable'} />
      <InspectorRow label="Next segment" value={next?.name ?? 'unavailable'} />
    </ConsoleSection>
  );
}
