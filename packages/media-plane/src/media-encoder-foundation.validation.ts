import {
  MediaEncoderFoundationError,
  SyntheticAudioEncoderBackend,
  SyntheticVideoEncoderBackend,
  createAudioEncoderConfiguration,
  createMediaEncoderFoundationEngine,
  createMediaEncoderFoundationProcessor,
  createVideoEncoderConfiguration,
  type AudioEncodeInputBlock,
  type AudioEncoderCodec,
  type MediaEncoderOutputRole,
  type VideoEncodeInputFrame,
  type VideoEncoderCodec,
  type VideoEncoderProfile,
} from './media-encoder-foundation.js';

const assert = {
  ok(value: unknown, message = 'assert ok failed') {
    if (!value) throw new Error(message);
  },
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected)
      throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
  },
  deepEqual(actual: unknown, expected: unknown, message?: string) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(message ?? `${a} !== ${b}`);
  },
  throws(fn: () => unknown, code: string) {
    let thrown = false;
    try {
      fn();
    } catch (error) {
      thrown = true;
      if (!(error instanceof MediaEncoderFoundationError) || error.code !== code) throw error;
    }
    if (!thrown) throw new Error(`expected ${code}`);
  },
};

const videoConfig = (codec: VideoEncoderCodec, profile: VideoEncoderProfile, id = `v:${codec}`) =>
  createVideoEncoderConfiguration({
    encoderConfigId: id,
    codec,
    profile,
    level: codec === 'AV1' ? '5.0' : codec === 'VP9' ? '4.1' : '4.2',
    width: 1920,
    height: 1080,
    pixelFormat: codec === 'H265' ? 'YUV420P10' : 'YUV420P8',
    colorMetadata: { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709' },
    frameRate: { numerator: 1, denominator: 60 },
    codecTimeBase: { numerator: 1, denominator: 90_000 },
    outputRole: 'PROGRAM',
    maximumKeyframeInterval: 30,
    gopSize: 30,
    bFrameCount: codec === 'H264' ? 2 : 0,
  });
const audioConfig = (codec: AudioEncoderCodec, id = `a:${codec}`) =>
  createAudioEncoderConfiguration({
    encoderConfigId: id,
    codec,
    profile: codec === 'OPUS' ? 'LOW_DELAY' : 'LC',
    sampleFormat: 'F32_PLANAR',
    sampleRate: 48_000,
    channelLayout: 'STEREO',
    channelCount: 2,
    codecTimeBase: { numerator: 1, denominator: 48_000 },
    outputRole: 'PROGRAM',
  });
const video = (sessionId: string, n: number, forceKeyframe = false): VideoEncodeInputFrame => ({
  submissionId: `vs:${sessionId}:${n}`,
  sessionId,
  sessionGeneration: 1,
  frameId: `vf:${sessionId}:${n}`,
  frameGeneration: 1,
  storageGeneration: 1,
  runtimeFrame: String(n),
  frameNumber: n,
  width: 1920,
  height: 1080,
  pixelFormat: 'YUV420P8',
  colorMetadata: { primaries: 'bt709' },
  alphaMode: 'NONE',
  frameTimestamp: n,
  pts: n * 1500,
  duration: 1500,
  timeBase: { numerator: 1, denominator: 90_000 },
  discontinuityGeneration: 0,
  forceKeyframe,
  frameOwnership: 'BORROWED_READ_ONLY',
  safeMetadata: {},
});
const audio = (sessionId: string, n: number): AudioEncodeInputBlock => ({
  submissionId: `as:${sessionId}:${n}`,
  sessionId,
  sessionGeneration: 1,
  blockId: `ab:${sessionId}:${n}`,
  blockGeneration: 1,
  runtimeFrame: String(n),
  blockSequence: n,
  samplePosition: n * 1024,
  sampleCount: 1024,
  sampleRate: 48_000,
  sampleFormat: 'F32_PLANAR',
  channelLayout: 'STEREO',
  timestamp: n,
  pts: n * 1024,
  duration: 1024,
  timeBase: { numerator: 1, denominator: 48_000 },
  discontinuityGeneration: 0,
  ownership: 'BORROWED_READ_ONLY',
  safeMetadata: {},
});
const queuePolicy = {
  maxInputCount: 16,
  maxInputDuration: 16,
  maxInputBytes: 64_000_000,
  maxLatencyNs: 500_000_000,
  inputOverflowPolicy: 'REJECT_NEW' as const,
  maxPacketCount: 25_000,
  maxPacketDuration: 25_000,
  maxPacketBytes: 1_000_000_000,
  packetOverflowPolicy: 'REJECT_NEW' as const,
};

function setup(role: MediaEncoderOutputRole = 'PROGRAM') {
  const engine = createMediaEncoderFoundationEngine();
  const vcfg = videoConfig('H264', 'HIGH', `v:${role}`);
  const acfg = audioConfig('AAC', `a:${role}`);
  engine.registerVideoConfiguration(vcfg);
  engine.registerAudioConfiguration(acfg);
  engine.createSession({
    sessionId: `s:v:${role}`,
    mediaType: 'VIDEO',
    outputRole: role,
    sourceBusId: `${role}:video`,
    videoConfigId: vcfg.encoderConfigId,
    queuePolicy,
  });
  engine.createSession({
    sessionId: `s:a:${role}`,
    mediaType: 'AUDIO',
    outputRole: role,
    sourceBusId: `${role}:audio`,
    audioConfigId: acfg.encoderConfigId,
    queuePolicy,
  });
  engine.bindOutputRole({
    bindingId: `b:${role}`,
    bindingVersion: '5.6.6',
    bindingGeneration: 1,
    outputRole: role,
    videoSessionId: `s:v:${role}`,
    audioSessionId: `s:a:${role}`,
    synchronizedSourceRequirement:
      role === 'RECORD' || role === 'STREAM' ? 'ENCODER_ONLY' : 'STRICT',
    profileGeneration: 1,
    criticality: role === 'PROGRAM' ? 'PROGRAM_CRITICAL' : 'IMPORTANT',
    enabled: true,
    futureDestinationClassMetadata:
      role === 'RECORD' ? 'RECORD_FUTURE' : role === 'STREAM' ? 'STREAM_FUTURE' : 'MUX_FUTURE',
    safeMetadata: {},
  });
  engine.startSession(`s:v:${role}`, 1);
  engine.startSession(`s:a:${role}`, 1);
  return engine;
}

function validationScenario() {
  const engine = setup('PROGRAM');
  assert.equal(engine.snapshot().health.videoBackendCount, 1);
  assert.throws(
    () => engine.registerVideoBackend(new SyntheticVideoEncoderBackend()),
    'DuplicateVideoEncoderBackend',
  );
  assert.throws(
    () => engine.registerAudioBackend(new SyntheticAudioEncoderBackend()),
    'DuplicateAudioEncoderBackend',
  );
  assert.equal(engine.selectVideoBackend()?.descriptor.backendId, 'synthetic-video-encoder');
  assert.equal(engine.selectAudioBackend()?.descriptor.backendId, 'synthetic-audio-encoder');

  for (const [codec, profile] of [
    ['H264', 'HIGH'],
    ['H265', 'MAIN_10'],
    ['AV1', 'MAIN'],
    ['VP9', 'PROFILE_0'],
  ] as const)
    assert.ok(videoConfig(codec, profile));
  for (const codec of ['AAC', 'OPUS'] as const) assert.ok(audioConfig(codec));
  assert.throws(() => videoConfig('H264', 'PROFILE_0'), 'EncoderProfileUnsupported');
  assert.throws(
    () =>
      createVideoEncoderConfiguration({
        ...videoConfig('H264', 'HIGH'),
        width: 0,
        encoderConfigId: 'bad:dim',
      }),
    'VideoEncoderConfigurationInvalid',
  );
  assert.throws(
    () =>
      createVideoEncoderConfiguration({
        ...videoConfig('H264', 'HIGH'),
        frameRate: { numerator: 0, denominator: 60 },
        encoderConfigId: 'bad:fr',
      }),
    'VideoEncoderConfigurationInvalid',
  );
  assert.throws(
    () =>
      createVideoEncoderConfiguration({
        ...videoConfig('H264', 'HIGH'),
        pixelFormat: 'AUTO',
        encoderConfigId: 'bad:pix',
      }),
    'EncoderFormatUnsupported',
  );
  assert.throws(
    () =>
      createVideoEncoderConfiguration({
        ...videoConfig('H264', 'HIGH'),
        colorMetadata: {},
        encoderConfigId: 'bad:color',
      }),
    'VideoEncoderConfigurationInvalid',
  );
  assert.throws(
    () =>
      createVideoEncoderConfiguration({
        ...videoConfig('H264', 'HIGH'),
        targetBitrate: 1,
        minimumBitrate: 2,
        encoderConfigId: 'bad:br',
      }),
    'VideoEncoderConfigurationInvalid',
  );
  assert.throws(
    () =>
      createVideoEncoderConfiguration({
        ...videoConfig('H264', 'HIGH'),
        gopSize: 0,
        encoderConfigId: 'bad:gop',
      }),
    'EncoderKeyframeRequestInvalid',
  );
  assert.throws(
    () =>
      createAudioEncoderConfiguration({
        ...audioConfig('AAC'),
        sampleRate: 12345,
        encoderConfigId: 'bad:sr',
      }),
    'AudioEncoderConfigurationInvalid',
  );
  assert.throws(
    () =>
      createAudioEncoderConfiguration({
        ...audioConfig('AAC'),
        channelLayout: 'STEREO',
        channelCount: 1,
        encoderConfigId: 'bad:layout',
      }),
    'AudioEncoderConfigurationInvalid',
  );

  const firstVideo = engine.submitVideo(video('s:v:PROGRAM', 0));
  assert.equal(firstVideo.packet.codecConfigPacket, false);
  assert.equal(firstVideo.packet.frameClassification, 'IDR');
  assert.equal(firstVideo.packet.keyframe, true);
  const secondVideo = engine.submitVideo(video('s:v:PROGRAM', 1));
  assert.equal(secondVideo.packet.packetSequence, 2);
  assert.ok(['P', 'B'].includes(secondVideo.packet.frameClassification));
  const firstAudio = engine.submitAudio(audio('s:a:PROGRAM', 0));
  assert.equal(firstAudio.packet.mediaType, 'AUDIO');
  assert.ok(firstAudio.packet.signature.startsWith('ubos-v5.6.6:'));
  assert.equal(engine.snapshot().correlations[0]?.futureMuxEligibility, 'ELIGIBLE');
  assert.throws(() => engine.submitVideo(video('s:v:PROGRAM', 1)), 'EncoderDuplicateSubmission');
  assert.throws(
    () =>
      engine.submitVideo({ ...video('s:v:PROGRAM', 2), pts: 1, submissionId: 'unique:regression' }),
    'EncoderTimestampRegression',
  );
  engine.submitAudio(audio('s:a:PROGRAM', 1));
  assert.throws(
    () =>
      engine.submitAudio({
        ...audio('s:a:PROGRAM', 2),
        samplePosition: 1,
        submissionId: 'audio:regression',
      }),
    'EncoderSamplePositionRegression',
  );
  assert.throws(
    () =>
      engine.submitVideo({
        ...video('s:v:PROGRAM', 3),
        width: 1280,
        submissionId: 'unique:format',
      }),
    'EncoderFormatUnsupported',
  );
  assert.throws(
    () =>
      engine.submitAudio({
        ...audio('s:a:PROGRAM', 3),
        channelLayout: 'MONO',
        submissionId: 'audio:format',
      }),
    'EncoderFormatUnsupported',
  );
  assert.throws(() => engine.startSession('s:v:PROGRAM', 99), 'EncoderSessionGenerationMismatch');

  const released = engine.releasePacket(firstVideo.packet.packetId);
  assert.equal(released.released, true);
  assert.throws(() => engine.releasePacket(firstVideo.packet.packetId), 'EncoderPacketInvalid');
  const eos = engine.drainSession('s:v:PROGRAM');
  assert.equal(eos.endOfStream, true);
  engine.flushSession('s:a:PROGRAM');
  assert.equal(engine.backpressure('s:a:PROGRAM').packetQueueDepth, 0);
  engine.resetSession('s:v:PROGRAM');
  assert.ok(engine.assertInvariants().valid);

  const preview = setup('PREVIEW');
  preview.submitVideo(video('s:v:PREVIEW', 0));
  preview.flushSession('s:v:PREVIEW');
  assert.equal(preview.snapshot().health.healthState, 'healthy');
  for (const role of [
    'AUXILIARY',
    'CLEAN_FEED',
    'RECORD',
    'STREAM',
    'HORIZONTAL_PROGRAM',
    'VERTICAL_PROGRAM',
    'SQUARE_PROGRAM',
  ] as const) {
    const e = setup(role);
    assert.ok(e.snapshot().outputBindings[0]);
    if (role === 'RECORD' || role === 'STREAM')
      assert.equal(e.snapshot().outputBindings[0]?.synchronizedSourceRequirement, 'ENCODER_ONLY');
  }
}

function deterministicReplay() {
  const run = () => {
    const engine = setup('PROGRAM');
    for (let i = 0; i < 250; i++) {
      engine.submitVideo(video('s:v:PROGRAM', i, i % 53 === 0));
      engine.submitAudio(audio('s:a:PROGRAM', i));
    }
    return engine.snapshot();
  };
  const a = run();
  const b = run();
  assert.deepEqual(
    a.packets.map((p) => [p.packetId, p.packetSequence, p.pts, p.dts, p.signature]),
    b.packets.map((p) => [p.packetId, p.packetSequence, p.pts, p.dts, p.signature]),
  );
  assert.deepEqual(a.correlations, b.correlations);
}

function longRun() {
  const engine = setup('PROGRAM');
  const processor = createMediaEncoderFoundationProcessor(engine);
  processor.initialize();
  const output: Record<string, unknown> = {};
  const context = {
    outputs: {
      publish: (_id: string, key: string, value: unknown) => {
        output[key] = value;
      },
    },
  } as never;
  for (let i = 0; i < 100_000; i++)
    processor.processTick(
      {
        frameNumber: BigInt(i),
        startedAtNs: 0n,
        deadlineAtNs: 0n,
        scheduledTimeNs: 0n,
        actualTimeNs: 0n,
        presentationTimeNs: 0n,
        frameDurationNs: 0n,
        driftNs: 0n,
      } as never,
      context,
    );
  for (let i = 0; i < 10_000; i++) {
    engine.submitVideo(video('s:v:PROGRAM', i, i % 60 === 0));
    engine.submitAudio(audio('s:a:PROGRAM', i));
  }
  processor.processTick(
    {
      frameNumber: 100_001n,
      startedAtNs: 0n,
      deadlineAtNs: 0n,
      scheduledTimeNs: 0n,
      actualTimeNs: 0n,
      presentationTimeNs: 0n,
      frameDurationNs: 0n,
      driftNs: 0n,
    } as never,
    context,
  );
  const snapshot = engine.snapshot();
  assert.equal(snapshot.health.encodedVideoPacketCount, 10_000);
  assert.equal(snapshot.health.encodedAudioPacketCount, 10_000);
  assert.ok(snapshot.health.keyframeCount >= 164);
  assert.equal(snapshot.validation.valid, true);
  assert.ok(output['media-encoder.health']);
  engine.shutdown();
  assert.equal(engine.assertInvariants().valid, true);
  assert.equal(engine.snapshot().health.activeSessionCount, 0);
}

validationScenario();
deterministicReplay();
longRun();
console.log('media-encoder-foundation validation passed');
