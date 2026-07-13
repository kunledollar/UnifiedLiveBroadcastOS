import type { FrameTick } from './execution-engine.js';
import {
  createAudioFollowSourceReference,
  createSceneAudioMembership,
  createAudioFollowVideoController,
  createAudioTransitionDefinition,
  AudioFollowVideoProcessor,
  AUDIO_FOLLOW_OUTPUT_KEYS,
} from './audio-follow-video.js';

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
const src = (
  id: string,
  role: 'PRIMARY' | 'HOST_MIC' | 'MUSIC' = 'PRIMARY',
  persistent = false,
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'MISSING' = 'AVAILABLE',
) =>
  createAudioFollowSourceReference({
    sourceId: id,
    streamId: `${id}-stream`,
    sourceGeneration: 1,
    streamGeneration: 1,
    category: 'synthetic',
    role,
    availability,
    active: true,
    muted: false,
    persistent,
    sampleRateHz: 48000,
    channels: 2,
    clockDomain: 'frame-tick',
    health: availability === 'AVAILABLE' ? 'HEALTHY' : 'FAILED',
  });
const membership = (
  sceneId: string,
  sources = [src(`${sceneId}-mic`)],
  defaults = sources.map((s) => s.sourceId),
) =>
  createSceneAudioMembership({
    sceneId,
    sceneGeneration: Number(sceneId.replace(/\D/g, '')) || 1,
    sceneInstanceId: `${sceneId}-instance`,
    sceneInstanceGeneration: 1,
    sources,
    defaultProgramAudioSourceIds: defaults,
    optionalAudioSourceIds: [],
    persistentAudioSourceIds: sources.filter((s) => s.persistent).map((s) => s.sourceId),
    mutedSourceIds: [],
    soloSourceIds: [],
    sourcePriorities: Object.fromEntries(sources.map((s, i) => [s.sourceId, i])),
    roleMappings: Object.fromEntries(sources.map((s) => [s.sourceId, s.role])),
    routingPolicy: {
      followMode: 'FOLLOW_PROGRAM_SCENE',
      missingSourcePolicy: 'FAIL_AUDIO_ROUTE',
      failurePolicy: 'DEGRADE_AND_NOTIFY',
    },
    transitionPolicy: {
      switchMode: 'CUT',
      commonSourcePolicy: 'KEEP_CONTINUOUS',
      persistentPolicy: 'PERSIST_ACROSS_SCENES',
    },
    safeMetadata: { note: 'safe', secretDevicePath: '/redacted' },
  });

