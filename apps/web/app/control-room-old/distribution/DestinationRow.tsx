'use client';

import type { BroadcastDestination, OutputRoute, StreamProfile } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import {
  destinationStatusVariant,
  getDestinationRoute,
  getStreamProfile,
  outputFormatLabel,
  platformLabel,
} from './distribution-utils';

export function DestinationRow({
  destination,
  streamProfiles,
  outputRoutes,
  selected = false,
  onSelect,
  onToggle,
  onAssignRoute,
  onRemove,
}: {
  destination: BroadcastDestination;
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  selected?: boolean;
  onSelect?: () => void;
  onToggle?: () => void;
  onAssignRoute?: () => void;
  onRemove?: () => void;
}) {
  const profile = getStreamProfile(destination.streamProfileId, streamProfiles);
  const route = getDestinationRoute(destination.id, outputRoutes);

  return (
    <div
      className={cn(
        'flex w-full items-start gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5',
        selected ? 'border-ubos-selection-border bg-ubos-selection-muted' : 'border-transparent bg-ubos-midnight/50',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
      >
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {destination.name}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {platformLabel(destination.platform)} · {outputFormatLabel(destination.outputFormat)} ·{' '}
          {profile?.name ?? 'No stream profile configured'}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Route: {route?.sourceView ?? 'Output route missing'} · Stream key:{' '}
          {destination.redactedConfig.streamKeyConfigured ? 'configured' : 'not configured'}
        </div>
        {destination.warnings?.length ? (
          <div className={cn(ubosTypographyClasses.metadata, 'mt-0.5 text-ubos-warning-text')}>
            {destination.warnings.join(' · ')}
          </div>
        ) : null}
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={destinationStatusVariant(destination.status)}>{destination.status}</StatusBadge>
        <StatusBadge variant="neutral">{destination.health}</StatusBadge>
      </div>
      <CompactRowActions>
        <RowIconButton label="Toggle" onClick={() => onToggle?.()} />
        <RowIconButton label="Route" onClick={() => onAssignRoute?.()} />
        <BroadcastButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onRemove?.(); }}>
          Del
        </BroadcastButton>
      </CompactRowActions>
    </div>
  );
}
