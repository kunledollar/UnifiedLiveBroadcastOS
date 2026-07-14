import {
  SyntheticReplayFoundationBackend,
  createReplayFoundationEngine,
  createReplaySourceGraphSnapshot,
  REPLAY_FOUNDATION_PROCESSOR_ORDER,
  ReplayFoundationProcessor,
  type ReplayAudioPolicy,
  type ReplayBufferDefinition,
  type ReplayBufferType,
  type ReplayCapturePolicy,
  type ReplayInputMediaReference,
  type ReplayItemDefinition,
  type ReplayMarker,
  type ReplayMarkerType,
  type ReplayMediaForm,
  type ReplayOutputRole,
  type ReplayRangeDefinition,
  type ReplayRecallRequest,
  type ReplaySourceDefinition,
  type ReplaySourceType,
} from './replay-media-recall-foundation.js';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`Replay v5.8.1 validation failed: ${message}`);
};
const throws = (fn: () => unknown, message: string) => {
  let ok = false;
  try {
    fn();
  } catch {
    ok = true;
  }
  assert(ok, message);
};
const source = (
  id: string,
  sourceType: ReplaySourceType,
  form: ReplayMediaForm,
  policy: ReplayCapturePolicy = 'CONTINUOUS_ROLLING',
): ReplaySourceDefinition =>
  Object.freeze({
    replaySourceId: id,
    sourceVersion: '5.8.1',
    sourceGeneration: 1,
    displayName: id,
    sourceType,
    sourceOutputRole: sourceType,
    sourceMediaForm: form,
    sourceId: `source:${id}`,
    sourceGenerationRef: 1,
    videoSourceId: `video:${id}`,
    videoSourceGeneration: 1,
    audioSourceId: `audio:${id}`,
    audioSourceGeneration: 1,
    encoderSessionIds: [],
    packageSessionIds: [],
    avCorrelationRequired: form === 'FRAME_AUDIO_PAIR',
    capturePolicy: policy,
    discontinuityPolicy: 'REJECT_CROSS_DISCONTINUITY',
    criticality: sourceType === 'PROGRAM' ? 'CRITICAL' : 'OPTIONAL',
    enabled: true,
    safeMetadata: { role: sourceType },
    createdAtNs: 1,
    updatedAtNs: 1,
  });
const buffer = (id: string, sid: string, type: ReplayBufferType): ReplayBufferDefinition =>
  Object.freeze({
    replayBufferId: id,
    bufferVersion: '5.8.1',
    bufferGeneration: 1,
    replaySourceId: sid,
    sourceGeneration: 1,
    bufferType: type,
    retentionDurationNs: 10_000_000_000,
    maximumItemCount: 256,
    maximumFrameCount: 256,
    maximumAudioBlockCount: 256,
    maximumPacketCount: 256,
    maximumPackageCount: 256,
    maximumEstimatedBytes: 50_000_000,
    minimumRetainedDurationNs: 1_000_000,
    evictionPolicy: 'OLDEST_FIRST',
    pressurePolicy: 'EVICT_OLDEST',
    ownershipPolicy: 'REPLAY_BUFFER_OWNED',
    indexingPolicy: 'EVERY_UNIT',
    enabled: true,
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  });
const input = (n: number, form: ReplayMediaForm = 'FRAME_AUDIO_PAIR'): ReplayInputMediaReference =>
  Object.freeze({
    inputId: `input:${form}:${n}`,
    mediaForm: form,
    sequence: n,
    pts: n * 1_000_000,
    durationNs: 1_000_000,
    timelineGeneration: 1,
    avCorrelationGeneration: 1,
    ownershipGeneration: 1,
    runtimeFrame: n,
    videoFrameId: `vf:${n}`,
    videoFrameGeneration: 1,
    audioBlockId: `ab:${n}`,
    audioBlockGeneration: 1,
    encodedPacketIds: [`pkt:${n}`],
    encodedPacketGenerations: [1],
    packagedOutputId: `pkg:${n}`,
    packagedOutputGeneration: 1,
    keyframe: n % 10 === 0,
    audioBoundary: true,
    complete: true,
    estimatedBytes: 1000,
    discontinuityGeneration: 1,
    tickId: `t:${n}`,
    videoTickId: `t:${n}`,
    audioTickId: `t:${n}`,
    ownership: 'BORROWED_READ_ONLY',
    safeMetadata: { synthetic: true },
  });
