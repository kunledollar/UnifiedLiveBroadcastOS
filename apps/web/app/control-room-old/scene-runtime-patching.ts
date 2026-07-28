import type { Scene } from '@ubos/shared';

const CAPTURE_SOURCE_TYPES = new Set(['camera', 'screen', 'audio', 'media']);

export type CaptureRuntimePatch = {
  runtimeStatus: string;
  sourceId?: string;
  message?: string;
  captureState?: string;
  warning?: string | null;
  relinkState?: string | null;
};

export function areScenesSameReference(current: Scene[], next: Scene[]): boolean {
  return current === next || (current.length === next.length && current.every((scene, index) => scene === next[index]));
}

function settingValue(settings: Record<string, unknown> | undefined, key: string): unknown {
  return settings ? settings[key] : undefined;
}

function patchValueIsUnchanged(
  settings: Record<string, unknown> | undefined,
  key: string,
  nextValue: unknown,
): boolean {
  return settingValue(settings, key) === nextValue;
}

export function patchCaptureSourceStatusInScenes(scenes: Scene[], patch: CaptureRuntimePatch): Scene[] {
  let changedScenes = false;
  const nextScenes = scenes.map((scene) => {
    let changedSources = false;
    const nextSources = scene.sources.map((source) => {
      if (!CAPTURE_SOURCE_TYPES.has(source.type) || (patch.sourceId && source.id !== patch.sourceId)) {
        return source;
      }
      const settings = source.settings as Record<string, unknown> | undefined;
      const messageUnchanged = patch.message === undefined || patchValueIsUnchanged(settings, 'message', patch.message);
      const captureStateUnchanged = patch.captureState === undefined || patchValueIsUnchanged(settings, 'captureState', patch.captureState);
      const warningUnchanged = patch.warning === undefined || patchValueIsUnchanged(settings, 'warning', patch.warning ?? undefined);
      const relinkStateUnchanged = patch.relinkState === undefined || patchValueIsUnchanged(settings, 'relinkState', patch.relinkState ?? undefined);
      if (
        patchValueIsUnchanged(settings, 'runtimeStatus', patch.runtimeStatus) &&
        messageUnchanged &&
        captureStateUnchanged &&
        warningUnchanged &&
        relinkStateUnchanged
      ) {
        return source;
      }
      changedSources = true;
      const nextSettings = {
        ...source.settings,
        runtimeStatus: patch.runtimeStatus,
        ...(patch.message === undefined ? {} : { message: patch.message }),
        ...(patch.captureState === undefined ? {} : { captureState: patch.captureState }),
        ...(patch.warning === undefined ? {} : { warning: patch.warning ?? undefined }),
        ...(patch.relinkState === undefined ? {} : { relinkState: patch.relinkState ?? undefined }),
      };
      return { ...source, settings: nextSettings };
    });
    if (!changedSources) return scene;
    changedScenes = true;
    return { ...scene, sources: nextSources };
  });
  return changedScenes ? nextScenes : scenes;
}

export function shouldRestoreLocalMediaSource(input: {
  sourceId: string;
  hasElement: boolean;
  hasLiveStream: boolean;
  runtimeStatus?: unknown;
  restoreInFlight: Set<string>;
}): boolean {
  if (input.restoreInFlight.has(input.sourceId)) return false;
  if (input.hasElement || input.hasLiveStream) return false;
  if (input.runtimeStatus === 'live' || input.runtimeStatus === 'ready') return false;
  return true;
}
