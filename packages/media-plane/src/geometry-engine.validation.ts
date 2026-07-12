const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected)
      throw new Error(`Assertion failed: ${String(actual)} !== ${String(expected)}`);
  },
  notEqual(actual: unknown, expected: unknown) {
    if (actual === expected)
      throw new Error(`Assertion failed: ${String(actual)} === ${String(expected)}`);
  },
  ok(value: unknown) {
    if (!value) throw new Error('Assertion failed: expected truthy value');
  },
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error('Assertion failed: deepEqual');
  },
  throws(fn: () => unknown) {
    let thrown = false;
    try {
      fn();
    } catch {
      thrown = true;
    }
    if (!thrown) throw new Error('Assertion failed: expected throw');
  },
};
import {
  createGeometryCanvasDescriptor,
  createDefaultGeometryTransform,
  createGeometryEngine,
  SyntheticGeometryBackend,
  invertGeometryMatrix,
  createSourceGraphGeometryMetadata,
  GEOMETRY_OUTPUT_KEYS,
  GEOMETRY_WATCHDOG_INCIDENTS,
} from './geometry-engine.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';

const frame: VideoPipelineFrameReference = Object.freeze({
  frameId: 'frame-1',
  storageId: 'storage-1',
  frameGeneration: 1n,
  storageGeneration: 1n,
  leaseId: 'lease-1',
  ownerId: 'test',
  sourceId: 'source-1',
  streamId: 'stream-1',
  sequenceNumber: 1n,
  runtimeFrameNumber: 1n,
  format: { width: 1920, height: 1080, format: 'RGBA8' },
  memoryDomain: 'CPU',
  state: 'READY',
  sourceTimestampNs: 100n,
  normalizedTimestampNs: 100n,
  discontinuity: false,
  metadata: {},
});
const canvas = createGeometryCanvasDescriptor(1920, 1080, 'RGBA8');
const engine = createGeometryEngine({ maxPlanCacheEntries: 4 });
assert.equal(engine.getSnapshot().backends.length, 1);
assert.throws(() =>
  engine.registerBackend(new SyntheticGeometryBackend({ backendId: 'synthetic-geometry' })),
);
engine.registerBackend(new SyntheticGeometryBackend({ backendId: 'synthetic-z' }));
await engine.unregisterBackend('synthetic-z');
const t = createDefaultGeometryTransform();
assert.equal(engine.validateTransform(t).valid, true);
assert.equal(engine.validateTransform(createDefaultGeometryTransform({ scaleX: 0 })).valid, false);
assert.equal(engine.validateTransform(createDefaultGeometryTransform({ scaleY: -1 })).valid, false);
assert.equal(
  engine.validateTransform(createDefaultGeometryTransform({ rotationDegrees: Number.NaN })).valid,
  false,
);
const req = { requestId: 'p1', inputFrame: frame, transform: t, outputCanvas: canvas } as const;
const p1 = engine.plan(req);
assert.equal(p1.status, 'CREATED');
assert.ok(p1.plan);
assert.equal(p1.plan?.passThroughEligible, true);
const p2 = engine.plan(req);
assert.equal(p2.status, 'CACHE_HIT');
assert.deepEqual(p1.plan?.transformMatrix, p2.plan?.transformMatrix);
const crop = engine.plan({
  ...req,
  requestId: 'p2',
  transform: createDefaultGeometryTransform({
    sourceCrop: { x: 0.1, y: 0.1, width: 0.5, height: 0.5, coordinateSpace: 'SOURCE_NORMALIZED' },
  }),
});
assert.equal(crop.status, 'CREATED');
assert.equal(crop.plan?.sourceCrop.width, 960);
assert.equal(
  engine.plan({
    ...req,
    requestId: 'p3',
    transform: createDefaultGeometryTransform({
      sourceCrop: { x: -1, y: 0, width: 10, height: 10, coordinateSpace: 'SOURCE_PIXELS' },
    }),
  }).status,
  'REJECTED',
);
const clamp = engine.plan({
  ...req,
  requestId: 'p4',
  cropPolicy: 'CLAMP_TO_SOURCE',
  transform: createDefaultGeometryTransform({
    sourceCrop: { x: -1, y: 0, width: 10, height: 10, coordinateSpace: 'SOURCE_PIXELS' },
  }),
});
assert.equal(clamp.status, 'CREATED');
assert.equal(clamp.plan?.sourceCrop.x, 0);
const fit = engine.plan({
  ...req,
  requestId: 'p5',
  transform: createDefaultGeometryTransform({
    fitMode: 'FIT',
    destinationRect: { x: 0, y: 0, width: 1000, height: 1000, coordinateSpace: 'CANVAS_PIXELS' },
  }),
});
assert.ok(Math.abs((fit.plan?.destinationRectangle.width ?? 0) - 1000) < 1e-6);
const fill = engine.plan({
  ...req,
  requestId: 'p6',
  transform: createDefaultGeometryTransform({
    fitMode: 'FILL',
    destinationRect: { x: 0, y: 0, width: 1000, height: 1000, coordinateSpace: 'CANVAS_PIXELS' },
  }),
});
assert.ok((fill.plan?.destinationRectangle.width ?? 0) > 1000);
const rot = engine.plan({
  ...req,
  requestId: 'p7',
  transform: createDefaultGeometryTransform({ rotationDegrees: 450 }),
});
assert.equal(rot.plan?.effectiveTransform.rotationDegrees, 90);
const flip = engine.plan({
  ...req,
  requestId: 'p8',
  transform: createDefaultGeometryTransform({ horizontalFlip: true, verticalFlip: true }),
});
assert.ok(flip.plan?.requiresRasterization);
const clipped = engine.plan({
  ...req,
  requestId: 'p9',
  transform: createDefaultGeometryTransform({
    destinationRect: {
      x: 3000,
      y: 3000,
      width: 100,
      height: 100,
      coordinateSpace: 'CANVAS_PIXELS',
    },
  }),
});
assert.equal(clipped.plan?.clippedBounds, undefined);
assert.ok(invertGeometryMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1]));
assert.throws(() => invertGeometryMatrix([0, 0, 0, 0, 0, 0, 0, 0, 0]));
const pass = await engine.transform(
  {
    requestId: 't1',
    sourceId: 'source-1',
    streamId: 'stream-1',
    inputFrame: frame,
    expectedFrameGeneration: 1n,
    expectedStorageGeneration: 1n,
    transform: t,
    outputCanvas: canvas,
  },
  { nowNs: () => 1n },
);
assert.equal(pass.status, 'PASSED_THROUGH');
assert.equal(pass.outputFrame?.frameId, frame.frameId);
const out = await engine.transform(
  {
    requestId: 't2',
    sourceId: 'source-1',
    streamId: 'stream-1',
    inputFrame: frame,
    expectedFrameGeneration: 1n,
    expectedStorageGeneration: 1n,
    transform: createDefaultGeometryTransform({
      translation: { x: 10, y: 0, coordinateSpace: 'DESTINATION_PIXELS' },
    }),
    outputCanvas: canvas,
  },
  { nowNs: () => 2n },
);
assert.equal(out.status, 'COMPLETED');
assert.notEqual(out.outputFrame?.frameId, frame.frameId);
assert.equal(out.outputFrame?.sourceTimestampNs, frame.sourceTimestampNs);
assert.equal(out.outputFrame?.sourceId, frame.sourceId);
const sg = createSourceGraphGeometryMetadata(out);
assert.equal(sg.geometryEnabled, true);
assert.ok(GEOMETRY_OUTPUT_KEYS.transformedFrameReferences);
assert.ok(GEOMETRY_WATCHDOG_INCIDENTS.includes('GEOMETRY_TIMEOUT'));
assert.equal(
  (
    await engine.transform(
      {
        requestId: 't3',
        sourceId: 'source-1',
        streamId: 'stream-1',
        inputFrame: frame,
        expectedFrameGeneration: 2n,
        expectedStorageGeneration: 1n,
        transform: t,
        outputCanvas: canvas,
      },
      { nowNs: () => 3n },
    )
  ).status,
  'REJECTED',
);
engine.assertInvariants();
await engine.shutdown();
await engine.shutdown();
assert.equal(engine.getHealth().engineState, 'SHUTDOWN');
console.log('UBOS v5.3.7 Geometry Engine validation passed');
