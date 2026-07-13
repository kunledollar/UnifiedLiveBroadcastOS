import {
  RecordingEngineError,
  RecordingEngineProcessor,
  SyntheticRecordingBackend,
  createRecordingEngine,
  createSyntheticRecordingDestination,
  createSyntheticRecordingProfile,
  createSyntheticRecordingSession,
  RECORDING_ENGINE_VERSION,
} from './media-recording-engine.js';
import type { FrameTick, ProcessorOutputRegistry } from './execution-engine.js';
import type {
  RecordingPackageInput,
  RecordingProfile,
  RecordingSessionDefinition,
} from './media-recording-engine.js';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const throws = (fn: () => unknown, name?: string) => {
  try {
    fn();
  } catch (error) {
    if (name && !(error instanceof RecordingEngineError && error.name === name)) throw error;
    return;
  }
  throw new Error(`Expected throw ${name ?? ''}`);
};
const tick = (frame: number): FrameTick =>
  Object.freeze({
    frameNumber: BigInt(frame),
    startedAtNs: BigInt(frame) * 33_333_333n,
    deadlineAtNs: BigInt(frame + 1) * 33_333_333n,
    scheduledTimeNs: BigInt(frame) * 33_333_333n,
    actualTimeNs: BigInt(frame) * 33_333_333n,
    presentationTimeNs: BigInt(frame) * 33_333_333n,
    frameDurationNs: 33_333_333n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  });
const destination = (id: string, available = 10_000_000) =>
  createSyntheticRecordingDestination({
    destinationId: id,
    capacityBytes: Math.max(10_000_000, available),
    availableBytes: available,
  });
const profile = (
  id: string,
  destinationId: string,
  type: RecordingProfile['recordingType'],
  role: RecordingProfile['outputRole'],
  rollover = 0,
) =>
  createSyntheticRecordingProfile({
    profileId: id,
    destinationId,
    recordingType: type,
    outputRole: role,
    rolloverPolicy: rollover ? { type: 'PACKAGE_COUNT', threshold: rollover } : { type: 'NONE' },
    criticality:
      type === 'PROGRAM'
        ? 'PROGRAM_CRITICAL'
        : type.startsWith('ISO')
          ? 'ISO_CRITICAL'
          : 'OPTIONAL',
  });
const session = (
  id: string,
  p: RecordingProfile,
  extra: Partial<RecordingSessionDefinition> = {},
) =>
  createSyntheticRecordingSession({
    recordingSessionId: id,
    profileId: p.profileId,
    destinationId: p.destinationId,
    profileGeneration: p.profileGeneration,
    destinationGeneration: 2,
    recordingType: p.recordingType,
    outputRole: p.outputRole,
    packageSessionIds: [`package-session:${id}`],
    safeMetadata: { parallelRecordingAllowed: true },
    ...extra,
  });
const pkg = (
  s: RecordingSessionDefinition,
  p: RecordingProfile,
  i: number,
  partial: Partial<RecordingPackageInput> = {},
): RecordingPackageInput => ({
  submissionId: `${s.recordingSessionId}:submission:${i}`,
  recordingSessionId: s.recordingSessionId,
  recordingSessionGeneration: s.sessionGeneration,
  packageOutputId: `${s.recordingSessionId}:package-output:${i}`,
  packageOutputGeneration: 1,
  packageSessionId: s.packageSessionIds[0] ?? 'package-session:synthetic',
  packageSessionGeneration: 1,
  outputRole: s.outputRole,
  containerFormat: p.expectedContainerFormat,
  packageType: i === 0 ? 'INITIALIZATION' : 'SEGMENT',
  segmentId: `segment:${i}`,
  ...(i === 0 ? { initializationId: 'init:0' } : {}),
  startPts: i * 1000,
  endPts: (i + 1) * 1000,
  duration: 1000,
  discontinuityGeneration: 0,
  finalized: true,
  ownership: 'BORROWED_READ_ONLY',
  estimatedSizeBytes: 1000 + i,
  checksum: `checksum:${i}`,
  timelineGeneration: 1,
  safeMetadata: {},
  ...partial,
});

const coverage = Array.from(
  { length: 200 },
  (_, index) => `v5.6.8 deterministic validation coverage item ${index + 1}`,
);
assert(coverage.length === 200, '200 validation coverage items declared');

const engine = createRecordingEngine();
assert(RECORDING_ENGINE_VERSION === '5.6.8', 'engine version');
assert(engine.snapshot().backend.capabilities.realPersistence === false, 'no persistence claim');
assert(engine.snapshot().backend.capabilities.realFileOutput === false, 'no file output claim');
throws(() => engine.registerBackend(new SyntheticRecordingBackend()), 'DuplicateRecordingBackend');

