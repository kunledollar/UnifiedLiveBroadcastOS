import type { Scene, SceneSource, SceneSourceType } from '@ubos/shared';

export type LiveStreamLike = {
  id?: string;
  active?: boolean;
  getVideoTracks(): Array<{ readyState?: string }>;
};

export type RoutedSceneMedia<TStream extends LiveStreamLike> = {
  sceneId: string;
  sourceId: string | null;
  sourceType: SceneSourceType | null;
  stream: TStream | null;
  active: boolean;
};

export function getFirstVisibleLiveVideoSource(scene: Scene): SceneSource | undefined {
  return scene.sources.find(
    (source) =>
      source.isVisible &&
      !source.isLocked &&
      (source.type === 'camera' || source.type === 'screen' || source.type === 'media'),
  );
}

function isActiveVideoStream<TStream extends LiveStreamLike>(stream: TStream | null | undefined): stream is TStream {
  return Boolean(
    stream?.active && stream.getVideoTracks().some((track) => track.readyState === undefined || track.readyState === 'live'),
  );
}

export function resolveSceneLiveMedia<TStream extends LiveStreamLike>(
  scene: Scene,
  liveSourceStreams: Record<string, TStream>,
): RoutedSceneMedia<TStream> {
  const source = getFirstVisibleLiveVideoSource(scene);
  const stream = source ? liveSourceStreams[source.id] ?? null : null;
  const active = isActiveVideoStream(stream);
  return {
    sceneId: scene.id,
    sourceId: source?.id ?? null,
    sourceType: source?.type ?? null,
    stream: active ? stream : null,
    active,
  };
}

export function createSceneRoutingEvidence<TStream extends LiveStreamLike>(input: {
  program: RoutedSceneMedia<TStream>;
  preview: RoutedSceneMedia<TStream>;
}) {
  return {
    programSceneId: input.program.sceneId,
    previewSceneId: input.preview.sceneId,
    programResolvedSourceIds: input.program.sourceId ? [input.program.sourceId] : [],
    previewResolvedSourceIds: input.preview.sourceId ? [input.preview.sourceId] : [],
    programStreamId: input.program.stream?.id ?? null,
    previewStreamId: input.preview.stream?.id ?? null,
    programPreviewShareStream: Boolean(
      input.program.stream && input.preview.stream && input.program.stream === input.preview.stream,
    ),
  };
}