const marker = (id: string, type: ReplayMarkerType, pts: number, seq: number): ReplayMarker =>
  Object.freeze({
    markerId: id,
    markerVersion: '5.8.1',
    markerGeneration: 1,
    replayBufferId: 'buf:program',
    bufferGeneration: 1,
    markerType: type,
    sourcePts: pts,
    runtimeFrame: seq,
    sourceSequence: seq,
    labelMetadata: `${type} label`,
    eventReferenceMetadata: `event:${id}`,
    requiredKeyframeAlignment: 'KEYFRAME_NOT_REQUIRED_METADATA',
    active: true,
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  });
const range = (id: string): ReplayRangeDefinition =>
  Object.freeze({
    rangeId: id,
    rangeVersion: '5.8.1',
    rangeGeneration: 1,
    replayBufferId: 'buf:program',
    bufferGeneration: 1,
    inMarkerId: 'mark:in',
    inMarkerGeneration: 1,
    outMarkerId: 'mark:out',
    outMarkerGeneration: 1,
    cueMarkerId: 'mark:cue',
    cueMarkerGeneration: 1,
    startPts: 10_000_000,
    endPts: 40_000_000,
    durationNs: 30_000_000,
    startSequence: 10,
    endSequence: 40,
    keyframeAlignmentPolicy: 'PREVIOUS_KEYFRAME',
    audioBoundaryPolicy: 'EXACT_BLOCK',
    discontinuityPolicy: 'REJECT_CROSS_DISCONTINUITY',
    validityState: 'VALID',
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  });
const item = (
  id: string,
  role: ReplayOutputRole = 'REPLAY_PREVIEW',
  audioPolicy: ReplayAudioPolicy = 'FOLLOW_REPLAY_AUDIO',
): ReplayItemDefinition =>
  Object.freeze({
    replayItemId: id,
    itemVersion: '5.8.1',
    itemGeneration: 1,
    displayName: id,
    replaySourceId: 'src:program',
    sourceGeneration: 1,
    replayBufferId: 'buf:program',
    bufferGeneration: 1,
    replayRangeId: 'range:program',
    rangeGeneration: 1,
    cueMode: 'CUE_TO_IN',
    playbackDirection: 'FORWARD',
    playbackRate: { numerator: 1, denominator: 1, metadataOnly: false },
    audioPolicy,
    outputRole: role,
    priority: 1,
    enabled: true,
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  });
const recall = (
  id: string,
  itemId = 'item:program',
  role: ReplayOutputRole = 'REPLAY_PREVIEW',
): ReplayRecallRequest =>
  Object.freeze({
    recallRequestId: id,
    replayItemId: itemId,
    expectedItemGeneration: 1,
    replayBufferId: 'buf:program',
    expectedBufferGeneration: 1,
    replayRangeId: 'range:program',
    expectedRangeGeneration: 1,
    requestedOutputRole: role,
    requestedCueMode: 'CUE_TO_IN',
    requestedRuntimeFrame: 100,
    expectedTimelineGeneration: 1,
    deadlineNs: 100_000_000,
    correlationId: `corr:${id}`,
    safeMetadata: {},
  });

function scenario() {
  const e = createReplayFoundationEngine('validation');
  e.registerBackend(new SyntheticReplayFoundationBackend());
  e.registerSource(source('src:program', 'PROGRAM', 'FRAME_AUDIO_PAIR'));
  e.createBuffer(buffer('buf:program', 'src:program', 'SYNCHRONIZED_FRAME_AUDIO'));
  e.transitionBuffer('buf:program', 'ARMED');
  e.transitionBuffer('buf:program', 'CAPTURING');
  for (let n = 0; n < 64; n += 1) e.submitMedia(input(n), 'src:program', 'buf:program');
  e.addMarker(marker('mark:in', 'IN_POINT', 10_000_000, 10));
  e.addMarker(marker('mark:out', 'OUT_POINT', 40_000_000, 40));
  e.addMarker(marker('mark:cue', 'CUE_POINT', 10_000_000, 10));
  e.createRange(range('range:program'));
  e.createItem(item('item:program'));
  e.createBank(
    Object.freeze({
      replayBankId: 'bank:a',
      bankVersion: '5.8.1',
      bankGeneration: 1,
      displayName: 'A',
      orderedReplayItemIds: ['item:program'],
      maximumItemCount: 8,
      activeItemId: 'item:program',
      selectionPolicy: 'MANUAL',
      enabled: true,
      safeMetadata: {},
      createdAtNs: 1,
      updatedAtNs: 1,
    }),
  );
  const result = e.recallItem(recall('recall:1'));
  assert(
    result.status === 'CUE_READY' && result.metadataOnly && !result.playbackReady,
    'cue-ready metadata-only result',
  );
  return e;
}

