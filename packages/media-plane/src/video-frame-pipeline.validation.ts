const assert = (condition: unknown, message = 'assertion failed') => {
  if (!condition) throw new Error(message);
};
assert.equal = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected)
    throw new Error(message ?? `expected ${String(expected)}, got ${String(actual)}`);
};
assert.deepEqual = (actual: unknown, expected: unknown, message?: string) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      message ?? `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
};
import {
  createVideoFramePipeline,
  SyntheticFailingStage,
  SyntheticTemporaryFrameStage,
  type VideoFrameProcessRequest,
  type VideoPipelineFrameReference,
} from './video-frame-pipeline.js';

const tick = {
  frameNumber: 1n,
  startedAtNs: 0n,
  deadlineAtNs: 33_000_000n,
  scheduledTimeNs: 0n,
  actualTimeNs: 0n,
  presentationTimeNs: 0n,
  frameDurationNs: 33_000_000n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
};
const frame: VideoPipelineFrameReference = Object.freeze({
  frameId: 'f1',
  storageId: 's1',
  frameGeneration: 1n,
  storageGeneration: 1n,
  leaseId: 'l1',
  ownerId: 'test',
  sourceId: 'source',
  streamId: 'video',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: Object.freeze({ kind: 'VIDEO', width: 1920, height: 1080, pixelFormat: 'RGBA8' }),
  memoryDomain: 'CPU',
  state: 'READY',
  sourceTimestampNs: 0n,
  normalizedTimestampNs: 0n,
  discontinuity: false,
  metadata: Object.freeze({}),
});
const request = (id = 'r1'): VideoFrameProcessRequest =>
  Object.freeze({
    requestId: id,
    sourceId: 'source',
    streamId: 'video',
    inputFrameId: 'f1',
    inputLeaseId: 'l1',
    inputFrame: frame,
    expectedFrameGeneration: 1n,
    expectedStorageGeneration: 1n,
    runtimeFrameNumber: 1n,
    frameTick: tick,
    targetOutputProfileId: 'default-video-pass-through',
    pipelineConfigurationGeneration: 1n,
    deadlineNs: 33_000_000n,
    metadata: Object.freeze({}),
  });

const pipeline = createVideoFramePipeline();
assert.equal(pipeline.getSnapshot().lifecycleState, 'CREATED');
await pipeline.initialize({
  nowNs: (() => {
    let n = 0n;
    return () => (n += 1_000n);
  })(),
});
assert.equal(pipeline.getSnapshot().lifecycleState, 'READY');
pipeline.start();
assert.equal(pipeline.getSnapshot().lifecycleState, 'RUNNING');
const result = await pipeline.processFrame(request(), {
  nowNs: (() => {
    let n = 0n;
    return () => (n += 1_000n);
  })(),
});
assert.equal(result.status, 'PASSED_THROUGH');
assert.equal(result.outputFrame?.frameId, 'f1');
assert.deepEqual(
  result.stageResults.map((s) => s.stageId),
  ['input-validation', 'format-inspection', 'pass-through', 'output-validation'],
);
assert.equal(
  (await pipeline.processFrame(request('r2'), { nowNs: () => 10_000n })).status,
  'DROPPED',
);
pipeline.assertInvariants();
await pipeline.shutdown();
await pipeline.shutdown();
assert.equal(pipeline.getSnapshot().lifecycleState, 'STOPPED');

const p2 = createVideoFramePipeline([new SyntheticTemporaryFrameStage('tmp')]);
await p2.initialize({
  configuration: { enabledStageIds: ['tmp'] },
  nowNs: (() => {
    let n = 0n;
    return () => (n += 1_000n);
  })(),
});
p2.start();
const r2 = await p2.processFrame(request('tmp'), {
  nowNs: (() => {
    let n = 0n;
    return () => (n += 1_000n);
  })(),
});
assert.equal(r2.status, 'PASSED_THROUGH');
p2.assertInvariants();

const p3 = createVideoFramePipeline([new SyntheticFailingStage('fail')]);
await p3.initialize({ configuration: { enabledStageIds: ['fail'] }, nowNs: () => 0n });
p3.start();
assert.equal((await p3.processFrame(request('fail'), { nowNs: () => 1n })).status, 'FAILED');
console.log('UBOS v5.3.3 video frame pipeline validation passed');
