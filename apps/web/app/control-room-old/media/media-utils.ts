import type { MediaAsset, MediaClip, ProductionAsset, ReplayClip, SceneMediaComposition } from '@ubos/shared';
import { createEmptySceneMediaComposition } from '@ubos/shared';

export function productionAssetToMediaAsset(
  asset: ProductionAsset,
  sceneId?: string,
): MediaAsset {
  const typeMap: Record<ProductionAsset['type'], MediaAsset['type']> = {
    video: 'video',
    image: 'image',
    lower_third: 'unknown',
    background: 'image',
    overlay: 'image',
  };
  const statusMap: Record<ProductionAsset['status'], MediaAsset['status']> = {
    ready: 'ready',
    queued: 'processing',
    disabled: 'unavailable',
  };
  const now = new Date().toISOString();
  return {
    id: asset.id,
    name: asset.name,
    type: typeMap[asset.type] ?? 'unknown',
    status: statusMap[asset.status] ?? 'unavailable',
    programState: 'idle',
    previewState: 'idle',
    ...(sceneId ? { assignedSceneId: sceneId } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

export function ensureSceneMediaComposition(
  compositions: Record<string, SceneMediaComposition>,
  sceneId: string,
): SceneMediaComposition {
  return compositions[sceneId] ?? createEmptySceneMediaComposition(sceneId);
}

export function playbackStateLabel(state: MediaAsset['programState']): string {
  switch (state) {
    case 'program':
      return 'PROGRAM';
    case 'preview':
      return 'PREVIEW';
    case 'unavailable':
      return 'Unavailable';
    default:
      return 'Idle';
  }
}

export function playbackStateVariant(
  state: MediaAsset['programState'],
): 'live' | 'preview' | 'neutral' | 'offline' {
  switch (state) {
    case 'program':
      return 'live';
    case 'preview':
      return 'preview';
    case 'unavailable':
      return 'offline';
    default:
      return 'neutral';
  }
}

export function formatDurationMs(durationMs?: number): string {
  if (durationMs === undefined || !Number.isFinite(durationMs)) return 'unavailable';
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function createClipFromAsset(asset: MediaAsset, sceneId: string): MediaClip {
  const durationMs = asset.durationMs ?? 0;
  return {
    id: `clip-${asset.id}-${Date.now()}`,
    assetId: asset.id,
    name: `${asset.name} Clip`,
    inPointMs: 0,
    outPointMs: durationMs > 0 ? durationMs : 1000,
    durationMs: durationMs > 0 ? durationMs : 1000,
    markers: [],
    loop: false,
    autoplay: false,
    volume: 1,
    playbackSpeed: 1,
    transitionInMs: 0,
    transitionOutMs: 0,
    programState: 'idle',
    previewState: 'idle',
    status: asset.status,
  };
}

export function getActiveProgramMediaLabels(composition: SceneMediaComposition): string[] {
  const assetLabels = composition.assets
    .filter((asset) => asset.programState === 'program')
    .map((asset) => asset.name);
  const clipLabels = composition.clips
    .filter((clip) => clip.programState === 'program')
    .map((clip) => clip.name);
  const replayLabels = composition.replayClips
    .filter((clip) => clip.programState === 'program')
    .map((clip) => clip.name);
  return [...assetLabels, ...clipLabels, ...replayLabels];
}

export function getProgramMediaOverlayItems(
  composition: SceneMediaComposition,
): Array<{ id: string; name: string }> {
  const assetItems = composition.assets
    .filter((asset) => asset.programState === 'program')
    .map((asset) => ({ id: asset.id, name: asset.name }));
  const clipItems = composition.clips
    .filter((clip) => clip.programState === 'program')
    .map((clip) => ({ id: clip.id, name: clip.name }));
  const replayItems = composition.replayClips
    .filter((clip) => clip.programState === 'program')
    .map((clip) => ({ id: clip.id, name: clip.name }));
  return [...assetItems, ...clipItems, ...replayItems];
}

export function getPreviewMediaOverlayItems(
  composition: SceneMediaComposition,
): Array<{ id: string; name: string }> {
  const assetItems = composition.assets
    .filter((asset) => asset.previewState === 'preview')
    .map((asset) => ({ id: asset.id, name: asset.name }));
  const clipItems = composition.clips
    .filter((clip) => clip.previewState === 'preview')
    .map((clip) => ({ id: clip.id, name: clip.name }));
  const replayItems = composition.replayClips
    .filter((clip) => clip.previewState === 'preview')
    .map((clip) => ({ id: clip.id, name: clip.name }));
  return [...assetItems, ...clipItems, ...replayItems];
}

export function getActivePreviewMediaLabels(composition: SceneMediaComposition): string[] {
  const assetLabels = composition.assets
    .filter((asset) => asset.previewState === 'preview')
    .map((asset) => asset.name);
  const clipLabels = composition.clips
    .filter((clip) => clip.previewState === 'preview')
    .map((clip) => clip.name);
  const replayLabels = composition.replayClips
    .filter((clip) => clip.previewState === 'preview')
    .map((clip) => clip.name);
  return [...assetLabels, ...clipLabels, ...replayLabels];
}
