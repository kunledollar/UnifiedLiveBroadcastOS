/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AiBackgroundProcessingEngine,
  DuplicateAiBackgroundBackend,
  DuplicateAiBackgroundModel,
  SyntheticAiBackgroundBackend,
  createDefaultBackgroundProcessingParameters,
  createSyntheticAiBackgroundModel,
  validateBackgroundProcessingParameters,
} from './ai-background-processing-engine.js';
const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const frame = (i = 'f') => ({
  frameId: i,
  storageId: `s-${i}`,
  frameGeneration: 1n,
  storageGeneration: 1n,
  leaseId: `l-${i}`,
  ownerId: 'TEST',
  sourceId: 'src',
  streamId: 'main',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: { format: 'RGBA8', width: 16, height: 16 },
  memoryDomain: 'CPU' as const,
  state: 'LEASED' as const,
  sourceTimestampNs: 10n,
  normalizedTimestampNs: 10n,
  discontinuity: false,
  metadata: {},
});
const engine = new AiBackgroundProcessingEngine(8, 8, () => 100n);
const p = createDefaultBackgroundProcessingParameters({
  mode: 'PERSON_SEGMENTATION',
  outputMode: 'COMPOSITING_PAIR',
  maximumSubjects: 1,
});
const planA = engine.createPlan({
  requestId: 'p1',
  inputFrame: frame(),
  parameters: p,
  pipelineConfigurationGeneration: 1n,
});
const planB = engine.createPlan({
  requestId: 'p2',
  inputFrame: frame(),
  parameters: p,
  pipelineConfigurationGeneration: 1n,
});
assert(planA.planId === planB.planId, 'plans are deterministic');
assert(engine.getTelemetry().cacheHits >= 1, 'cache hit recorded');
const bypass = engine.createPlan({
  requestId: 'bp',
  inputFrame: frame(),
  parameters: createDefaultBackgroundProcessingParameters({
    enabled: false,
    mode: 'BYPASS',
    outputMode: 'PASSTHROUGH',
  }),
  pipelineConfigurationGeneration: 1n,
});
assert(bypass.passThroughEligible, 'bypass pass-through eligible');
try {
  engine.registerBackend(new SyntheticAiBackgroundBackend());
  throw new Error('duplicate backend not rejected');
} catch (e) {
  assert(e instanceof DuplicateAiBackgroundBackend, 'duplicate backend type');
}
try {
  engine.registerModel(createSyntheticAiBackgroundModel());
  throw new Error('duplicate model not rejected');
} catch (e) {
  assert(e instanceof DuplicateAiBackgroundModel, 'duplicate model type');
}
try {
  validateBackgroundProcessingParameters({ confidenceThreshold: Number.NaN });
  throw new Error('NaN not rejected');
} catch {
  /* expected */
}
try {
  validateBackgroundProcessingParameters({ backgroundThreshold: 0.8, foregroundThreshold: 0.2 });
  throw new Error('invalid threshold order not rejected');
} catch {
  /* expected */
}
for (let i = 0; i < 10_000; i++)
  engine.createPlan({
    requestId: `many-${i}`,
    inputFrame: frame(String(i % 4)),
    parameters: p,
    pipelineConfigurationGeneration: BigInt(i % 3),
  });
assert(engine.getHealth().planCacheSize <= 8, 'plan cache bounded');
const snap = engine.getSnapshot();
try {
  (snap as any).planCacheSize = 999;
  throw new Error('snapshot mutable');
} catch {
  /* expected */
}
engine.assertInvariants();
await engine.shutdown();
assert(engine.getHealth().engineState === 'SHUTDOWN', 'shutdown state');
console.log('ai-background-processing-engine.validation: PASS');
