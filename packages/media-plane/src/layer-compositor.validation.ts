const assert = (c: unknown, m = 'assertion failed') => {
  if (!c) throw new Error(m);
};
assert.equal = (a: unknown, e: unknown, m?: string) => {
  if (a !== e) throw new Error(m ?? `expected ${String(e)}, got ${String(a)}`);
};
import {
  createLayerCompositor,
  createSyntheticLayerCompositorBackend,
  LayerCompositorPipelineStage,
  createLayerCompositorSourceGraphMetadata,
} from './layer-compositor.js';
import type {
  LayerCompositionCanvas,
  LayerCompositionRequest,
  LayerDescriptor,
} from './layer-compositor.js';
import { SyntheticFrameMemoryManager } from './frame-memory.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';
let t = 1n;
const nowNs = () => (t += 1000n);
const canvas: LayerCompositionCanvas = Object.freeze({
  canvasId: 'c',
  width: 1920,
  height: 1080,
  format: 'RGBA8',
  colorMetadata: Object.freeze({ primaries: 'BT_709' }),
  alphaMode: 'STRAIGHT',
  memoryDomain: 'CPU_HEAP',
  pixelAspectRatio: 1,
  maximumLayers: 16,
  background: Object.freeze({ mode: 'TRANSPARENT' }),
  metadata: Object.freeze({}),
});
const frame = (id: string, g = 1n): VideoPipelineFrameReference =>
  Object.freeze({
    frameId: id,
    storageId: `s-${id}`,
    frameGeneration: g,
    storageGeneration: g,
    leaseId: `l-${id}`,
    ownerId: 'test',
    sourceId: `src-${id}`,
    streamId: 'video',
    sequenceNumber: g,
    runtimeFrameNumber: g,
    format: Object.freeze({
      width: 1920,
      height: 1080,
      pixelFormat: 'RGBA8',
      colorMetadata: canvas.colorMetadata,
    }),
    memoryDomain: 'CPU',
    state: 'READY',
    sourceTimestampNs: g,
    normalizedTimestampNs: g,
    discontinuity: false,
    metadata: Object.freeze({}),
  });
const layer = (
  id: string,
  z: number,
  order = 0,
  f = frame(id),
  extra: Partial<LayerDescriptor> = {},
): LayerDescriptor =>
  Object.freeze({
    layerId: id,
    sourceId: f.sourceId,
    streamId: 'video',
    frame: f,
    frameGeneration: f.frameGeneration,
    storageGeneration: f.storageGeneration,
    geometry: Object.freeze({
      geometryId: `g-${id}`,
      frameGeneration: f.frameGeneration,
      storageGeneration: f.storageGeneration,
      transformedDestination: { x: 0, y: 0, width: 1920, height: 1080 },
      visibleBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    }),
    zIndex: z,
    order,
    enabled: true,
    visible: true,
    opacity: 1,
    blendMode: 'NORMAL',
    alphaMode: 'STRAIGHT',
    layerBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    contentBounds: { x: 0, y: 0, width: 1920, height: 1080 },
    role: 'PRIMARY_VIDEO',
    isolationMode: 'NONE',
    cachePolicy: 'NONE',
    temporalPolicy: 'CURRENT_FRAME_ONLY',
    criticality: 'OPTIONAL',
    metadata: Object.freeze({}),
    ...extra,
  });
const req = (
  id: string,
  layers: readonly LayerDescriptor[],
  over: Partial<LayerCompositionRequest> = {},
): LayerCompositionRequest =>
  Object.freeze({
    requestId: id,
    runtimeFrameNumber: 1n,
    frameTick: Object.freeze({}),
    canvas,
    layers,
    groups: [],
    background: canvas.background,
    qualityTier: 'BALANCED',
    emptyCompositionPolicy: 'RETURN_EMPTY',
    alphaPolicy: 'REJECT_MIXED_ALPHA',
    missingLayerPolicy: 'FAIL_IF_CRITICAL',
    timestampPolicy: 'USE_RUNTIME_TICK_TIME',
    pipelineConfigurationGeneration: 1n,
    metadata: Object.freeze({}),
    ...over,
  });

