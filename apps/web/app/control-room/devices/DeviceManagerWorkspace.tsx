'use client';

import type { DeviceState } from './device-state';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { ConnectionPanel } from './ConnectionPanel';
import { DeviceHealthPanel } from './DeviceHealthPanel';
import { DeviceInspector } from './DeviceInspector';
import { DeviceManager } from './DeviceManager';
import { PluginBrowser } from './PluginBrowser';
import { ProtocolPanel } from './ProtocolPanel';
import { RoutingMatrix } from './RoutingMatrix';
import type { DeviceAction } from './device-state';
import { deviceHealthSummaryLabel } from './device-utils';

export function DeviceManagerWorkspace({
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
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            Device Manager Workspace
          </h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Discover · Manage · Route · Monitor · Metadata only
          </p>
        </div>
        <StatusBadge variant="warning">{deviceHealthSummaryLabel(state.devices)}</StatusBadge>
      </div>

      <ResizableSplit
        initialRatio={0.34}
        minPrimary={0.24}
        maxPrimary={0.5}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
            <DeviceManager
              devices={state.devices}
              selectedDeviceId={state.selectedDeviceId}
              onSelectDevice={(deviceId) => dispatch({ type: 'SELECT_DEVICE', deviceId })}
              className="min-h-0 flex-1"
            />
            <ProtocolPanel
              protocols={state.protocols}
              selectedProtocolId={state.selectedProtocolId}
              onSelectProtocol={(protocolId) => dispatch({ type: 'SELECT_PROTOCOL', protocolId })}
              className="shrink-0"
            />
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.55}
            primary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <RoutingMatrix routingEndpoints={state.routingEndpoints} className="min-h-0 flex-1" />
                <PluginBrowser plugins={state.plugins} className="shrink-0" />
              </div>
            }
            secondary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <DeviceInspector device={selectedDevice} protocols={state.protocols} />
                <ConnectionPanel device={selectedDevice} />
                <DeviceHealthPanel devices={state.devices} className="min-h-0 flex-1" />
              </div>
            }
          />
        }
      />
    </div>
  );
}
