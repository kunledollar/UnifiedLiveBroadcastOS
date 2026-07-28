'use client';

import type { MediaAsset, MediaClip, ReplayClip } from '@ubos/shared';
import { validateMediaAsset, validateMediaClip, validateReplayClip } from '@ubos/shared';
import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { MediaEmptyState } from './MediaEmptyState';
import { formatDurationMs, playbackStateLabel } from './media-utils';

export function MediaInspector({
  asset,
  clip,
  replayClip,
  assets,
  clips,
  sceneName,
}: {
  asset: MediaAsset | null;
  clip: MediaClip | null;
  replayClip: ReplayClip | null;
  assets: MediaAsset[];
  clips: MediaClip[];
  sceneName: string;
}) {
  if (!asset && !clip && !replayClip) {
    return <MediaEmptyState message="Select a media asset, clip, or replay clip to inspect" />;
  }

  if (replayClip) {
    const issues = validateReplayClip(replayClip);
    return (
      <ConsoleSection title="Replay Clip">
        <InspectorRow label="Name" value={replayClip.name} />
        <InspectorRow label="Source" value={replayClip.sourceId} />
        <InspectorRow label="Start" value={formatDurationMs(replayClip.startTimeMs)} />
        <InspectorRow label="End" value={formatDurationMs(replayClip.endTimeMs)} />
        <InspectorRow label="Duration" value={formatDurationMs(replayClip.durationMs)} />
        <InspectorRow label="Speed" value={`${replayClip.speed}x`} />
        <InspectorRow label="Angle" value={replayClip.angle ?? 'not configured'} />
        <InspectorRow label="Markers" value={String(replayClip.markers.length)} />
        <InspectorRow label="Program" value={playbackStateLabel(replayClip.programState)} />
        <InspectorRow label="Preview" value={playbackStateLabel(replayClip.previewState)} />
        <InspectorRow label="Status" value={replayClip.status} />
        {issues.length ? (
          <div className="flex flex-wrap gap-1 pt-2">
            {issues.map((issue) => (
              <StatusBadge key={`${issue.code}-${issue.field ?? 'root'}`} variant="warning">
                {issue.message}
              </StatusBadge>
            ))}
          </div>
        ) : null}
        <p className="pt-2 text-ubos-metadata text-ubos-fg-muted">
          Replay metadata staged · Playback runtime unavailable
        </p>
      </ConsoleSection>
    );
  }

  if (clip) {
    const parentAsset = assets.find((item) => item.id === clip.assetId);
    const issues = validateMediaClip(clip, clips, assets);
    return (
      <ConsoleSection title="Clip Properties">
        <InspectorRow label="Name" value={clip.name} />
        <InspectorRow label="Parent asset" value={parentAsset?.name ?? 'missing asset'} />
        <InspectorRow label="Scene" value={sceneName} />
        <InspectorRow label="In point" value={formatDurationMs(clip.inPointMs)} />
        <InspectorRow label="Out point" value={formatDurationMs(clip.outPointMs)} />
        <InspectorRow label="Duration" value={formatDurationMs(clip.durationMs)} />
        <InspectorRow label="Loop" value={clip.loop ? 'Yes' : 'No'} />
        <InspectorRow label="Autoplay" value={clip.autoplay ? 'Yes' : 'No'} />
        <InspectorRow label="Volume" value={`${Math.round(clip.volume * 100)}%`} />
        <InspectorRow label="Speed" value={`${clip.playbackSpeed}x`} />
        <InspectorRow label="Markers" value={String(clip.markers.length)} />
        <InspectorRow label="Program" value={playbackStateLabel(clip.programState)} />
        <InspectorRow label="Preview" value={playbackStateLabel(clip.previewState)} />
        {issues.length ? (
          <div className="flex flex-wrap gap-1 pt-2">
            {issues.map((issue) => (
              <StatusBadge key={`${issue.code}-${issue.field ?? 'root'}`} variant="warning">
                {issue.message}
              </StatusBadge>
            ))}
          </div>
        ) : null}
        <p className="pt-2 text-ubos-metadata text-ubos-fg-muted">
          Clip metadata staged · Playback runtime unavailable
        </p>
      </ConsoleSection>
    );
  }

  if (asset) {
    const issues = validateMediaAsset(asset, assets);
    return (
      <ConsoleSection title="Media Asset">
        <InspectorRow label="Name" value={asset.name} />
        <InspectorRow label="Type" value={asset.type} />
        <InspectorRow label="Scene" value={asset.assignedSceneId ?? sceneName} />
        <InspectorRow label="Duration" value={formatDurationMs(asset.durationMs)} />
        <InspectorRow label="Format" value={asset.format ?? 'unavailable'} />
        <InspectorRow label="Resolution" value={asset.resolution ?? 'unavailable'} />
        <InspectorRow label="FPS" value={asset.fps ? String(asset.fps) : 'unavailable'} />
        <InspectorRow
          label="Audio"
          value={asset.audioChannels ? `${asset.audioChannels} ch` : 'unavailable'}
        />
        <InspectorRow label="Source URI" value={asset.sourceUri ?? 'not configured'} />
        <InspectorRow label="Program" value={playbackStateLabel(asset.programState)} />
        <InspectorRow label="Preview" value={playbackStateLabel(asset.previewState)} />
        <InspectorRow label="Status" value={asset.status} />
        {issues.length ? (
          <div className="flex flex-wrap gap-1 pt-2">
            {issues.map((issue) => (
              <StatusBadge key={`${issue.code}-${issue.field ?? 'root'}`} variant="warning">
                {issue.message}
              </StatusBadge>
            ))}
          </div>
        ) : null}
        <p className="pt-2 text-ubos-metadata text-ubos-fg-muted">
          Media metadata staged · Playback runtime unavailable
        </p>
      </ConsoleSection>
    );
  }

  return null;
}
