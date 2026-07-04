'use client';

import type { ReplayBufferMetadata, ReplayClip } from '@ubos/shared';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { MediaEmptyState } from './MediaEmptyState';
import { ReplayClipRow } from './ReplayClipRow';
import { formatDurationMs } from './media-utils';

export function ReplayWorkspace({
  replayBuffer,
  replayClips,
  selectedReplayClipId,
  onSelectReplayClip,
  onPreview,
  onSendToPreview,
  onTakeLive,
  onAddSampleClip,
  className,
}: {
  replayBuffer: ReplayBufferMetadata;
  replayClips: ReplayClip[];
  selectedReplayClipId?: string | null;
  onSelectReplayClip?: (clipId: string) => void;
  onPreview?: (clipId: string) => void;
  onSendToPreview?: (clipId: string) => void;
  onTakeLive?: (clipId: string) => void;
  onAddSampleClip?: () => void;
  className?: string;
}) {
  const bufferLabel = replayBuffer.active
    ? `Buffer ready · ${formatDurationMs(replayBuffer.durationMs)}`
    : replayBuffer.status === 'unavailable'
      ? 'Replay runtime unavailable'
      : 'Replay buffer not active';

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="flex items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Replay Workspace</h3>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{bufferLabel}</p>
        </div>
        <StatusBadge variant={replayBuffer.active ? 'success' : 'offline'}>{replayBuffer.status}</StatusBadge>
      </div>
      <div className="space-y-ubos-2 p-ubos-2">
        <div className="rounded-ubos-sm bg-ubos-midnight px-ubos-2 py-1.5 text-ubos-caption text-ubos-fg-secondary">
          <div className="flex items-center justify-between">
            <span>Replay source</span>
            <span>{replayBuffer.sourceId ?? 'No replay source configured'}</span>
          </div>
        </div>
        {!replayBuffer.active && !replayClips.length ? (
          <MediaEmptyState message="No replay clips available" />
        ) : (
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {replayClips.length ? (
              replayClips.map((clip) => (
                <ReplayClipRow
                  key={clip.id}
                  clip={clip}
                  selected={selectedReplayClipId === clip.id}
                  onSelect={() => onSelectReplayClip?.(clip.id)}
                  onPreview={() => onPreview?.(clip.id)}
                  onSendToPreview={() => onSendToPreview?.(clip.id)}
                  onTakeLive={() => onTakeLive?.(clip.id)}
                />
              ))
            ) : (
              <MediaEmptyState message="Replay buffer inactive · No clips marked" className="min-h-[3rem]" />
            )}
          </div>
        )}
        {onAddSampleClip ? (
          <BroadcastButton size="sm" variant="ghost" onClick={onAddSampleClip}>
            Add sample replay clip (metadata)
          </BroadcastButton>
        ) : null}
      </div>
    </BroadcastPanel>
  );
}