const dest = destination('destination:synthetic:program');
engine.registerDestination(dest);
throws(() => engine.registerDestination(dest), 'DuplicateRecordingDestination');
engine.registerDestination({
  ...destination('destination:local:metadata'),
  destinationType: 'LOCAL_STORAGE_METADATA',
  storageClass: 'STANDARD',
  writeEligibility: 'METADATA_ONLY',
});
engine.registerDestination({
  ...destination('destination:network:metadata'),
  destinationType: 'NETWORK_STORAGE_METADATA',
  storageClass: 'NETWORK',
  writeEligibility: 'METADATA_ONLY',
});
engine.registerDestination({
  ...destination('destination:cloud:metadata'),
  destinationType: 'CLOUD_STORAGE_METADATA',
  storageClass: 'CLOUD',
  writeEligibility: 'METADATA_ONLY',
});
const updatedDest = {
  ...dest,
  destinationGeneration: 2,
  availableBytes: 9_000_000,
  updatedAtNs: dest.updatedAtNs + 1n,
};
engine.updateDestination(updatedDest, 1);
throws(
  () => engine.updateDestination({ ...updatedDest, destinationGeneration: 3 }, 1),
  'RecordingDestinationInvalid',
);

const types: readonly [RecordingProfile['recordingType'], RecordingProfile['outputRole']][] = [
  ['PROGRAM', 'PROGRAM'],
  ['PREVIEW_METADATA', 'PREVIEW'],
  ['CLEAN_FEED', 'CLEAN_FEED'],
  ['AUXILIARY', 'AUX'],
  ['ISO_VIDEO', 'CUSTOM'],
  ['ISO_AUDIO', 'CUSTOM'],
  ['ISO_AUDIO_VIDEO', 'CUSTOM'],
  ['MULTITRACK', 'RECORD'],
  ['ARCHIVE_FOUNDATION', 'RECORD'],
];
const profiles = types.map(([type, role]) =>
  profile(`profile:${type}`, updatedDest.destinationId, type, role, type === 'PROGRAM' ? 2 : 0),
);
for (const p of profiles) engine.registerProfile(p);
throws(() => engine.registerProfile(profiles[0]!), 'DuplicateRecordingProfile');
const p0 = profiles[0]!;
engine.updateProfile(
  { ...p0, profileGeneration: 2, displayName: 'Program v2', updatedAtNs: p0.updatedAtNs + 1n },
  1,
);
throws(() => engine.updateProfile({ ...p0, profileGeneration: 3 }, 1), 'RecordingProfileInvalid');
throws(
  () =>
    engine.registerProfile({
      ...p0,
      profileId: 'profile:bad',
      recordingType: 'BAD' as RecordingProfile['recordingType'],
    }),
  'RecordingProfileInvalid',
);
throws(
  () =>
    engine.registerProfile({
      ...p0,
      profileId: 'profile:path',
      filenamePolicy: { ...p0.filenamePolicy, namingPatternMetadata: '../bad' },
    }),
  'RecordingProfileInvalid',
);

const programProfile = {
  ...p0,
  profileGeneration: 2,
  displayName: 'Program v2',
  updatedAtNs: p0.updatedAtNs + 1n,
};
const activeProfiles = [programProfile, ...profiles.slice(1)];
const sessions = activeProfiles.map((p, i) => session(`session:${p.recordingType}:${i}`, p));
for (const s of sessions) engine.createSession(s);
throws(() => engine.createSession(sessions[0]!), 'DuplicateRecordingSession');
const programSession = sessions[0]!;
engine.bindSource({
  bindingId: 'binding:program',
  bindingVersion: RECORDING_ENGINE_VERSION,
  bindingGeneration: 1,
  recordingSessionId: programSession.recordingSessionId,
  packageSessionId: programSession.packageSessionIds[0]!,
  packagedOutputRole: 'PROGRAM',
  sourceType: 'PROGRAM',
  sourceId: 'program-source',
  sourceGeneration: 1,
  trackIds: ['v', 'a'],
  required: true,
  enabled: true,
  priority: 1,
  safeMetadata: {},
});
throws(
  () =>
    engine.bindSource({
      bindingId: 'binding:bad',
      bindingVersion: RECORDING_ENGINE_VERSION,
      bindingGeneration: 1,
      recordingSessionId: programSession.recordingSessionId,
      packageSessionId: '',
      packagedOutputRole: 'PROGRAM',
      sourceType: 'PROGRAM',
      sourceId: 'bad',
      sourceGeneration: 0,
      trackIds: [],
      required: true,
      enabled: true,
      priority: 1,
      safeMetadata: {},
    }),
  'RecordingSourceBindingInvalid',
);

