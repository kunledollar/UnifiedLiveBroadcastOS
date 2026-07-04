'use client';

import { useMemo } from 'react';
import type { ProductionAsset, SceneMediaComposition } from '@ubos/shared';
import { BroadcastPanel, cn, StatusBadge, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { ClipBrowser } from './ClipBrowser';
import { MediaBin } from './MediaBin';
import { MediaInspector } from './MediaInspector';
import { MediaPreviewControls } from './MediaPreviewControls';
import { PlaylistManager } from './PlaylistManager';
import { ReplayWorkspace } from './ReplayWorkspace';
import type { MediaCompositionAction } from './media-state';
import { productionAssetToMediaAsset } from './media-utils';

export function MediaWorkspace({
  sceneId,
  sceneName,
  composition,
  assets,
  selectedAssetId,
  selectedClipId,
  selectedReplayClipId,
  onSelectAsset,
  onSelectClip,
  onSelectReplayClip,
  dispatch,
  className,
}: {
  sceneId: string;
  sceneName: string;
  composition: SceneMediaComposition;
  assets: ProductionAsset[];
  selectedAssetId?: string | null;
  selectedClipId?: string | null;
  selectedReplayClipId?: string | null;
  onSelectAsset?: (assetId: string | null) => void;
  onSelectClip?: (clipId: string | null) => void;
  onSelectReplayClip?: (clipId: string | null) => void;
  dispatch: (action: MediaCompositionAction) => void;
  className?: string;
}) {
  const mediaAssets = useMemo(
    () => composition.assets.length ? composition.assets : assets.map((asset) => productionAssetToMediaAsset(asset, sceneId)),
    [composition.assets, assets, sceneId],
  );

  const selectedAsset = mediaAssets.find((asset) => asset.id === selectedAssetId) ?? null;
  const selectedClip = composition.clips.find((clip) => clip.id === selectedClipId) ?? null;
  const selectedReplayClip =
    composition.replayClips.find((clip) => clip.id === selectedReplayClipId) ?? null;

  const previewCount =
    composition.previewAssetIds.length +
    composition.previewClipIds.length +
    composition.replayClips.filter((clip) => clip.previewState === 'preview').length;
  const programCount =
    composition.programAssetIds.length +
    composition.programClipIds.length +
    composition.replayClips.filter((clip) => clip.programState === 'program').length;

  const selectionId = selectedClipId ?? selectedAssetId ?? selectedReplayClipId;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>Media Workspace</h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Scene: {sceneName} · Metadata staged · Playback runtime unavailable
          </p>
        </div>
        <StatusBadge variant="warning">Media metadata staged</StatusBadge>
      </div>

      <MediaPreviewControls
        previewCount={previewCount}
        programCount={programCount}
        onSendToPreview={() => {
          if (selectedClipId) dispatch({ type: 'SEND_CLIP_TO_PREVIEW', sceneId, clipId: selectedClipId });
          else if (selectedAssetId) dispatch({ type: 'SEND_ASSET_TO_PREVIEW', sceneId, assetId: selectedAssetId });
          else if (selectedReplayClipId) dispatch({ type: 'SEND_REPLAY_TO_PREVIEW', sceneId, clipId: selectedReplayClipId });
        }}
        onTakeLive={() => {
          if (selectedClipId) dispatch({ type: 'TAKE_CLIP_TO_PROGRAM', sceneId, clipId: selectedClipId });
          else if (selectedAssetId) dispatch({ type: 'TAKE_ASSET_TO_PROGRAM', sceneId, assetId: selectedAssetId });
          else if (selectedReplayClipId) dispatch({ type: 'TAKE_REPLAY_TO_PROGRAM', sceneId, clipId: selectedReplayClipId });
        }}
        onClearPreview={() => dispatch({ type: 'CLEAR_PREVIEW', sceneId })}
        onClearProgram={() => dispatch({ type: 'CLEAR_PROGRAM', sceneId })}
        className="shrink-0 px-ubos-2"
      />

      <ResizableSplit
        initialRatio={0.3}
        minPrimary={0.22}
        maxPrimary={0.42}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
            <MediaBin
              assets={mediaAssets}
              sceneName={sceneName}
              {...(selectedAssetId !== undefined ? { selectedAssetId } : {})}
              onSelectAsset={(assetId) => {
                onSelectAsset?.(assetId);
                onSelectClip?.(null);
                onSelectReplayClip?.(null);
              }}
              onPreview={(assetId) => onSelectAsset?.(assetId)}
              onAssign={(assetId) => dispatch({ type: 'ASSIGN_ASSET_TO_SCENE', sceneId, assetId })}
              onSendToPreview={(assetId) => dispatch({ type: 'SEND_ASSET_TO_PREVIEW', sceneId, assetId })}
              onTakeLive={(assetId) => dispatch({ type: 'TAKE_ASSET_TO_PROGRAM', sceneId, assetId })}
              onRemove={(assetId) => dispatch({ type: 'REMOVE_ASSET', sceneId, assetId })}
              className="min-h-0 flex-1"
            />
            <BroadcastPanel variant="inset" padding={false} className="shrink-0 border-0 shadow-none">
              <div className="p-ubos-2">
                <BroadcastButtonRow
                  label="Create clip from selection"
                  disabled={!selectedAsset}
                  onClick={() => {
                    if (selectedAsset) dispatch({ type: 'ADD_CLIP', sceneId, asset: selectedAsset });
                  }}
                />
              </div>
            </BroadcastPanel>
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.55}
            primary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <ClipBrowser
                  clips={composition.clips}
                  assets={mediaAssets}
                  {...(selectedClipId !== undefined ? { selectedClipId } : {})}
                  onSelectClip={(clipId) => {
                    onSelectClip?.(clipId);
                    onSelectAsset?.(null);
                    onSelectReplayClip?.(null);
                  }}
                  onPreview={(clipId) => onSelectClip?.(clipId)}
                  onSendToPreview={(clipId) => dispatch({ type: 'SEND_CLIP_TO_PREVIEW', sceneId, clipId })}
                  onTakeLive={(clipId) => dispatch({ type: 'TAKE_CLIP_TO_PROGRAM', sceneId, clipId })}
                  onDuplicate={(clipId) => dispatch({ type: 'DUPLICATE_CLIP', sceneId, clipId })}
                  onRemove={(clipId) => {
                    dispatch({ type: 'REMOVE_CLIP', sceneId, clipId });
                    if (selectedClipId === clipId) onSelectClip?.(null);
                  }}
                  className="min-h-0 flex-1"
                />
                <PlaylistManager
                  playlists={composition.playlists}
                  assets={mediaAssets}
                  clips={composition.clips}
                  onCreatePlaylist={() => dispatch({ type: 'CREATE_PLAYLIST', sceneId, name: 'Playlist' })}
                  onClearPlaylist={(playlistId) => dispatch({ type: 'CLEAR_PLAYLIST', sceneId, playlistId })}
                  onSendToPreview={() => {
                    if (selectionId && selectedAssetId) {
                      dispatch({ type: 'SEND_ASSET_TO_PREVIEW', sceneId, assetId: selectedAssetId });
                    }
                  }}
                  className="shrink-0"
                />
              </div>
            }
            secondary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <MediaInspector
                  asset={selectedClip ? null : selectedAsset}
                  clip={selectedClip}
                  replayClip={selectedReplayClip}
                  assets={mediaAssets}
                  clips={composition.clips}
                  sceneName={sceneName}
                />
                <ReplayWorkspace
                  replayBuffer={composition.replayBuffer}
                  replayClips={composition.replayClips}
                  {...(selectedReplayClipId !== undefined ? { selectedReplayClipId } : {})}
                  onSelectReplayClip={(clipId) => {
                    onSelectReplayClip?.(clipId);
                    onSelectAsset?.(null);
                    onSelectClip?.(null);
                  }}
                  onPreview={(clipId) => onSelectReplayClip?.(clipId)}
                  onSendToPreview={(clipId) => dispatch({ type: 'SEND_REPLAY_TO_PREVIEW', sceneId, clipId })}
                  onTakeLive={(clipId) => dispatch({ type: 'TAKE_REPLAY_TO_PROGRAM', sceneId, clipId })}
                  onAddSampleClip={() =>
                    dispatch({
                      type: 'ADD_REPLAY_CLIP',
                      sceneId,
                      clip: {
                        id: `replay-${Date.now()}`,
                        sourceId: composition.replayBuffer.sourceId ?? 'program-feed',
                        name: 'Sample Replay Clip',
                        startTimeMs: 0,
                        endTimeMs: 5000,
                        durationMs: 5000,
                        speed: 1,
                        markers: [],
                        angle: 'A',
                        programState: 'idle',
                        previewState: 'idle',
                        status: 'ready',
                      },
                    })
                  }
                  className="min-h-0 flex-1"
                />
              </div>
            }
          />
        }
      />
    </div>
  );
}

function BroadcastButtonRow({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight px-ubos-2 py-1 text-ubos-caption text-ubos-fg-secondary hover:bg-ubos-slate disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
