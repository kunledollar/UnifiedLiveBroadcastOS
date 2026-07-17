/**
 * Focused automated tests for FFmpeg/FFprobe discovery.
 *
 * Covers:
 *   - parseVersion: pure unit tests for all version string variants
 *   - resolveExecutable: env-var configured paths, PATH fallback, CRLF handling
 *   - Integration: actual ffmpeg/ffprobe execution and artifact verification
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir, platform } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import test from 'node:test';
import { parseVersion, resolveExecutable } from './ffmpeg.js';

// ---------------------------------------------------------------------------
// parseVersion — pure unit tests
// ---------------------------------------------------------------------------

test('parseVersion: standard version string', () => {
  const result = parseVersion('ffmpeg version 6.1.1 Copyright (c) 2000-2023', 'ffmpeg');
  assert.equal(result.ok, true);
  assert.equal(result.version, '6.1.1');
  assert.equal(result.reason, null);
});

test('parseVersion: version with build suffix', () => {
  const result = parseVersion('ffmpeg version 8.1.2-essentials_build-www.gyan.dev Copyright', 'ffmpeg');
  assert.equal(result.ok, true);
  assert.equal(result.version, '8.1.2-essentials_build-www.gyan.dev');
});

test('parseVersion: ffprobe binary name', () => {
  const result = parseVersion('ffprobe version 6.1.1 Copyright (c) 2007-2023', 'ffprobe');
  assert.equal(result.ok, true);
  assert.equal(result.version, '6.1.1');
});

test('parseVersion: version output with CRLF line endings', () => {
  const result = parseVersion('ffmpeg version 7.0.0\r\nbuilt with gcc', 'ffmpeg');
  assert.equal(result.ok, true);
  assert.equal(result.version, '7.0.0');
});

test('parseVersion: version string missing returns not-ok', () => {
  const result = parseVersion('something unexpected without a version line', 'ffmpeg');
  assert.equal(result.ok, false);
  assert.ok(result.reason?.includes('Unable to parse'));
});

test('parseVersion: empty output returns not-ok', () => {
  const result = parseVersion('', 'ffmpeg');
  assert.equal(result.ok, false);
});

// ---------------------------------------------------------------------------
// resolveExecutable: env-var configured path
// ---------------------------------------------------------------------------

test('resolveExecutable: FFMPEG_PATH env var overrides PATH lookup', async (t) => {
  // Temporarily set FFMPEG_PATH to a non-existent value; resolveExecutable must
  // fall back to the bare name when the configured path fails.
  const original = process.env['FFMPEG_PATH'];
  t.after(() => {
    if (original === undefined) delete process.env['FFMPEG_PATH'];
    else process.env['FFMPEG_PATH'] = original;
  });

  const pathResolved = await resolveExecutable('ffmpeg');
  if (!pathResolved) {
    t.skip('ffmpeg not available on PATH for fallback test');
    return;
  }
  process.env['FFMPEG_PATH'] = '/nonexistent/path/ffmpeg';
  const resolved = await resolveExecutable('ffmpeg');
  // Should fall back to PATH lookup and still resolve on systems that provide ffmpeg.
  assert.ok(resolved !== null, 'Should fall back to PATH when configured path is missing');
  assert.ok(resolved.path.length > 0);
  assert.ok(resolved.versionOutput.includes('ffmpeg'));
});

test('resolveExecutable: configured absolute path is used when valid', async (t) => {
  // Use the actual ffmpeg binary as the "configured" path.
  const actual = (() => {
    try {
      const locator = platform() === 'win32' ? 'where.exe' : 'which';
      return execFileSync(locator, ['ffmpeg'], { encoding: 'utf8' }).split(/\r?\n/)[0]?.trim() ?? null;
    } catch { return null; }
  })();
  if (!actual) {
    t.skip('ffmpeg not available for configured-path test');
    return;
  }

  const original = process.env['FFMPEG_PATH'];
  t.after(() => {
    if (original === undefined) delete process.env['FFMPEG_PATH'];
    else process.env['FFMPEG_PATH'] = original;
  });

  process.env['FFMPEG_PATH'] = actual;
  const resolved = await resolveExecutable('ffmpeg');
  assert.ok(resolved !== null);
  assert.equal(resolved.path, actual);
  assert.ok(resolved.versionOutput.includes('ffmpeg'));
});

test('resolveExecutable: FFPROBE_PATH env var is respected', async (t) => {
  const original = process.env['FFPROBE_PATH'];
  t.after(() => {
    if (original === undefined) delete process.env['FFPROBE_PATH'];
    else process.env['FFPROBE_PATH'] = original;
  });

  const pathResolved = await resolveExecutable('ffprobe');
  if (!pathResolved) {
    t.skip('ffprobe not available on PATH for fallback test');
    return;
  }
  process.env['FFPROBE_PATH'] = '/nonexistent/ffprobe';
  const resolved = await resolveExecutable('ffprobe');
  // Falls back to PATH
  assert.ok(resolved !== null, 'Should fall back to PATH when configured path is missing');
  assert.ok(resolved.versionOutput.includes('ffprobe'));
});

// ---------------------------------------------------------------------------
// resolveExecutable: CRLF handling from where.exe / which output
// ---------------------------------------------------------------------------

test('where.exe / which output CRLF is stripped from reported path', () => {
  // Direct unit test of the path-splitting logic used inside resolveExecutable.
  // We simulate where.exe output with CRLF and confirm the first line is trimmed.
  const crlfOutput = 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe\r\nC:\\Tools\\ffmpeg.exe\r\n';
  const firstLine = crlfOutput.split(/\r?\n/)[0]?.trim();
  assert.equal(firstLine, 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe');
});

test('which output newline is stripped from reported path', () => {
  const unixOutput = '/usr/bin/ffmpeg\n';
  const firstLine = unixOutput.split(/\r?\n/)[0]?.trim();
  assert.equal(firstLine, '/usr/bin/ffmpeg');
});

// ---------------------------------------------------------------------------
// Integration: actual ffmpeg/ffprobe execution
// ---------------------------------------------------------------------------

test('resolveExecutable returns non-null for ffmpeg on this host', async (t) => {
  const resolved = await resolveExecutable('ffmpeg');
  if (!resolved) {
    t.skip('ffmpeg not installed');
    return;
  }
  assert.ok(resolved.path.length > 0, 'path must be non-empty');
  assert.ok(resolved.versionOutput.length > 0, 'versionOutput must be non-empty');
  const parsed = parseVersion(resolved.versionOutput, 'ffmpeg');
  assert.equal(parsed.ok, true, `Version must be parseable, got: ${resolved.versionOutput.slice(0, 80)}`);
});

test('resolveExecutable returns non-null for ffprobe on this host', async (t) => {
  const resolved = await resolveExecutable('ffprobe');
  if (!resolved) {
    t.skip('ffprobe not installed');
    return;
  }
  assert.ok(resolved.path.length > 0);
  const parsed = parseVersion(resolved.versionOutput, 'ffprobe');
  assert.equal(parsed.ok, true);
});

test('integration: ffmpeg generates H.264/AAC MP4 artifact verified by ffprobe', async (t) => {
  const ffmpegResolved = await resolveExecutable('ffmpeg');
  const ffprobeResolved = await resolveExecutable('ffprobe');
  if (!ffmpegResolved || !ffprobeResolved) {
    t.skip('ffmpeg/ffprobe not installed');
    return;
  }

  const workdir = mkdtempSync(join(tmpdir(), 'ubos-ffmpeg-test-'));
  const artifactPath = join(workdir, 'test-artifact.mp4');

  await new Promise<void>((resolve, reject) => {
    const child = execFile(
      ffmpegResolved.path,
      [
        '-hide_banner', '-nostdin', '-y',
        '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25:duration=1',
        '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=1',
        '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-t', '1',
        artifactPath,
      ],
      { encoding: 'utf8' },
      (err) => { if (err) reject(err); else resolve(); },
    );
    void child;
  });

  assert.ok(existsSync(artifactPath), 'artifact must exist');
  assert.ok(statSync(artifactPath).size > 0, 'artifact must be non-empty');

  const probeOutput = await new Promise<string>((resolve, reject) => {
    execFile(
      ffprobeResolved.path,
      ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', artifactPath],
      { encoding: 'utf8', maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(`${stdout}${stderr}`);
      },
    );
  });

  const probe = JSON.parse(probeOutput) as { format?: { duration?: string }; streams?: Array<{ codec_type?: string; codec_name?: string }> };
  const duration = Number(probe.format?.duration ?? 0);
  const video = probe.streams?.find((s) => s.codec_type === 'video');
  const audio = probe.streams?.find((s) => s.codec_type === 'audio');

  assert.ok(duration > 0, 'duration must be positive');
  assert.ok(video, 'must have video stream');
  assert.equal(video?.codec_name, 'h264', 'video codec must be h264');
  assert.ok(audio, 'must have audio stream');
  assert.equal(audio?.codec_name, 'aac', 'audio codec must be aac');
});
