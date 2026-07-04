'use client';

import { AssetList, AssetRow, StatusBadge } from '@ubos/ui';
import { DestinationStatus } from '@ubos/shared';
import type { Destination } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';
import { SceneThumbnail } from '../browsers/BrowserChrome';

function destinationHealthVariant(status: Destination['status']) {
  switch (status) {
    case DestinationStatus.Connected:
    case DestinationStatus.Live:
      return 'success' as const;
    case DestinationStatus.Disconnected:
      return 'offline' as const;
    case DestinationStatus.Error:
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
}

export function OutputsPanel({ destinations }: { destinations: Destination[] }) {
  if (!destinations.length) {
    return (
      <OperationsPanel title="Outputs">
        <p className="text-ubos-caption text-ubos-fg-muted">No destinations configured.</p>
        <p className="text-ubos-metadata text-ubos-fg-muted">Streaming disabled.</p>
      </OperationsPanel>
    );
  }

  return (
    <OperationsPanel title="Outputs">
      <AssetList isEmpty={false}>
        {destinations.map((destination) => (
          <AssetRow
            key={destination.id}
            thumbnail={<SceneThumbnail label="OUT" />}
            title={destination.label}
            subtitle={destination.platform}
            status={
              <div className="flex flex-col items-end gap-0.5">
                <StatusBadge variant={destination.enabled ? 'preview' : 'neutral'}>
                  {destination.enabled ? 'Enabled' : 'Disabled'}
                </StatusBadge>
                <StatusBadge variant={destinationHealthVariant(destination.status)}>
                  {destination.status}
                </StatusBadge>
              </div>
            }
          />
        ))}
      </AssetList>
    </OperationsPanel>
  );
}
