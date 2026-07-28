'use client';

import type { BroadcastDestination, OutputHealth } from '@ubos/shared';
import { BroadcastPanel, ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DistributionEmptyState } from './DistributionEmptyState';
import {
  formatBitrate,
  formatLatency,
  formatMetric,
  getDestinationHealth,
  healthStatusVariant,
  platformLabel,
} from './distribution-utils';

export function OutputHealthPanel({
  destinations,
  outputHealth,
  className,
}: {
  destinations: BroadcastDestination[];
  outputHealth: OutputHealth[];
  className?: string;
}) {
  const selectedHealth = destinations
    .map((destination) => ({
      destination,
      health: getDestinationHealth(destination.id, outputHealth),
    }))
    .filter((item) => item.health);

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Output Health</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Health telemetry unavailable when stream not active
        </p>
      </div>
      <div className="space-y-ubos-2 overflow-y-auto p-ubos-2">
        {!selectedHealth.length ? (
          <DistributionEmptyState message="Health telemetry unavailable" />
        ) : (
          selectedHealth.map(({ destination, health }) => (
            <ConsoleSection key={destination.id} title={platformLabel(destination.platform)}>
              <InspectorRow
                label="Status"
                value={
                  <StatusBadge variant={healthStatusVariant(health!.status)}>{health!.status}</StatusBadge>
                }
              />
              <InspectorRow label="Bitrate" value={formatBitrate(health!.bitrateKbps)} />
              <InspectorRow label="Latency" value={formatLatency(health!.latencyMs)} />
              <InspectorRow label="Dropped frames" value={formatMetric(health!.droppedFrames)} />
              <InspectorRow label="Reconnects" value={formatMetric(health!.reconnectCount)} />
              <InspectorRow label="Last error" value={health!.lastError ?? 'unavailable'} />
              {destination.status === 'disconnected' ? (
                <p className="text-ubos-metadata text-ubos-fg-muted">Destination disconnected</p>
              ) : null}
            </ConsoleSection>
          ))
        )}
      </div>
    </BroadcastPanel>
  );
}
