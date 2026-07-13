/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import assert from 'node:assert/strict';
import {
  createProgramPreviewBusOrchestrator,
  ProgramPreviewBusOrchestrationProcessor,
  PROGRAM_PREVIEW_BUS_PROCESSOR_ORDER,
  PROGRAM_PREVIEW_BUS_WATCHDOG_INCIDENTS,
  PROGRAM_PREVIEW_BUS_OUTPUT_KEYS,
  type OutputProfileCoordinationSnapshot,
} from './program-preview-bus-orchestration.js';
import { TransitionExecutionProcessor } from './transition-execution-engine.js';
import { AudioFollowVideoProcessor } from './audio-follow-video.js';
import type { FrameTick, ProcessorRuntimeContext } from './execution-engine.js';

const tick = (n: number): FrameTick => ({
  frameNumber: BigInt(n),
  startedAtNs: BigInt(n),
  deadlineAtNs: BigInt(n),
  scheduledTimeNs: BigInt(n),
  actualTimeNs: BigInt(n),
  presentationTimeNs: BigInt(n),
  frameDurationNs: 33333333n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const profile = (
  id: string,
  w: number,
  h: number,
  orientation: any,
): OutputProfileCoordinationSnapshot =>
  Object.freeze({
    profileId: id,
    profileVersion: '1',
    profileGeneration: 1,
    width: w,
    height: h,
    frameRate: { numerator: 30, denominator: 1 },
    pixelFormat: 'RGBA8',
    colorMetadata: { space: 'BT709' },
    alphaMode: 'PREMULTIPLIED',
    audioFormatMetadata: { kind: 'metadata' },
    aspectRatio: `${w}:${h}`,
    safeArea: {},
    orientation,
    memoryDomain: 'FRAME_MEMORY',
    latencyClass: 'LIVE',
    qualityTier: 'PRODUCTION',
    routingEligibility: true,
    safeMetadata: {},
  });
const upstream = (n: number) => ({
  program: { runtimeFrameNumber: String(n), scene: { sceneId: 'program', sceneGeneration: n } },
  preview: { runtimeFrameNumber: String(n), scene: { sceneId: 'preview', sceneGeneration: n } },
  transition: {
    runtimeFrameNumber: String(n),
    generation: n,
    state: n % 10 ? 'RUNNING' : 'COMPLETED',
  },
  programAudio: { runtimeFrameNumber: String(n), routeId: 'program-audio', routeGeneration: n },
  previewAudio: { runtimeFrameNumber: String(n), routeId: 'preview-audio', routeGeneration: n },
});

assert.equal(PROGRAM_PREVIEW_BUS_PROCESSOR_ORDER.transitionExecution, 500);
assert.equal(PROGRAM_PREVIEW_BUS_PROCESSOR_ORDER.audioFollowVideo, 550);
assert.equal(
  new TransitionExecutionProcessor({
    shutdown() {},
    processTick() {},
    health() {
      return {};
    },
    telemetry() {
      return {};
    },
  } as any).order,
  500,
);
assert.equal(new AudioFollowVideoProcessor().order, 550);
assert.equal(
  new ProgramPreviewBusOrchestrationProcessor(createProgramPreviewBusOrchestrator()).order,
  600,
);

const orch = createProgramPreviewBusOrchestrator();
let snap = orch.getSnapshot();
assert.equal(
  snap.buses.some((b) => b.role === 'PROGRAM_VIDEO'),
  true,
);
assert.equal(
  snap.buses.some((b) => b.role === 'PREVIEW_VIDEO'),
  true,
);
const custom = orch.registerBus({ busId: 'bus.clean', role: 'CLEAN_FEED', displayName: 'Clean' });
assert.throws(() => orch.registerBus({ busId: 'bus.clean', role: 'CLEAN_FEED' }), /duplicate/);
const updated = orch.updateBus(custom.busId, custom.busGeneration, { displayName: 'Clean Feed' });
assert.equal(updated.busGeneration, 2);
assert.throws(() => orch.updateBus(custom.busId, 1, { displayName: 'stale' }), /stale/);
assert.throws(() => orch.unregisterBus('bus.program.video'), /critical/);
orch.bindOutputRole({
  outputRole: 'CLEAN_FEED',
  busId: 'bus.clean',
  roleInstanceId: 'clean-1',
  cleanFeedExclusionPolicy: ['graphics', 'lower-thirds'],
  priority: 3,
});
orch.registerBus({
  busId: 'bus.h',
  role: 'HORIZONTAL_PROGRAM',
  outputProfile: profile('h', 1920, 1080, 'LANDSCAPE'),
});
orch.registerBus({
  busId: 'bus.v',
  role: 'VERTICAL_PROGRAM',
  outputProfile: profile('v', 1080, 1920, 'PORTRAIT'),
});
orch.registerBus({
  busId: 'bus.s',
  role: 'SQUARE_PROGRAM',
  outputProfile: profile('s', 1080, 1080, 'SQUARE'),
});
orch.bindOutputRole({ outputRole: 'HORIZONTAL_PROGRAM', busId: 'bus.h', priority: 5 });
orch.bindOutputRole({ outputRole: 'VERTICAL_PROGRAM', busId: 'bus.v', priority: 6 });
orch.bindOutputRole({ outputRole: 'SQUARE_PROGRAM', busId: 'bus.s', priority: 7 });
for (let i = 0; i < 3; i++) {
  orch.registerBus({ busId: `bus.aux.${i}`, role: 'AUXILIARY' });
  orch.bindOutputRole({
    outputRole: 'AUXILIARY',
    busId: `bus.aux.${i}`,
    roleInstanceId: `aux-${i}`,
    priority: 10 + i,
  });
}
orch.bindOutputRole({
  outputRole: 'MULTIVIEW',
  busId: 'bus.preview.video',
  roleInstanceId: 'multiview',
  required: false,
  priority: 20,
});
orch.bindOutputRole({
  outputRole: 'CONFIDENCE_MONITOR',
  busId: 'bus.program.video',
  roleInstanceId: 'confidence',
  required: false,
  priority: 19,
});
orch.bindOutputRole({
  outputRole: 'RECORD',
  busId: 'bus.program.video',
  roleInstanceId: 'record',
  required: false,
  priority: 17,
});
orch.bindOutputRole({
  outputRole: 'STREAM',
  busId: 'bus.program.video',
  roleInstanceId: 'stream',
  required: false,
  priority: 18,
});
let tx = orch.processFrameTick(tick(1), upstream(1));
assert.equal(
  tx.rolePublicationResults.filter((r) => r.role === 'PROGRAM' && r.published).length,
  1,
);
assert.equal(
  tx.rolePublicationResults.some((r) => r.role === 'PREVIEW'),
  true,
);
assert.deepEqual(
  tx.rolePlans.map((p) => p.roleInstanceId),
  [...tx.rolePlans.map((p) => p.roleInstanceId)].sort(
    (a, b) =>
      tx.rolePlans.find((p) => p.roleInstanceId === a)!.priority -
        tx.rolePlans.find((p) => p.roleInstanceId === b)!.priority || a.localeCompare(b),
  ),
);
assert.throws(() => orch.processFrameTick(tick(1), upstream(1)), /duplicate tick/);
assert.throws(
  () => orch.processFrameTick(tick(2), { ...upstream(2), preview: { runtimeFrameNumber: '1' } }),
  /mixed tick/,
);
for (let i = 3; i < 10003; i++) orch.processFrameTick(tick(i), upstream(i));
snap = orch.getSnapshot();
assert.equal(snap.health.programPublicationCount, 10001);
assert.equal(snap.health.duplicateTickCount, 1);
assert.equal(snap.health.mixedTickRejectionCount, 1);
assert.equal(snap.validation, undefined);
assert.equal(orch.assertInvariants(), true);
const replay = () => {
  const o = createProgramPreviewBusOrchestrator();
  for (let i = 1; i <= 1000; i++) o.processFrameTick(tick(i), upstream(i));
  return JSON.stringify(o.getSnapshot());
};
assert.equal(replay(), replay());
const fake: any = {
  entries: new Map<string, unknown>(),
  publish(_p: string, k: string, v: unknown) {
    this.entries.set(k, v);
  },
  readDependencyOutput() {
    return undefined;
  },
};
const p = new ProgramPreviewBusOrchestrationProcessor(createProgramPreviewBusOrchestrator());
p.processTick(tick(99), { outputs: fake } as ProcessorRuntimeContext);
assert.ok(fake.entries.has(PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.health));
assert.ok(PROGRAM_PREVIEW_BUS_WATCHDOG_INCIDENTS.includes('BUS_MIXED_TICK_INPUT'));
orch.shutdown();
assert.throws(() => orch.registerBus({ busId: 'after', role: 'CUSTOM' }), /shutdown/);
console.log('UBOS v5.5.4 bus-orchestration validation passed');
