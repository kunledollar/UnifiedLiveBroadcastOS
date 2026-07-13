/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import assert from 'node:assert/strict';
import {
  createLiveProductionTallyCoordinator,
  createSyntheticTallyPublicationAdapter,
  LiveProductionTallyProcessor,
  LIVE_CONTROL_WATCHDOG_INCIDENTS,
  LIVE_PRODUCTION_TALLY_OUTPUT_KEYS,
  TALLY_PRIORITY,
} from './live-production-control-tally.js';
import type { FrameTick, ProcessorRuntimeContext } from './execution-engine.js';
const tick = (n: number): FrameTick => ({
  frameNumber: BigInt(n),
  startedAtNs: BigInt(n),
  deadlineAtNs: BigInt(n),
  scheduledTimeNs: BigInt(n),
  actualTimeNs: BigInt(n),
  presentationTimeNs: BigInt(n),
  frameDurationNs: 1n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const upstream = (n: number) => ({
  program: {
    runtimeFrameNumber: String(n),
    sceneReference: { sceneId: 'program', sceneGeneration: n },
  },
  preview: {
    runtimeFrameNumber: String(n),
    sceneReference: { sceneId: n % 2 ? 'preview' : 'program', sceneGeneration: n },
  },
  transition: { runtimeFrameNumber: String(n), transitionId: 'tx', progress: 0.5 },
  programAudio: { runtimeFrameNumber: String(n) },
  previewAudio: { runtimeFrameNumber: String(n) },
});
const c = createLiveProductionTallyCoordinator();
assert.equal(c.getSnapshot().control.commandMode, 'NORMAL');
c.registerEntity({
  entityId: 'source:cam1',
  entityType: 'SOURCE',
  entityGeneration: 1,
  sourceId: 'cam1',
  safeMetadata: { role: 'program' },
});
assert.throws(
  () => c.registerEntity({ entityId: 'source:cam1', entityType: 'SOURCE', entityGeneration: 1 }),
  /DuplicateTallyEntity/,
);
c.registerEntity({
  entityId: 'camera:cam1',
  entityType: 'CAMERA',
  entityGeneration: 2,
  sourceId: 'cam1',
  safeMetadata: { role: 'preview' },
});
c.registerEntity({
  entityId: 'guest:g1',
  entityType: 'REMOTE_GUEST',
  entityGeneration: 1,
  safeMetadata: { role: 'program', guestName: 'redacted' },
});
c.registerEntity({
  entityId: 'audio:pgm',
  entityType: 'AUDIO_SOURCE',
  entityGeneration: 1,
  safeMetadata: { role: 'program', muted: true },
});
c.registerEntity({
  entityId: 'pip:1',
  entityType: 'PIP_SLOT',
  entityGeneration: 1,
  slotId: '1',
  safeMetadata: { role: 'preview' },
});
c.registerEntity({
  entityId: 'role:record',
  entityType: 'OUTPUT_ROLE',
  entityGeneration: 1,
  outputRole: 'RECORD',
});
c.registerEntity({
  entityId: 'role:stream',
  entityType: 'OUTPUT_ROLE',
  entityGeneration: 1,
  outputRole: 'STREAM',
});
c.registerAdapter(createSyntheticTallyPublicationAdapter());
let s = c.processFrameTick(tick(1), upstream(1));
assert.equal(s.sceneTallies.length, 2);
assert.equal(s.sourceTallies[0].effectiveTallyState, 'PROGRAM');
assert.equal(s.cameraTallies[0].effectiveTallyState, 'PREVIEW');
assert.equal(s.guestTallies[0].effectiveTallyState, 'PROGRAM');
assert.equal(s.audioTallies[0].effectiveTallyState, 'PROGRAM');
assert.equal(s.pipSlotTallies[0].effectiveTallyState, 'PREVIEW');
assert.throws(() => c.processFrameTick(tick(1), upstream(1)), /TallyDuplicatePublication/);
assert.throws(() => c.processFrameTick(tick(2), upstream(3)), /TallyMixedTickInput/);
assert.equal(
  c.executeCommand({ requestId: 'r1', commandId: 'cmd1', commandType: 'LIVE_CONTROL_TAKE' }).status,
  'REJECTED',
);
assert.equal(
  c.executeCommand({ requestId: 'r2', commandId: 'cmd2', commandType: 'LIVE_CONTROL_ARM_PROGRAM' })
    .status,
  'COMPLETED',
);
assert.equal(
  c.executeCommand({ requestId: 'r3', commandId: 'cmd3', commandType: 'LIVE_CONTROL_TAKE' }).status,
  'COMPLETED',
);
assert.equal(
  c.executeCommand({ requestId: 'r3', commandId: 'cmd3', commandType: 'LIVE_CONTROL_TAKE' }).status,
  'REJECTED',
);
c.setOverride({ entityId: 'source:cam1', overrideType: 'FORCE_PREVIEW', generation: 1 });
s = c.processFrameTick(tick(4), upstream(4));
assert.equal(s.sourceTallies[0].effectiveTallyState, 'PREVIEW');
c.clearOverride('source:cam1');
s = c.processFrameTick(tick(5), upstream(5));
assert.equal(s.sourceTallies[0].effectiveTallyState, 'PROGRAM');
assert.equal(TALLY_PRIORITY.FAILED < TALLY_PRIORITY.PROGRAM, true);
assert.equal(c.assertInvariants(), true);
const replay = () => {
  const x = createLiveProductionTallyCoordinator();
  x.registerEntity({ entityId: 'source:a', entityType: 'SOURCE', entityGeneration: 1 });
  for (let i = 1; i <= 1000; i++) x.processFrameTick(tick(i), upstream(i));
  return JSON.stringify(x.getSnapshot().tally?.assignments);
};
assert.equal(replay(), replay());
const fake: any = {
  entries: new Map(),
  publish(_p: string, k: string, v: any) {
    this.entries.set(k, v);
  },
  readDependencyOutput(_p: string, k: string) {
    if (k.includes('program.state')) return upstream(9).program;
    if (k.includes('preview.state')) return upstream(9).preview;
    return { runtimeFrameNumber: '9' };
  },
};
new LiveProductionTallyProcessor(createLiveProductionTallyCoordinator()).processTick(tick(9), {
  outputs: fake,
} as ProcessorRuntimeContext);
assert.ok(fake.entries.has(LIVE_PRODUCTION_TALLY_OUTPUT_KEYS.snapshot));
assert.ok(LIVE_CONTROL_WATCHDOG_INCIDENTS.includes('TALLY_ADAPTER_FAILED'));
c.shutdown();
assert.throws(
  () => c.registerEntity({ entityId: 'x', entityType: 'SOURCE', entityGeneration: 1 }),
  /shutdown/,
);
console.log('UBOS v5.5.5 live-control/tally validation passed');
