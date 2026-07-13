// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
const assert: any = (value: unknown, message?: string) => {
  if (!value) throw new Error(message || 'assertion failed');
};
assert.equal = (actual: unknown, expected: unknown) => {
  if (actual !== expected) throw new Error(`assert.equal failed: ${actual} !== ${expected}`);
};
assert.throws = (fn: () => unknown, pattern?: RegExp) => {
  let thrown: any;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }
  if (!thrown) throw new Error('assert.throws failed');
  if (pattern && !pattern.test(String(thrown?.message || thrown)))
    throw new Error(`assert.throws pattern failed: ${thrown?.message || thrown}`);
};
import {
  PictureInPictureEngine,
  createPictureInPictureLayoutDefinition,
  createPictureInPicturePresetLayout,
  PIP_LAYOUT_TYPES,
  PIP_OUTPUT_ROLES,
  PICTURE_IN_PICTURE_BUILTIN_PRESETS,
} from './picture-in-picture-engine.js';

const engine = new PictureInPictureEngine();
assert.equal(engine.health().presetCount, PICTURE_IN_PICTURE_BUILTIN_PRESETS.length);
const layout = createPictureInPicturePresetLayout('SIDE_BY_SIDE');
const reg = engine.registerLayout(layout);
assert.throws(() => engine.registerLayout(layout), /duplicate layout/i);
assert(Object.isFrozen(reg));
const updated = engine.updateLayout(reg.layoutId, reg.layoutGeneration, {
  displayName: 'Side By Side Updated',
});
assert.equal(updated.layoutGeneration, reg.layoutGeneration + 1);
assert.throws(
  () => engine.updateLayout(reg.layoutId, reg.layoutGeneration, {}),
  /generation mismatch/i,
);
engine.unregisterLayout(reg.layoutId);
const allLayouts = PIP_LAYOUT_TYPES.map((type, index) =>
  engine.registerLayout(
    createPictureInPictureLayoutDefinition({
      layoutId: `layout:${type}`,
      displayName: type,
      layoutType: type,
      slots: [
        {
          slotId: 'slot0',
          slotIndex: 0,
          role: 'PRIMARY',
          destination: { x: 0, y: 0, width: 1, height: 1 },
          coordinateSpace: 'CANVAS_NORMALIZED',
          fitMode: 'FIT',
          alignment: 'CENTER',
          sourceCropPolicy: 'REJECT_OUT_OF_BOUNDS',
          zOrder: 0,
          visible: true,
          opacity: 1,
          required: true,
          priority: 0,
        },
      ],
      canvas: type.includes('VERTICAL')
        ? { width: 1080, height: 1920 }
        : type.includes('SQUARE')
          ? { width: 1080, height: 1080 }
          : { width: 1920, height: 1080 },
      slotAssignmentPolicy:
        index % 3 === 0 ? 'STABLE_SOURCE_ORDER' : index % 3 === 1 ? 'ROLE_BASED' : 'PRIORITY_BASED',
    }),
  ),
);
assert.equal(allLayouts.length, PIP_LAYOUT_TYPES.length);
const v = engine.registerVariant({
  variantId: 'variant:preview',
  baseLayoutId: allLayouts[0].layoutId,
  outputRole: 'PREVIEW',
  outputProfile: 'profile:preview',
});
assert.equal(v.outputRole, 'PREVIEW');
const inst = engine.createInstance({
  instanceId: 'inst:program',
  layoutId: allLayouts[0].layoutId,
  outputRole: 'PROGRAM',
});
assert.throws(
  () => engine.createInstance({ instanceId: 'inst:program', layoutId: allLayouts[0].layoutId }),
  /duplicate instance/i,
);
assert.throws(
  () =>
    engine.render({
      requestId: 'inactive',
      instanceId: inst.instanceId,
      expectedLayoutVersion: inst.layoutVersion,
      expectedLayoutGeneration: inst.layoutGeneration,
      expectedInstanceGeneration: inst.instanceGeneration,
      runtimeFrameNumber: '0',
      frameTick: { frameNumber: 0n },
      outputRole: 'PROGRAM',
      sourceFrameBindings: [],
      outputProfile: allLayouts[0].outputProfileReference,
    }),
  /inactive instance/i,
);
let active = engine.activate(inst.instanceId);
active = engine.bindSource(active.instanceId, {
  bindingId: 'bind:a',
  sourceId: 'source:a',
  streamId: 'stream:a',
  expectedSourceGeneration: 1,
  role: 'PRIMARY',
  priority: 1,
  required: true,
  active: true,
});
const plan = engine.plan({
  requestId: 'plan:1',
  instanceId: active.instanceId,
  expectedLayoutVersion: active.layoutVersion,
  expectedLayoutGeneration: active.layoutGeneration,
  expectedInstanceGeneration: (
    engine.snapshot().instances.find((i: any) => i.instanceId === active.instanceId) as any
  ).instanceGeneration,
  runtimeFrameNumber: '1',
  frameTick: { frameNumber: 1n },
  outputRole: 'PROGRAM',
  sourceFrameBindings: [],
  outputProfile: allLayouts[0].outputProfileReference,
});
assert.equal(plan.passThroughEligible, true);
const current = engine.snapshot().instances.find((i: any) => i.instanceId === active.instanceId)!;
const result = engine.render({
  requestId: 'render:1',
  instanceId: current.instanceId,
  expectedLayoutVersion: current.layoutVersion,
  expectedLayoutGeneration: current.layoutGeneration,
  expectedInstanceGeneration: current.instanceGeneration,
  runtimeFrameNumber: '2',
  frameTick: { frameNumber: 2n },
  outputRole: 'PROGRAM',
  sourceFrameBindings: [],
  outputProfile: allLayouts[0].outputProfileReference,
});
assert.equal(result.status, 'PASSED_THROUGH');
assert.equal(result.passThrough, true);
assert.equal(result.ownershipTransfer, 'PRESERVED');
const meta = (
  await import('./picture-in-picture-engine.js')
).createPictureInPictureSourceGraphMetadata(result);
assert.equal(meta.passThrough, true);
const after = engine.snapshot().instances.find((i: any) => i.instanceId === active.instanceId)!;
assert.equal(after.lastPlanId, result.planId);
engine.suspend(after.instanceId);
engine.resume(after.instanceId);
let ii: any = engine.snapshot().instances.find((i: any) => i.instanceId === active.instanceId)!;
engine.deactivate(ii.instanceId);
ii = engine.activate(ii.instanceId);
ii = engine.bindSource(ii.instanceId, {
  bindingId: 'bind:b',
  sourceId: 'source:b',
  streamId: 'stream:b',
  expectedSourceGeneration: 1,
  role: 'PRIMARY',
  priority: 2,
  required: false,
  active: true,
});
engine.swapSlots(ii.instanceId, 'slot0', 'slot0');
ii = engine.unbindSource(ii.instanceId, 'bind:b');
for (const role of PIP_OUTPUT_ROLES) {
  const snap: any = engine.snapshot().instances.find((i: any) => i.instanceId === ii.instanceId)!;
  try {
    engine.render({
      requestId: `render:${role}`,
      instanceId: snap.instanceId,
      expectedLayoutVersion: snap.layoutVersion,
      expectedLayoutGeneration: snap.layoutGeneration,
      expectedInstanceGeneration: snap.instanceGeneration,
      runtimeFrameNumber: String(10 + PIP_OUTPUT_ROLES.indexOf(role)),
      frameTick: { frameNumber: BigInt(10 + PIP_OUTPUT_ROLES.indexOf(role)) },
      outputRole: role,
      sourceFrameBindings: [],
      outputProfile: allLayouts[0].outputProfileReference,
    });
  } catch {}
}
const missingLayout = engine.registerLayout(
  createPictureInPictureLayoutDefinition({
    layoutId: 'missing-required',
    displayName: 'Missing Required',
    layoutType: 'SINGLE_INSET',
    slots: [
      {
        slotId: 'required',
        slotIndex: 0,
        role: 'PRIMARY',
        destination: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        coordinateSpace: 'CANVAS_NORMALIZED',
        fitMode: 'FILL',
        alignment: 'CENTER',
        sourceCropPolicy: 'CENTER_CROP',
        zOrder: 0,
        visible: true,
        opacity: 1,
        required: true,
        priority: 0,
      },
    ],
  }),
);
const missingInst: any = engine.activate(
  engine.createInstance({ instanceId: 'inst:missing', layoutId: missingLayout.layoutId })
    .instanceId,
);
assert.throws(
  () =>
    engine.render({
      requestId: 'missing',
      instanceId: missingInst.instanceId,
      expectedLayoutVersion: missingInst.layoutVersion,
      expectedLayoutGeneration: missingInst.layoutGeneration,
      expectedInstanceGeneration: missingInst.instanceGeneration,
      runtimeFrameNumber: '50',
      frameTick: { frameNumber: 50n },
      outputRole: 'PROGRAM',
      sourceFrameBindings: [],
      outputProfile: missingLayout.outputProfileReference,
    }),
  /required source missing/i,
);
assert(engine.health().missingSourceCount >= 1);
assert.equal(engine.assertInvariants().valid, true);
const perfSnap: any = engine.snapshot().instances.find((i: any) => i.instanceId === ii.instanceId)!;
for (let n = 0; n < 10000; n++) {
  engine.plan({
    requestId: `long-plan:${n}`,
    instanceId: perfSnap.instanceId,
    expectedLayoutVersion: perfSnap.layoutVersion,
    expectedLayoutGeneration: perfSnap.layoutGeneration,
    expectedInstanceGeneration: perfSnap.instanceGeneration,
    runtimeFrameNumber: `p${n}`,
    frameTick: { frameNumber: BigInt(n) },
    outputRole: 'PROGRAM',
    sourceFrameBindings: [],
    outputProfile: allLayouts[0].outputProfileReference,
  });
}
assert(engine.snapshot().plans.length <= 512);
for (let n = 0; n < 10000; n++) {
  try {
    engine.render({
      requestId: `long-render:${n}`,
      instanceId: perfSnap.instanceId,
      expectedLayoutVersion: perfSnap.layoutVersion,
      expectedLayoutGeneration: perfSnap.layoutGeneration,
      expectedInstanceGeneration: perfSnap.instanceGeneration,
      runtimeFrameNumber: `r${n}`,
      frameTick: { frameNumber: BigInt(n) },
      outputRole: n % 2 ? 'PREVIEW' : 'PROGRAM',
      sourceFrameBindings: [],
      outputProfile: allLayouts[0].outputProfileReference,
    });
  } catch {}
}
for (let n = 0; n < 100000; n++) {
  if (n % 10000 === 0) assert.equal(engine.assertInvariants().valid, true);
}
const health = engine.health();
assert(health.completedRenderCount >= 1);
const telemetry = engine.telemetry();
assert(telemetry.rendersCompleted >= health.completedRenderCount);
engine.destroyInstance(ii.instanceId);
engine.shutdownEngine();
assert.equal(engine.health().engineState, 'SHUTDOWN');
console.log('UBOS v5.4.8 Picture-in-Picture Engine validation passed');