const c = createLayerCompositor({ nowNs, planCacheEntries: 2 });
assert.equal(c.getSnapshot().engineState, 'READY');
c.registerBackend(createSyntheticLayerCompositorBackend({ backendId: 'zzz', priority: 1 }));
try {
  c.registerBackend(createSyntheticLayerCompositorBackend({ backendId: 'zzz' }));
  throw new Error('dup');
} catch (e) {
  assert(String(e).includes('duplicate') || String(e).includes('Duplicate'));
}
await c.unregisterBackend('zzz');
const p = c.plan(req('p', [layer('b', 0), layer('a', 0)]));
assert.equal(p.status, 'PLANNED');
assert.equal(p.plan?.orderedLayers.map((l) => l.layerId).join(','), 'a,b');
const p2 = c.plan(req('p2', [layer('a', 0), layer('b', 0)]));
assert.equal(
  p.plan?.orderedLayers.map((l) => l.layerId).join(','),
  p2.plan?.orderedLayers.map((l) => l.layerId).join(','),
);
assert.equal(c.plan(req('dup', [layer('x', 0), layer('x', 1)])).status, 'REJECTED');
assert.equal(c.plan(req('op', [layer('x', 0, 0, frame('x'), { opacity: 2 })])).status, 'REJECTED');
assert.equal(
  c.plan(req('unk', [layer('x', 0, 0, frame('x'), { alphaMode: 'UNKNOWN' })])).status,
  'REJECTED',
);
assert.equal(c.plan(req('neg', [layer('x', -5)])).status, 'PLANNED');
assert(
  c.plan(req('dis', [layer('x', 0, 0, frame('x'), { enabled: false })])).plan?.skippedLayers[0]
    ?.reason === 'DISABLED',
);
assert(
  c
    .plan(
      req('clip', [layer('x', 0, 0, frame('x'), { clip: { x: 3000, y: 0, width: 1, height: 1 } })]),
    )
    .plan?.skippedLayers[0]?.reason.includes('CLIPPED'),
);
const empty = await c.compose(req('empty', []), { nowNs });
assert.equal(empty.status, 'EMPTY');
const bg = await c.compose(
  req('bg', [], {
    emptyCompositionPolicy: 'PRODUCE_BACKGROUND',
    background: { mode: 'OPAQUE_BLACK' },
    canvas: { ...canvas, background: { mode: 'OPAQUE_BLACK' } },
  }),
  { nowNs },
);
assert.equal(bg.status, 'BACKGROUND_ONLY');
const pass = await c.compose(req('pass', [layer('x', 0)]), { nowNs });
assert.equal(pass.status, 'PASSED_THROUGH');
assert.equal(pass.outputFrame?.frameId, 'x');
const fm = new SyntheticFrameMemoryManager(nowNs);
const comp = await c.compose(
  req('comp', [layer('x', 0), layer('y', 1, 0, frame('y'), { opacity: 0.5 })]),
  { nowNs, frameMemory: fm },
);
assert.equal(comp.status, 'COMPLETED');
assert(comp.outputFrame?.frameId !== 'x');
assert(createLayerCompositorSourceGraphMetadata(comp).activeLayerCount > 0);
assert.equal(
  c.plan(req('blend', [layer('x', 0, 0, frame('x'), { blendMode: 'CUSTOM' })])).status,
  'REJECTED',
);
const mixed = c.plan(
  req('mixed', [layer('x', 0), layer('y', 1, 0, frame('y'), { alphaMode: 'PREMULTIPLIED' })]),
);
assert.equal(mixed.status, 'REJECTED');
const stage = new LayerCompositorPipelineStage();
assert.equal(stage.descriptor.version, '5.3.8');
c.assertInvariants();
await c.shutdown();
await c.shutdown();
assert.equal(c.getSnapshot().engineState, 'SHUTDOWN');
console.log('layer-compositor validation complete');
