const assert = (value: unknown, message = 'assertion failed') => {
  if (!value) throw new Error(message);
};
assert.equal = (actual: unknown, expected: unknown) => {
  if (actual !== expected) throw new Error(`expected ${String(expected)} got ${String(actual)}`);
};
assert.rejects = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
  } catch (e) {
    if (pattern.test(String(e))) return;
    throw e;
  }
  throw new Error('expected rejection');
};
import {
  createAudioSourceDescriptor,
  createAudioDeviceSource,
  SyntheticAudioBackend,
  negotiateAudioFormat,
  mapDeviceToAudioSourceDescriptors,
  SyntheticAudioDeviceProvider,
  createAudioTelemetrySnapshot,
  AUDIO_COMMAND_TYPES,
  AUDIO_EVENT_TYPES,
  AUDIO_WATCHDOG_INCIDENTS,
} from './audio-device-source.js';

let now = 0n;
const nowNs = () => {
  now += 1_000_000n;
  return now;
};
const descriptor = createAudioSourceDescriptor({
  id: 'audio-source:test',
  providerId: 'synthetic-audio-provider',
  deviceId: 'dev:mic',
  displayName: 'Test Mic',
  audioCategory: 'MICROPHONE',
  permissionState: 'GRANTED',
});
assert(Object.isFrozen(descriptor));
assert.equal(descriptor.audio.loopbackCapable, false);
const denied = createAudioSourceDescriptor({
  id: 'audio-source:denied',
  providerId: 'synthetic-audio-provider',
  displayName: 'Denied',
  permissionState: 'DENIED',
});
await assert.rejects(
  async () =>
    createAudioDeviceSource(denied, new SyntheticAudioBackend('denied', nowNs), nowNs).open(
      {},
      { nowNs },
    ),
  /Audio permission denied/,
);
const negotiated = negotiateAudioFormat([...descriptor.audio.supportedFormats].reverse(), {
  preferredSampleRate: 48000,
  preferredChannelLayout: 'STEREO',
  preferredSampleFormat: 'F32',
});
assert.equal(negotiated.ok, true);
assert.equal(negotiated.selectedFormat?.id, descriptor.audio.defaultFormat.id);
const mapped = mapDeviceToAudioSourceDescriptors({
  id: 'device:1',
  providerId: 'provider:1',
  type: 'AUDIO_INPUT',
  displayName: 'USB Mic',
  permissionState: 'GRANTED',
  virtual: false,
  available: true,
});
assert.equal(mapped.length, 1);
assert.equal(mapped[0]!.audioCategory, 'MICROPHONE');
const backend = new SyntheticAudioBackend('backend:test', nowNs);
const source = createAudioDeviceSource(descriptor, backend, nowNs);
await source.initialize();
await source.open({}, { nowNs });
await source.startCapture({ nowNs });
backend.emit(3, 480);
let batch = await source.pull({ frameNumber: 1n, scheduledTimeNs: 0n }, { nowNs });
assert(batch.audioBuffers.length > 0);
assert.equal(batch.audioBuffers[0]!.payload.kind, 'OPAQUE_TEST_HANDLE');
assert(!JSON.stringify(source.getAudioSnapshot()).includes('pcm'));
const again = await source.pull({ frameNumber: 1n, scheduledTimeNs: 0n }, { nowNs });
assert.equal(again.audioBuffers.length, 0);
await source.stopCapture({ nowNs });
backend.emit(1, 480);
batch = await source.pull({ frameNumber: 2n, scheduledTimeNs: 10_000_000n }, { nowNs });
assert.equal(batch.audioBuffers.length, 0);
await source.close({ nowNs });
source.assertInvariants();
const provider = new SyntheticAudioDeviceProvider([descriptor]);
const discovery = await provider.listAudioDevices({}, { nowNs });
assert.equal(discovery.descriptors.length, 1);
const telemetry = createAudioTelemetrySnapshot([source.getAudioSnapshot()]);
assert.equal(telemetry.registeredAudioSourceCount, 1);
assert(AUDIO_COMMAND_TYPES.includes('AUDIO_OPEN'));
assert(AUDIO_EVENT_TYPES.includes('AudioBufferPublished'));
assert(AUDIO_WATCHDOG_INCIDENTS.includes('AUDIO_QUEUE_OVERFLOW'));
console.log('audio-device-source validation passed');
