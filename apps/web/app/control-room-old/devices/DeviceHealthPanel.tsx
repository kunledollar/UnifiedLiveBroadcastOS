'use client';

import type { BroadcastDevice } from '@ubos/shared';
import { BroadcastPanel, ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DeviceEmptyState } from './DeviceEmptyState';
import { deviceStatusVariant, healthStatusVariant, protocolLabel } from './device-utils';

export function DeviceHealthPanel({
  devices,
  className,
}: {
  devices: BroadcastDevice[];
  className?: string;
}) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Device Health</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Diagnostics unavailable · Metadata only
        </p>
      </div>
      <div className="space-y-ubos-2 overflow-y-auto p-ubos-2">
        {!devices.length ? (
          <DeviceEmptyState message="No device detected" />
        ) : (
          devices.map((device) => (
            <ConsoleSection key={device.id} title={device.name}>
              <InspectorRow
                label="Connection"
                value={<StatusBadge variant={deviceStatusVariant(device.status)}>{device.status}</StatusBadge>}
              />
              <InspectorRow
                label="Health"
                value={<StatusBadge variant={healthStatusVariant(device.health)}>{device.health}</StatusBadge>}
              />
              <InspectorRow label="Firmware" value={device.firmware ?? 'unavailable'} />
              <InspectorRow label="Protocol" value={protocolLabel(device.protocol)} />
              <InspectorRow label="Diagnostics" value="unavailable" />
              <InspectorRow label="Warnings" value={device.notes ?? 'none'} />
            </ConsoleSection>
          ))
        )}
      </div>
    </BroadcastPanel>
  );
}
