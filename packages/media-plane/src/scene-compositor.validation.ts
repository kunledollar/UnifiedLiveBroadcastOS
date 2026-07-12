const assert = (condition: unknown, message = 'assertion failed') => {
  if (!condition) throw new Error(message);
};
assert.equal = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected) throw new Error(message ?? `expected ${String(expected)}, got ${String(actual)}`);
};

import { createLayerCompositor, createSyntheticLayerCompositorBackend, type LayerCompositionCanvas } from './layer-compositor.js';
import { SyntheticFrameMemoryManager } from './frame-memory.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';
import {
  createSceneCompositor,
  createSceneCompositorCommandHandlers,
  createSceneCompositorProcessor,
  createSceneCompositorSourceGraphMetadata,
  type SceneBinding,
  type SceneCollection,
  type SceneDefinition,
  type SceneDependencyKind,
  type SceneOutputProfile,
  type SceneTemplate,
} from './scene-compositor.js';

let time = 1n;
const nowNs = () => (time += 1_000n);

const canvas = (canvasId: string, width: number, height: number): LayerCompositionCanvas =>
  Object.freeze({
    canvasId,
    width,
    height,
    format: 'RGBA8',
    colorMetadata: Object.freeze({ primaries: 'BT_709' }),
    alphaMode: 'STRAIGHT',
    memoryDomain: 'CPU_HEAP',
    pixelAspectRatio: 1,
    maximumLayers: 64,
    background: Object.freeze({ mode: 'OPAQUE_BLACK' }),
    metadata: Object.freeze({ synthetic: true }),
  });


const frame = (id: string, sourceId = id, generation = 1n): VideoPipelineFrameReference =>
  Object.freeze({
    frameId: id,
    storageId: `storage-${id}`,
    frameGeneration: generation,
    storageGeneration: generation,
    leaseId: `lease-${id}`,
    ownerId: 'validation',
    sourceId,
    streamId: 'video',
    sequenceNumber: generation,
    runtimeFrameNumber: generation,
    format: Object.freeze({ width: 1920, height: 1080, pixelFormat: 'RGBA8', colorMetadata: { primaries: 'BT_709' } }),
    memoryDomain: 'CPU',
    state: 'READY',
    sourceTimestampNs: generation,
    normalizedTimestampNs: generation,
    discontinuity: false,
    metadata: Object.freeze({}),
  });

const outputProfiles: readonly SceneOutputProfile[] = Object.freeze([
  {
    outputProfileId: 'program-horizontal',
    role: 'PROGRAM',
    aspect: 'HORIZONTAL',
    order: 0,
    canvas: canvas('program-h', 1920, 1080),
    registryKey: 'scene.program.horizontal',
    cleanFeed: false,
    multiview: false,
  },
  {
    outputProfileId: 'program-vertical',
    role: 'PROGRAM',
    aspect: 'VERTICAL',
    order: 1,
    canvas: canvas('program-v', 1080, 1920),
    registryKey: 'scene.program.vertical',
    cleanFeed: false,
    multiview: false,
  },
  {
    outputProfileId: 'preview-square',
    role: 'PREVIEW',
    aspect: 'SQUARE',
    order: 2,
    canvas: canvas('preview-s', 1080, 1080),
    registryKey: 'scene.preview.square',
    cleanFeed: false,
    multiview: false,
  },
]);

const bindings: readonly SceneBinding[] = Object.freeze([
  {
    bindingId: 'primary-camera',
    kind: 'SOURCE',
    sourceId: 'camera-a',
    streamId: 'video',
    role: 'PRIMARY',
    order: 2,
    zIndex: 0,
    required: true,
    enabled: true,
  },
  {
    bindingId: 'show-bug',
    kind: 'SOURCE',
    sourceId: 'graphic-bug',
    streamId: 'video',
    role: 'BUG',
    order: 1,
    zIndex: 10,
    required: false,
    enabled: true,
  },
]);