const host = src('host-mic', 'HOST_MIC', true);
const music = src('music-bed', 'MUSIC', true);
const a = membership('scene-1', [host, music, src('camera-a')], ['host-mic', 'music-bed']);
const b = membership(
  'scene-2',
  [host, music, src('camera-b')],
  ['host-mic', 'music-bed', 'camera-b'],
);
const c = membership('scene-3', [src('desktop')], ['desktop']);
const ctl = createAudioFollowVideoController('scene-1', 'scene-2');
ctl.registerMembership(a);
ctl.registerMembership(b);
ctl.registerMembership(c);
assert(ctl.getSnapshot().programRoute.busId === 'PROGRAM_AUDIO', 'program bus init');
assert(ctl.getSnapshot().previewRoute.busId === 'PREVIEW_AUDIO', 'preview bus init');
let duplicate = false;
try {
  ctl.registerMembership(a);
} catch {
  duplicate = true;
}
assert(duplicate, 'duplicate membership rejected');
ctl.setPreviewRoute('scene-2');
assert(ctl.getSnapshot().programRoute.programSceneId === 'scene-1', 'preview isolation');
ctl.startRouting({
  requestId: 'cut-1',
  targetSceneId: 'scene-2',
  mode: 'CUT',
  frame: 1n,
  videoCommitFrame: 1n,
});
const cut = ctl.processFrameTick(tick(1n));
assert(cut?.status === 'COMPLETED', 'cut completed');
assert(cut!.audioVideoSynchronized, 'cut video/audio sync');
assert(cut!.realAudioMixApplied === false, 'metadata only audio');
assert(
  ctl.getSnapshot().programRoute.activeSources.some((s) => s.sourceId === 'host-mic'),
  'persistent host mic',
);
assert(
  ctl.getSnapshot().programRoute.contributions.filter((x) => x.sourceId === 'host-mic').length ===
    1,
  'no common-source double contribution',
);
ctl.setMode('HOLD_CURRENT');
ctl.startRouting({
  requestId: 'hold-1',
  targetSceneId: 'scene-3',
  mode: 'HOLD_CURRENT',
  frame: 2n,
});
ctl.processFrameTick(tick(2n));
assert(
  ctl.getSnapshot().programRoute.activeSources.some((s) => s.sourceId === 'host-mic'),
  'hold current',
);
ctl.setMode('MUTE');
ctl.startRouting({
  requestId: 'mute-1',
  targetSceneId: 'scene-3',
  mode: 'MUTE_THEN_SWITCH',
  frame: 3n,
});
ctl.processFrameTick(tick(3n));
assert(ctl.getSnapshot().programRoute.activeSources.length === 0, 'mute mode');
ctl.setMode('FOLLOW_PROGRAM_SCENE');
ctl.registerTransitionDefinition(
  createAudioTransitionDefinition({
    audioTransitionId: 'xfade',
    version: 1,
    generation: 1,
    mode: 'CROSSFADE',
    durationFrames: 3,
    durationNs: '3000',
    easing: 'LINEAR',
    sourceFadePolicy: 'METADATA_ONLY',
    targetFadePolicy: 'METADATA_ONLY',
    commonSourcePolicy: 'KEEP_CONTINUOUS',
    persistentSourcePolicy: 'PERSIST_ACROSS_SCENES',
    mutePolicy: 'METADATA_ONLY',
    silencePolicy: 'METADATA_ONLY',
    perRoleOverrides: {},
  }),
);
ctl.startRouting({
  requestId: 'auto-1',
  targetSceneId: 'scene-2',
  mode: 'CROSSFADE',
  frame: 4n,
  transitionDefinitionId: 'xfade',
});
assert(!ctl.processFrameTick(tick(4n)), 'animated route not committed at start');
ctl.processFrameTick(tick(5n));
const done = ctl.processFrameTick(tick(6n));
assert(done?.status === 'COMPLETED', 'animated completion');
assert(done!.transitionProgress === 1, 'final contribution exact');
const beforeDup = ctl.getSnapshot().programRoute.routeGeneration;
assert(!ctl.processFrameTick(tick(6n)), 'duplicate tick no mutation');
assert(
  ctl.getSnapshot().programRoute.routeGeneration === beforeDup,
  'duplicate tick preserves route',
);
let missing = false;
try {
  ctl.registerMembership(membership('scene-4', [src('optional')], ['missing-required']));
  ctl.startRouting({ requestId: 'missing-1', targetSceneId: 'scene-4', mode: 'CUT', frame: 7n });
} catch {
  missing = true;
}
assert(missing, 'missing required source rejected');
assert(ctl.createSourceGraphMetadata().programAudioRouteId, 'source graph metadata');
assert(ctl.getHealthSnapshot().duplicateTickCount === 1, 'health duplicate tick');
assert(ctl.getTelemetrySnapshot().routeCommits >= 4, 'telemetry route commits');
assert(Object.isFrozen(ctl.getSnapshot().memberships[0]), 'snapshot immutability');
assert(ctl.assertInvariants().valid, 'invariants');
const fakeOutputs = new Map<string, unknown>();
const processor = new AudioFollowVideoProcessor(ctl);
processor.processTick(tick(100n), {
  processorId: 'audio-follow-video',
  outputs: {
    publish(_p: string, k: string, v: unknown) {
      fakeOutputs.set(k, v);
    },
    read() {
      return undefined;
    },
    readDependencyOutput() {
      return undefined;
    },
    clearTick() {},
    entryCount() {
      return fakeOutputs.size;
    },
  },
} as never);
assert(fakeOutputs.has(AUDIO_FOLLOW_OUTPUT_KEYS.programRoute), 'output registry publication');
for (let i = 0; i < 100000; i++) ctl.processFrameTick(tick(BigInt(1000 + i)));
assert(ctl.assertInvariants().valid, '100000 processor ticks deterministic');
ctl.shutdownEngine();
ctl.shutdownEngine();
assert(ctl.getHealthSnapshot().activeTransactionCount === 0, 'shutdown clears active transactions');
console.log('audio-follow-video validation passed');
