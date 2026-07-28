'use client';

import type { MediaAsset } from '@ubos/shared';
import { AssetList, BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { MediaAssetRow } from './MediaAssetRow';
import { MediaEmptyState } from './MediaEmptyState';

export function MediaBin({
  assets,
  sceneName,
  selectedAssetId,
  onSelectAsset,
  onPreview,
  onAssign,
  onSendToPreview,
  onTakeLive,
  onRemove,
  className,
}: {
  assets: MediaAsset[];
  sceneName?: string;
  selectedAssetId?: string | null;
  onSelectAsset?: (assetId: string) => void;
  onPreview?: (assetId: string) => void;
  onAssign?: (assetId: string) => void;
  onSendToPreview?: (assetId: string) => void;
  onTakeLive?: (assetId: string) => void;
  onRemove?: (assetId: string) => void;
  className?: string;
}) {
  const playableAssets = assets.filter((asset) =>
    ['video', 'image', 'audio', 'browser', 'replay_clip', 'playlist'].includes(asset.type),
  );

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Media Bin</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {playableAssets.length} asset{playableAssets.length === 1 ? '' : 's'}
          {sceneName ? ` · Scene: ${sceneName}` : ''}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-ubos-2">
        {!playableAssets.length ? (
          <MediaEmptyState message="No media assets loaded" />
        ) : (
          <AssetList isEmpty={false}>
            <div className="space-y-1">
              {playableAssets.map((asset) => (
                <MediaAssetRow
                  key={asset.id}
                  asset={asset}
                  selected={selectedAssetId === asset.id}
                  onSelect={() => onSelectAsset?.(asset.id)}
                  onPreview={() => onPreview?.(asset.id)}
                  onAssign={() => onAssign?.(asset.id)}
                  onSendToPreview={() => onSendToPreview?.(asset.id)}
                  onTakeLive={() => onTakeLive?.(asset.id)}
                  onRemove={() => onRemove?.(asset.id)}
                />
              ))}
            </div>
          </AssetList>
        )}
      </div>
    </BroadcastPanel>
  );
}
