'use client';

import type { BroadcastDevice } from '@ubos/shared';
import { ConsoleSection, InspectorRow, cn, ubosTypographyClasses } from '@ubos/ui';
import { protocolLabel } from './device-utils';

export function ConnectionPanel({
  device,
  className,
}: {
  device?: BroadcastDevice | null;
  className?: string;
}) {
  return (
    <ConsoleSection title="Connection" {...(className ? { className } : {})}>
      {device ? (
        <>
          <InspectorRow label="Protocol" value={protocolLabel(device.protocol)} />
          <InspectorRow
            label="Address"
            value={
              device.ipAddress
                ? `${device.ipAddress}${device.port ? `:${device.port}` : ''}`
                : 'unavailable'
            }
          />
          <InspectorRow label="Serial" value={device.serialNumber ?? 'not configured'} />
          <InspectorRow label="Connection" value={device.status} />
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            No runtime sockets · Metadata only
          </p>
        </>
      ) : (
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>Not configured</p>
      )}
    </ConsoleSection>
  );
}
