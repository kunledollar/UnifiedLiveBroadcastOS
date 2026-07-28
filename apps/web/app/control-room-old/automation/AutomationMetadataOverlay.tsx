'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export function AutomationMetadataOverlay({
  currentSegmentName,
  nextSegmentName,
  automationMode,
  className,
}: {
  currentSegmentName?: string;
  nextSegmentName?: string;
  automationMode?: string;
  className?: string;
}) {
  if (!currentSegmentName && !nextSegmentName && !automationMode) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap gap-1 bg-gradient-to-b from-black/60 to-transparent px-ubos-3 py-ubos-2',
        className,
      )}
    >
      <p className={cn(ubosTypographyClasses.metadata, 'w-full text-ubos-fg-muted')}>
        Rundown metadata · Automation execution unavailable
      </p>
      {currentSegmentName ? <StatusBadge variant="live">Now: {currentSegmentName}</StatusBadge> : null}
      {nextSegmentName ? <StatusBadge variant="preview">Next: {nextSegmentName}</StatusBadge> : null}
      {automationMode ? <StatusBadge variant="neutral">{automationMode}</StatusBadge> : null}
    </div>
  );
}