const compositor = createSceneCompositor({ nowNs, registryLimit: 10_000, eventHistoryLimit: 32 });
const collection: SceneCollection = Object.freeze({
  collectionId: 'show-main',
  displayName: 'Main Show',
  order: 0,
  generation: 1n,
  sceneIds: Object.freeze([]),
});
compositor.registerCollection(collection);

const template: SceneTemplate = Object.freeze({
  templateId: 'two-layer-template',
  collectionId: 'show-main',
  displayName: 'Two Layer Template',
  generation: 1n,
  defaultBindings: bindings,
  defaultOutputProfiles: outputProfiles,
});
compositor.registerTemplate(template);

const childIdentity = compositor.createSceneIdentity({
  sceneId: 'child-scene',
  collectionId: 'show-main',
  templateId: 'two-layer-template',
  version: 1n,
});
compositor.registerScene(
  Object.freeze({
    identity: childIdentity,
    displayName: 'Nested Child',
    bindings: Object.freeze([{ ...bindings[1], bindingId: 'child-bug', order: 0, zIndex: 1 } as SceneBinding]),
    outputProfiles,
    dependencyKinds: Object.freeze(['SOURCE_ACQUISITION', 'FRAME_MEMORY', 'LAYER_COMPOSITOR'] as const satisfies readonly SceneDependencyKind[]),
  }),
);

const identity = compositor.createSceneIdentity({
  collectionId: 'show-main',
  templateId: 'two-layer-template',
  version: 1n,
});
assert.equal(
  identity.sceneId,
  compositor.createSceneIdentity({ collectionId: 'show-main', templateId: 'two-layer-template', version: 1n })
    .sceneId,
);

const scene: SceneDefinition = Object.freeze({
  identity,
  displayName: 'Opening Scene',
  bindings,
  outputProfiles,
  dependencyKinds: Object.freeze([
    'SOURCE_ACQUISITION',
    'FRAME_MEMORY',
    'VIDEO_FRAME_PIPELINE',
    'SCALING_ENGINE',
    'COLOR_CONVERSION',
    'COLOR_CORRECTION',
    'GEOMETRY_ENGINE',
    'LAYER_COMPOSITOR',
  ] as const satisfies readonly SceneDependencyKind[]),
});
const report = compositor.validateScene(scene);
assert.equal(report.valid, true);
assert.equal(report.orderedBindingIds.join(','), 'primary-camera,show-bug');
const registered = compositor.registerScene(scene);
assert(Object.isFrozen(registered));
const graph = compositor.buildDependencyGraph(registered.identity.sceneId, 4);
assert.equal(graph.valid, true);

const variant = Object.freeze({
  variantId: 'vertical-first',
  sceneId: registered.identity.sceneId,
  templateId: 'two-layer-template',
  displayName: 'Vertical First',
  generation: 1n,
  bindingOverrides: Object.freeze([]),
  outputProfileOverrides: outputProfiles,
});
compositor.registerVariant(variant);

const instance = compositor.createSceneInstance({ sceneId: registered.identity.sceneId, role: 'PREVIEW' });
assert.equal(instance.activationState, 'INACTIVE');
const active = compositor.activateScene(instance.instanceId, instance.generation);
assert.equal(active.activationState, 'ACTIVE');
const suspended = compositor.suspendScene(instance.instanceId, active.generation);
assert.equal(suspended.activationState, 'SUSPENDED');
const resumed = compositor.resumeScene(instance.instanceId, suspended.generation);
assert.equal(resumed.activationState, 'ACTIVE');
const inactive = compositor.deactivateScene(instance.instanceId, resumed.generation);
assert.equal(inactive.activationState, 'INACTIVE');
const destroyed = compositor.destroySceneInstance(instance.instanceId, inactive.generation);
assert.equal(destroyed.activationState, 'DESTROYED');

try {
  compositor.activateScene(instance.instanceId, inactive.generation);
  throw new Error('stale generation was accepted');
} catch (error) {
  assert(String(error).includes('Generation'));
}

