import {
  DefaultDeviceDiscoveryService,
  createSyntheticDeviceProvider,
  syntheticDevice,
  DeviceMonitoringAlreadyRunningError,
  DuplicateDeviceProviderError,
} from './device-discovery.js';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`v5.2.2 device-discovery validation failed: ${message}`);
};
let tick = 0n;
const nowNs = () => ++tick;

const camera = syntheticDevice('p-b', 0, {
  id: 'cam-a',
  displayName: 'Camera A',
  type: 'VIDEO_INPUT',
  persistentIdentity: 'hw:camera:a',
  metadata: { serialNumber: 'secret-serial', hardwarePath: '/secret/path' },
});
const mic = syntheticDevice('p-a', 0, {
  id: 'mic-a',
  displayName: 'Mic A',
  type: 'AUDIO_INPUT',
  supportsVideo: false,
  supportsAudioInput: true,
  mediaKinds: ['AUDIO'],
  capabilities: {
    audio: [{ kind: 'audio', sampleRate: 48000, channels: 2, layout: 'stereo' }],
    metadataOnly: true,
  },
});
const alias = syntheticDevice('p-c', 0, {
  id: 'camera-alias',
  displayName: 'Camera Alias',
  type: 'VIDEO_INPUT',
  persistentIdentity: 'hw:camera:a',
  mergeKey: 'hw:camera:a',
});
const providerA = createSyntheticDeviceProvider('p-a', [mic]);
const providerB = createSyntheticDeviceProvider('p-b', [camera]);
const providerC = createSyntheticDeviceProvider('p-c', [alias]);
const service = new DefaultDeviceDiscoveryService(undefined, nowNs);
service.registerProvider(providerB);
service.registerProvider(providerA);
service.registerProvider(providerC);
try {
  service.registerProvider(providerA);
  assert(false, 'duplicate provider rejected');
} catch (e) {
  assert(e instanceof DuplicateDeviceProviderError, 'duplicate provider typed error');
}

const first = await service.discover({ includeUnavailable: true, refreshCapabilities: true });
assert(first.generation === 1, 'first generation is one');
assert(first.devices.length === 2, 'deduplicates alias devices');
assert(
  first.providerResults.map((p) => p.providerId).join(',') === 'p-a,p-b,p-c',
  'provider ordering is deterministic',
);
const cam = service.getDevice('cam-a');
assert(
  cam?.identity.serialNumberHash && !JSON.stringify(cam).includes('secret-serial'),
  'serial number is hashed and redacted',
);
assert(
  cam?.sources.length === 1 && cam.sources[0]?.availability === 'AVAILABLE',
  'device maps to available source descriptor',
);
assert(first.devices[0]?.displayName === 'Mic A', 'stable device ordering by type/provider/name');

providerB.setDevices([]);
providerA.setDevices([mic]);
providerC.setDevices([]);
const second = await service.refresh({ includeUnavailable: true, includeRemoved: true });
assert(second.unavailableDevices.length >= 1, 'first missed generation marks unavailable');
const third = await service.refresh({ includeUnavailable: true, includeRemoved: true });
assert(third.removedDevices.length >= 1, 'second missed generation marks removed');
providerB.setDevices([camera]);
const fourth = await service.refresh({ includeUnavailable: true, includeRemoved: true });
assert(
  fourth.devices.some((d) => d.id === 'cam-a' && d.reappearanceGeneration === 4),
  'reappearance retains identity',
);

await service.startMonitoring({ pollIntervalMs: 1 });
try {
  await service.startMonitoring();
  assert(false, 'duplicate monitoring rejected');
} catch (e) {
  assert(e instanceof DeviceMonitoringAlreadyRunningError, 'duplicate monitoring typed error');
}
await service.stopMonitoring();
const snap = service.getSnapshot();
assert(snap.telemetry.deduplicatedDeviceCount >= 1, 'telemetry records deduplication');
assert(snap.telemetry.deviceReappearanceCount >= 1, 'telemetry records reappearance');
assert(Object.isFrozen(snap), 'platform snapshot is immutable');
service.assertInvariants();

const long = new DefaultDeviceDiscoveryService(undefined, nowNs);
long.registerProvider(
  createSyntheticDeviceProvider(
    'bulk',
    Array.from({ length: 1000 }, (_, i) => syntheticDevice('bulk', i)),
  ),
);
await long.discover();
assert(long.getSnapshot().devices.length === 1000, '1,000 synthetic devices complete');
const generations = new DefaultDeviceDiscoveryService(undefined, nowNs);
generations.registerProvider(
  createSyntheticDeviceProvider('generations', [syntheticDevice('generations', 0)]),
);
await generations.discover();
for (let i = 0; i < 100000; i++) await generations.refresh();
assert(generations.getSnapshot().generation === 100001, '100,000 refresh generations complete');
generations.assertInvariants();
await generations.shutdown();
long.assertInvariants();
await long.shutdown();
await service.shutdown();
console.log('UBOS v5.2.2 device discovery validation passed');
