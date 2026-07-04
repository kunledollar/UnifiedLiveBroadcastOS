'use client';

import type { BroadcastDevice } from '@ubos/shared';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import {
  deviceStatusVariant,
  formatLastSeen,
  healthStatusVariant,
  protocolLabel,
} from './device-utils';

export function DeviceBrowserRow({
  device,
  selected = false,
  onSelect,
}: {
  device: BroadcastDevice;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5 text-left',
        selected ? 'border-ubos-selection-border bg-ubos-selection-muted' : 'border-transparent bg-ubos-midnight/50',
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-ubos-sm bg-ubos-graphite text-[0.625rem] font-bold text-ubos-fg-muted">
        {device.manufacturer.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {device.name}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {device.manufacturer} {device.model} · {protocolLabel(device.protocol)}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Last seen: {formatLastSeen(device.lastSeen)}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={deviceStatusVariant(device.status)}>{device.status}</StatusBadge>
        <StatusBadge variant={healthStatusVariant(device.health)}>{device.health}</StatusBadge>
      </div>
    </button>
  );
}