const updated = compositor.commitSceneUpdate(
  Object.freeze({ ...registered, displayName: 'Opening Scene Updated' }),
  registered.identity.generation,
);
assert.equal(updated.identity.generation, registered.identity.generation + 1n);
assert(Object.isFrozen(compositor.getSnapshot()));
assert.equal(compositor.getHealthSnapshot().registeredScenes, 2);
assert.equal(createSceneCompositorSourceGraphMetadata(compositor.getSnapshot()).containsPixels, false);
assert(createSceneCompositorCommandHandlers(compositor).length > 0);

const nestedUpdated = compositor.commitSceneUpdate(
  Object.freeze({
    ...updated,
    bindings: Object.freeze([
      ...updated.bindings,
      {
        bindingId: 'nested-child',
        kind: 'NESTED_SCENE',
        nestedSceneId: childIdentity.sceneId,
        role: 'NESTED',
        order: 3,
        zIndex: 20,
        required: false,
        enabled: true,
      } as SceneBinding,
    ]),
  }),
  updated.identity.generation,
);
const nestedGraph = compositor.buildDependencyGraph(nestedUpdated.identity.sceneId, 4);
assert.equal(nestedGraph.valid, true);
assert(nestedGraph.orderedSceneIds.includes(childIdentity.sceneId));

const layerCompositor = createLayerCompositor({ nowNs });
layerCompositor.registerBackend(createSyntheticLayerCompositorBackend({ backendId: 'scene-validation-layer', priority: 10 }));
const frameMemory = new SyntheticFrameMemoryManager(nowNs);
const renderRequest = Object.freeze({
  requestId: 'render-program-horizontal',
  sceneId: nestedUpdated.identity.sceneId,
  outputProfileId: 'program-horizontal',
  runtimeFrameNumber: 100n,
  frameTick: Object.freeze({}),
  expectedSceneGeneration: nestedUpdated.identity.generation,
  maxNestedDepth: 4,
  sources: Object.freeze([
    { sourceId: 'camera-a', streamId: 'video', frame: frame('camera-frame', 'camera-a') },
    { sourceId: 'graphic-bug', streamId: 'video', frame: frame('bug-frame', 'graphic-bug'), frozen: false },
  ]),
  parameterOverrides: Object.freeze([{ targetId: 'show-bug', parameter: 'zIndex', value: 11 }]),
  backgroundPolicy: 'TRANSPARENT',
  missingSourcePolicy: 'FAIL_REQUIRED',
  frozenSourcePolicy: 'ALLOW',
  pipelineConfigurationGeneration: 1n,
});
const plan = compositor.createRenderPlan(renderRequest);
assert.equal(plan.outputProfile.role, 'PROGRAM');
assert.equal(plan.dependencyGraph.valid, true);
assert(plan.orderedBindingIds.includes('child-bug'));
const rendered = await compositor.renderScene(renderRequest, { nowNs, frameMemory, layerCompositor });
assert(rendered.status === 'COMPLETED' || rendered.status === 'PASSED_THROUGH');
const published = compositor.publishSceneOutput(rendered);
assert(published.outputKey.includes('scene.program'));
const invalidIdentity = compositor.createSceneIdentity({ collectionId: 'show-main', version: 1n });
const invalid = compositor.validateScene(
  Object.freeze({
    identity: invalidIdentity,
    displayName: 'Invalid',
    bindings: Object.freeze([
      { ...bindings[0], bindingId: 'dup' } as SceneBinding,
      { ...bindings[1], bindingId: 'dup' } as SceneBinding,
    ]),
    outputProfiles,
    dependencyKinds: Object.freeze(['SOURCE_ACQUISITION'] as const satisfies readonly SceneDependencyKind[]),
  }),
);
assert.equal(invalid.valid, false);

