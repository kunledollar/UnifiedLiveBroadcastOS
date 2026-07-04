'use client';

import type { MediaAsset, MediaClip, Playlist } from '@ubos/shared';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { MediaEmptyState } from './MediaEmptyState';

export function PlaylistManager({
  playlists,
  assets,
  clips,
  onCreatePlaylist,
  onClearPlaylist,
  onSendToPreview,
  className,
}: {
  playlists: Playlist[];
  assets: MediaAsset[];
  clips: MediaClip[];
  onCreatePlaylist?: () => void;
  onClearPlaylist?: (playlistId: string) => void;
  onSendToPreview?: (playlistId: string) => void;
  className?: string;
}) {
  const activePlaylist = playlists[0] ?? null;

  const resolveItemLabel = (item: Playlist['items'][number]) => {
    if (item.clipId) {
      return clips.find((clip) => clip.id === item.clipId)?.name ?? 'missing clip';
    }
    if (item.assetId) {
      return assets.find((asset) => asset.id === item.assetId)?.name ?? 'missing asset';
    }
    return item.label;
  };

  const currentItem =
    activePlaylist && activePlaylist.items.length
      ? activePlaylist.items[activePlaylist.currentIndex]
      : null;
  const nextItem =
    activePlaylist && activePlaylist.items.length
      ? activePlaylist.items[(activePlaylist.currentIndex + 1) % activePlaylist.items.length]
      : null;

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="flex items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Playlist Manager</h3>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Metadata sequencing only · No fake playback
          </p>
        </div>
        <BroadcastButton size="sm" variant="secondary" onClick={onCreatePlaylist}>
          Create
        </BroadcastButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-ubos-2">
        {!activePlaylist ? (
          <MediaEmptyState message="No playlists configured. Create a playlist to stage items." />
        ) : (
          <div className="space-y-ubos-2">
            <div className="rounded-ubos-sm bg-ubos-midnight px-ubos-2 py-1.5">
              <div className="flex items-center justify-between gap-ubos-2">
                <span className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>
                  {activePlaylist.name}
                </span>
                <StatusBadge variant={activePlaylist.status === 'ready' ? 'success' : 'neutral'}>
                  {activePlaylist.status}
                </StatusBadge>
              </div>
              <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                {activePlaylist.items.length} items · Mode: {activePlaylist.mode}
              </p>
            </div>
            <InspectorPlaylistRow label="Current" value={currentItem ? resolveItemLabel(currentItem) : 'not selected'} />
            <InspectorPlaylistRow label="Next" value={nextItem ? resolveItemLabel(nextItem) : 'unavailable'} />
            <div className="flex flex-wrap gap-ubos-2">
              <BroadcastButton size="sm" variant="secondary" onClick={() => onSendToPreview?.(activePlaylist.id)}>
                Send to Preview
              </BroadcastButton>
              <BroadcastButton size="sm" variant="ghost" onClick={() => onClearPlaylist?.(activePlaylist.id)}>
                Clear Playlist
              </BroadcastButton>
            </div>
            {activePlaylist.items.length ? (
              <ul className="space-y-1 text-ubos-caption text-ubos-fg-secondary">
                {activePlaylist.items.map((item, index) => (
                  <li
                    key={item.id}
                    className={cn(
                      'rounded-ubos-sm px-2 py-1',
                      index === activePlaylist.currentIndex ? 'bg-ubos-selection-muted' : 'bg-ubos-midnight',
                    )}
                  >
                    {index + 1}. {resolveItemLabel(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <MediaEmptyState message="Playlist has no items" className="min-h-[3rem]" />
            )}
          </div>
        )}
      </div>
    </BroadcastPanel>
  );
}

function InspectorPlaylistRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-ubos-2 text-ubos-caption">
      <span className="text-ubos-fg-muted">{label}</span>
      <span className="ubos-truncate text-ubos-fg-secondary">{value}</span>
    </div>
  );
}
