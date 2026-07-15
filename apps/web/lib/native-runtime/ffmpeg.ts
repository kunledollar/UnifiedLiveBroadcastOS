import { execFile, execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type NativeRuntimeStatus = {
  host: 'next-server';
  connected: boolean;
  ffmpeg: { state: 'AVAILABLE' | 'MISSING' | 'UNSUPPORTED_VERSION' | 'STARTUP_FAILED'; path: string | null; version: string | null; reason: string | null };
  ffprobe: { state: 'AVAILABLE' | 'PROBE_MISSING' | 'UNSUPPORTED_VERSION' | 'STARTUP_FAILED'; path: string | null; version: string | null; reason: string | null };
  recordingReady: boolean;
  activeRecordingState: 'idle' | 'finalizing' | 'failed' | 'completed';
  lastArtifactResult: NativeRecordingArtifactResult | null;
  lastFailure: string | null;
};

export type NativeRecordingArtifactResult = {
  artifactPath: string;
  sizeBytes: number;
  durationSeconds: number;
  videoCodec: string;
  audioCodec: string | null;
  ffmpegExitCode: number;
  ffprobeOk: boolean;
};

let activeRecordingState: NativeRuntimeStatus['activeRecordingState'] = 'idle';
let lastArtifactResult: NativeRecordingArtifactResult | null = null;
let lastFailure: string | null = null;

function resolveOnPath(binary: string) {
  try {
    return execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', [binary], { encoding: 'utf8' }).split(/\r?\n/)[0]?.trim() || null;
  } catch {
    return null;
  }
}

function parseVersion(output: string, binary: string) {
  const match = output.match(new RegExp(`${binary} version\\s+([^\\s]+)`, 'i'));
  if (!match) return { version: null, ok: false, reason: `Unable to parse ${binary} version.` };
  return { version: match[1] ?? null, ok: true, reason: null };
}

function execText(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(`${stdout}${stderr}`);
    });
  });
}

async function inspectFFmpeg() {
  const path = resolveOnPath('ffmpeg');
  if (!path) return { state: 'MISSING' as const, path: null, version: null, reason: 'ffmpeg did not resolve on PATH.' };
  try {
    const parsed = parseVersion(await execText(path, ['-version']), 'ffmpeg');
    return parsed.ok
      ? { state: 'AVAILABLE' as const, path, version: parsed.version, reason: null }
      : { state: 'STARTUP_FAILED' as const, path, version: null, reason: parsed.reason };
  } catch (error) {
    return { state: 'STARTUP_FAILED' as const, path, version: null, reason: error instanceof Error ? error.message : 'ffmpeg startup failed.' };
  }
}

async function inspectFFprobe() {
  const path = resolveOnPath('ffprobe');
  if (!path) return { state: 'PROBE_MISSING' as const, path: null, version: null, reason: 'ffprobe did not resolve on PATH.' };
  try {
    const parsed = parseVersion(await execText(path, ['-version']), 'ffprobe');
    return parsed.ok
      ? { state: 'AVAILABLE' as const, path, version: parsed.version, reason: null }
      : { state: 'STARTUP_FAILED' as const, path, version: null, reason: parsed.reason };
  } catch (error) {
    return { state: 'STARTUP_FAILED' as const, path, version: null, reason: error instanceof Error ? error.message : 'ffprobe startup failed.' };
  }
}

export async function getNativeRuntimeStatus(): Promise<NativeRuntimeStatus> {
  const [ffmpeg, ffprobe] = await Promise.all([inspectFFmpeg(), inspectFFprobe()]);
  const recordingReady = ffmpeg.state === 'AVAILABLE' && ffprobe.state === 'AVAILABLE' && activeRecordingState === 'idle';
  return { host: 'next-server', connected: true, ffmpeg, ffprobe, recordingReady, activeRecordingState, lastArtifactResult, lastFailure };
}

function runFFmpeg(command: string, args: string[]) {
  return new Promise<{ code: number; stderr: string }>((resolve, reject) => {
    let stderr = '';
    const child = spawn(command, args, { shell: false, stdio: ['ignore', 'ignore', 'pipe'] });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('FFmpeg transcode timed out.'));
    }, 60_000);
    child.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk.toString('utf8')}`.slice(-65536);
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve({ code, stderr });
      else reject(new Error(`FFmpeg exited with code ${code}.`));
    });
  });
}

export async function finalizeNativeRecording(input: { base64Webm: string; mimeType: string; expectedAudio: boolean }) {
  if (activeRecordingState !== 'idle') throw new Error('A native recording finalization is already active.');
  activeRecordingState = 'finalizing';
  lastFailure = null;
  try {
    const status = await getNativeRuntimeStatus();
    if (status.ffmpeg.state !== 'AVAILABLE' || !status.ffmpeg.path) throw new Error(status.ffmpeg.reason ?? 'FFmpeg unavailable.');
    if (status.ffprobe.state !== 'AVAILABLE' || !status.ffprobe.path) throw new Error(status.ffprobe.reason ?? 'FFprobe unavailable.');
    const dir = join(tmpdir(), 'ubos-native-recordings');
    mkdirSync(dir, { recursive: true });
    const id = randomUUID();
    const sourcePath = join(dir, `${id}.webm`);
    const artifactPath = join(dir, `${id}.mp4`);
    writeFileSync(sourcePath, Buffer.from(input.base64Webm, 'base64'));
    const ffmpegArgs = ['-hide_banner', '-nostdin', '-y', '-i', sourcePath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p'];
    if (input.expectedAudio) ffmpegArgs.push('-c:a', 'aac', '-ar', '48000');
    else ffmpegArgs.push('-an');
    ffmpegArgs.push('-movflags', '+faststart', artifactPath);
    const ffmpegResult = await runFFmpeg(status.ffmpeg.path, ffmpegArgs);
    if (!existsSync(artifactPath) || statSync(artifactPath).size <= 0) throw new Error('FFmpeg did not produce a non-empty artifact.');
    const probe = JSON.parse(await execText(status.ffprobe.path, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', artifactPath]));
    const durationSeconds = Number(probe.format?.duration ?? 0);
    const video = probe.streams?.find((stream: { codec_type?: string }) => stream.codec_type === 'video');
    const audio = probe.streams?.find((stream: { codec_type?: string }) => stream.codec_type === 'audio');
    if (!(durationSeconds > 0)) throw new Error('FFprobe reported zero duration.');
    if (!video) throw new Error('FFprobe reported no video stream.');
    if (input.expectedAudio && !audio) throw new Error('FFprobe reported no audio stream.');
    lastArtifactResult = { artifactPath, sizeBytes: statSync(artifactPath).size, durationSeconds, videoCodec: String(video.codec_name), audioCodec: audio?.codec_name ? String(audio.codec_name) : null, ffmpegExitCode: ffmpegResult.code, ffprobeOk: true };
    activeRecordingState = 'completed';
    return lastArtifactResult;
  } catch (error) {
    activeRecordingState = 'failed';
    lastFailure = error instanceof Error ? error.message : 'Native recording failed.';
    throw error;
  } finally {
    if (activeRecordingState === 'completed' || activeRecordingState === 'failed') activeRecordingState = 'idle';
  }
}
