import { createAudioCaptureDemo, createAudioDecodeSource, createFFmpegAudioDecoder } from '../packages/media-plane/dist/media-plane/src/index.js';

const capture = await createAudioCaptureDemo({ frames: 2 });
const decoder = createFFmpegAudioDecoder({ id: 'demo:audio-decoder', dryRun: true, maxFrames: 2, env: process.env });
await decoder.open(createAudioDecodeSource({ id: 'demo:audio-file', uri: 'fixtures/audio.wav' }));
const decoded = [await decoder.decodeNext(), await decoder.decodeNext()].filter(Boolean);
console.log(JSON.stringify({ capture: capture.source, capturedFrames: capture.frames.length, decodedFrames: decoded, decoder: decoder.getSnapshot() }, null, 2));
