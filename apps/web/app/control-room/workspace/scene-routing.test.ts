import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSceneLiveMedia, createSceneRoutingEvidence, type LiveStreamLike } from './scene-routing.js';
import { SceneType, type Scene } from '@ubos/shared';

function stream(id: string): LiveStreamLike {
  return { id, active: true, getVideoTracks: () => [{ readyState: 'live' }] };
}

function scene(id: string, sourceId: string): Scene {
  const at = '2026-07-16T00:00:00.000Z';
  return {
    id,
    broadcastId: 'broadcast-test',
    name: id,
    order: id.endsWith('a') ? 1 : id.endsWith('b') ? 2 : 3,
    isActive: false,
    type: SceneType.Camera,
    layout: null,
    sources: [{ id: sourceId, name: sourceId, type: 'camera', label: sourceId, order: 1, visible: true, isVisible: true, isLocked: false, settings: {}, transform: {} }],
    overlays: [],
    audioConfig: {},
    canvases: [],
    createdAt: at,
    updatedAt: at,
  };
}

test('Program and Preview resolve different scene source streams without stale fallback', () => {
  const program = resolveSceneLiveMedia(scene('scene-a', 'source-a'), { 'source-a': stream('stream-a'), 'source-b': stream('stream-b') });
  const preview = resolveSceneLiveMedia(scene('scene-b', 'source-b'), { 'source-a': stream('stream-a'), 'source-b': stream('stream-b') });
  assert.equal(program.sourceId, 'source-a');
  assert.equal(preview.sourceId, 'source-b');
  assert.equal(program.stream?.id, 'stream-a');
  assert.equal(preview.stream?.id, 'stream-b');
});

test('Preview scene with no matching live stream does not reuse Program Scene A stream', () => {
  const streams = { 'source-a': stream('stream-a') };
  const program = resolveSceneLiveMedia(scene('scene-a', 'source-a'), streams);
  const preview = resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams);
  assert.equal(program.stream?.id, 'stream-a');
  assert.equal(preview.stream, null);
  assert.equal(preview.active, false);
});

test('CUT/TAKE evidence follows Program binding after Program scene changes', () => {
  const streams = { 'source-a': stream('stream-a'), 'source-c': stream('stream-c') };
  const before = createSceneRoutingEvidence({
    program: resolveSceneLiveMedia(scene('scene-a', 'source-a'), streams),
    preview: resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams),
  });
  const after = createSceneRoutingEvidence({
    program: resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams),
    preview: resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams),
  });
  assert.deepEqual(before.programResolvedSourceIds, ['source-a']);
  assert.deepEqual(before.previewResolvedSourceIds, ['source-c']);
  assert.equal(after.programSceneId, 'scene-c');
  assert.deepEqual(after.programResolvedSourceIds, ['source-c']);
  assert.equal(after.programStreamId, 'stream-c');
});
