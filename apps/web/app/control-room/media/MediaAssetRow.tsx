'use client';

import type { MediaAsset } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { SceneThumbnail } from '../browsers/BrowserChrome';
import { formatDurationMs, playbackStateLabel, playbackStateVariant } from './media-utils';

export function MediaAssetRow({
  asset,
  onPreview,
  onAssign,
  onSendToPreview,
  onTakeLive,
  onRemove,
  onSelect,
  selected = false,
}: {
  asset: MediaAsset;
  onPreview?: () => void;
  onAssign?: () => void;
  onSendToPreview?: () => void;
  onTakeLive?: () => void;
  onRemove?: () => void;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const displayState =
    asset.programState === 'program'
      ? asset.programState
      : asset.previewState === 'preview'
        ? asset.previewState
        : 'idle';

  return (
    <div
      className={cn(
        'flex w-full items-center gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5',
        selected ? 'border-ubos-selection-border bg-ubos-selection-muted' : 'border-transparent bg-ubos-midnight/50',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-ubos-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
      >
        <div className="h-9 w-16 shrink-0 overflow-hidden rounded-ubos-sm bg-ubos-carbon">
          <SceneThumbnail label={asset.type.slice(0, 3).toUpperCase()} />
        </div>
        <div className="min-w-0">
          <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
            {asset.name}
          </div>
          <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            {asset.type} · {formatDurationMs(asset.durationMs)} · {asset.resolution ?? 'res unavailable'} ·{' '}
            {asset.fps ? `${asset.fps} fps` : 'fps unavailable'}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={playbackStateVariant(displayState)}>{playbackStateLabel(displayState)}</StatusBadge>
        <StatusBadge variant={asset.status === 'ready' ? 'success' : 'offline'}>{asset.status}</StatusBadge>
      </div>
      <CompactRowActions>
        <RowIconButton label="Prv" onClick={() => onPreview?.()} />
        <RowIconButton label="PVW" onClick={() => onSendToPreview?.()} />
        <BroadcastButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onTakeLive?.(); }}>
          Live
        </BroadcastButton>
        <RowIconButton label="Asn" onClick={() => onAssign?.()} />
        <RowIconButton label="Del" variant="danger" onClick={() => onRemove?.()} />
      </CompactRowActions>
    </div>
  );
}
