'use client';

import type { BroadcastDevice } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { DeviceBrowserRow } from './DeviceBrowser';
import { DeviceEmptyState } from './DeviceEmptyState';
import { DEVICE_CATEGORIES, categoryLabel, getDevicesByCategory } from './device-utils';

export function DeviceManager({
  devices,
  selectedDeviceId,
  onSelectDevice,
  className,
}: {
  devices: BroadcastDevice[];
  selectedDeviceId?: string | null;
  onSelectDevice?: (deviceId: string) => void;
  className?: string;
}) {
  if (!devices.length) {
    return <DeviceEmptyState message="No device detected" {...(className ? { className } : {})} />;
  }

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Device Manager</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata only · No hardware communication
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-ubos-2 overflow-y-auto p-ubos-2">
        {DEVICE_CATEGORIES.map((category) => {
          const categoryDevices = getDevicesByCategory(devices, category);
          if (!categoryDevices.length) return null;
          return (
            <div key={category}>
              <h4 className={cn(ubosTypographyClasses.caption, 'mb-1 text-ubos-fg-secondary')}>
                {categoryLabel(category)}
              </h4>
              <div className="space-y-1">
                {categoryDevices.map((device) => (
                  <DeviceBrowserRow
                    key={device.id}
                    device={device}
                    selected={selectedDeviceId === device.id}
                    onSelect={() => onSelectDevice?.(device.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </BroadcastPanel>
  );
}
