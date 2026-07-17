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
  warning: string | null;
  activationAction: 'start-camera' | 'start-screen' | null;
};

export function getVisibleLiveVideoSources(scene: Scene): SceneSource[] {
  return scene.sources
    .filter(
      (source) =>
        source.isVisible &&
        !source.isLocked &&
        (source.type === 'camera' || source.type === 'screen' || source.type === 'media'),
    )
    .sort((a, b) => {
      const zA = typeof a.transform.zIndex === 'number' ? a.transform.zIndex : a.order;
      const zB = typeof b.transform.zIndex === 'number' ? b.transform.zIndex : b.order;
      if (zA !== zB) return zB - zA;
      return a.order - b.order;
    });
}

export function getFirstVisibleLiveVideoSource(scene: Scene): SceneSource | undefined {
  return getVisibleLiveVideoSources(scene)[0];
}

function isActiveVideoStream<TStream extends LiveStreamLike>(
  stream: TStream | null | undefined,
): stream is TStream {
  return Boolean(
    stream?.active &&
    stream
      .getVideoTracks()
      .some((track) => track.readyState === undefined || track.readyState === 'live'),
  );
}

export function resolveSceneLiveMedia<TStream extends LiveStreamLike>(
  scene: Scene,
  liveSourceStreams: Record<string, TStream>,
): RoutedSceneMedia<TStream> {
  const visibleSources = getVisibleLiveVideoSources(scene);
  const activeSource = visibleSources.find((candidate) =>
    isActiveVideoStream(liveSourceStreams[candidate.id] ?? null),
  );
  const source = activeSource ?? visibleSources[0];
  const stream = source ? (liveSourceStreams[source.id] ?? null) : null;
  const active = isActiveVideoStream(stream);
  const sourceType = source?.type ?? null;
  const warning = active
    ? null
    : sourceType === 'camera'
      ? 'CAMERA OFFLINE'
      : sourceType === 'screen'
        ? 'SCREEN SOURCE NOT STARTED'
        : sourceType === 'media'
          ? typeof source?.settings?.message === 'string'
            ? source.settings.message
            : source?.settings?.runtimeStatus === 'relink_required'
              ? 'RELINK REQUIRED'
              : 'MEDIA UNAVAILABLE'
          : null;
  const activationAction = active
    ? null
    : sourceType === 'camera'
      ? 'start-camera'
      : sourceType === 'screen'
        ? 'start-screen'
        : null;
  return {
    sceneId: scene.id,
    sourceId: source?.id ?? null,
    sourceType,
    stream: active ? stream : null,
    active,
    warning,
    activationAction,
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

export function getUnusedLiveSourceIds<TStream extends LiveStreamLike>(input: {
  scenes: Scene[];
  liveSourceStreams: Record<string, TStream>;
}): string[] {
  const referenced = new Set(
    input.scenes.flatMap((scene) => scene.sources.map((source) => source.id)),
  );
  return Object.keys(input.liveSourceStreams).filter((sourceId) => !referenced.has(sourceId));
}
