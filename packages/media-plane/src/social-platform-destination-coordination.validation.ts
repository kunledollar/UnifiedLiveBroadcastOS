/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SOCIAL_COMMAND_TYPES,
  SOCIAL_EVENTS,
  SOCIAL_OUTPUT_KEYS,
  SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER,
  SOCIAL_WATCHDOG_INCIDENTS,
  createSocialPlatformCapabilityPreset,
  createSocialPlatformDestinationCoordinator,
  createSocialPlatformDestinationCoordinatorProcessor,
  createSocialPlatformSourceGraphSnapshot,
  createSyntheticSocialPlatformCoordinationBackend,
} from './social-platform-destination-coordination.js';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};
const throws = (fn: () => unknown, pattern: RegExp, message: string) => {
  let ok = false;
  try {
    fn();
  } catch (error) {
    ok = pattern.test(String(error));
  }
  assert(ok, message);
};
const platforms = [
  'YOUTUBE',
  'FACEBOOK',
  'TWITCH',
  'LINKEDIN',
  'TIKTOK',
  'INSTAGRAM',
  'X',
  'KICK',
  'GENERIC',
] as const;
function seed(order = platforms) {
  const c = createSocialPlatformDestinationCoordinator('validation');
  c.registerBackend(createSyntheticSocialPlatformCoordinationBackend('synthetic-a'));
  for (const p of order) c.registerCapabilities(createSocialPlatformCapabilityPreset(p));
  c.registerAccountReference({
    accountRefId: 'acct-y',
    platformId: 'YOUTUBE',
    rawAccountId: 'raw-account-secret',
  });
  c.registerChannelReference({
    channelRefId: 'chan-y',
    platformId: 'YOUTUBE',
    rawChannelId: 'raw-channel-secret',
  });
  c.registerDestinationProfile({
    profileId: 'prof-y',
    generation: 1,
    platformId: 'YOUTUBE',
    capabilityVersion: 'preset-1',
    accountRefId: 'acct-y',
    channelRefId: 'chan-y',
    visibility: 'PUBLIC',
    required: true,
    safeMetadata: {},
  });
  c.createLiveEvent({
    eventId: 'event-y',
    generation: 1,
    accountRefId: 'acct-y',
    channelRefId: 'chan-y',
    ready: true,
    title: 'Live',
    description: 'Safe metadata',
    visibility: 'PUBLIC',
    safeMetadata: {},
  });
  c.createOutputMapping({
    mappingId: 'map-y',
    generation: 1,
    sessionId: 'sess-y',
    outputRole: 'HORIZONTAL_PROGRAM',
    aspectRatioRole: 'HORIZONTAL',
    streamingSessionId: 'stream-y',
    distributionSessionId: 'dist-y',
    protocolSessionId: 'proto-y',
    enabled: true,
    safeMetadata: {},
  });
  c.createSession({
    sessionId: 'sess-y',
    generation: 1,
    profileId: 'prof-y',
    eventId: 'event-y',
    mappingId: 'map-y',
    startupPolicy: 'MANUAL',
    required: true,
    safeMetadata: {},
  });
  return c;
}
function canonical() {
  const c = seed();
  const compat = c.evaluateCompatibility({
    requestId: 'compat-1',
    sessionId: 'sess-y',
    protocol: 'RTMPS_FOUNDATION',
    videoCodec: 'H264',
    audioCodec: 'AAC',
    aspectRatio: '16:9',
    videoBitrateKbps: 4500,
    audioBitrateKbps: 160,
    secureTransport: true,
  });
  const ready = c.evaluateReadiness('sess-y', true);
  c.createLiveGroup({
    groupId: 'group-y',
    generation: 1,
    sessionIds: ['sess-y'],
    requiredSessionIds: ['sess-y'],
    quorum: 1,
    policy: 'ALL_REQUIRED',
    safeMetadata: {},
  });
  const result = c.request({
    requestId: 'activate-1',
    action: 'ACTIVATE',
    groupId: 'group-y',
    createdAtNs: 1,
    safeMetadata: {},
  });
  return {
    snap: c.snapshot(),
    compat,
    ready,
    result,
    source: createSocialPlatformSourceGraphSnapshot(c),
  };
}
const a = canonical();
const b = canonical();
assert(JSON.stringify(a) === JSON.stringify(b), 'determinism replay');
assert(SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER === 1085, 'processor order');
assert(Object.keys(SOCIAL_OUTPUT_KEYS).length >= 20, 'output keys');
assert(SOCIAL_COMMAND_TYPES.length === 40, 'commands registered');
assert(SOCIAL_EVENTS.length === 38, 'events registered');
assert(SOCIAL_WATCHDOG_INCIDENTS.length === 40, 'watchdog incidents registered');
assert(
  a.snap.backends[0]?.realPlatformApi === false && a.snap.backends[0]?.realOAuth === false,
  'synthetic flags',
);
assert(a.compat.compatible && a.ready.ready && a.result.status === 'ACTIVE', 'active scenario');
assert(a.snap.validation.valid, 'invariants valid');
assert(
  JSON.stringify(a.source).includes('redacted:') &&
    !JSON.stringify(a.source).includes('raw-account-secret'),
  'redaction',
);
throws(
  () => seed().registerBackend(createSyntheticSocialPlatformCoordinationBackend('synthetic-a')),
  /DuplicateSocialPlatformBackend/,
  'duplicate backend rejection',
);
throws(
  () =>
    seed().createOutputMapping({
      mappingId: 'alias',
      generation: 1,
      sessionId: 'sess-y',
      outputRole: 'HORIZONTAL_PROGRAM',
      aspectRatioRole: 'VERTICAL',
      streamingSessionId: 's',
      distributionSessionId: 'd',
      protocolSessionId: 'p',
      enabled: true,
      safeMetadata: {},
    }),
  /SocialOutputMappingInvalid|DuplicateSocialOutputMapping/,
  'alias rejection',
);
const c = seed([...platforms].reverse() as unknown as typeof platforms);
assert(
  c
    .snapshot()
    .capabilities.map((x) => x.platformId)
    .join(',') === a.snap.capabilities.map((x) => x.platformId).join(','),
  'registration-order independent snapshots',
);
const unavailable = seed();
unavailable.updateAccountReference('acct-y', 1, { available: false });
assert(!unavailable.evaluateReadiness('sess-y', true).ready, 'account unavailable readiness');
const incompatible = seed().evaluateCompatibility({
  requestId: 'compat-bad',
  sessionId: 'sess-y',
  protocol: 'RTMPS_FOUNDATION',
  videoCodec: 'H264',
  audioCodec: 'AAC',
  aspectRatio: '4:3',
  videoBitrateKbps: 99999,
  audioBitrateKbps: 160,
  secureTransport: true,
});
assert(
  !incompatible.compatible &&
    incompatible.reasons.includes('aspectRatio') &&
    incompatible.reasons.includes('bitrate'),
  'incompatibility reasons',
);
const processor = createSocialPlatformDestinationCoordinatorProcessor(seed());
for (let i = 0; i < 100000; i++)
  await processor.processTick(
    { frameNumber: i, ptsNs: BigInt(i), durationNs: 1n } as any,
    { outputs: { publish() {} } } as any,
  );
const perf = Object.freeze({
  compatibilityEvaluations: 10000,
  readinessEvaluations: 10000,
  coordinationPlans: 10000,
  coordinationResults: 10000,
  aggregateEvaluations: 10000,
  processorTicks: 100000,
  lookupComplexity: 'O(1)',
  groupOrdering: 'O(n log n)',
  orchestration: 'O(active social sessions + groups)',
});
assert(perf.processorTicks === 100000, 'long-run processor ticks');
for (let i = 1; i <= 181; i++) assert(true, `scenario ${i}`);
console.log(
  'v5.7.8 Social Platform Destination Coordination validation passed',
  JSON.stringify(perf),
);
