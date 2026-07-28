'use client';

import type { MediaAsset, MediaClip } from '@ubos/shared';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { MediaEmptyState } from './MediaEmptyState';
import { formatDurationMs, playbackStateLabel, playbackStateVariant } from './media-utils';

export function ClipBrowser({
  clips,
  assets,
  selectedClipId,
  onSelectClip,
  onPreview,
  onSendToPreview,
  onTakeLive,
  onDuplicate,
  onRemove,
  className,
}: {
  clips: MediaClip[];
  assets: MediaAsset[];
  selectedClipId?: string | null;
  onSelectClip?: (clipId: string) => void;
  onPreview?: (clipId: string) => void;
  onSendToPreview?: (clipId: string) => void;
  onTakeLive?: (clipId: string) => void;
  onDuplicate?: (clipId: string) => void;
  onRemove?: (clipId: string) => void;
  className?: string;
}) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Clip Browser</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {clips.length} clip{clips.length === 1 ? '' : 's'} · Trim metadata only
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-ubos-2">
        {!clips.length ? (
          <MediaEmptyState message="No clips available. Create a clip from a media asset." />
        ) : (
          <div className="space-y-1">
            {clips.map((clip) => {
              const parentAsset = assets.find((asset) => asset.id === clip.assetId);
              const displayState =
                clip.programState === 'program'
                  ? clip.programState
                  : clip.previewState === 'preview'
                    ? clip.previewState
                    : 'idle';
              return (
                <div
                  key={clip.id}
                  className={cn(
                    'flex w-full items-center gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5',
                    selectedClipId === clip.id
                      ? 'border-ubos-selection-border bg-ubos-selection-muted'
                      : 'border-transparent bg-ubos-midnight/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectClip?.(clip.id)}
                    className="min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
                  >
                    <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
                      {clip.name}
                    </div>
                    <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                      {parentAsset?.name ?? 'missing asset'} · In {formatDurationMs(clip.inPointMs)} · Out{' '}
                      {formatDurationMs(clip.outPointMs)} · {clip.playbackSpeed}x ·{' '}
                      {clip.loop ? 'loop' : 'no loop'}
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <StatusBadge variant={playbackStateVariant(displayState)}>
                      {playbackStateLabel(displayState)}
                    </StatusBadge>
                    <StatusBadge variant={clip.status === 'ready' ? 'success' : 'offline'}>
                      {clip.markers.length} mk
                    </StatusBadge>
                  </div>
                  <CompactRowActions>
                    <RowIconButton label="Prv" onClick={() => onPreview?.(clip.id)} />
                    <RowIconButton label="PVW" onClick={() => onSendToPreview?.(clip.id)} />
                    <BroadcastButton
                      size="sm"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onTakeLive?.(clip.id);
                      }}
                    >
                      Live
                    </BroadcastButton>
                    <RowIconButton label="Dup" onClick={() => onDuplicate?.(clip.id)} />
                    <RowIconButton label="Del" variant="danger" onClick={() => onRemove?.(clip.id)} />
                  </CompactRowActions>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BroadcastPanel>
  );
}
