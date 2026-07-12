// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFrameMemoryManager } from './frame-memory.js';
import {
  createBlurSharpenEngine,
  defaultBlurSharpenParameters,
  SyntheticBlurSharpenBackend,
  validateBlurSharpenParameters,
  createBlurSharpenSourceGraphMetadata,
  createBlurSharpenPipelineStage,
} from './blur-sharpen-engine.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';
const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const fm = createFrameMemoryManager(undefined, {
  maximumFrames: 50000,
  maximumBytes: 1024 * 1024 * 256,
  maximumIdleFrames: 1000,
  maximumIdleBytes: 1024 * 1024 * 16,
});
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
const input: VideoPipelineFrameReference = {
  frameId: lease.frameId,
  storageId: snap.identity.storageId,
  frameGeneration: BigInt(snap.identity.frameGeneration),
  storageGeneration: BigInt(snap.identity.storageGeneration),
  leaseId: lease.leaseId,
  ownerId: 'TEST',
  sourceId: 'source-a',
  streamId: 'stream-a',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: { pixelFormat: 'RGBA8', width: 16, height: 16 },
  memoryDomain: 'CPU',
  state: 'READY',
  sourceTimestampNs: 10n,
  normalizedTimestampNs: 10n,
  discontinuity: false,
  metadata: { alphaMode: 'STRAIGHT', colorMetadata: { primaries: 'BT709' } },
};
const p = (over: any = {}) => ({ ...defaultBlurSharpenParameters(), ...over });
const req = (id: string, params = p()) =>
  ({
    requestId: id,
    sourceId: 'source-a',
    streamId: 'stream-a',
    inputFrame: input,
    inputLease: lease,
    expectedFrameGeneration: input.frameGeneration,
    expectedStorageGeneration: input.storageGeneration,
    parameters: params,
    qualityTier: params.qualityTier ?? 'BALANCED',
    parameterPolicy: 'REJECT_OUT_OF_RANGE',
    pipelineConfigurationGeneration: '1',
  }) as any;
