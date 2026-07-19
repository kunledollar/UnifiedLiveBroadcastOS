import type { MediaAsset, MediaClip, Playlist, ReplayClip, SceneMediaComposition } from '@ubos/shared';
import { createMediaCommandIntent } from '@ubos/shared';
import { createClipFromAsset, ensureSceneMediaComposition } from './media-utils';

export type MediaCompositionState = {
  compositions: Record<string, SceneMediaComposition>;
  commandLog: ReturnType<typeof createMediaCommandIntent>[];
};

export type MediaCompositionAction =
  | { type: 'REGISTER_ASSETS'; sceneId: string; assets: MediaAsset[] }
  | { type: 'ADD_CLIP'; sceneId: string; asset: MediaAsset }
  | { type: 'REMOVE_CLIP'; sceneId: string; clipId: string }
  | { type: 'DUPLICATE_CLIP'; sceneId: string; clipId: string }
  | { type: 'SEND_ASSET_TO_PREVIEW'; sceneId: string; assetId: string }
  | { type: 'TAKE_ASSET_TO_PROGRAM'; sceneId: string; assetId: string }
  | { type: 'SEND_CLIP_TO_PREVIEW'; sceneId: string; clipId: string }
  | { type: 'TAKE_CLIP_TO_PROGRAM'; sceneId: string; clipId: string }
  | { type: 'ASSIGN_ASSET_TO_SCENE'; sceneId: string; assetId: string }
  | { type: 'REMOVE_ASSET'; sceneId: string; assetId: string }
  | { type: 'CREATE_PLAYLIST'; sceneId: string; name: string }
  | { type: 'CLEAR_PLAYLIST'; sceneId: string; playlistId: string }
  | { type: 'ADD_REPLAY_CLIP'; sceneId: string; clip: ReplayClip }
  | { type: 'SEND_REPLAY_TO_PREVIEW'; sceneId: string; clipId: string }
  | { type: 'TAKE_REPLAY_TO_PROGRAM'; sceneId: string; clipId: string }
  | { type: 'CLEAR_PREVIEW'; sceneId: string }
  | { type: 'CLEAR_PROGRAM'; sceneId: string };

export const initialMediaCompositionState: MediaCompositionState = {
  compositions: {},
  commandLog: [],
};

function updateComposition(
  state: MediaCompositionState,
  sceneId: string,
  updater: (composition: SceneMediaComposition) => SceneMediaComposition,
  command?: ReturnType<typeof createMediaCommandIntent>,
): MediaCompositionState {
  const current = ensureSceneMediaComposition(state.compositions, sceneId);
  return {
    compositions: {
      ...state.compositions,
      [sceneId]: {
        ...updater(current),
        updatedAt: new Date().toISOString(),
      },
    },
    commandLog: command ? [command, ...state.commandLog].slice(0, 50) : state.commandLog,
  };
}

