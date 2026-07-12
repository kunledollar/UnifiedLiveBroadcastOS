import { SyntheticFrameMemoryManager } from './frame-memory.js';
import {
  createColorCorrectionEngine,
  createSyntheticColorCorrectionBackend,
  COLOR_CORRECTION_OPERATION_ORDER,
  type ColorCorrectionPreset,
} from './color-correction.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';

const assert = (c: unknown, m: string) => {
  if (!c) throw new Error(m);
};
const now = (() => {
  let n = 1_000_000n;
  return () => (n += 1_000n);
})();
const engine = createColorCorrectionEngine({
  nowNs: now,
  maxPlanCacheEntries: 4,
  maxPresetStackDepth: 2,
});
engine.registerBackend(createSyntheticColorCorrectionBackend({ backendId: 'b' }));
assert(engine.getSnapshot().backends.length === 1, 'backend registered');
try {
  engine.registerBackend(createSyntheticColorCorrectionBackend({ backendId: 'b' }));
  assert(false, 'duplicate backend rejected');
} catch {}
const preset: ColorCorrectionPreset = {
  presetId: 'bright',
  displayName: 'Bright',
  version: 1,
  parameters: { brightness: 0.1 },
  workingSpace: 'LINEAR_RGB',
  createdAtNs: now(),
  updatedAtNs: now(),
  metadata: { privatePath: '/secret/lut.cube' },
};
engine.registerPreset(preset);
assert(engine.getPreset('bright')?.metadata.privatePath === '[REDACTED]', 'preset redacted');
try {
  engine.registerPreset(preset);
  assert(false, 'duplicate preset rejected');
} catch {}
const planA = engine.plan({
  requestId: 'p1',
  inputFormat: 'RGBA8',
  parameters: { brightness: 0.2 },
  parameterPolicy: 'REJECT_OUT_OF_RANGE',
  qualityTier: 'BALANCED',
});
const planB = engine.plan({
  requestId: 'p2',
  inputFormat: 'RGBA8',
  parameters: { brightness: 0.2 },
  parameterPolicy: 'REJECT_OUT_OF_RANGE',
  qualityTier: 'BALANCED',
});
assert(planA.ok && planB.ok && planB.cacheHit, 'plan cache hit');
assert(
  planA.plan?.operationOrder.join('|') === COLOR_CORRECTION_OPERATION_ORDER.join('|'),
  'operation order',
);
assert(
  !engine.plan({
    requestId: 'bad',
    inputFormat: 'RGBA8',
    parameters: { gamma: 0 },
    parameterPolicy: 'REJECT_OUT_OF_RANGE',
  }).ok,
  'invalid gamma rejected',
);
assert(
  !engine.plan({
    requestId: 'nan',
    inputFormat: 'RGBA8',
    parameters: { brightness: Number.NaN },
    parameterPolicy: 'REJECT_OUT_OF_RANGE',
  }).ok,
  'NaN rejected',
);
assert(
  !engine.plan({
    requestId: 'bw',
    inputFormat: 'RGBA8',
    parameters: { blackLevel: 0.8, whiteLevel: 0.2 },
    parameterPolicy: 'REJECT_OUT_OF_RANGE',
  }).ok,
  'black white rejected',
);
assert(
  engine
    .plan({
      requestId: 'clamp',
      inputFormat: 'RGBA8',
      parameters: { brightness: 2 },
      parameterPolicy: 'WARN_AND_CLAMP',
    })
    .validation.clampedParameterNames.includes('brightness'),
  'explicit clamp observable',
);
const fm = new SyntheticFrameMemoryManager(now);
const lease = await fm.allocate({
  width: 16,
  height: 16,
  format: 'RGBA8',
  memoryDomain: 'SYNTHETIC',
  ownerId: 'TEST',
  usageFlags: ['PROCESSING_INPUT'],
  metadata: { sourceId: 's', streamId: 'v' },
});
const frame = fm.getFrame(lease.frameId)!;
const ref: VideoPipelineFrameReference = {
  frameId: lease.frameId,
  storageId: frame.descriptor.storageId,
  frameGeneration: lease.generation,
  storageGeneration: BigInt(frame.descriptor.storageGeneration),
  leaseId: lease.leaseId,
  ownerId: 'TEST',
  sourceId: 's',
  streamId: 'v',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: { format: 'RGBA8', width: 16, height: 16 },
  memoryDomain: 'OPAQUE',
  state: 'LEASED',
  sourceTimestampNs: 11n,
  normalizedTimestampNs: 22n,
  discontinuity: false,
  metadata: {},
};
const pass = await engine.correct(
  {
    requestId: 'c-pass',
    sourceId: 's',
    streamId: 'v',
    inputFrame: ref,
    inputLease: lease,
    expectedFrameGeneration: ref.frameGeneration,
    expectedStorageGeneration: ref.storageGeneration,
    inputFormat: 'RGBA8',
    parameters: {},
    parameterPolicy: 'REJECT_OUT_OF_RANGE',
    correctionIntent: 'OPERATOR_ADJUSTMENT',
  },
  { frameMemory: fm, nowNs: now },
);
assert(
  pass.status === 'PASSED_THROUGH' && pass.outputFrame?.frameId === ref.frameId,
  'pass-through preserves identity',
);
const corr = await engine.correct(
  {
    requestId: 'c-corr',
    sourceId: 's',
    streamId: 'v',
    inputFrame: ref,
    inputLease: lease,
    expectedFrameGeneration: ref.frameGeneration,
    expectedStorageGeneration: ref.storageGeneration,
    inputFormat: 'RGBA8',
    parameters: { contrast: 1.2 },
    parameterPolicy: 'REJECT_OUT_OF_RANGE',
    correctionIntent: 'OPERATOR_ADJUSTMENT',
  },
  { frameMemory: fm, nowNs: now },
);
assert(
  corr.status === 'COMPLETED' &&
    corr.outputFrame?.frameId !== ref.frameId &&
    corr.outputFrame?.sourceTimestampNs === ref.sourceTimestampNs,
  'correction creates new frame and preserves timestamp',
);
await engine.shutdown();
await engine.shutdown();
console.log('UBOS v5.3.6 color correction validation passed');