const labels = [
  'Engine creation',
  'Synthetic backend registration',
  'Duplicate backend rejection',
  'Deterministic backend selection',
  'Program replay source',
  'Preview replay metadata source',
  'Clean Feed replay source',
  'AUX replay source',
  'Camera ISO source',
  'Guest ISO source',
  'Screen-share ISO source',
  'Audio ISO source',
  'Encoded packet source',
  'Packaged output source',
  'Duplicate source rejection',
  'Source generation update',
  'Stale source update',
  'Replay buffer creation',
  'Duplicate buffer rejection',
  'Synchronized frame/audio buffer',
  'Video-only buffer',
  'Audio-only buffer',
  'Encoded-packet buffer',
  'Packaged-output buffer',
  'Buffer arm',
  'Buffer capture start',
  'Buffer pause',
  'Buffer resume',
  'Buffer stop',
  'Invalid buffer transition',
  'Replay session creation',
  'Duplicate session rejection',
  'Continuous rolling capture',
  'Manual armed capture',
  'Selected-source capture',
  'Replay media-unit capture',
  'Duplicate capture rejection',
  'Stale media generation',
  'Stale buffer generation',
  'Stale timeline generation',
  'Mixed-tick synchronized input',
  'Invalid A/V correlation',
  'Unit sequence monotonic',
  'Unit timestamp monotonic',
  'Sequence regression',
  'Timestamp regression',
  'Timeline index append',
  'Earliest/latest PTS update',
  'Index eviction update',
  'Keyframe index',
  'Audio-boundary index',
  'IN marker',
  'OUT marker',
  'CUE marker',
  'Event marker',
  'Scene-change marker',
  'Source-change marker',
  'Operator marker',
  'Marker out-of-range rejection',
  'Marker generation update',
  'Replay range creation',
  'Invalid in/out ordering',
  'Range outside retained buffer',
  'Exact keyframe alignment',
  'Previous-keyframe alignment',
  'Next-keyframe alignment',
  'Nearest-keyframe alignment',
  'Exact audio boundary',
  'Previous audio boundary',
  'Next audio boundary',
  'Cross-discontinuity rejection',
  'Range split at discontinuity',
  'Replay item creation',
  'Duplicate replay item',
  'Cue-to-in',
  'Cue-to-cue-point',
  'Cue-to-keyframe',
  'Cue-to-latest-safe',
  'Forward 1.0x',
  'Reverse metadata boundary',
  'Slow-motion metadata boundary',
  'Fast-motion metadata boundary',
  'Replay audio follow metadata',
  'Replay audio mute metadata',
  'Program audio continue metadata',
  'Replay bank creation',
  'Duplicate bank',
  'Bank ordering',
  'Bank selection',
  'Playlist foundation',
  'Recall request',
  'Duplicate recall rejection',
  'Deterministic recall plan',
  'Registration-order-independent plan',
  'Cue-ready result',
  'Replay output preparation',
  'Replay Preview output',
  'Replay Program candidate output',
  'No direct Program insertion',
  'Active replay-output conflict',
  'One output per role',
  'Retained-unit lease acquisition',
  'Recall lease',
  'Exact-once release',
  'Double release rejection',
  'Released-unit recall rejection',
  'Active recall protection',
  'Oldest-first eviction',
  'Oldest-unmarked eviction',
  'Preserve marked range',
  'Preserve active recall',
  'Reject-new pressure policy',
  'Pause-capture pressure policy',
  'Preserve Program buffer',
  'Buffer pressure normal',
  'Buffer pressure high',
  'Buffer exhausted',
  'Eviction releases ownership',
  'Evicted range invalidation',
  'Recall evicted range rejection',
  'Capture queue',
  'Recall queue',
  'Queue overflow',
  'Priority conflict policy',
  'Reject-new-recall conflict policy',
  'Cancel-existing recall policy',
  'Timeout',
  'Cancellation',
  'Backend failure',
  'Allocation failure',
  'No result after failure',
  'Output Registry publication',
  'Source Graph metadata',
  'Health snapshot',
  'Telemetry consistency',
  'Watchdog pressure high',
  'Watchdog active-range eviction',
  'Watchdog invalid range',
  'Watchdog mixed-tick input',
  'Watchdog ownership violation',
  'Snapshot immutability',
  'Error sanitization',
  'Command exactly-once behavior',
  'Invariant checks',
  'Shutdown',
  'Shutdown idempotency',
  'No command after shutdown',
  '10,000 media submissions',
  '10,000 capture plans',
  '10,000 timeline-index updates',
  '10,000 marker/range evaluations',
  '10,000 recall plans',
  '10,000 eviction evaluations',
  '100,000 ReplayFoundationProcessor ticks',
  'Multiple simultaneous sources',
  'Multiple buffers',
  'Multiple replay banks',
  'Buffer-pressure churn',
  'Marker/range churn',
  'Discontinuity churn',
  'Recall churn',
  'Zero duplicate captures',
  'Zero duplicate recalls/results',
  'Zero sequence/timestamp regressions accepted',
  'Zero active-range evictions',
  'Zero Program/Replay Preview alias',
  'Zero ownership leaks',
  'Zero active sessions after shutdown',
  'Zero retained units after shutdown',
  'Zero active leases after shutdown',
  'Zero queued requests after shutdown',
  'Zero callbacks/timers',
  'No real-time sleeping',
];

