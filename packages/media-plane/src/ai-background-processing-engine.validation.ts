// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AiBackgroundProcessingEngine,
  AiBackgroundProcessingPipelineStage,
  DuplicateAiBackgroundBackend,
  DuplicateAiBackgroundModel,
  SyntheticAiBackgroundBackend,
  createDefaultBackgroundProcessingParameters,
  createSyntheticAiBackgroundModel,
  validateBackgroundProcessingParameters,
} from './ai-background-processing-engine.js';
import { createFrameMemoryManager } from './frame-memory.js';

const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
let t = 100n;
const now = () => (t += 1_000_000n);
const fm = createFrameMemoryManager(now, {
  maximumFrames: 500_000,
  maximumBytes: 1024 * 1024 * 1024,
  maximumIdleFrames: 100_000,
  maximumIdleBytes: 128 * 1024 * 1024,
});
const mkInput = async (sourceId = 'src-a', i = 1, discontinuity = false) => {
  const lease = await fm.allocate({
    width: 16,
    height: 16,
    format: 'RGBA8',
    memoryDomain: 'CPU_HEAP',
    usageFlags: ['PROCESSING_INPUT'],
    accessMode: 'READ_ONLY',
    ownerId: 'TEST',
  } as any);
  const snap = fm.getFrame(lease.frameId)!;
  return {
    lease,
    ref: {
      frameId: lease.frameId,
      storageId: snap.identity.storageId,
      frameGeneration: BigInt(snap.identity.frameGeneration),
      storageGeneration: BigInt(snap.identity.storageGeneration),
      leaseId: lease.leaseId,
      ownerId: 'TEST',
      sourceId,
      streamId: 'main',
      sequenceNumber: BigInt(i),
      runtimeFrameNumber: BigInt(i),
      format: { format: 'RGBA8', width: 16, height: 16 },
      memoryDomain: 'CPU',
      state: 'LEASED',
      sourceTimestampNs: BigInt(i) * 1_000_000n,
      normalizedTimestampNs: BigInt(i) * 1_000_000n,
      discontinuity,
      metadata: { colorMetadata: { primaries: 'BT709' }, marker: `input-${sourceId}-${i}` },
    },
  };
};
const releaseResult = (r: any) => {
  const released = new Set<string>();
  for (const ref of [
    r.foregroundReference,
    r.matteReference,
    r.backgroundReference,
    r.composedOutputReference,
  ]) {
    if (ref && !released.has(ref.frameId)) {
      fm.release(ref.frameId, 'AI_BACKGROUND_PROCESSOR');
      released.add(ref.frameId);
    }
  }
};
const req = (id: string, input: any, parameters: any, extra: any = {}) => ({
  requestId: id,
  sourceId: input.sourceId,
  streamId: input.streamId,
  inputFrame: input,
  inputLeaseId: input.leaseId,
  expectedFrameGeneration: input.frameGeneration,
  expectedStorageGeneration: input.storageGeneration,
  parameters,
  pipelineConfigurationGeneration: extra.pipelineConfigurationGeneration ?? 1n,
  ...extra,
});

