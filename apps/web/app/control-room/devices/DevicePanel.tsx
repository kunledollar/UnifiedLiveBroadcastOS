'use client';

import type { DeviceState } from './device-state';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { ConnectionPanel } from './ConnectionPanel';
import { DeviceHealthPanel } from './DeviceHealthPanel';
import { DeviceInspector } from './DeviceInspector';
import { DeviceManager } from './DeviceManager';
import { PluginBrowser } from './PluginBrowser';
import { ProtocolPanel } from './ProtocolPanel';
import { RoutingMatrix } from './RoutingMatrix';
import type { DeviceAction } from './device-state';
import { deviceHealthSummaryLabel } from './device-utils';

export function DevicePanel({
  state,
  dispatch,
  className,
}: {
  state: DeviceState;
  dispatch: (action: DeviceAction) => void;
  className?: string;
}) {
  const selectedDevice =
    state.devices.find((device) => device.id === state.selectedDeviceId) ?? null;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <BroadcastPanel variant="inset" padding={false} className="border-0 shadow-none">
        <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Devices</h3>
              <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                Equipment metadata · No hardware control
              </p>
            </div>
            <StatusBadge variant="neutral">{deviceHealthSummaryLabel(state.devices)}</StatusBadge>
          </div>
        </div>
        <div className="space-y-ubos-2 overflow-y-auto p-ubos-2">
          <DeviceManager
            devices={state.devices}
            selectedDeviceId={state.selectedDeviceId}
            onSelectDevice={(deviceId) => dispatch({ type: 'SELECT_DEVICE', deviceId })}
          />
          <ProtocolPanel
            protocols={state.protocols}
            selectedProtocolId={state.selectedProtocolId}
            onSelectProtocol={(protocolId) => dispatch({ type: 'SELECT_PROTOCOL', protocolId })}
          />
          <RoutingMatrix routingEndpoints={state.routingEndpoints} />
          <DeviceInspector device={selectedDevice} protocols={state.protocols} />
          <ConnectionPanel device={selectedDevice} />
          <DeviceHealthPanel devices={state.devices} />
          <PluginBrowser plugins={state.plugins} />
        </div>
      </BroadcastPanel>
    </div>
  );
}
