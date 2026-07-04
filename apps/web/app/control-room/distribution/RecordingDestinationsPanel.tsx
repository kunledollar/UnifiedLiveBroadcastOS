'use client';

import type { BroadcastDestination } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DistributionEmptyState } from './DistributionEmptyState';
import { destinationStatusVariant, getRecordingDestinations, platformLabel } from './distribution-utils';

export function RecordingDestinationsPanel({
  destinations,
  className,
}: {
  destinations: BroadcastDestination[];
  className?: string;
}) {
  const recordingDestinations = getRecordingDestinations(destinations);

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Recording Destinations</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Recording runtime unavailable · Metadata only
        </p>
      </div>
      <div className="space-y-1 p-ubos-2">
        {!recordingDestinations.length ? (
          <DistributionEmptyState message="Recording not configured" />
        ) : (
          recordingDestinations.map((destination) => (
            <div
              key={destination.id}
              className="flex items-center justify-between rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-1.5"
            >
              <div>
                <div className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>
                  {destination.name}
                </div>
                <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                  {platformLabel(destination.platform)} · ISO / clean / archive metadata
                </div>
              </div>
              <StatusBadge variant={destinationStatusVariant(destination.status)}>
                {destination.status}
              </StatusBadge>
            </div>
          ))
        )}
      </div>
    </BroadcastPanel>
  );
}
