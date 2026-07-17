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

test('Preview scene change does not mutate Program media binding', () => {
  const streams = {
    'source-a': stream('stream-a'),
    'source-b': stream('stream-b'),
    'source-c': stream('stream-c'),
  };
  const programBefore = resolveSceneLiveMedia(scene('scene-a', 'source-a'), streams);
  const previewBefore = resolveSceneLiveMedia(scene('scene-b', 'source-b'), streams);
  const programAfterPreviewChange = resolveSceneLiveMedia(scene('scene-a', 'source-a'), streams);
  const previewAfterPreviewChange = resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams);

  assert.equal(programBefore.sourceId, 'source-a');
  assert.equal(previewBefore.sourceId, 'source-b');
  assert.equal(programAfterPreviewChange.sourceId, 'source-a');
  assert.equal(programAfterPreviewChange.stream?.id, 'stream-a');
  assert.equal(previewAfterPreviewChange.sourceId, 'source-c');
  assert.equal(previewAfterPreviewChange.stream?.id, 'stream-c');
});

test('AUTO/TAKE updates Program binding while shared source streams remain active', () => {
  const shared = stream('stream-shared');
  const streams = {
    'source-a': stream('stream-a'),
    'source-b': stream('stream-b'),
    'source-shared': shared,
  };
  const afterTakeB = resolveSceneLiveMedia(scene('scene-b', 'source-b'), streams);
  const sharedProgram = resolveSceneLiveMedia(scene('scene-shared-program', 'source-shared'), streams);
  const sharedPreview = resolveSceneLiveMedia(scene('scene-shared-preview', 'source-shared'), streams);

  assert.equal(afterTakeB.sourceId, 'source-b');
  assert.equal(afterTakeB.stream?.id, 'stream-b');
  assert.equal(sharedProgram.stream, shared);
  assert.equal(sharedPreview.stream, shared);
  assert.equal(sharedProgram.active, true);
  assert.equal(sharedPreview.active, true);
});

test('recording capture evidence follows authoritative Program after transitions', () => {
  const streams = {
    'source-a': stream('stream-a'),
    'source-b': stream('stream-b'),
    'source-c': stream('stream-c'),
  };
  const afterCutC = createSceneRoutingEvidence({
    program: resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams),
    preview: resolveSceneLiveMedia(scene('scene-c', 'source-c'), streams),
  });
  const afterTakeB = createSceneRoutingEvidence({
    program: resolveSceneLiveMedia(scene('scene-b', 'source-b'), streams),
    preview: resolveSceneLiveMedia(scene('scene-b', 'source-b'), streams),
  });

  assert.equal(afterCutC.programSceneId, 'scene-c');
  assert.equal(afterCutC.programStreamId, 'stream-c');
  assert.equal(afterTakeB.programSceneId, 'scene-b');
  assert.equal(afterTakeB.programStreamId, 'stream-b');
});