const engine = createBlurSharpenEngine(fm, 64);
assert(engine.getSnapshot().backends.length === 1, 'engine/backend lifecycle');
let bad = false;
try {
  engine.registerBackend(new SyntheticBlurSharpenBackend());
} catch {
  bad = true;
}
assert(bad, 'duplicate backend rejection');
const pa = engine.createPlan(req('plan-a'));
const pb = engine.createPlan(req('plan-b'));
assert(pa.planId === pb.planId, 'plan deterministic independent of request id');
const e2 = createBlurSharpenEngine(fm, 64);
e2.unregisterBackend('synthetic-blur-sharpen');
e2.registerBackend(new SyntheticBlurSharpenBackend());
assert(e2.createPlan(req('perm')).planId === pa.planId, 'backend registration-order stable');
const pass = await engine.execute(req('pass', p({ enabled: false, mode: 'BYPASS' })));
assert(
  pass.status === 'PASSED_THROUGH' && pass.outputFrame.frameId === input.frameId,
  'bypass/pass-through preserves identity',
);
for (const mode of [
  'GAUSSIAN_BLUR',
  'BOX_BLUR',
  'DIRECTIONAL_BLUR',
  'BACKGROUND_BLUR',
  'SHARPEN',
  'UNSHARP_MASK',
  'EDGE_ENHANCE',
] as const) {
  const params = p({
    mode,
    radius: mode === 'SHARPEN' ? 0 : 3,
    strength: mode === 'SHARPEN' ? 1 : 1,
    maskReference:
      mode === 'BACKGROUND_BLUR'
        ? {
            maskId: 'm',
            sourceId: 'source-a',
            streamId: 'stream-a',
            generation: 1n,
            feathered: true,
          }
        : undefined,
    maskGeneration: mode === 'BACKGROUND_BLUR' ? 1n : undefined,
  });
  const r = await engine.execute(req(`exec-${mode}`, params));
  assert(
    r.status === 'COMPLETED' && r.outputFrame.frameId !== input.frameId,
    `${mode} completed distinct identity`,
  );
  assert(
    r.outputFrame.sourceTimestampNs === input.sourceTimestampNs &&
      r.outputFrame.sourceId === input.sourceId,
    `${mode} preserves timestamp/source`,
  );
}
for (const mode of [
  'MOTION_BLUR',
  'RADIAL_BLUR',
  'ZOOM_BLUR',
  'HIGH_PASS_SHARPEN',
  'CUSTOM',
] as const) {
  const plan = engine.createPlan(req(`meta-${mode}`, p({ mode, radius: 2, strength: 1 })));
  assert(plan.warnings.join(' ').includes('metadata-boundary'), 'metadata boundary warned ' + mode);
}
for (const over of [
  { radius: Infinity },
  { radius: -1 },
  { sigma: Infinity },
  { sigma: -1 },
  { strength: 99 },
  { iterationCount: 99 },
  { sampleCount: 9999 },
  { edgeMode: 'BAD' },
  { premultipliedAlphaPolicy: 'BAD' },
]) {
  bad = false;
  try {
    validateBlurSharpenParameters(p(over as any));
  } catch {
    bad = true;
  }
  assert(bad, 'invalid rejected ' + JSON.stringify(over));
}
const clamp = validateBlurSharpenParameters(p({ radius: 999 }), 'WARN_AND_CLAMP');
assert(clamp.warnings.length && clamp.parameters.radius === 256, 'observable clamp');
bad = false;
try {
  engine.createPlan(
    req(
      'stale',
      p({
        mode: 'MASKED_BLUR',
        maskReference: { maskId: 'm', sourceId: 'source-a', generation: 1n },
        maskGeneration: 2n,
      }),
    ),
  );
} catch {
  bad = true;
}
assert(bad, 'stale mask rejected');
const masked = await engine.execute(
  req(
    'masked',
    p({
      mode: 'MASKED_BLUR',
      radius: 4,
      maskReference: {
        maskId: 'm',
        sourceId: 'source-a',
        streamId: 'stream-a',
        generation: 3n,
        opacity: 0.5,
      },
      maskGeneration: 3n,
      invertMask: true,
    }),
  ),
);
assert(
  masked.maskApplied && createBlurSharpenSourceGraphMetadata(masked).maskUsage.generation === '3',
  'mask integration/source graph',
);
const ac = new AbortController();
ac.abort();
const can = await engine.execute(
  req('cancel', p({ mode: 'GAUSSIAN_BLUR' })) as any & { cancellationSignal: AbortSignal },
);
assert(can.status !== 'CANCELLED', 'control');
const can2 = await engine.execute({ ...req('cancel2'), cancellationSignal: ac.signal });
assert(can2.status === 'CANCELLED', 'cancellation');
const late = await createBlurSharpenEngine(fm).execute({ ...req('timeout'), deadlineNs: 0n });
assert(late.status === 'FAILED', 'timeout fails no output');
const stage = createBlurSharpenPipelineStage(engine, p({ mode: 'BOX_BLUR', radius: 2 }));
const sr = await stage.process(
  { inputFrame: input } as any,
  {
    requestId: 'stage',
    nowNs: () => BigInt(Date.now()) * 1000000n,
    configuration: { generation: '1' },
  } as any,
);
assert(sr.output.metadata.filterMode === 'BOX_BLUR', 'pipeline-stage integration');
assert(
  stage.descriptor.metadata.after === 'MASKING' &&
    stage.descriptor.metadata.before.includes('GEOMETRY'),
  'Masking dependency and Geometry ordering',
);
const meta = stage.descriptor.metadata;
assert(meta.before.includes('LAYER_COMPOSITOR'), 'Layer Compositor compatibility');
assert(
  engine.getHealth().backendCount === 1 && engine.getTelemetry().cacheSize <= 64,
  'health/telemetry',
);
assert(Object.isFrozen(engine.getSnapshot()), 'snapshot immutability');
assert(engine.assertInvariants(), 'invariants');
for (let i = 0; i < 10000; i++)
  engine.createPlan(
    req(`many-plan-${i}`, p({ radius: i % 16, mode: i % 2 ? 'GAUSSIAN_BLUR' : 'BOX_BLUR' })),
  );
for (let i = 0; i < 10000; i++) {
  const r = await engine.execute(
    req(
      `many-op-${i}`,
      p({ mode: i % 2 ? 'SHARPEN' : 'BOX_BLUR', radius: i % 2 ? 0 : 1, strength: 1 }),
    ),
  );
  assert(r.status === 'COMPLETED', 'synthetic op ' + i);
}
for (let i = 0; i < 100000; i++) {
  const plan = engine.createPlan(req(`tick-${i}`, p({ enabled: false, mode: 'BYPASS' })));
  assert(plan.passThroughEligible, '100k pipeline tick plan');
}
const multi = await Promise.all([
  engine.execute(req('src-a', p({ mode: 'GAUSSIAN_BLUR', radius: 1 }))),
  engine.execute({
    ...req('src-b', p({ mode: 'SHARPEN', strength: 1 })),
    sourceId: 'source-b',
    streamId: 'stream-b',
    inputFrame: { ...input, sourceId: 'source-b', streamId: 'stream-b' },
  }),
]);
assert(
  new Set(multi.map((r) => r.outputFrame?.frameId)).size === 2,
  'multiple simultaneous sources zero duplicate outputs',
);
engine.assertInvariants();
await engine.shutdown();
assert(engine.assertInvariants(), 'shutdown/idempotency');
bad = false;
try {
  await engine.execute(req('after-shutdown'));
} catch {
  bad = true;
}
assert(!bad, 'shutdown returns failed not throw after shutdown');
console.log('UBOS v5.4.3 blur/sharpen validation PASS');
