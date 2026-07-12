// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFrameMemoryManager } from './frame-memory.js';
import {
  createMaskingEngine,
  IDENTITY_MASK_TRANSFORM,
  SyntheticMaskingBackend,
  type MaskingParameters,
  type MaskingRequest,
} from './masking-engine.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';
const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const fm = createFrameMemoryManager(undefined, {
  maximumFrames: 1000,
  maximumBytes: 1024 * 1024 * 64,
  maximumIdleFrames: 100,
  maximumIdleBytes: 1024 * 1024 * 8,
});
const lease = await fm.allocate({
  width: 16,
  height: 16,
  format: 'RGBA8',
  memoryDomain: 'CPU',
  usageFlags: ['PROCESSING_INPUT'],
  accessMode: 'READ_ONLY',
  ownerId: 'TEST',
});
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
  metadata: { alphaMode: 'STRAIGHT' },
};
const base = (over: Partial<MaskingParameters> = {}): MaskingParameters => ({
  enabled: true,
  maskType: 'RECTANGLE',
  shape: { x: 1, y: 1, width: 8, height: 8, coordinateSpace: 'FRAME_PIXELS' },
  invert: false,
  opacity: 1,
  featherRadius: 0,
  featherMode: 'NONE',
  expandPixels: 0,
  contractPixels: 0,
  edgeHardness: 1,
  transform: IDENTITY_MASK_TRANSFORM,
  combineMode: 'REPLACE',
  outputMode: 'MASKED_FRAME',
  diagnosticsEnabled: false,
  ...over,
});
const req = (id: string, p = base()): MaskingRequest => ({
  requestId: id,
  sourceId: 'source-a',
  streamId: 'stream-a',
  inputFrame: input,
  inputLease: lease,
  expectedFrameGeneration: input.frameGeneration,
  expectedStorageGeneration: input.storageGeneration,
  parameters: p,
  outputMode: p.outputMode,
  qualityTier: 'BALANCED',
  parameterPolicy: 'REJECT_OUT_OF_RANGE',
  pipelineConfigurationGeneration: 1n,
});
const engine = createMaskingEngine(fm);
assert(engine.getSnapshot().backends.length === 1, 'engine/backend lifecycle');
let dup = false;
try {
  engine.registerBackend(new SyntheticMaskingBackend());
} catch {
  dup = true;
}
assert(dup, 'duplicate backend rejection');
const p1 = engine.createPlan(req('plan-a'));
const p2 = engine.createPlan(req('plan-b'));
assert(p1.planId !== p2.planId, 'request id participates in plan id for traceability');
const p3 = engine.createPlan(req('plan-a'));
assert(p1.planId === p3.planId, 'plan determinism/cache hit');
const pass = await engine.execute(req('pass', base({ enabled: false, outputMode: 'PASSTHROUGH' })));
assert(
  pass.status === 'PASSED_THROUGH' && pass.maskedOutputReference?.frameId === input.frameId,
  'pass-through preserves identity',
);
const done = await engine.execute(req('rect'));
assert(
  done.status === 'COMPLETED' && done.maskedOutputReference?.frameId !== input.frameId,
  'masked output distinct identity',
);
assert(
  done.maskedOutputReference?.sourceTimestampNs === input.sourceTimestampNs,
  'timestamp preserved',
);
const maskOnly = await engine.execute(req('mask-only', base({ outputMode: 'MASK_ONLY' })));
assert(!!maskOnly.maskOutputReference, 'mask-only output allocated');
for (const mt of [
  'ROUNDED_RECTANGLE',
  'ELLIPSE',
  'CIRCLE',
  'POLYGON',
  'SOURCE_ALPHA',
  'KEY_MATTE',
  'EXTERNAL_MATTE',
  'FULL_FRAME',
] as const) {
  const shape: any =
    mt === 'ROUNDED_RECTANGLE'
      ? {
          rectangle: { x: 0, y: 0, width: 4, height: 4, coordinateSpace: 'FRAME_PIXELS' },
          radiusX: 1,
          radiusY: 1,
        }
      : mt === 'ELLIPSE'
        ? { centerX: 4, centerY: 4, radiusX: 2, radiusY: 3, coordinateSpace: 'FRAME_PIXELS' }
        : mt === 'CIRCLE'
          ? { centerX: 4, centerY: 4, radius: 2, coordinateSpace: 'FRAME_PIXELS' }
          : mt === 'POLYGON'
            ? {
                points: [
                  { x: 0, y: 0 },
                  { x: 4, y: 0 },
                  { x: 4, y: 4 },
                ],
                fillRule: 'EVEN_ODD',
                closed: true,
                coordinateSpace: 'FRAME_PIXELS',
              }
            : { coordinateSpace: 'FRAME_PIXELS' };
  const matte =
    mt === 'KEY_MATTE' || mt === 'EXTERNAL_MATTE'
      ? { matteId: `${mt}-1`, sourceId: 'source-a', generation: 1n }
      : undefined;
  const pl = engine.createPlan(
    req(`type-${mt}`, base({ maskType: mt as any, shape, matteReference: matte as any })),
  );
  assert(pl.operationOrder[0].includes(mt), 'mask type planned ' + mt);
}
let bad = false;
try {
  engine.createPlan(req('bad', base({ opacity: 2 })));
} catch {
  bad = true;
}
assert(bad, 'invalid parameters rejected');
bad = false;
try {
  engine.createPlan(
    req(
      'polybad',
      base({
        maskType: 'POLYGON',
        shape: {
          points: [{ x: 0, y: 0 }],
          fillRule: 'NON_ZERO',
          closed: true,
          coordinateSpace: 'FRAME_PIXELS',
        },
      } as any),
    ),
  );
} catch {
  bad = true;
}
assert(bad, 'empty polygon rejection');
bad = false;
try {
  engine.createPlan(
    req('singular', base({ transform: { ...IDENTITY_MASK_TRANSFORM, scaleX: 0 } })),
  );
} catch {
  bad = true;
}
assert(bad, 'singular transform rejection');
const stack = {
  stackId: 'stack-a',
  maximumDepth: 3,
  outputMode: 'MASKED_FRAME' as const,
  entries: [
    { entryId: 'a', parameters: base({ combineMode: 'REPLACE' }), generation: 1n },
    {
      entryId: 'b',
      parameters: base({
        maskType: 'CIRCLE',
        shape: { centerX: 5, centerY: 5, radius: 2, coordinateSpace: 'FRAME_PIXELS' },
        combineMode: 'INTERSECT',
      }),
      generation: 1n,
    },
  ],
};
const sp = engine.createPlan({ ...req('stack'), maskStack: stack });
assert(sp.operationOrder.map((x) => x[0]).join('') === 'ab', 'stack ordering stable');
bad = false;
try {
  engine.createPlan({ ...req('deep'), maskStack: { ...stack, maximumDepth: 1 } });
} catch {
  bad = true;
}
assert(bad, 'stack depth bound');
const ac = new AbortController();
ac.abort();
const cr = await engine.execute({ ...req('cancel'), cancellationSignal: ac.signal });
assert(cr.status === 'CANCELLED', 'cancellation before planning');
assert(engine.validate().ok, 'invariants');
for (let i = 0; i < 10000; i++) engine.createPlan(req(`many-${i}`));
assert(engine.getSnapshot().health.planCacheSize <= 256, 'bounded cache after 10,000 plans');
for (let i = 0; i < 10000; i++) {
  const pl = engine.createPlan(req(`op-${i}`));
  assert(!!pl.planId, '10,000 synthetic mask operations planned');
}
for (let i = 0; i < 100000; i++) {
  if (i % 1000 === 0) engine.assertInvariants();
}
console.log(
  'UBOS v5.4.2 masking validation passed',
  JSON.stringify(engine.createSourceGraphMaskingMetadata(done)),
);
await engine.shutdown();
await fm.shutdown();
