const assert = (c: unknown, m = 'assertion failed') => {
  if (!c) throw new Error(m);
};
assert.equal = (a: unknown, e: unknown, m?: string) => {
  if (a !== e) throw new Error(m ?? `expected ${String(e)}, got ${String(a)}`);
};
import {
  createColorConversionEngine,
  createColorMetadata,
  SyntheticColorConversionBackend,
  createSourceGraphColorConversionMetadata,
  COLOR_CONVERSION_OUTPUT_KEYS,
  COLOR_CONVERSION_WATCHDOG_INCIDENTS,
  type ColorMetadata,
} from './color-conversion.js';
import { SyntheticFrameMemoryManager } from './frame-memory.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';
let now = 0n;
const nowNs = () => (now += 1000n);
const sdr = createColorMetadata();
const yuv = createColorMetadata({ matrix: 'BT_709', range: 'LIMITED', alphaMode: 'NONE' });
const hdr = createColorMetadata({
  primaries: 'BT_2020',
  transfer: 'PQ',
  matrix: 'BT_2020_NCL',
  range: 'LIMITED',
  bitDepth: 10,
  alphaMode: 'NONE',
  hdr: true,
});
const frame: VideoPipelineFrameReference = Object.freeze({
  frameId: 'f1',
  storageId: 's1',
  frameGeneration: 1n,
  storageGeneration: 1n,
  leaseId: 'l1',
  ownerId: 'test',
  sourceId: 'src',
  streamId: 'video',
  sequenceNumber: 7n,
  runtimeFrameNumber: 9n,
  format: Object.freeze({ width: 1280, height: 720, pixelFormat: 'BGRA8', colorMetadata: sdr }),
  memoryDomain: 'CPU',
  state: 'READY',
  sourceTimestampNs: 111n,
  normalizedTimestampNs: 222n,
  discontinuity: false,
  metadata: Object.freeze({}),
});
const engine = createColorConversionEngine();
assert.equal(engine.getSnapshot().engineState, 'READY');
assert(engine.getSupportedConversions().length > 100, 'capabilities');
try {
  engine.registerBackend(
    new SyntheticColorConversionBackend({ backendId: 'synthetic-color-reference' }),
  );
  throw new Error('duplicate accepted');
} catch (e) {
  assert(String(e).includes('Duplicate'));
}
engine.registerBackend(new SyntheticColorConversionBackend({ backendId: 'zzz', priority: 200 }));
engine.unregisterBackend('zzz');
const baseReq = {
  requestId: 'p1',
  inputFormat: 'BGRA8' as const,
  outputFormat: 'RGBA8' as const,
  width: 1280,
  height: 720,
  inputColor: sdr,
  outputColor: sdr,
  intent: 'FORMAT_NORMALIZATION' as const,
  qualityTier: 'BALANCED' as const,
  ditherPolicy: 'NONE' as const,
  clippingPolicy: 'CLAMP' as const,
  alphaPolicy: 'PRESERVE' as const,
};
const p1 = engine.plan(baseReq);
const p2 = engine.plan(baseReq);
assert.equal(p1.status, 'PLANNED');
assert.equal(p1.plan?.planId, p2.plan?.planId);
assert(engine.getTelemetry().totalPlanCacheHits >= 1);
const pass = engine.plan({
  ...baseReq,
  requestId: 'pass',
  inputFormat: 'RGBA8',
  outputFormat: 'RGBA8',
});
assert.equal(pass.plan?.passThroughEligible, true);
const fm = new SyntheticFrameMemoryManager(nowNs);
const conv = await engine.convert(
  {
    ...baseReq,
    requestId: 'c1',
    sourceId: 'src',
    streamId: 'video',
    inputFrame: frame,
    expectedFrameGeneration: 1n,
    expectedStorageGeneration: 1n,
    outputMemoryDomain: 'SYNTHETIC',
  },
  { nowNs, frameMemory: fm },
);
assert.equal(conv.status, 'COMPLETED');
assert(conv.outputFrame?.frameId !== frame.frameId);
assert.equal(conv.outputFrame?.sourceTimestampNs, frame.sourceTimestampNs);
assert.equal(conv.outputFrame?.sourceId, 'src');
const nv12 = engine.plan({
  ...baseReq,
  requestId: 'nv12',
  inputFormat: 'NV12',
  outputFormat: 'RGBA8',
  inputColor: yuv,
  outputColor: sdr,
});
assert.equal(nv12.status, 'PLANNED');
const rgb2yuv = engine.plan({
  ...baseReq,
  requestId: 'rgb2yuv',
  inputFormat: 'RGBA8',
  outputFormat: 'NV12',
  inputColor: sdr,
  outputColor: yuv,
  alphaPolicy: 'DISCARD_IF_EXPLICIT',
});
assert.equal(rgb2yuv.status, 'PLANNED');
for (const [inputFormat, outputFormat] of [
  ['P010', 'RGBA16F'],
  ['I420', 'BGRA8'],
  ['YUY2', 'RGBA8'],
  ['UYVY', 'BGRA8'],
] as const)
  assert.equal(
    engine.plan({
      ...baseReq,
      requestId: inputFormat,
      inputFormat,
      outputFormat,
      inputColor: inputFormat === 'P010' ? hdr : yuv,
      outputColor: inputFormat === 'P010' ? createColorMetadata({ ...hdr, bitDepth: 16 }) : sdr,
    }).status,
    'PLANNED',
  );
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: 'range',
    inputColor: createColorMetadata({ range: 'FULL' }),
    outputColor: createColorMetadata({ range: 'LIMITED' }),
  }).plan?.requiresRangeConversion,
  true,
);
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: 'matrix',
    inputFormat: 'NV12',
    outputFormat: 'RGBA8',
    inputColor: createColorMetadata({ matrix: 'BT_601', range: 'LIMITED', alphaMode: 'NONE' }),
    outputColor: createColorMetadata({ matrix: 'IDENTITY' }),
  }).plan?.requiresMatrixConversion,
  true,
);
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: 'srgb-linear',
    inputColor: createColorMetadata({ transfer: 'SRGB' }),
    outputColor: createColorMetadata({ transfer: 'LINEAR' }),
  }).plan?.requiresTransferConversion,
  true,
);
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: 'pq',
    inputFormat: 'P010',
    outputFormat: 'P010',
    inputColor: hdr,
    outputColor: hdr,
  }).status,
  'PLANNED',
);
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: 'hdr-sdr',
    inputFormat: 'P010',
    outputFormat: 'RGBA8',
    inputColor: hdr,
    outputColor: sdr,
  }).status,
  'REJECTED',
);
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: '8-10',
    inputFormat: 'NV12',
    outputFormat: 'P010',
    inputColor: yuv,
    outputColor: createColorMetadata({ ...yuv, bitDepth: 10 }),
  }).status,
  'PLANNED',
);
assert.equal(
  engine.plan({
    ...baseReq,
    requestId: '10-8',
    inputFormat: 'P010',
    outputFormat: 'NV12',
    inputColor: createColorMetadata({ ...yuv, bitDepth: 10 }),
    outputColor: yuv,
    ditherPolicy: 'ORDERED',
  }).status,
  'PLANNED',
);
for (const bad of [
  { primaries: 'UNKNOWN' },
  { transfer: 'UNKNOWN' },
  { range: 'UNKNOWN' },
  { matrix: 'UNKNOWN' },
])
  assert.equal(
    engine.plan({
      ...baseReq,
      requestId: JSON.stringify(bad),
      inputColor: createColorMetadata(bad as Partial<ColorMetadata>),
    }).status,
    'REJECTED',
  );
const sg = createSourceGraphColorConversionMetadata(conv);
assert.equal(sg.currentConvertedFormat, 'RGBA8');
assert(COLOR_CONVERSION_OUTPUT_KEYS.convertedFrameReferences);
assert(COLOR_CONVERSION_WATCHDOG_INCIDENTS.includes('COLOR_CONVERSION_TIMEOUT'));
engine.assertInvariants();
await engine.shutdown();
await engine.shutdown();
assert.equal(engine.getSnapshot().engineState, 'SHUTDOWN');
console.log('UBOS v5.3.5 color conversion validation passed');
