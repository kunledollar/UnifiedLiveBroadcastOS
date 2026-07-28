'use client';

import type { RunOfShow } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { AutomationEmptyState } from './AutomationEmptyState';
import { SegmentRow } from './SegmentRow';

export function RunOfShowPanel({
  runOfShow,
  selectedSegmentId,
  onSelectSegment,
  className,
}: {
  runOfShow: RunOfShow;
  selectedSegmentId?: string | null;
  onSelectSegment?: (segmentId: string) => void;
  className?: string;
}) {
  if (!runOfShow.segments.length) {
    return <AutomationEmptyState message="No run of show configured" {...(className ? { className } : {})} />;
  }

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>{runOfShow.name}</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {runOfShow.segments.length} segments · {runOfShow.status} · Metadata only
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-ubos-2">
        {runOfShow.segments.map((segment) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            isCurrent={segment.id === runOfShow.currentSegmentId}
            isNext={segment.id === runOfShow.nextSegmentId}
            selected={selectedSegmentId === segment.id}
            onSelect={() => onSelectSegment?.(segment.id)}
          />
        ))}
      </div>
    </BroadcastPanel>
  );
}
