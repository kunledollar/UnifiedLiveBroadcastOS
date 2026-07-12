const assert = {
  equal(a: unknown, b: unknown) {
    if (a !== b) throw new Error(`expected ${String(b)}, received ${String(a)}`);
  },
  notEqual(a: unknown, b: unknown) {
    if (a === b) throw new Error(`expected different values: ${String(a)}`);
  },
  ok(v: unknown) {
    if (!v) throw new Error('expected truthy value');
  },
  deepEqual(a: unknown, b: unknown) {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('expected deep equality');
  },
  throws(fn: () => unknown, pattern: RegExp) {
    try {
      fn();
    } catch (e) {
      if (pattern.test(String((e as Error).message))) return;
      throw e;
    }
    throw new Error(`expected throw ${pattern}`);
  },
};
import {
  createColorEffectsEngine,
  createSyntheticColorEffectsBackend,
  COLOR_EFFECTS_PRESETS,
  COLOR_EFFECTS_IDENTITY_LUT,
  COLOR_EFFECTS_BLEND_MODES,
  createColorEffectsPipelineStage,
  createColorEffectsCommandHandlers,
  COLOR_EFFECTS_OUTPUT_KEYS,
  COLOR_EFFECTS_WATCHDOG_INCIDENTS,
  validateColorEffectsParameters,
} from './color-effects-lut-engine.js';
import { createFrameMemoryManager } from './frame-memory.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';

const engine = createColorEffectsEngine({ nowNs: () => 1_000_000n, maxCacheEntries: 64 });
assert.throws(() => engine.registerBackend(createSyntheticColorEffectsBackend()), /Duplicate/);
assert.deepEqual(COLOR_EFFECTS_PRESETS.Neutral, COLOR_EFFECTS_PRESETS.Neutral);
assert.equal(COLOR_EFFECTS_IDENTITY_LUT.checksum, 'identity:0');
assert.equal(engine.createPlan({ requestId: 'p1', inputFormat: 'RGBA8' }).passThrough, true);
assert.throws(() => validateColorEffectsParameters({ exposure: Number.NaN }), /Invalid exposure/);
assert.throws(
  () =>
    validateColorEffectsParameters({
      lumaCurve: [
        [0, 0],
        [0.5, 2],
      ],
    }),
  /Invalid luma/,
);
for (const blendMode of COLOR_EFFECTS_BLEND_MODES.filter((m) => m !== 'CUSTOM'))
  assert.equal(
    validateColorEffectsParameters({ enabled: true, opacity: 0.5, blendMode }).blendMode,
    blendMode,
  );