const bounded = createSceneCompositor({ nowNs, registryLimit: 1 });
bounded.registerCollection({ collectionId: 'one', displayName: 'One', order: 0, generation: 1n, sceneIds: [] });
try {
  bounded.registerCollection({ collectionId: 'two', displayName: 'Two', order: 1, generation: 1n, sceneIds: [] });
  throw new Error('registry bound was not enforced');
} catch (error) {
  assert(String(error).includes('SceneRegistryLimitExceeded'));
}


const processor = createSceneCompositorProcessor({ layerCompositor });
const outputStore = new Map<string, unknown>();
const processorContext = {
  nowNs,
  runtimeId: 'validation-runtime',
  state: 'RUNNING',
  frameNumber: 1n,
  monotonicTimeNs: nowNs(),
  config: {},
  logger: { debug() {}, info() {}, warn() {}, error() {} },
  events: { publish() {} },
  shutdownSignal: new AbortController().signal,
  services: new Map(),
  processorId: 'scene-compositor',
  descriptor: processor.descriptor,
  authoritativeTick: undefined,
  currentFrameNumber: 1n,
  tickBudgetNs: 16_000_000n,
  processorBudgetNs: 8_000_000n,
  remainingTickBudgetNs: 16_000_000n,
  overloadState: 'NORMAL',
  cancellationSignal: new AbortController().signal,
  processorState: undefined,
  outputs: {
    publish(_processorId: string, key: string, value: unknown) { outputStore.set(key, value); },
    read(_processorId: string, key: string) { return outputStore.get(key); },
    readDependencyOutput(_processorId: string, key: string) { return outputStore.get(key); },
    clearTick() { outputStore.clear(); },
    entryCount() { return outputStore.size; },
  },
  executionAttempt: 1,
  priorHealth: {},
} as never;
for (let i = 0; i < 100_000; i += 1) {
  const tick = {
    frameNumber: BigInt(i + 1),
    startedAtNs: nowNs(),
    deadlineAtNs: nowNs() + 16_000_000n,
    scheduledTimeNs: nowNs(),
    actualTimeNs: nowNs(),
    presentationTimeNs: BigInt(i + 1) * 16_000_000n,
    frameDurationNs: 16_000_000n,
    driftNs: 0n,
    missedFrames: 0n,
    discontinuity: false,
    clockId: 'validation-clock',
    tickId: `tick-${i}`,
  } as never;
  const tickResult = await processor.processTick(tick, processorContext);
  assert(tickResult.status === 'SUCCEEDED' || tickResult.status === 'SKIPPED');
}
await processor.shutdown();

const renderStressCompositor = createSceneCompositor({ nowNs, layerCompositor });
renderStressCompositor.registerCollection(collection);
renderStressCompositor.registerTemplate(template);
const stressIdentity = renderStressCompositor.createSceneIdentity({ sceneId: 'stress-scene', collectionId: 'show-main', templateId: 'two-layer-template' });
renderStressCompositor.registerScene(Object.freeze({ ...scene, identity: stressIdentity, bindings: Object.freeze([bindings[0]!]) }));
const stressRequest = Object.freeze({
  ...renderRequest,
  sceneId: stressIdentity.sceneId,
  outputProfileId: 'program-horizontal',
  expectedSceneGeneration: stressIdentity.generation,
  sources: Object.freeze([{ sourceId: 'camera-a', streamId: 'video', frame: frame('stress-camera', 'camera-a') }]),
});
for (let i = 0; i < 10_000; i += 1) {
  const result = await renderStressCompositor.renderScene(Object.freeze({ ...stressRequest, requestId: `stress-${i}`, runtimeFrameNumber: BigInt(i + 1) }), { nowNs, layerCompositor });
  assert(result.status === 'PASSED_THROUGH' || result.status === 'COMPLETED');
}
renderStressCompositor.assertInvariants();
await renderStressCompositor.shutdown();

compositor.assertInvariants();
await compositor.shutdown();
await layerCompositor.shutdown();
await frameMemory.shutdown();
assert.equal(compositor.getSnapshot().engineState, 'SHUTDOWN');
console.log('UBOS v5.3.9 Scene Compositor foundation validation passed');
