const assert = {
  equal: (a: unknown, b: unknown) => {
    if (a !== b) throw new Error(`assert equal failed ${String(a)} !== ${String(b)}`);
  },
  notEqual: (a: unknown, b: unknown) => {
    if (a === b) throw new Error('assert notEqual failed');
  },
  ok: (v: unknown) => {
    if (!v) throw new Error('assert ok failed');
  },
  throws: (fn: () => unknown, re: RegExp) => {
    try {
      fn();
    } catch (e) {
      if (re.test(String((e as Error).message)) || re.test(String(e))) return;
      throw e;
    }
    throw new Error('assert throws failed');
  },
};
import { createFrameMemoryManager } from './frame-memory.js';
import {
  ImageEffectsEngine,
  SyntheticImageEffectsBackend,
  createImageEffectsCommandHandlers,
  createImageEffectsSourceGraphMetadata,
  validateImageEffectParameters,
  type ImageEffectParameters,
  type ImageEffectStack,
} from './image-effects-engine.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';
const now = () => 1_000_000n;
const fm = createFrameMemoryManager(now, {
  maximumFrames: 100000,
  maximumBytes: 1_000_000_000,
  maximumIdleFrames: 100000,
  maximumIdleBytes: 1_000_000_000,
});
const lease = await fm.allocate({
  width: 16,
  height: 16,
  format: 'RGBA8',
  memoryDomain: 'SYNTHETIC',
  usageFlags: ['SOURCE_INPUT'],
  accessMode: 'READ_ONLY',
  ownerId: 'test',
});
const ref: VideoPipelineFrameReference = {
  frameId: lease.frameId,
  storageId: lease.frameId,
  frameGeneration: lease.generation,
  storageGeneration: lease.generation,
  leaseId: lease.leaseId,
  ownerId: 'test',
  sourceId: 's',
  streamId: 'v',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: { format: 'RGBA8', alphaMode: 'STRAIGHT' },
  memoryDomain: 'CPU',
  state: 'LEASED',
  sourceTimestampNs: 10n,
  normalizedTimestampNs: 10n,
  discontinuity: false,
  metadata: {},
};
const p = (
  effectType: ImageEffectParameters['effectType'],
  extra: Partial<ImageEffectParameters> = {},
): ImageEffectParameters => ({
  enabled: true,
  effectType,
  alphaPolicy: 'PRESERVE',
  edgePolicy: 'TRANSPARENT',
  outputMode: 'EFFECT_FRAME',
  ...extra,
});
const engine = new ImageEffectsEngine(64, 64, now);
assert.throws(
  () => engine.registerBackend(new SyntheticImageEffectsBackend()),
  /DuplicateImageEffectsBackend/,
);
assert.throws(
  () => validateImageEffectParameters(p('OPACITY', { opacity: 2 })),
  /ImageEffectParameterOutOfRange/,
);
const stack: ImageEffectStack = {
  stackId: 'a',
  maximumDepth: 8,
  executionPolicy: 'SEQUENTIAL',
  outputMode: 'EFFECT_FRAME',
  entries: [
    { entryId: 'op', parameters: p('OPACITY', { opacity: 0.5 }) },
    { entryId: 'bd', parameters: p('BORDER', { thickness: 2 }) },
    { entryId: 'sh', parameters: p('DROP_SHADOW', { softness: 4 }) },
    { entryId: 'ms', parameters: p('PIXELATE', { pixelSize: 4 }) },
  ],
};
const plan1 = engine.plan({
  requestId: 'plan1',
  inputFormat: 'RGBA8',
  inputAlphaMode: 'STRAIGHT',
  effectStack: stack,
  qualityTier: 'BALANCED',
  deviceGeneration: 1n,
  pipelineConfigurationGeneration: 1n,
});
const plan2 = engine.plan({
  requestId: 'plan2',
  inputFormat: 'RGBA8',
  inputAlphaMode: 'STRAIGHT',
  effectStack: stack,
  qualityTier: 'BALANCED',
  deviceGeneration: 1n,
  pipelineConfigurationGeneration: 1n,
});
assert.equal(plan1.planId, plan2.planId);
assert.equal(engine.getTelemetry().cacheHits, 1);
const res = await engine.execute(
  {
    requestId: 'exec1',
    sourceId: 's',
    streamId: 'v',
    inputFrame: ref,
    expectedFrameGeneration: lease.generation,
    expectedStorageGeneration: lease.generation,
    effectStack: stack,
    inputFormat: 'RGBA8',
    inputAlphaMode: 'STRAIGHT',
    qualityTier: 'BALANCED',
    deviceGeneration: 1n,
    pipelineConfigurationGeneration: 1n,
  },
  { frameMemory: fm, nowNs: now },
);
assert.equal(res.status, 'COMPLETED');
assert.ok(res.outputFrame);
assert.notEqual(res.outputFrame!.frameId, ref.frameId);
assert.equal(res.outputFrame!.sourceTimestampNs, ref.sourceTimestampNs);
assert.ok(res.blurDependencyUsed);
const pass = await engine.execute(
  {
    requestId: 'pass1',
    sourceId: 's',
    streamId: 'v',
    inputFrame: ref,
    expectedFrameGeneration: lease.generation,
    expectedStorageGeneration: lease.generation,
    effectStack: {
      stackId: 'empty',
      entries: [],
      maximumDepth: 8,
      executionPolicy: 'SEQUENTIAL',
      outputMode: 'PASSTHROUGH',
    },
    inputFormat: 'RGBA8',
    inputAlphaMode: 'STRAIGHT',
  },
  { frameMemory: fm, nowNs: now },
);
assert.equal(pass.status, 'PASSED_THROUGH');
assert.equal(pass.outputFrame!.frameId, ref.frameId);
const handlers = createImageEffectsCommandHandlers(engine);
assert.ok(handlers.IMAGE_EFFECTS_PLAN);
assert.ok(createImageEffectsSourceGraphMetadata(res).effectCount >= 4);
const health = engine.getHealth();
assert.ok(health.backendCount >= 1);
const snap = engine.getSnapshot();
assert.throws(
  () => ((snap as { planCacheSize: number }).planCacheSize = 999),
  /read only|Cannot assign/,
);
for (let i = 0; i < 10000; i++)
  engine.plan({
    requestId: `bulk-${i}`,
    inputFormat: 'RGBA8',
    parameters: p(i % 2 ? 'BORDER' : 'SCANLINES', { thickness: 1, scanlineSpacing: 2 }),
    pipelineConfigurationGeneration: BigInt(i % 7),
  });
assert.ok(engine.getHealth().planCacheSize <= 64);
for (let i = 0; i < 10000; i++)
  await engine.execute(
    {
      requestId: `op-${i}`,
      sourceId: 's',
      streamId: 'v',
      inputFrame: ref,
      expectedFrameGeneration: lease.generation,
      expectedStorageGeneration: lease.generation,
      parameters: p('BYPASS'),
      inputFormat: 'RGBA8',
    },
    { frameMemory: fm, nowNs: now },
  );
for (let i = 0; i < 100000; i++)
  engine.plan({
    requestId: `tick-${i}`,
    inputFormat: 'RGBA8',
    parameters: p('BYPASS'),
    pipelineConfigurationGeneration: BigInt(i % 3),
  });
engine.assertInvariants();
await engine.shutdown();
console.log('image-effects-engine.validation: PASS');
