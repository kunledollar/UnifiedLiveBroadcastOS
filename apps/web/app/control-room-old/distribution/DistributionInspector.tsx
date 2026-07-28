'use client';

import type { BroadcastDestination, OutputHealth, OutputRoute, StreamProfile } from '@ubos/shared';
import { ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import {
  getDestinationHealth,
  getDestinationRoute,
  getStreamProfile,
  outputFormatLabel,
  platformLabel,
} from './distribution-utils';

export function DistributionInspector({
  destination,
  streamProfiles,
  outputRoutes,
  outputHealth,
  className,
}: {
  destination?: BroadcastDestination | null;
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  outputHealth: OutputHealth[];
  className?: string;
}) {
  if (!destination) {
    return (
      <div className={cn('rounded-ubos-md border border-ubos-border-subtle p-ubos-2', className)}>
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>No destination selected</p>
      </div>
    );
  }

  const profile = getStreamProfile(destination.streamProfileId, streamProfiles);
  const route = getDestinationRoute(destination.id, outputRoutes);
  const health = getDestinationHealth(destination.id, outputHealth);

  return (
    <ConsoleSection title="Destination Inspector" {...(className ? { className } : {})}>
      <InspectorRow label="Name" value={destination.name} />
      <InspectorRow label="Platform" value={platformLabel(destination.platform)} />
      <InspectorRow label="Format" value={outputFormatLabel(destination.outputFormat)} />
      <InspectorRow
        label="Status"
        value={<StatusBadge variant="neutral">{destination.status}</StatusBadge>}
      />
      <InspectorRow label="Stream profile" value={profile?.name ?? 'No stream profile configured'} />
      <InspectorRow label="Route" value={route?.sourceView ?? 'Output route missing'} />
      <InspectorRow
        label="Stream key"
        value={destination.redactedConfig.streamKeyConfigured ? 'configured' : 'not configured'}
      />
      <InspectorRow
        label="Endpoint"
        value={destination.redactedConfig.redactedEndpoint ?? 'not configured'}
      />
      <InspectorRow label="Health" value={health?.status ?? 'unavailable'} />
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        Stream key redacted · Metadata only
      </p>
    </ConsoleSection>
  );
}
