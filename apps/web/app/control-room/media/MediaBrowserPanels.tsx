'use client';

import type { MediaAsset, ReplayClip, SceneMediaComposition } from '@ubos/shared';
import { AssetList, AssetRow, StatusBadge } from '@ubos/ui';
import { BrowserSection } from '../browsers/BrowserChrome';
import { SceneThumbnail } from '../browsers/BrowserChrome';
import { MediaEmptyState } from './MediaEmptyState';
import { ReplayClipRow } from './ReplayClipRow';
import { formatDurationMs } from './media-utils';

export function MediaBrowserPanel({
  assets,
  onSelectAsset,
  selectedAssetId,
}: {
  assets: MediaAsset[];
  onSelectAsset?: (assetId: string) => void;
  selectedAssetId?: string | null;
}) {
  const mediaAssets = assets.filter((asset) =>
    ['video', 'image', 'audio', 'browser'].includes(asset.type),
  );

  return (
    <BrowserSection title="Media">
      {!mediaAssets.length ? (
        <MediaEmptyState message="No media assets loaded" />
      ) : (
        <AssetList isEmpty={false}>
          {mediaAssets.map((asset) => (
            <AssetRow
              key={asset.id}
              selected={selectedAssetId === asset.id}
              {...(onSelectAsset ? { onClick: () => onSelectAsset(asset.id) } : {})}
              thumbnail={<SceneThumbnail label="MED" />}
              title={asset.name}
              subtitle={`${asset.type} · ${formatDurationMs(asset.durationMs)} · ${asset.resolution ?? 'res unavailable'}`}
              status={
                <StatusBadge variant={asset.status === 'ready' ? 'success' : 'offline'}>
                  {asset.status}
                </StatusBadge>
              }
            />
          ))}
        </AssetList>
      )}
    </BrowserSection>
  );
}

export function ReplayBrowserPanel({
  composition,
  onSelectReplayClip,
  selectedReplayClipId,
}: {
  composition: SceneMediaComposition;
  onSelectReplayClip?: (clipId: string) => void;
  selectedReplayClipId?: string | null;
}) {
  const { replayBuffer, replayClips } = composition;

  return (
    <BrowserSection title="Replay">
      <p className="text-ubos-metadata text-ubos-fg-muted">
        Buffer: {replayBuffer.active ? 'active' : 'inactive'} · Source:{' '}
        {replayBuffer.sourceId ?? 'not configured'}
      </p>
      {!replayBuffer.active && !replayClips.length ? (
        <MediaEmptyState message="Replay buffer not active" />
      ) : !replayClips.length ? (
        <MediaEmptyState message="No replay clips available" />
      ) : (
        <div className="space-y-1">
          {replayClips.map((clip: ReplayClip) => (
            <ReplayClipRow
              key={clip.id}
              clip={clip}
              selected={selectedReplayClipId === clip.id}
              onSelect={() => onSelectReplayClip?.(clip.id)}
            />
          ))}
        </div>
      )}
    </BrowserSection>
  );
}
