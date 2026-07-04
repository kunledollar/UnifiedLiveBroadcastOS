'use client';

import type { ShowSegment } from '@ubos/shared';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { formatDurationMs, getSegmentCueCount, segmentStatusVariant } from './automation-utils';

export function SegmentRow({
  segment,
  isCurrent = false,
  isNext = false,
  selected = false,
  onSelect,
}: {
  segment: ShowSegment;
  isCurrent?: boolean;
  isNext?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const cueCount = getSegmentCueCount(segment);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-2 text-left',
        selected ? 'border-ubos-selection-border bg-ubos-selection-muted' : 'border-ubos-border-subtle bg-ubos-midnight/50',
      )}
    >
      <span className={cn(ubosTypographyClasses.metadata, 'w-6 shrink-0 text-ubos-fg-muted')}>
        {segment.order}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {segment.name}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {segment.type} · {formatDurationMs(segment.durationMs)} · {cueCount} cue{cueCount === 1 ? '' : 's'}
          {segment.notes ? ' · notes' : ''}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={segmentStatusVariant(segment.status)}>{segment.status}</StatusBadge>
        {isCurrent ? <StatusBadge variant="live">CURRENT</StatusBadge> : null}
        {isNext ? <StatusBadge variant="preview">NEXT</StatusBadge> : null}
      </div>
    </button>
  );
}