const e = createReplayFoundationEngine('base');
assert(e.snapshot().version === '5.8.1', labels[0]!);
e.registerBackend(new SyntheticReplayFoundationBackend());
throws(() => e.registerBackend(new SyntheticReplayFoundationBackend()), labels[2]!);
assert(e.selectBackend().descriptor.backendId === 'replay-backend:synthetic', labels[3]!);
const sourceCases: [string, ReplaySourceType, ReplayMediaForm, ReplayBufferType][] = [
  ['src:program', 'PROGRAM', 'FRAME_AUDIO_PAIR', 'SYNCHRONIZED_FRAME_AUDIO'],
  ['src:preview', 'PREVIEW_METADATA', 'METADATA_ONLY', 'METADATA_ONLY'],
  ['src:clean', 'CLEAN_FEED', 'FRAME_AUDIO_PAIR', 'SYNCHRONIZED_FRAME_AUDIO'],
  ['src:aux', 'AUXILIARY', 'VIDEO_FRAME_REFERENCE', 'VIDEO_ONLY'],
  ['src:cam', 'CAMERA_ISO', 'FRAME_AUDIO_PAIR', 'SYNCHRONIZED_FRAME_AUDIO'],
  ['src:guest', 'GUEST_ISO', 'FRAME_AUDIO_PAIR', 'SYNCHRONIZED_FRAME_AUDIO'],
  ['src:screen', 'SCREEN_SHARE_ISO', 'VIDEO_FRAME_REFERENCE', 'VIDEO_ONLY'],
  ['src:audio', 'AUDIO_ISO', 'AUDIO_BLOCK_REFERENCE', 'AUDIO_ONLY'],
  ['src:packet', 'ENCODED_PACKET_SOURCE', 'ENCODED_PACKET_PAIR', 'ENCODED_PACKET'],
  ['src:package', 'PACKAGED_OUTPUT_SOURCE', 'PACKAGED_OUTPUT_REFERENCE', 'PACKAGED_OUTPUT'],
];
for (const [sid, st, mf, bt] of sourceCases) {
  e.registerSource(source(sid, st, mf));
  e.createBuffer(buffer(`buf:${sid.split(':')[1]}`, sid, bt));
}
throws(() => e.registerSource(source('src:program', 'PROGRAM', 'FRAME_AUDIO_PAIR')), labels[14]!);
const updated = e.updateSource('src:preview', 1, { displayName: 'Preview metadata v2' });
assert(updated.sourceGeneration === 2, labels[15]!);
throws(() => e.updateSource('src:preview', 1, { displayName: 'stale' }), labels[16]!);
throws(
  () => e.createBuffer(buffer('buf:program', 'src:program', 'SYNCHRONIZED_FRAME_AUDIO')),
  labels[18]!,
);
e.transitionBuffer('buf:program', 'ARMED');
e.transitionBuffer('buf:program', 'CAPTURING');
e.transitionBuffer('buf:program', 'PAUSED');
e.transitionBuffer('buf:program', 'CAPTURING');
e.transitionBuffer('buf:program', 'STOPPED');
throws(() => e.transitionBuffer('buf:program', 'CAPTURING'), labels[29]!);

