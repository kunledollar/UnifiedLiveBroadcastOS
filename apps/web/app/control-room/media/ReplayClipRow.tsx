'use client';

import type { ReplayClip } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { formatDurationMs, playbackStateLabel, playbackStateVariant } from './media-utils';

export function ReplayClipRow({
  clip,
  onPreview,
  onSendToPreview,
  onTakeLive,
  onSelect,
  selected = false,
}: {
  clip: ReplayClip;
  onPreview?: () => void;
  onSendToPreview?: () => void;
  onTakeLive?: () => void;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const displayState =
    clip.programState === 'program'
      ? clip.programState
      : clip.previewState === 'preview'
        ? clip.previewState
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
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
      >
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {clip.name}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {formatDurationMs(clip.durationMs)} · {clip.speed}x · {clip.angle ?? 'angle n/a'} ·{' '}
          {clip.markers.length} markers
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={playbackStateVariant(displayState)}>{playbackStateLabel(displayState)}</StatusBadge>
        <StatusBadge variant={clip.status === 'ready' ? 'success' : 'offline'}>{clip.status}</StatusBadge>
      </div>
      <CompactRowActions>
        <RowIconButton label="Prv" onClick={() => onPreview?.()} />
        <RowIconButton label="PVW" onClick={() => onSendToPreview?.()} />
        <BroadcastButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onTakeLive?.(); }}>
          Live
        </BroadcastButton>
      </CompactRowActions>
    </div>
  );
}
