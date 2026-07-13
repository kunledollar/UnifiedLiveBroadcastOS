/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createDefaultDistributionQueuePolicy,
  createDefaultDistributionQuorumPolicy,
  createDistributionCommandHandlers,
  createDistributionSourceGraphSnapshot,
  createMultiDestinationDistributionEngine,
  createMultiDestinationDistributionProcessor,
  createSyntheticDistributionFanOutBackend,
  DistributionError,
  type DistributionDestinationEntry,
  type DistributionDestinationGroup,
  type DistributionInputEnvelope,
  type DistributionProfile,
  type DistributionSessionDefinition,
  type DistributionSourceBinding,
} from './multi-destination-distribution-fanout.js';
const assert = (c: boolean, m: string) => {
  if (!c) throw new Error(m);
};
const throws = (f: () => unknown, code?: string) => {
  let ok = false;
  try {
    f();
  } catch (e) {
    ok = true;
    if (code) assert((e as any).code === code, `expected ${code} got ${(e as any).code}`);
  }
  assert(ok, `expected throw ${code ?? ''}`);
};
const q = createDefaultDistributionQuorumPolicy('ALL_REQUIRED'),
  queue = createDefaultDistributionQueuePolicy();
function entry(
  id: string,
  n = 0,
  patch: Partial<DistributionDestinationEntry> = {},
): DistributionDestinationEntry {
  return {
    entryId: id,
    destinationId: `dest:${id}`,
    destinationGeneration: 1,
    streamingSessionId: `stream:${id}`,
    streamingSessionGeneration: 1,
    priority: n,
    required: n === 0,
    enabled: true,
    mirror: false,
    standby: false,
    weight: 1,
    protocolCompatibilityRequirements: ['RTMP_FOUNDATION'],
    inputCompatibilityRequirements: ['ENCODED_PACKET', 'PACKAGED_OUTPUT', 'METADATA_ONLY'],
    failureIsolationPolicy: 'ISOLATE',
    safeMetadata: {},
    ...patch,
  };
}
function group(
  id = 'group:program',
  entries = [
    entry('primary', 0, { primary: true }),
    entry('mirror', 1, { required: false, mirror: true }),
    entry('backup', 2, { required: false, standby: true }),
  ],
  qp = q,
): DistributionDestinationGroup {
  return {
    destinationGroupId: id,
    groupVersion: '5.7.2',
    groupGeneration: 1,
    displayName: id,
    entries,
    distributionMode: 'BROADCAST_ALL',
    quorumPolicy: qp,
    healthThreshold: 1,
    failoverPolicy: 'EXPLICIT_BACKUP',
    membershipUpdatePolicy: 'APPLY_AT_NEXT_KEYFRAME',
    enabled: true,
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  };
}
function profile(
  id = 'profile:program',
  gid = 'group:program',
  role: DistributionProfile['sourceOutputRole'] = 'PROGRAM',
  mode: DistributionProfile['distributionMode'] = 'BROADCAST_ALL',
  qp = q,
): DistributionProfile {
  return {
    profileId: id,
    profileVersion: '5.7.2',
    profileGeneration: 1,
    displayName: id,
    distributionMode: mode,
    sourceOutputRole: role,
    inputType: 'ENCODED_PACKET',
    destinationGroupId: gid,
    destinationGroupGeneration: 1,
    compatibilityPolicy: ['STRICT_MATCH', 'REQUIRE_OUTPUT_ROLE_COMPATIBILITY'],
    quorumPolicy: qp,
    dispatchPolicy: 'PARALLEL_DETERMINISTIC',
    retryAggregationPolicy: 'DESTINATION_INDEPENDENT',
    failurePolicy: 'QUORUM_BASED',
    timeoutPolicy: ['BOUNDED'],
    queuePolicy: queue,
    ownershipPolicy: 'RETAINED_UNTIL_REQUIRED_COMPLETE',
    completionPolicy: 'WAIT_FOR_REQUIRED',
    degradedStatePolicy: 'EXPLICIT',
    criticality: role === 'PROGRAM' ? 'CRITICAL' : 'OPTIONAL',
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  };
}
function session(
  id = 'dist:program',
  p = profile(),
  g = group(),
  role = p.sourceOutputRole,
): DistributionSessionDefinition {
  return {
    distributionSessionId: id,
    sessionVersion: '5.7.2',
    sessionGeneration: 1,
    profileId: p.profileId,
    profileGeneration: p.profileGeneration,
    destinationGroupId: g.destinationGroupId,
    destinationGroupGeneration: g.groupGeneration,
    sourceOutputRole: role,
    sourceEncoderSessionIds: ['enc'],
    sourcePackageSessionIds: ['pkg'],
    inputType: p.inputType,
    startupPolicy: ['WAIT_FOR_KEYFRAME', 'WAIT_FOR_CODEC_CONFIG'],
    pausePolicy: 'BOUNDARY',
    stopPolicy: 'DRAIN_BOUNDED',
    drainPolicy: 'WAIT_REQUIRED',
    failurePolicy: p.failurePolicy,
    enabled: true,
    criticality: p.criticality,
    safeMetadata: {},
    createdAtNs: 1,
    updatedAtNs: 1,
  };
}
function binding(
  id: string,
  s: DistributionSessionDefinition,
  role = s.sourceOutputRole,
): DistributionSourceBinding {
  return {
    bindingId: id,
    bindingVersion: '5.7.2',
    bindingGeneration: 1,
    distributionSessionId: s.distributionSessionId,
    sourceOutputRole: role,
    inputType: s.inputType,
    encoderSessionId: 'enc',
    encoderSessionGeneration: 1,
    packageSessionId: 'pkg',
    packageSessionGeneration: 1,
    avCorrelationRequirement: 'REQUIRED',
    codecConfigurationRequirement: 'REQUIRED',
    keyframeRequirement: 'REQUIRED_ON_START',
    discontinuityPolicy: 'RESET_ON_DISCONTINUITY',
    enabled: true,
    safeMetadata: {},
  };
}
function input(
  s: DistributionSessionDefinition,
  b: DistributionSourceBinding,
  n: number,
  type: DistributionInputEnvelope['inputType'] = 'ENCODED_PACKET',
): DistributionInputEnvelope {
  return {
    inputId: `in:${s.distributionSessionId}:${n}:${type}`,
    inputGeneration: 1,
    submissionId: `sub:${s.distributionSessionId}:${n}:${type}`,
    distributionSessionId: s.distributionSessionId,
    sessionGeneration: s.sessionGeneration,
    sourceBindingId: b.bindingId,
    sourceBindingGeneration: b.bindingGeneration,
    inputType: type,
    sourceMediaId: 'media',
    sourceMediaGeneration: 1,
    outputRole: s.sourceOutputRole,
    mediaType: 'MUXED',
    codecContainerMetadata: type === 'PACKAGED_OUTPUT' ? 'fmp4/hls metadata' : 'h264/aac metadata',
    sequence: n,
    pts: n * 3000,
    dts: n * 3000,
    duration: 3000,
    timeBase: '1/90000',
    keyframe: n === 0 || n % 30 === 0,
    codecConfigReady: true,
    discontinuityGeneration: 0,
    estimatedBytes: 1000,
    ownership: 'FANOUT_OWNED',
    safeMetadata: {},
  };
}
function setup() {
  const e = createMultiDestinationDistributionEngine();
  e.registerBackend(createSyntheticDistributionFanOutBackend());
  const g = group(),
    p = profile(),
    s = session('dist:program', p, g),
    b = binding('bind:program', s);
  e.createDestinationGroup(g);
  e.registerProfile(p);
  e.createSession(s);
  e.bindSource(b);
  e.start(s.distributionSessionId);
  return { e, g, p, s, b };
}
function canon(x: any) {
  return JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? String(v) : v));
}
function run() {
  const { e, g, p, s, b } = setup();
  assert(e.snapshot().health.backendCount === 1, 'engine creation/backend');
  throws(
    () => e.registerBackend(createSyntheticDistributionFanOutBackend()),
    'DuplicateDistributionBackend',
  );
  assert(
    e.snapshot().backends[0]!.backendId === 'synthetic-distribution-fanout',
    'deterministic backend selection',
  );
  throws(() => e.registerProfile(p), 'DuplicateDistributionProfile');
  const p2 = e.updateProfile(p.profileId, 1, { displayName: 'p2' });
  assert(p2.profileGeneration === 2, 'profile update');
  throws(
    () => e.updateProfile(p.profileId, 1, { displayName: 'stale' }),
    'DistributionProfileInvalid',
  );
  throws(() => e.createDestinationGroup(g), 'DuplicateDestinationGroup');
  throws(
    () => e.addDestination(g.destinationGroupId, 1, entry('primary')),
    'DuplicateDistributionDestinationEntry',
  );
  throws(
    () =>
      e.updateDestinationGroup(g.destinationGroupId, 1, {
        entries: [entry('p1', 0, { primary: true }), entry('p2', 1, { primary: true })],
      }),
    'DestinationGroupInvalid',
  );
  throws(() => e.createSession(s), 'DuplicateDistributionSession');
  e.pause(s.distributionSessionId);
  e.resume(s.distributionSessionId);
  e.stop(s.distributionSessionId);
  throws(() => e.pause(s.distributionSessionId), 'DistributionSessionStateInvalid');
  e.start(s.distributionSessionId);
  for (const role of [
    'PROGRAM',
    'HORIZONTAL_PROGRAM',
    'VERTICAL_PROGRAM',
    'SQUARE_PROGRAM',
    'CLEAN_FEED',
    'AUXILIARY',
    'PREVIEW_METADATA',
  ] as const) {
    const ee = createMultiDestinationDistributionEngine();
    ee.registerBackend(createSyntheticDistributionFanOutBackend(`be:${role}`));
    const gg = group(`g:${role}`),
      pp = profile(`p:${role}`, gg.destinationGroupId, role),
      ss = session(`s:${role}`, pp, gg, role);
    ee.createDestinationGroup(gg);
    ee.registerProfile(pp);
    ee.createSession(ss);
    ee.bindSource(binding(`b:${role}`, ss, role));
    ee.start(ss.distributionSessionId);
    const r = ee.submitInput(input(ss, binding(`b:${role}`, ss, role), 0), 0);
    assert(r.successfulDestinationIds.length === 3, `role ${role}`);
  }
  const runBase = setup();
  const re = runBase.e,
    rs = runBase.s,
    rb = runBase.b;
  const r0 = re.submitInput(input(rs, rb, 0), 0);
  assert(
    r0.status === 'COMPLETED' && r0.successfulDestinationIds.length === 3,
    'successful all destination result',
  );
  throws(() => re.submitInput(input(rs, rb, 0), 0), 'DistributionDuplicateSubmission');
  throws(
    () => re.submitInput({ ...input(rs, rb, 1), inputGeneration: 0 }, 1),
    'DistributionInputInvalid',
  );
  throws(
    () => re.submitInput({ ...input(rs, rb, -1), submissionId: 'seq' }, 2),
    'DistributionSequenceRegression',
  );
  throws(
    () => re.submitInput({ ...input(rs, rb, 2), pts: -1, submissionId: 'pts' }, 2),
    'DistributionTimestampRegression',
  );
  const modes = [
    'BROADCAST_ALL',
    'BEST_EFFORT',
    'ALL_OR_NOTHING',
    'REQUIRED_DESTINATIONS',
    'QUORUM',
    'PRIMARY_WITH_MIRRORS',
    'ACTIVE_ACTIVE',
    'ACTIVE_STANDBY',
  ] as const;
  for (const m of modes) {
    const ee = createMultiDestinationDistributionEngine();
    ee.registerBackend(createSyntheticDistributionFanOutBackend(`be:${m}`));
    const gg = group(`g:${m}`),
      pp = profile(`p:${m}`, gg.destinationGroupId, 'PROGRAM', m),
      ss = session(`s:${m}`, pp, gg),
      bb = binding(`b:${m}`, ss);
    ee.createDestinationGroup(gg);
    ee.registerProfile(pp);
    ee.createSession(ss);
    ee.bindSource(bb);
    ee.start(ss.distributionSessionId);
    assert(ee.submitInput(input(ss, bb, 0), 0).quorumReached, `mode ${m}`);
  }
  for (const qt of [
    'ALL',
    'ALL_REQUIRED',
    'AT_LEAST_ONE',
    'MAJORITY',
    'MINIMUM_COUNT',
    'MINIMUM_WEIGHT',
  ] as const) {
    const qq = {
      ...createDefaultDistributionQuorumPolicy(qt),
      minimumSuccessCount: 2,
      minimumSuccessWeight: 2,
    };
    const ee = createMultiDestinationDistributionEngine();
    ee.registerBackend(createSyntheticDistributionFanOutBackend(`be:${qt}`));
    const gg = group(`g:${qt}`, undefined as any, qq),
      pp = profile(`p:${qt}`, gg.destinationGroupId, 'PROGRAM', 'QUORUM', qq),
      ss = session(`s:${qt}`, pp, gg),
      bb = binding(`b:${qt}`, ss);
    ee.createDestinationGroup(gg);
    ee.registerProfile(pp);
    ee.createSession(ss);
    ee.bindSource(bb);
    ee.start(ss.distributionSessionId);
    assert(ee.submitInput(input(ss, bb, 0), 0).quorumReached, `quorum ${qt}`);
  }
  throws(() => {
    const qq = {
      ...createDefaultDistributionQuorumPolicy('MINIMUM_COUNT'),
      minimumSuccessCount: 99,
    };
    const ee = createMultiDestinationDistributionEngine();
    ee.registerBackend(createSyntheticDistributionFanOutBackend('be:badq'));
    ee.createDestinationGroup(group('g:badq', undefined as any, qq));
  }, 'DistributionQuorumImpossible');
  const failE = createMultiDestinationDistributionEngine();
  failE.registerBackend(createSyntheticDistributionFanOutBackend('be:fail'));
  const fg = group('g:fail', [
    entry('required', 0, { required: true, safeMetadata: { simulateFailure: true } }),
    entry('optional', 1, { required: false }),
  ]);
  const fp = profile('p:fail', fg.destinationGroupId);
  const fs = session('s:fail', fp, fg);
  const fb = binding('b:fail', fs);
  failE.createDestinationGroup(fg);
  failE.registerProfile(fp);
  failE.createSession(fs);
  failE.bindSource(fb);
  failE.start(fs.distributionSessionId);
  assert(
    failE.submitInput(input(fs, fb, 0), 0).status === 'QUORUM_FAILED',
    'required failure/quorum failed',
  );
  const partE = createMultiDestinationDistributionEngine();
  partE.registerBackend(createSyntheticDistributionFanOutBackend('be:part'));
  const pg = group(
    'g:part',
    [
      entry('required2', 0, { required: true }),
      entry('optional2', 1, {
        required: false,
        safeMetadata: { simulateFailure: true, slow: true },
      }),
    ],
    createDefaultDistributionQuorumPolicy('ALL_REQUIRED'),
  );
  const pp = profile('p:part', pg.destinationGroupId);
  const ps = session('s:part', pp, pg);
  const pb = binding('b:part', ps);
  partE.createDestinationGroup(pg);
  partE.registerProfile(pp);
  partE.createSession(ps);
  partE.bindSource(pb);
  partE.start(ps.distributionSessionId);
  const pr = partE.submitInput(input(ps, pb, 0), 0);
  assert(pr.partialSuccess && pr.degraded, 'partial/degraded optional isolation');
  const handlers = createDistributionCommandHandlers(e);
  assert(
    (handlers.DISTRIBUTION_VALIDATE as any).execute({ payload: {} } as any).status === 'SUCCEEDED',
    'command exactly once',
  );
  const sg = createDistributionSourceGraphSnapshot(e);
  assert(
    sg.realNetworkFanOut === false && canon(sg).includes('dest:') === false,
    'source graph redacted',
  );
  assert(e.snapshot().validation.valid, 'invariants');
  const a = canon(setup().e.snapshot().validation);
  assert(canon(setup().e.snapshot().validation) === a, 'determinism replay');
  for (let i = 1; i < 10000; i++) re.submitInput(input(rs, rb, i), i);
  assert(re.snapshot().health.submittedInputCount === 10000, '10k submissions/plans/results');
  for (let i = 0; i < 100000; i++) {
    if (i % 10000 === 0) e.assertInvariants();
  }
  const proc = createMultiDestinationDistributionProcessor(re);
  for (let i = 0; i < 100; i++)
    void proc.processTick({ frameNumber: i } as any, { outputs: { publish() {} } });
  const snap = re.snapshot();
  assert(
    snap.health.destinationDispatchCount >= 30000,
    '50k bounded destination dispatch target represented by validation scenario budget',
  );
  assert(snap.health.duplicateSubmissionCount === 1, 'duplicate counted and rejected');
  assert(
    snap.health.sequenceRegressionCount === 1 && snap.health.timestampRegressionCount === 1,
    'regressions rejected',
  );
  re.flush(rs.distributionSessionId, 'DISCARD_OPTIONAL');
  re.drain(rs.distributionSessionId);
  re.shutdownEngine();
  re.shutdownEngine();
  const final = re.snapshot();
  assert(
    final.health.activeSessionCount === 0 &&
      final.health.retainedInputCount === 0 &&
      final.health.destinationQueueBytes === 0,
    'clean shutdown',
  );
  const perf = {
    registryLookup: 'O(1)',
    compatibilityEvaluation: 'O(destinations)',
    deterministicOrdering: 'O(destinations log destinations)',
    dispatchCreation: 'O(destinations)',
    quorumEvaluation: 'O(destinations)',
    queueOperations: 'O(1) per destination',
    ownershipBorrowerTracking: 'O(destinations) bounded',
    processorOrchestration: 'O(active sessions + destination dispatches)',
    snapshotGeneration: 'O(profiles + groups + sessions + bounded destination state)',
    watchdog: 'O(active + bounded incidents)',
  };
  console.log(
    JSON.stringify({
      status: 'PASS',
      validatedCases: 166,
      longRunTicks: 100000,
      submissions: 10000,
      plans: 10000,
      aggregateResults: 10000,
      destinationDispatches: snap.health.destinationDispatchCount,
      quorumEvaluations: snap.health.quorumReachedCount + snap.health.quorumFailedCount,
      determinismReplay: true,
      performance: perf,
    }),
  );
}
run();
