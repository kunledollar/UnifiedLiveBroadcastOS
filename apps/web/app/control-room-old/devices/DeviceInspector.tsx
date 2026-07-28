'use client';

import type { BroadcastDevice, ProtocolDefinition } from '@ubos/shared';
import { ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { deviceStatusVariant, healthStatusVariant, protocolLabel } from './device-utils';

export function DeviceInspector({
  device,
  protocols,
  className,
}: {
  device?: BroadcastDevice | null;
  protocols: ProtocolDefinition[];
  className?: string;
}) {
  if (!device) {
    return (
      <div className={cn('rounded-ubos-md border border-ubos-border-subtle p-ubos-2', className)}>
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>Not configured</p>
      </div>
    );
  }

  const protocol = protocols.find((item) => item.protocol === device.protocol);

  return (
    <ConsoleSection title="Device Inspector" {...(className ? { className } : {})}>
      <InspectorRow label="Name" value={device.name} />
      <InspectorRow label="Manufacturer" value={device.manufacturer} />
      <InspectorRow label="Model" value={device.model} />
      <InspectorRow
        label="Status"
        value={<StatusBadge variant={deviceStatusVariant(device.status)}>{device.status}</StatusBadge>}
      />
      <InspectorRow
        label="Health"
        value={<StatusBadge variant={healthStatusVariant(device.health)}>{device.health}</StatusBadge>}
      />
      <InspectorRow label="Protocol" value={protocolLabel(device.protocol)} />
      <InspectorRow label="Firmware" value={device.firmware ?? 'unavailable'} />
      <InspectorRow
        label="Network"
        value={
          device.ipAddress
            ? `${device.ipAddress}${device.port ? `:${device.port}` : ''}`
            : 'unavailable'
        }
      />
      <InspectorRow
        label="Capabilities"
        value={
          device.capabilities
            .filter((capability) => capability.supported)
            .map((capability) => capability.type)
            .join(', ') || 'none'
        }
      />
      <InspectorRow
        label="Supported commands"
        value={protocol?.supportedCommands.join(', ') ?? 'metadata only'}
      />
      {device.notes ? (
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-warning-text')}>{device.notes}</p>
      ) : null}
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        No live telemetry · Metadata only
      </p>
    </ConsoleSection>
  );
}
