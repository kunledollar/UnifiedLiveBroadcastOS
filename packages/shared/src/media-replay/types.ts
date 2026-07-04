export type MediaAssetType =
  | 'video'
  | 'image'
  | 'audio'
  | 'browser'
  | 'replay_clip'
  | 'playlist'
  | 'unknown';

export type MediaAssetStatus =
  | 'ready'
  | 'missing'
  | 'unavailable'
  | 'processing'
  | 'offline';

export type MediaPlaybackState = 'idle' | 'preview' | 'program' | 'unavailable';

export type PlaylistMode = 'manual' | 'sequential' | 'loop' | 'shuffle';

export type PlaylistStatus = 'idle' | 'ready' | 'playing' | 'unavailable';

export type ReplayClipStatus = 'ready' | 'buffering' | 'unavailable' | 'offline';

export interface MediaMarker {
  id: string;
  label: string;
  timeMs: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaAssetType;
  sourceUri?: string;
  durationMs?: number;
  format?: string;
  resolution?: string;
  fps?: number;
  audioChannels?: number;
  status: MediaAssetStatus;
  assignedSceneId?: string;
  programState: MediaPlaybackState;
  previewState: MediaPlaybackState;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MediaClip {
  id: string;
  assetId: string;
  name: string;
  inPointMs: number;
  outPointMs: number;
  durationMs: number;
  markers: MediaMarker[];
  loop: boolean;
  autoplay: boolean;
  volume: number;
  playbackSpeed: number;
  transitionInMs: number;
  transitionOutMs: number;
  programState: MediaPlaybackState;
  previewState: MediaPlaybackState;
  status: MediaAssetStatus;
}

export interface PlaylistItem {
  id: string;
  clipId?: string;
  assetId?: string;
  label: string;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  currentIndex: number;
  mode: PlaylistMode;
  status: PlaylistStatus;
}

export interface ReplayClip {
  id: string;
  sourceId: string;
  name: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  speed: number;
  markers: MediaMarker[];
  angle?: string;
  programState: MediaPlaybackState;
  previewState: MediaPlaybackState;
  status: ReplayClipStatus;
}

export interface ReplayBufferMetadata {
  active: boolean;
  sourceId?: string;
  durationMs?: number;
  status: 'inactive' | 'ready' | 'unavailable';
}

export interface SceneMediaComposition {
  sceneId: string;
  assets: MediaAsset[];
  clips: MediaClip[];
  playlists: Playlist[];
  replayClips: ReplayClip[];
  replayBuffer: ReplayBufferMetadata;
  programAssetIds: string[];
  programClipIds: string[];
  previewAssetIds: string[];
  previewClipIds: string[];
  updatedAt: string;
}

export interface MediaManifest {
  assets: MediaAsset[];
  clips: MediaClip[];
  playlists: Playlist[];
  replayClips: ReplayClip[];
  containsRuntimeHandles: false;
}

export const MEDIA_COMMAND_STUBS = [
  'ADD_MEDIA_ASSET',
  'UPDATE_MEDIA_ASSET',
  'REMOVE_MEDIA_ASSET',
  'ADD_MEDIA_CLIP',
  'UPDATE_MEDIA_CLIP',
  'REMOVE_MEDIA_CLIP',
  'PREVIEW_MEDIA_CLIP',
  'TAKE_MEDIA_TO_PROGRAM',
  'CREATE_PLAYLIST',
  'UPDATE_PLAYLIST',
  'ADD_REPLAY_CLIP',
  'PREVIEW_REPLAY_CLIP',
  'TAKE_REPLAY_TO_PROGRAM',
] as const;

export type MediaCommandStub = (typeof MEDIA_COMMAND_STUBS)[number];
