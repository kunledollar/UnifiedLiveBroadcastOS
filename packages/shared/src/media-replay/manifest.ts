import type { MediaClip, MediaManifest, MediaAsset, Playlist, ReplayClip, SceneMediaComposition } from './types.js';

export function createMediaManifest(input: {
  assets: MediaAsset[];
  clips: MediaClip[];
  playlists: Playlist[];
  replayClips: ReplayClip[];
}): MediaManifest {
  return {
    assets: input.assets,
    clips: input.clips,
    playlists: input.playlists,
    replayClips: input.replayClips,
    containsRuntimeHandles: false,
  };
}

export function createEmptySceneMediaComposition(sceneId: string): SceneMediaComposition {
  return {
    sceneId,
    assets: [],
    clips: [],
    playlists: [],
    replayClips: [],
    replayBuffer: { active: false, status: 'inactive' },
    programAssetIds: [],
    programClipIds: [],
    previewAssetIds: [],
    previewClipIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function isMediaManifestReplaySafe(manifest: MediaManifest): boolean {
  return manifest.containsRuntimeHandles === false;
}
