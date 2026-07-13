import {
  createSceneSwitchReference,
  createSceneSwitchingController,
  SceneSwitchingProcessor,
} from './scene-switching.js';
import type { FrameTick } from './execution-engine.js';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const tick = (frame: bigint): FrameTick => ({
  frameNumber: frame,
  startedAtNs: frame * 1000n,
  deadlineAtNs: frame * 1000n,
  scheduledTimeNs: frame * 1000n,
  actualTimeNs: frame * 1000n,
  presentationTimeNs: frame * 1000n,
  frameDurationNs: 1000n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const scene = (id: string, state: 'READY' | 'DEGRADED' | 'FAILED' | 'LOADING' = 'READY') =>
  createSceneSwitchReference({
    sceneId: id,
    sceneGeneration: Number(id.replace(/\D/g, '')) || 1,
    readiness: {
      state,
      dependencySummary: [`dep:${id}`],
      generation: 1,
      updatedAtNs: '0',
      safeMetadata: {},
    },
    healthState: state === 'FAILED' ? 'FAILED' : state === 'DEGRADED' ? 'DEGRADED' : 'HEALTHY',
  });

const a = scene('scene-1'),
  b = scene('scene-2'),
  c = scene('scene-3'),
  d = scene('scene-4', 'DEGRADED'),
  f = scene('scene-5', 'FAILED');
const ctl = createSceneSwitchingController({ programScene: a, previewScene: b, queueCapacity: 8 });
[c, d, f].forEach((s) => ctl.registerScene(s));
assert(ctl.getSnapshot().program.scene?.sceneId === 'scene-1', 'program init');
ctl.setPreviewScene('scene-3');
assert(ctl.getSnapshot().program.scene?.sceneId === 'scene-1', 'preview isolation');
ctl.requestSwitch({
  mode: 'CUT',
  safeMetadata: { previewAfterCutPolicy: 'SWAP_WITH_PREVIOUS_PROGRAM' },
});
let r = ctl.processFrameTick(tick(1n));
assert(r?.status === 'COMPLETED', 'cut completes');
assert(ctl.getSnapshot().program.scene?.sceneId === 'scene-3', 'program changed');
assert(ctl.getSnapshot().preview.scene?.sceneId === 'scene-1', 'preview swapped');
ctl.setPreviewScene('scene-2');
ctl.requestSwitch({
  mode: 'TAKE',
  requestedTransitionType: 'dissolve',
  requestedDurationNs: '500000000',
  safeMetadata: { previewAfterCutPolicy: 'KEEP_SELECTED_SCENE' },
});
r = ctl.processFrameTick(tick(2n));
assert(r?.transitionAnimationApplied === false, 'take no animation');
assert(r?.transitionMetadata.type === 'dissolve', 'metadata kept');
let rejected = false;
try {
  ctl.requestSwitch({ mode: 'CUT' });
} catch {
  rejected = true;
}
assert(rejected, 'same scene rejected');
ctl.setPreviewScene('scene-4');
rejected = false;
try {
  ctl.requestSwitch({ mode: 'CUT' });
} catch {
  rejected = true;
}
assert(rejected, 'degraded rejected by default');
ctl.requestSwitch({
  mode: 'CUT',
  safeMetadata: { allowDegradedPreview: true, previewAfterCutPolicy: 'CLEAR_PREVIEW' },
});
ctl.processFrameTick(tick(3n));
assert(ctl.getSnapshot().preview.scene === null, 'clear preview');
ctl.setPreviewScene('scene-5');
rejected = false;
try {
  ctl.requestSwitch({ mode: 'CUT' });
} catch {
  rejected = true;
}
assert(rejected, 'failed rejected');
ctl.setPreviewScene('scene-1');
ctl.lockProgram();
rejected = false;
try {
  ctl.requestSwitch({ mode: 'CUT' });
} catch {
  rejected = true;
}
assert(rejected, 'lock rejected');
ctl.emergencyOverride();
ctl.requestSwitch({
  mode: 'CUT',
  safeMetadata: { allowSameSceneRefresh: true, previewAfterCutPolicy: 'FOLLOW_PROGRAM' },
});
ctl.processFrameTick(tick(4n));
assert(
  ctl.getSnapshot().preview.scene?.sceneId === ctl.getSnapshot().program.scene?.sceneId,
  'follow program',
);
ctl.setPreviewScene('scene-2');
ctl.requestSwitch({ mode: 'CUT', requestId: 'dup' });
rejected = false;
try {
  ctl.requestSwitch({ mode: 'CUT', requestId: 'dup' });
} catch {
  rejected = true;
}
assert(rejected, 'duplicate request');
ctl.processFrameTick(tick(5n));
const pg = ctl.getSnapshot().health.programGeneration;
ctl.processFrameTick(tick(5n));
assert(ctl.getSnapshot().health.programGeneration === pg, 'duplicate tick no mutate');
const procCtl = createSceneSwitchingController({ programScene: a, previewScene: b });
const proc = new SceneSwitchingProcessor(procCtl);
procCtl.requestSwitch({ mode: 'CUT' });
const pr = proc.processTick(tick(6n));
assert(pr.status === 'SUCCEEDED', 'processor tick');
for (let i = 0; i < 10000; i++) {
  ctl.registerScene(scene(`load-${i}`));
  ctl.setPreviewScene(`load-${i}`);
}
for (let i = 0; i < 1000; i++) {
  ctl.processFrameTick(tick(BigInt(100 + i)));
}
ctl.assertInvariants();
ctl.shutdown();
ctl.assertInvariants();
console.log(
  'UBOS v5.5.1 scene-switching validation passed',
  JSON.stringify({
    previewSelections: ctl.getTelemetry().previewSelections,
    duplicateTicks: ctl.getTelemetry().duplicateTicks,
  }),
);
