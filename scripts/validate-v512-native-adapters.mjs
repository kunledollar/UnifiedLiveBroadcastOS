import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  FFmpegRecordingAdapter,
  RtmpStreamingAdapter,
  buildFFmpegRecordingArgs,
  discoverFFmpegExecutable,
  validateFFmpegVersion,
  validatePlayableOutputMetadata,
} from '../packages/media-plane/dist/media-plane/src/native-media-adapter.js';

class FakeProcess extends EventEmitter {
  stderr = new EventEmitter();
  killed = [];
  kill(signal) {
    this.killed.push(signal);
    this.emit('exit', signal === 'SIGINT' ? 0 : null, signal);
    return true;
  }
}
const fakeSpawn = (process, seen) => (command, args, options) => {
  seen.command = command;
  seen.args = args;
  seen.shell = options.shell;
  return process;
};

assert.deepEqual(validateFFmpegVersion('ffmpeg version 6.0 Copyright').ok, true);
assert.equal(validateFFmpegVersion('not ffmpeg').ok, false);
assert.equal(validatePlayableOutputMetadata({ mimeType: 'video/webm', sizeBytes: 1024, durationMs: 1000 }).ok, true);
assert.equal(validatePlayableOutputMetadata({ mimeType: 'video/webm', sizeBytes: 0, durationMs: 1000 }).ok, false);

const missing = discoverFFmpegExecutable(['/missing/ffmpeg'], () => false);
assert.equal(missing.available, false);
assert.match(missing.reason, /FFmpeg executable not found/);

const args = buildFFmpegRecordingArgs(['-f', 'lavfi', '-i', 'testsrc=size=128x72:rate=10'], '/tmp/out.webm');
assert.deepEqual(args.slice(0, 3), ['-hide_banner', '-nostdin', '-y']);
assert.equal(args.includes('/tmp/out.webm'), true);

const proc = new FakeProcess();
const seen = {};
const adapter = new FFmpegRecordingAdapter({
  executable: 'ffmpeg',
  inputArgs: ['-f', 'lavfi', '-i', 'testsrc'],
  outputPath: '/tmp/out.webm',
  exists: () => true,
  spawnProcess: fakeSpawn(proc, seen),
});
await adapter.start();
assert.equal(seen.shell, false);
proc.stderr.emit('data', Buffer.from('stream_key=supersecret'));
proc.emit('exit', 1, null);
assert.equal(adapter.health().state, 'failed');
assert.doesNotMatch(adapter.diagnostics().join('\n'), /supersecret/);

const cancelProcess = new FakeProcess();
const cancelAdapter = new FFmpegRecordingAdapter({
  executable: 'ffmpeg',
  inputArgs: ['-f', 'lavfi', '-i', 'testsrc'],
  outputPath: '/tmp/cancel.webm',
  exists: () => true,
  spawnProcess: fakeSpawn(cancelProcess, {}),
});
await cancelAdapter.start();
const cancelled = await cancelAdapter.cancel('operator cancelled stream_key=secret');
assert.equal(cancelled.state, 'cancelled');
assert.equal(cancelProcess.killed.includes('SIGTERM'), true);
assert.doesNotMatch(cancelAdapter.diagnostics().join('\n'), /secret/);

const timeoutProcess = new FakeProcess();
const timeoutAdapter = new FFmpegRecordingAdapter({
  executable: 'ffmpeg',
  inputArgs: ['-f', 'lavfi', '-i', 'testsrc'],
  outputPath: '/tmp/timeout.webm',
  exists: () => true,
  spawnProcess: fakeSpawn(timeoutProcess, {}),
  timeoutMs: 1,
});
await timeoutAdapter.start();
await new Promise((resolve) => setTimeout(resolve, 5));
assert.equal(timeoutAdapter.health().state, 'timeout');

const ok = new RtmpStreamingAdapter(
  { url: 'rtmps://example/live', streamKeyRef: 'secret://rtmp/test', approvedTestDestination: true },
  async () => true,
);
assert.equal(await ok.start(), 'live');
assert.equal(ok.metrics().bitrateKbps > 0, true);
assert.equal(ok.markDegraded(3), 'degraded');
assert.equal(ok.reconnect(), 'reconnecting');
assert.deepEqual(ok.redactedDestination(), { url: 'rtmps://example/live', streamKeyRef: '[secret-ref]' });
assert.equal(ok.stop(), 'stopped');

const authFailure = new RtmpStreamingAdapter(
  { url: 'rtmps://example/live', streamKeyRef: 'secret://bad', approvedTestDestination: true },
  async () => false,
);
assert.equal(await authFailure.start(), 'failed');

const unapproved = new RtmpStreamingAdapter(
  { url: 'rtmps://example/live', streamKeyRef: 'secret://none', approvedTestDestination: false },
  async () => true,
);
assert.equal(await unapproved.start(), 'failed');
console.log('UBOS v5.12.0 Step 3 native media adapter validation passed');