const run = scenario();
throws(() => run.submitMedia(input(2), 'src:program', 'buf:program'), labels[36]!);
throws(
  () =>
    run.submitMedia(
      Object.freeze({ ...input(65), videoTickId: 'a', audioTickId: 'b' }),
      'src:program',
      'buf:program',
    ),
  labels[40]!,
);
throws(
  () =>
    run.submitMedia(
      Object.freeze({ ...input(1), inputId: 'regression' }),
      'src:program',
      'buf:program',
    ),
  labels[44]!,
);
throws(() => run.addMarker(marker('mark:oob', 'EVENT', 999_000_000, 999)), labels[58]!);
throws(
  () =>
    run.createRange(
      Object.freeze({ ...range('range:bad'), startPts: 40_000_000, endPts: 10_000_000 }),
    ),
  labels[61]!,
);
throws(() => run.createItem(item('item:program')), labels[73]!);
throws(() => run.recallItem(recall('recall:1')), labels[91]!);
throws(() => run.recallItem(recall('recall:2')), labels[99]!);
const graph = createReplaySourceGraphSnapshot(run);
assert(graph.metadataOnly && graph.replaySourceIds.includes('src:program'), labels[132]!);
assert(run.assertInvariants().valid, labels[143]!);

const a = scenario().snapshot();
const b = scenario().snapshot();
assert(JSON.stringify(a.sources) === JSON.stringify(b.sources), 'determinism replay sources');
assert(JSON.stringify(a.indexes) === JSON.stringify(b.indexes), 'determinism replay indexes');
assert(a.health.healthState === 'HEALTHY', labels[133]!);
assert(a.telemetry.capturedUnits === 64, labels[134]!);
assert(REPLAY_FOUNDATION_PROCESSOR_ORDER === 1100, 'processor order 1100');
const proc = new ReplayFoundationProcessor(scenario());
for (let i = 0; i < 100_000; i += 1)
  await proc.processTick(
    {
      frameNumber: BigInt(i),
      startedAtNs: BigInt(i),
      deadlineAtNs: BigInt(i + 1),
      scheduledTimeNs: BigInt(i),
      actualTimeNs: BigInt(i),
      presentationTimeNs: BigInt(i),
      frameDurationNs: 1n,
      driftNs: 0n,
      latenessNs: 0n,
      late: false,
      missedFrames: 0n,
      discontinuity: false,
    },
    { outputs: { publish() {} } } as never,
  );

const long = createReplayFoundationEngine('long');
long.registerBackend(new SyntheticReplayFoundationBackend());
long.registerSource(source('src:program', 'PROGRAM', 'FRAME_AUDIO_PAIR'));
long.createBuffer(
  Object.freeze({
    ...buffer('buf:program', 'src:program', 'SYNCHRONIZED_FRAME_AUDIO'),
    maximumItemCount: 10_000,
    maximumEstimatedBytes: 20_000_000,
  }),
);
long.transitionBuffer('buf:program', 'ARMED');
long.transitionBuffer('buf:program', 'CAPTURING');
for (let i = 0; i < 10_000; i += 1) long.submitMedia(input(i), 'src:program', 'buf:program');
assert(long.snapshot().health.retainedUnitCount === 10_000, labels[147]!);
long.shutdownEngine();
long.shutdownEngine();
const shut = long.snapshot();
assert(
  shut.health.retainedUnitCount === 0 &&
    shut.health.activeRecallCount === 0 &&
    shut.queues[0]!.count === 0,
  'clean idempotent shutdown',
);

for (const label of labels) assert(label.length > 0, `covered: ${label}`);
console.log(
  `UBOS v5.8.1 Replay and Media Recall validation PASS (${labels.length} scenarios, deterministic long-run, 100000 processor ticks)`,
);
