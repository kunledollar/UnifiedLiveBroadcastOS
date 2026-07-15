import { execFile, execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const MIN_SUPPORTED_MAJOR = 6;
const stderrLimitBytes = 64 * 1024;

function execFileText(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8', maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(`${stdout}${stderr}`);
    });
  });
}

function resolveOnPath(binary) {
  try {
    return execFileSync('which', [binary], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function parseVersion(output, binary) {
  const match = output.match(new RegExp(`${binary} version\\s+([^\\s]+)`, 'i'));
  if (!match) return { version: null, state: 'STARTUP_FAILED', reason: `Unable to parse ${binary} version.` };
  const major = Number(String(match[1]).split('.')[0]);
  if (!Number.isFinite(major) || major < MIN_SUPPORTED_MAJOR) {
    return { version: match[1], state: 'UNSUPPORTED_VERSION', reason: `${binary} ${match[1]} is below ${MIN_SUPPORTED_MAJOR}.x.` };
  }
  return { version: match[1], state: 'AVAILABLE', reason: null };
}

function redact(value) {
  return value
    .replace(/(stream[_-]?key=)[^\s&]+/gi, '$1[REDACTED]')
    .replace(/rtmps?:\/\/([^:\s]+):([^@\s]+)@/gi, 'rtmp://$1:[REDACTED]@')
    .replace(/(secret:\/\/)[^\s]+/gi, '$1[REDACTED]');
}

function appendBounded(current, next) {
  const combined = `${current}${next}`;
  return combined.length > stderrLimitBytes ? combined.slice(combined.length - stderrLimitBytes) : combined;
}

async function runProcess(command, args, { timeoutMs = 20_000 } = {}) {
  let stderr = '';
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, stdio: ['ignore', 'ignore', 'pipe'] });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stderr.on('data', (chunk) => {
      stderr = appendBounded(stderr, redact(chunk.toString('utf8')));
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      const result = { code, signal, stderr, durationMs: Date.now() - startedAt };
      if (code === 0) resolve(result);
      else reject(Object.assign(new Error(`process exited ${code ?? signal}`), result));
    });
  });
}

function validateDestinationUrl(url) {
  try {
    const parsed = new URL(url);
    return ['rtmp:', 'rtmps:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

async function main() {
  const ffmpegPath = resolveOnPath('ffmpeg');
  const ffprobePath = resolveOnPath('ffprobe');
  if (!ffmpegPath || !ffprobePath) {
    console.error(JSON.stringify({
      state: !ffmpegPath ? 'MISSING' : 'PROBE_MISSING',
      ffmpegPath,
      ffprobePath,
      reason: !ffmpegPath
        ? 'ffmpeg executable did not resolve through PATH in this runtime host.'
        : 'ffprobe executable did not resolve through PATH in this runtime host.',
    }, null, 2));
    process.exit(1);
  }

  const ffmpegVersionOutput = await execFileText(ffmpegPath, ['-version']);
  const ffprobeVersionOutput = await execFileText(ffprobePath, ['-version']);
  const ffmpeg = parseVersion(ffmpegVersionOutput, 'ffmpeg');
  const ffprobe = parseVersion(ffprobeVersionOutput, 'ffprobe');
  assert.equal(ffmpeg.state, 'AVAILABLE');
  assert.equal(ffprobe.state, 'AVAILABLE');

  const workdir = await mkdtemp(join(tmpdir(), 'ubos-v512-native-'));
  const artifactPath = join(workdir, 'ubos-v512-native-recording.mp4');
  const args = [
    '-hide_banner',
    '-nostdin',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc2=size=1280x720:rate=30:duration=2',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=1000:sample_rate=48000:duration=2',
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    '-c:a',
    'aac',
    '-ar',
    '48000',
    '-movflags',
    '+faststart',
    '-t',
    '2',
    artifactPath,
  ];
  const encode = await runProcess(ffmpegPath, args, { timeoutMs: 30_000 });
  assert.equal(encode.code, 0);
  assert.ok(existsSync(artifactPath), 'native recording artifact must exist');
  const sizeBytes = statSync(artifactPath).size;
  assert.ok(sizeBytes > 0, 'native recording artifact must be non-empty');

  const probeRaw = await execFileText(ffprobePath, [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    artifactPath,
  ]);
  const probe = JSON.parse(probeRaw);
  const duration = Number(probe.format?.duration ?? 0);
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams?.find((stream) => stream.codec_type === 'audio');
  assert.ok(duration > 0, 'ffprobe duration must be nonzero');
  assert.ok(video, 'ffprobe must report a video stream');
  assert.equal(video.codec_name, 'h264');
  assert.ok(audio, 'ffprobe must report an audio stream for deterministic sine ingress');
  assert.equal(audio.codec_name, 'aac');

  assert.equal(validateDestinationUrl('rtmp://localhost/live/stream'), true);
  assert.equal(validateDestinationUrl('rtmps://example.test/live'), true);
  assert.equal(validateDestinationUrl('https://example.test/live'), false);
  const secretLog = redact('rtmps://user:super-secret@example/live stream_key=plain secret://rtmp/key');
  assert.doesNotMatch(secretLog, /super-secret|plain|rtmp\/key/);

  const approvedDestination = process.env.UBOS_V512_RTMP_URL;
  const secretRef = process.env.UBOS_V512_RTMP_SECRET_REF;
  const rtmp = approvedDestination && secretRef
    ? { state: 'READY_FOR_RECEIPT_TEST', destinationType: new URL(approvedDestination).protocol.replace(':', '').toUpperCase() }
    : { state: 'BLOCKED_BY_TEST_DESTINATION', destinationType: 'CUSTOM_RTMP_OR_RTMPS', reason: 'Set UBOS_V512_RTMP_URL and UBOS_V512_RTMP_SECRET_REF for approved receipt validation.' };

  const summary = {
    nativeExecutionHost: 'api/server process host (Node.js validation host; browser never spawns FFmpeg)',
    ffmpegPath,
    ffmpegVersion: ffmpeg.version,
    ffprobePath,
    ffprobeVersion: ffprobe.version,
    programVideoIngress: 'deterministic lavfi testsrc2 actual video bytes',
    programAudioIngress: 'deterministic lavfi sine actual audio bytes',
    artifactPath,
    artifact: { sizeBytes, duration, videoCodec: video.codec_name, audioCodec: audio.codec_name },
    encode: { durationMs: encode.durationMs, stderrBytes: encode.stderr.length },
    rtmp,
  };
  console.log(JSON.stringify(summary, null, 2));
}

mkdirSync(join(process.cwd(), '.tmp'), { recursive: true });
await main();