export function mediaCompositionReducer(
  state: MediaCompositionState,
  action: MediaCompositionAction,
): MediaCompositionState {
  switch (action.type) {
    case 'REGISTER_ASSETS': {
      const current = ensureSceneMediaComposition(state.compositions, action.sceneId);
      const assets = action.assets.map((asset) => ({
        ...asset,
        assignedSceneId: asset.assignedSceneId ?? action.sceneId,
      }));

      // Prevent unnecessary re-renders.
      if (JSON.stringify(current.assets) === JSON.stringify(assets)) {
        return state;
      }

      return updateComposition(state, action.sceneId, (composition) => ({
        ...composition,
        assets,
      }));
    }
    case 'ADD_CLIP': {
      const clip = createClipFromAsset(action.asset, action.sceneId);
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({ ...current, clips: [...current.clips, clip] }),
        createMediaCommandIntent('ADD_MEDIA_CLIP', { sceneId: action.sceneId, clip }),
      );
    }
    case 'REMOVE_CLIP':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        clips: current.clips.filter((clip) => clip.id !== action.clipId),
        previewClipIds: current.previewClipIds.filter((id) => id !== action.clipId),
        programClipIds: current.programClipIds.filter((id) => id !== action.clipId),
      }));
    case 'DUPLICATE_CLIP': {
      const composition = ensureSceneMediaComposition(state.compositions, action.sceneId);
      const original = composition.clips.find((clip) => clip.id === action.clipId);
      if (!original) return state;
      const duplicate: MediaClip = {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        name: `${original.name} Copy`,
        programState: 'idle',
        previewState: 'idle',
      };
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        clips: [...current.clips, duplicate],
      }));
    }
    case 'SEND_ASSET_TO_PREVIEW':
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({
          ...current,
          previewAssetIds: Array.from(new Set([...current.previewAssetIds, action.assetId])),
          assets: current.assets.map((asset) =>
            asset.id === action.assetId ? { ...asset, previewState: 'preview' as const } : asset,
          ),
        }),
        createMediaCommandIntent('PREVIEW_MEDIA_CLIP', { sceneId: action.sceneId, assetId: action.assetId }),
      );
    case 'TAKE_ASSET_TO_PROGRAM':
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({
          ...current,
          programAssetIds: Array.from(new Set([...current.programAssetIds, action.assetId])),
          previewAssetIds: current.previewAssetIds.filter((id) => id !== action.assetId),
          assets: current.assets.map((asset) =>
            asset.id === action.assetId
              ? { ...asset, programState: 'program' as const, previewState: 'idle' as const }
              : asset,
          ),
        }),
        createMediaCommandIntent('TAKE_MEDIA_TO_PROGRAM', { sceneId: action.sceneId, assetId: action.assetId }),
      );
    case 'SEND_CLIP_TO_PREVIEW':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        previewClipIds: Array.from(new Set([...current.previewClipIds, action.clipId])),
        clips: current.clips.map((clip) =>
          clip.id === action.clipId ? { ...clip, previewState: 'preview' as const } : clip,
        ),
      }));
    case 'TAKE_CLIP_TO_PROGRAM':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        programClipIds: Array.from(new Set([...current.programClipIds, action.clipId])),
        previewClipIds: current.previewClipIds.filter((id) => id !== action.clipId),
        clips: current.clips.map((clip) =>
          clip.id === action.clipId
            ? { ...clip, programState: 'program' as const, previewState: 'idle' as const }
            : clip,
        ),
      }));
    case 'ASSIGN_ASSET_TO_SCENE':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        assets: current.assets.map((asset) =>
          asset.id === action.assetId ? { ...asset, assignedSceneId: action.sceneId } : asset,
        ),
      }));
    case 'REMOVE_ASSET':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        assets: current.assets.filter((asset) => asset.id !== action.assetId),
        clips: current.clips.filter((clip) => clip.assetId !== action.assetId),
      }));
    case 'CREATE_PLAYLIST': {
      const playlist: Playlist = {
        id: `playlist-${Date.now()}`,
        name: action.name,
        items: [],
        currentIndex: 0,
        mode: 'manual',
        status: 'ready',
      };
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({ ...current, playlists: [...current.playlists, playlist] }),
        createMediaCommandIntent('CREATE_PLAYLIST', { sceneId: action.sceneId, playlist }),
      );
    }
    case 'CLEAR_PLAYLIST':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        playlists: current.playlists.map((playlist) =>
          playlist.id === action.playlistId ? { ...playlist, items: [], currentIndex: 0, status: 'idle' as const } : playlist,
        ),
      }));
    case 'ADD_REPLAY_CLIP':
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({ ...current, replayClips: [...current.replayClips, action.clip] }),
        createMediaCommandIntent('ADD_REPLAY_CLIP', { sceneId: action.sceneId, clip: action.clip }),
      );
    case 'SEND_REPLAY_TO_PREVIEW':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        replayClips: current.replayClips.map((clip) =>
          clip.id === action.clipId ? { ...clip, previewState: 'preview' as const } : clip,
        ),
      }));
    case 'TAKE_REPLAY_TO_PROGRAM':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        replayClips: current.replayClips.map((clip) =>
          clip.id === action.clipId
            ? { ...clip, programState: 'program' as const, previewState: 'idle' as const }
            : clip,
        ),
      }));
    case 'CLEAR_PREVIEW':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        previewAssetIds: [],
        previewClipIds: [],
        assets: current.assets.map((asset) => ({ ...asset, previewState: 'idle' as const })),
        clips: current.clips.map((clip) => ({ ...clip, previewState: 'idle' as const })),
        replayClips: current.replayClips.map((clip) => ({ ...clip, previewState: 'idle' as const })),
      }));
    case 'CLEAR_PROGRAM':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        programAssetIds: [],
        programClipIds: [],
        assets: current.assets.map((asset) => ({ ...asset, programState: 'idle' as const })),
        clips: current.clips.map((clip) => ({ ...clip, programState: 'idle' as const })),
        replayClips: current.replayClips.map((clip) => ({ ...clip, programState: 'idle' as const })),
      }));
    default:
      return state;
  }
}