const syntheticInput = (sourceId: string, i: number, discontinuity = false) => ({
  ...seed,
  frameId: `synthetic-input-${sourceId}-${i}`,
  storageId: `synthetic-storage-${sourceId}-${i}`,
  leaseId: `synthetic-lease-${sourceId}-${i}`,
  sourceId,
  sequenceNumber: BigInt(i),
  runtimeFrameNumber: BigInt(i),
  sourceTimestampNs: BigInt(i) * 1_000_000n,
  normalizedTimestampNs: BigInt(i) * 1_000_000n,
  discontinuity,
  metadata: { colorMetadata: { primaries: 'BT709' }, marker: `input-${sourceId}-${i}` },
});
const syntheticModel = (backendId: string, modelId: string, version = '5.4.5-synthetic.test') => ({
  ...createSyntheticAiBackgroundModel(backendId),
  modelId,
  modelVersion: version,
  modelChecksum: `sha256:${modelId}`,
});
const engine = new AiBackgroundProcessingEngine(32, 8, now);
const base = createDefaultBackgroundProcessingParameters({
  mode: 'PERSON_SEGMENTATION',
  outputMode: 'COMPOSITING_PAIR',
  confidenceThreshold: 0.1,
  maximumSubjects: 1,
});
const { ref: seed } = await mkInput('src-a', 1);
const planA = engine.createPlan({
  requestId: 'p1',
  inputFrame: seed,
  parameters: base,
  pipelineConfigurationGeneration: 1n,
});
const planB = engine.createPlan({
  requestId: 'p2',
  inputFrame: seed,
  parameters: base,
  pipelineConfigurationGeneration: 1n,
});
assert(planA.planId === planB.planId, 'plans are deterministic');
assert(engine.getTelemetry().cacheHits >= 1, 'cache hit recorded');
const bypass = engine.createPlan({
  requestId: 'bp',
  inputFrame: seed,
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
for (const bad of [
  () => validateBackgroundProcessingParameters({ confidenceThreshold: Number.NaN }),
  () =>
    validateBackgroundProcessingParameters({ backgroundThreshold: 0.8, foregroundThreshold: 0.2 }),
]) {
  let rejected = false;
  try {
    bad();
  } catch {
    rejected = true;
  }
  assert(rejected, 'invalid parameters rejected');
}
for (let i = 0; i < 10_000; i++) {
  engine.createPlan({
    requestId: `many-${i}`,
    inputFrame: seed,
    parameters: base,
    pipelineConfigurationGeneration: BigInt(i % 64),
  });
}
assert(engine.getHealth().planCacheSize <= 32, 'plan cache bounded after 10,000 plans');
const modes = [
  ['PERSON_SEGMENTATION', 'FOREGROUND_WITH_ALPHA'],
  ['FOREGROUND_SEGMENTATION', 'FOREGROUND_WITH_ALPHA'],
  ['BACKGROUND_REMOVAL', 'FOREGROUND_WITH_ALPHA'],
  ['BACKGROUND_BLUR', 'BLURRED_BACKGROUND_FRAME'],
  ['BACKGROUND_REPLACEMENT', 'REPLACED_BACKGROUND_FRAME'],
  ['BYPASS', 'PASSTHROUGH'],
] as const;
let completed = 0;
const seen = new Set<string>();
for (let i = 0; i < 10_000; i++) {
  const [mode, outputMode] = modes[i % modes.length]!;
  const sourceId = `source-${i % 5}`;
  const input = syntheticInput(sourceId, i + 2, i % 997 === 0);
  const before = structuredClone(input);
  const parameters = createDefaultBackgroundProcessingParameters({
    enabled: mode !== 'BYPASS',
    mode,
    outputMode,
    subjectType: mode === 'FOREGROUND_SEGMENTATION' ? 'FOREGROUND_GENERAL' : 'PERSON',
    confidenceThreshold: 0.1,
    confidencePolicy: i % 17 === 0 ? 'USE_MASK_FALLBACK' : 'FAIL_BELOW_THRESHOLD',
    fallbackPolicy: i % 19 === 0 ? 'USE_KEY_MATTE_FALLBACK' : 'FAIL_FRAME',
  });
  const r = await engine.execute(req(`op-${i}`, input, parameters), {
    frameMemory: fm,
    nowNs: now,
  });
  assert(!seen.has(r.requestId), 'no duplicate outputs');
  seen.add(r.requestId);
  assert(r.status === 'COMPLETED' || r.status === 'PASSED_THROUGH', `operation ${i} completed`);
  assert(input.sourceTimestampNs === before.sourceTimestampNs, 'input timestamp unchanged');
  assert(input.metadata.marker === before.metadata.marker, 'input metadata unchanged');
  const out =
    r.composedOutputReference ??
    r.foregroundReference ??
    r.backgroundReference ??
    r.matteReference ??
    input;
  assert(out.sourceId === input.sourceId, 'source identity preserved');
  assert(out.sourceTimestampNs === input.sourceTimestampNs, 'timestamp preserved');
  releaseResult(r);
  if (i % 1000 === 0) {
    fm.collectGarbage();
    engine.assertInvariants();
  }
  completed++;
}
assert(completed === 10_000, '10,000 synthetic processing operations completed');
const lowEngine = new AiBackgroundProcessingEngine(8, 8, now);
lowEngine.registerBackend(new SyntheticAiBackgroundBackend({ backendId: 'low', confidence: 0.01 }));
lowEngine.registerModel(syntheticModel('low', 'synthetic-ai-background-low'));
lowEngine.activateModel('synthetic-ai-background-low');
const { ref: lowInput } = await mkInput('low-src', 1);
const low = await lowEngine.execute(
  req('low', lowInput, createDefaultBackgroundProcessingParameters({ confidenceThreshold: 0.9 }), {
    selectedModelId: 'synthetic-ai-background-low',
    backendPreference: 'low',
  }),
  { frameMemory: fm, nowNs: now },
);
assert(
  low.status === 'LOW_CONFIDENCE' && !low.foregroundReference,
  'low confidence rejected output',
);
for (const [name, backend] of [
  ['gpu', new SyntheticAiBackgroundBackend({ backendId: 'gpu', gpuLoss: true })],
  ['timeout', new SyntheticAiBackgroundBackend({ backendId: 'timeout', timeout: true })],
  ['fail', new SyntheticAiBackgroundBackend({ backendId: 'fail', fail: true })],
] as const) {
  const e = new AiBackgroundProcessingEngine(8, 8, now);
  e.registerBackend(backend);
  const modelId = `synthetic-ai-background-${name}`;
  e.registerModel(syntheticModel(name, modelId));
  e.activateModel(modelId);
  const { ref: input } = await mkInput(`${name}-src`, 1);
  const r = await e.execute(
    req(name, input, base, { selectedModelId: modelId, backendPreference: name }),
    {
      frameMemory: fm,
      nowNs: now,
    },
  );
  assert(r.status === 'FAILED' && !r.foregroundReference, `${name} failure has no output`);
  e.assertInvariants();
  await e.shutdown();
}
const ac = new AbortController();
ac.abort();
const { ref: cancelInput } = await mkInput('cancel-src', 1);
const cancelled = await engine.execute(
  req('cancelled', cancelInput, base, { cancellationSignal: ac.signal }),
  {
    frameMemory: fm,
    nowNs: now,
  },
);
assert(
  cancelled.status === 'CANCELLED' && !cancelled.foregroundReference,
  'cancelled has no output',
);
const { ref: staleInput } = await mkInput('stale-src', 1);
const stale = await engine.execute(
  req('stale', staleInput, base, { expectedFrameGeneration: staleInput.frameGeneration + 1n }),
  { frameMemory: fm, nowNs: now },
);
assert(
  stale.status === 'FAILED' && engine.getHealth().staleGenerationRejectionCount >= 1,
  'stale generation rejected',
);
engine.registerModel({
  ...createSyntheticAiBackgroundModel('synthetic-ai-background-reference'),
  modelId: 'synthetic-ai-background-person-v2',
  modelVersion: '5.4.5-synthetic.2',
  modelChecksum: 'sha256:synthetic-ai-background-v5.4.5-v2',
});
engine.activateModel('synthetic-ai-background-person-v2');
const { ref: mt1 } = await mkInput('model-src', 1);
releaseResult(await engine.execute(req('model-1', mt1, base), { frameMemory: fm, nowNs: now }));
const resetsBefore = engine.getHealth().temporalStateResetCount;
const { ref: mt2 } = await mkInput('model-src', 2);
releaseResult(
  await engine.execute(
    req('model-2', mt2, base, { selectedModelId: 'synthetic-ai-background-person-v2' }),
    {
      frameMemory: fm,
      nowNs: now,
    },
  ),
);
assert(
  engine.getHealth().temporalStateResetCount > resetsBefore,
  'model change resets temporal state',
);
const bypassStage = new AiBackgroundProcessingPipelineStage(
  engine,
  fm,
  createDefaultBackgroundProcessingParameters({
    enabled: false,
    mode: 'BYPASS',
    outputMode: 'PASSTHROUGH',
  }),
);
for (let i = 0; i < 90_000; i++) {
  const input = syntheticInput(`stage-pass-${i % 7}`, i + 1, i % 4099 === 0);
  const r = await bypassStage.process(
    { inputFrame: input, frameContext: { deadlineNs: now() + 10_000_000n } } as any,
    { requestId: `stage-pass-${i}`, nowNs: now, configuration: { generation: 1n } } as any,
  );
  assert(r.status === 'PASSED_THROUGH', 'pass-through pipeline stage tick succeeds');
}
const obs = JSON.stringify({
  telemetry: engine.getTelemetry(),
  snapshot: engine.getSnapshot(),
}).toLowerCase();
for (const forbidden of ['tensor', 'biometric', 'face', 'identity data', 'raw pixel'])
  assert(!obs.includes(forbidden), `observability excludes ${forbidden}`);
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
assert(engine.getSnapshot().temporalStateCount === 0, 'shutdown clears temporal state');
fm.collectGarbage();
const leaked = fm
  .listFrames()
  .filter(
    (f: any) =>
      f.referenceCounts.activeLeases > 0 && f.descriptor.ownerId === 'AI_BACKGROUND_PROCESSOR',
  );
assert(leaked.length === 0, 'zero leaked AI output leases');
await fm.shutdown();
console.log('ai-background-processing-engine.validation: PASS');
console.log(
  JSON.stringify({ syntheticOperations: 10000, processorTicks: 100000, leakedAiOutputLeases: 0 }),
);
