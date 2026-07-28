'use client';

import type { BroadcastDestination, OutputRoute, StreamProfile } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { DestinationRow } from './DestinationRow';
import { DistributionEmptyState } from './DistributionEmptyState';

export function DestinationManager({
  destinations,
  streamProfiles,
  outputRoutes,
  selectedDestinationId,
  onSelectDestination,
  onToggleDestination,
  onAssignRoute,
  onRemoveDestination,
  className,
}: {
  destinations: BroadcastDestination[];
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  selectedDestinationId?: string | null;
  onSelectDestination?: (destinationId: string) => void;
  onToggleDestination?: (destinationId: string) => void;
  onAssignRoute?: (destinationId: string) => void;
  onRemoveDestination?: (destinationId: string) => void;
  className?: string;
}) {
  if (!destinations.length) {
    return <DistributionEmptyState message="No destinations configured" {...(className ? { className } : {})} />;
  }

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Destination Manager</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata only · Streaming runtime unavailable
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-ubos-2">
        {destinations.map((destination) => (
          <DestinationRow
            key={destination.id}
            destination={destination}
            streamProfiles={streamProfiles}
            outputRoutes={outputRoutes}
            selected={selectedDestinationId === destination.id}
            onSelect={() => onSelectDestination?.(destination.id)}
            onToggle={() => onToggleDestination?.(destination.id)}
            onAssignRoute={() => onAssignRoute?.(destination.id)}
            onRemove={() => onRemoveDestination?.(destination.id)}
          />
        ))}
      </div>
    </BroadcastPanel>
  );
}