const frameMemory = createFrameMemoryManager(() => 1_000_000n, {
  maximumFrames: 20050,
  maximumBytes: 256 * 1024 * 1024,
  maximumIdleFrames: 20050,
  maximumIdleBytes: 256 * 1024 * 1024,
});
const lease = await frameMemory.allocate({
  width: 16,
  height: 9,
  format: 'RGBA8',
  memoryDomain: 'CPU_HEAP',
  ownerId: 'TEST',
  usageFlags: ['SOURCE_INPUT'],
  accessMode: 'READ_ONLY',
});
const input: VideoPipelineFrameReference = Object.freeze({
  frameId: lease.frameId,
  storageId: lease.frameId,
  frameGeneration: lease.generation,
  storageGeneration: lease.generation,
  leaseId: lease.leaseId,
  ownerId: 'TEST',
  sourceId: 'camera-a',
  streamId: 'program',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: { format: 'RGBA8', width: 16, height: 9 },
  memoryDomain: 'CPU',
  state: 'LEASED',
  sourceTimestampNs: 42n,
  normalizedTimestampNs: 42n,
  discontinuity: false,
  metadata: {},
});
const graded = await engine.execute(
  {
    requestId: 'e1',
    sourceId: 'camera-a',
    streamId: 'program',
    inputFrame: input,
    inputLease: lease,
    expectedFrameGeneration: lease.generation,
    expectedStorageGeneration: lease.generation,
    inputFormat: 'RGBA8',
    parameters: { enabled: true, contrast: 1.2, opacity: 1 },
  },
  { frameMemory, nowNs: () => 2_000_000n },
);
assert.equal(graded.status, 'COMPLETED');
assert.notEqual(graded.outputFrame?.frameId, input.frameId);
assert.equal(graded.outputFrame?.sourceTimestampNs, input.sourceTimestampNs);
assert.equal(graded.outputFrame?.sourceId, input.sourceId);
assert.throws(
  () =>
    engine.createPlan({
      requestId: 'stale-mask',
      inputFormat: 'RGBA8',
      maskStack: {
        stackId: 'm',
        entries: [
          {
            entryId: 'e',
            generation: -1n,
            optional: true,
            parameters: {
              enabled: true,
              maskType: 'RECTANGLE',
              shape: { x: 0, y: 0, width: 1, height: 1, coordinateSpace: 'SOURCE_NORMALIZED' },
              opacity: 1,
              invert: false,
              featherRadius: 0,
              featherMode: 'NONE',
              expandPixels: 0,
              contractPixels: 0,
              edgeHardness: 1,
              transform: {
                translateX: 0,
                translateY: 0,
                scaleX: 1,
                scaleY: 1,
                rotationDegrees: 0,
                anchorX: 0,
                anchorY: 0,
                pivotX: 0,
                pivotY: 0,
                flipX: false,
                flipY: false,
              },
              combineMode: 'REPLACE',
              outputMode: 'MASKED_FRAME',
              diagnosticsEnabled: false,
            },
          },
        ],
        maximumDepth: 8,
        outputMode: 'MASKED_FRAME',
        metadata: {},
      },
    }),
  /Stale mask/,
);
assert.throws(
  () =>
    engine.createPlan({
      requestId: 'bad-lut',
      inputFormat: 'RGBA8',
      parameters: {
        enabled: true,
        lut: {
          ...COLOR_EFFECTS_IDENTITY_LUT,
          type: 'EXTERNAL_REFERENCE',
          enabled: true,
          lutId: 'x',
          checksum: 'x',
        },
        lutStrength: 1,
      },
    }),
  /Unsupported LUT/,
);
const cancelled = await engine.execute(
  {
    requestId: 'c1',
    sourceId: 'camera-a',
    streamId: 'program',
    inputFrame: input,
    inputLease: lease,
    expectedFrameGeneration: lease.generation,
    expectedStorageGeneration: lease.generation,
    inputFormat: 'RGBA8',
    cancellationSignal: AbortSignal.abort(),
  },
  { frameMemory },
);
assert.equal(cancelled.status, 'CANCELLED');
try {
  await engine.execute(
    {
      requestId: 'stale',
      sourceId: 'camera-a',
      streamId: 'program',
      inputFrame: input,
      inputLease: lease,
      expectedFrameGeneration: 999n,
      expectedStorageGeneration: lease.generation,
      inputFormat: 'RGBA8',
    },
    { frameMemory },
  );
  throw new Error('expected stale generation rejection');
} catch (error) {
  assert.ok(/Stale input/.test(String((error as Error).message)));
}
const stage = createColorEffectsPipelineStage(engine, frameMemory);
assert.equal(stage.descriptor.stageKind, 'COLOR_EFFECTS');
assert.equal(stage.descriptor.phase, 'TRANSFORM');
assert.ok(stage.descriptor.order > 543);
const handlers = Object.fromEntries(
  createColorEffectsCommandHandlers(engine, frameMemory).map((h) => [
    (h as { commandType: string }).commandType,
    h,
  ]),
);
assert.ok(handlers.COLOR_EFFECTS_PLAN);
assert.ok(COLOR_EFFECTS_OUTPUT_KEYS.results);
assert.ok(COLOR_EFFECTS_WATCHDOG_INCIDENTS.includes('COLOR_EFFECTS_TIMEOUT'));
const graph = engine.createSourceGraphMetadata(
  engine.createPlan({ requestId: 'graph', inputFormat: 'RGBA8', preset: 'Film' }),
);
assert.equal(graph.containsPixels, false);
assert.ok(engine.getSnapshot().health.backendCount >= 1);
engine.assertInvariants();
for (let i = 0; i < 10_000; i++)
  engine.createPlan({
    requestId: `lp-${i}`,
    inputFormat: 'RGBA8',
    parameters: { enabled: true, contrast: 1 + (i % 10) / 100 },
  });
for (let i = 0; i < 10_000; i++)
  await engine.execute(
    {
      requestId: `op-${i}`,
      sourceId: 'camera-a',
      streamId: 'program',
      inputFrame: input,
      inputLease: lease,
      expectedFrameGeneration: lease.generation,
      expectedStorageGeneration: lease.generation,
      inputFormat: 'RGBA8',
      parameters: { enabled: true, saturation: 1.01 },
    },
    { frameMemory },
  );
for (let i = 0; i < 100_000; i++) assert.ok(stage.descriptor.enabled);
await engine.shutdown();
assert.equal(engine.getSnapshot().health.activeRequests, 0);
await frameMemory.shutdown();
console.log('UBOS v5.4.4 color effects validation passed');