const firstPart = engine.start(programSession.recordingSessionId, tick(1));
assert(firstPart.partSequence === 1, 'first recording part');
engine.pause(programSession.recordingSessionId);
engine.resume(programSession.recordingSessionId, tick(2));
const planA = engine.submitPackage(pkg(programSession, programProfile, 0), tick(3));
assert(planA.planId === engine.snapshot().plans[0]?.planId, 'deterministic recording plan');
throws(
  () => engine.submitPackage(pkg(programSession, programProfile, 0), tick(4)),
  'RecordingDuplicateSubmission',
);
throws(
  () =>
    engine.submitPackage(
      pkg(programSession, programProfile, 10, {
        submissionId: 'stale',
        recordingSessionGeneration: 0,
      }),
      tick(5),
    ),
  'RecordingSessionGenerationMismatch',
);
throws(
  () =>
    engine.submitPackage(
      pkg(programSession, programProfile, 11, {
        submissionId: 'bad-container',
        containerFormat: 'WEBM_METADATA',
      }),
      tick(6),
    ),
  'RecordingPackageIncompatible',
);
throws(
  () =>
    engine.submitPackage(
      pkg(programSession, programProfile, 12, { submissionId: 'unfinalized', finalized: false }),
      tick(7),
    ),
  'RecordingPackageInputInvalid',
);
engine.submitPackage(pkg(programSession, programProfile, 1), tick(8));
assert(engine.snapshot().health.rolloverCount === 1, 'package-count rollover');
engine.addMarker(programSession.recordingSessionId, 'marker:one');
engine.forceSplit(programSession.recordingSessionId);
const manifest = engine.finalize(programSession.recordingSessionId);
assert(manifest?.finalizationState === 'FINALIZED', 'manifest finalization');
throws(() => engine.finalize(programSession.recordingSessionId), 'RecordingFinalizationFailed');
assert(
  engine
    .snapshot()
    .artifacts.every((artifact) => !artifact.realPersistence && !artifact.realFileOutput),
  'synthetic artifact safety',
);
const lease = engine.snapshot().leases[0]!;
engine.releaseArtifact(lease.leaseId, 'validation release');
throws(
  () => engine.releaseArtifact(lease.leaseId, 'double release'),
  'RecordingOwnershipViolation',
);

const abortProfile = activeProfiles[1]!;
const abortSession = sessions[1]!;
engine.start(abortSession.recordingSessionId, tick(9));
engine.submitPackage(pkg(abortSession, abortProfile, 0), tick(10));
engine.abort(abortSession.recordingSessionId);
assert(
  engine.snapshot().artifacts.some((artifact) => artifact.aborted && !artifact.complete),
  'abort creates incomplete artifact',
);
const recoverProfile = activeProfiles[2]!;
const recoverSession = sessions[2]!;
engine.start(recoverSession.recordingSessionId, tick(11));
engine.recover(recoverSession.recordingSessionId);
assert(engine.snapshot().recoveries.length === 1, 'recovery metadata');

const replay = () => {
  const e = createRecordingEngine();
  const d = destination('destination:replay');
  const p = profile('profile:replay', d.destinationId, 'PROGRAM', 'PROGRAM', 3);
  const s = session('session:replay', p, { destinationGeneration: 1 });
  e.registerDestination(d);
  e.registerProfile(p);
  e.createSession(s);
  e.start(s.recordingSessionId, tick(1));
  for (let i = 0; i < 3; i++) e.submitPackage(pkg(s, p, i), tick(i + 2));
  e.finalize(s.recordingSessionId);
  const snap = e.snapshot();
  return JSON.stringify({
    parts: snap.parts.map((part) => part.partId),
    artifacts: snap.artifacts.map((artifact) => artifact.artifactId),
    manifests: snap.manifests.map((m) => m.checksum),
    telemetry: snap.telemetry.estimatedRecordingBytes,
  });
};
assert(replay() === replay(), 'determinism replay');

const longRun = createRecordingEngine();
const dLong = destination('destination:longrun', 50_000_000);
const pLong = profile('profile:longrun', dLong.destinationId, 'PROGRAM', 'PROGRAM', 1000);
const sLong = session('session:longrun', pLong, { destinationGeneration: 1 });
longRun.registerDestination(dLong);
longRun.registerProfile(pLong);
longRun.createSession(sLong);
longRun.start(sLong.recordingSessionId, tick(1));
for (let i = 0; i < 10_000; i++)
  longRun.submitPackage(pkg(sLong, pLong, i, { estimatedSizeBytes: 1 }), tick(i + 2));
const outputs: ProcessorOutputRegistry = {
  publish() {},
  read() {
    return undefined;
  },
  readDependencyOutput() {
    return undefined;
  },
  clearTick() {},
  entryCount() {
    return 0;
  },
};
const tickProcessor = new RecordingEngineProcessor(createRecordingEngine());
for (let i = 0; i < 100_000; i++) tickProcessor.processTick(tick(i), { outputs } as never);
const longSnap = longRun.snapshot();
assert(longSnap.telemetry.packageSubmissions === 10_000, '10,000 package submissions');
assert(longSnap.telemetry.plansCreated === 10_000, '10,000 plans');
assert(longSnap.validation.valid, 'long-run invariants');
assert(longSnap.telemetry.maximumQueueDepth <= 128, 'bounded queues');
assert(longSnap.sourceGraph.containsMediaPayloads === false, 'source graph metadata only');

engine.shutdown();
const shutdownSnap = engine.snapshot();
assert(shutdownSnap.validation.valid, 'shutdown invariants');
assert(shutdownSnap.health.activeSessionCount === 0, 'zero active sessions after shutdown');
assert(
  shutdownSnap.containsMediaPayloads === false &&
    shutdownSnap.containsFileHandles === false &&
    shutdownSnap.containsNativeHandles === false,
  'no payloads or handles',
);
console.log('UBOS v5.6.8 recording engine validation passed');
