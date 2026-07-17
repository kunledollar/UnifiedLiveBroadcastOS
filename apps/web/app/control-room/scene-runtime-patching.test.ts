import assert from 'node:assert/strict';
import test from 'node:test';
import type { Scene } from '@ubos/shared';
import {
  areScenesSameReference,
  patchCaptureSourceStatusInScenes,
  shouldRestoreLocalMediaSource,
} from './scene-runtime-patching.js';

function scene(status = 'relink_required', message = 'Relink required.'): Scene {
  return {
    id: 'scene-1',
    name: 'Scene',
    type: 'program',
    layout: 'single',
    order: 1,
    isActive: true,
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
    sources: [
      {
        id: 'media-1',
        name: 'Media',
        type: 'media',
        isVisible: true,
        settings: { runtimeStatus: status, message, relinkState: 'required' },
      },
    ],
    overlays: [],
    canvases: [],
  } as unknown as Scene;
}

test('unchanged capture status patch returns the same scene reference and avoids setScenes work', () => {
  const current = [scene()];
  const next = patchCaptureSourceStatusInScenes(current, {
    runtimeStatus: 'relink_required',
    sourceId: 'media-1',
    message: 'Relink required.',
    relinkState: 'required',
  });
  assert.equal(next, current);
  assert.equal(next[0], current[0]);
  assert.equal(areScenesSameReference(current, next), true);
});

test('changed capture status updates once, then subsequent identical patch is stable', () => {
  const current = [scene('loading', 'Loading local media.')];
  const ready = patchCaptureSourceStatusInScenes(current, {
    runtimeStatus: 'live',
    sourceId: 'media-1',
    message: 'Local media ready.',
    captureState: 'live',
  });
  assert.notEqual(ready, current);
  assert.notEqual(ready[0], current[0]);
  assert.equal(ready[0]!.sources[0]!.settings?.runtimeStatus, 'live');
  const unchanged = patchCaptureSourceStatusInScenes(ready, {
    runtimeStatus: 'live',
    sourceId: 'media-1',
    message: 'Local media ready.',
    captureState: 'live',
  });
  assert.equal(unchanged, ready);
});

test('restore starts only once and rerender does not restart an in-flight restore', () => {
  const inFlight = new Set<string>();
  assert.equal(
    shouldRestoreLocalMediaSource({
      sourceId: 'media-1',
      hasElement: false,
      hasLiveStream: false,
      runtimeStatus: 'loading',
      restoreInFlight: inFlight,
    }),
    true,
  );
  inFlight.add('media-1');
  assert.equal(
    shouldRestoreLocalMediaSource({
      sourceId: 'media-1',
      hasElement: false,
      hasLiveStream: false,
      runtimeStatus: 'loading',
      restoreInFlight: inFlight,
    }),
    false,
  );
});

test('ready media, relink state, and stable failures do not trigger repeated restore or patches', () => {
  const restoreInFlight = new Set<string>();
  assert.equal(
    shouldRestoreLocalMediaSource({
      sourceId: 'media-1',
      hasElement: false,
      hasLiveStream: true,
      runtimeStatus: 'live',
      restoreInFlight,
    }),
    false,
  );
  const relink = [scene('relink_required', 'Relink required: local media bytes are unavailable.')];
  assert.equal(
    patchCaptureSourceStatusInScenes(relink, {
      runtimeStatus: 'relink_required',
      sourceId: 'media-1',
      message: 'Relink required: local media bytes are unavailable.',
    }),
    relink,
  );
  const failed = [scene('unavailable', 'Unsupported codec or media container in this browser.')];
  assert.equal(
    patchCaptureSourceStatusInScenes(failed, {
      runtimeStatus: 'unavailable',
      sourceId: 'media-1',
      message: 'Unsupported codec or media container in this browser.',
    }),
    failed,
  );
});
