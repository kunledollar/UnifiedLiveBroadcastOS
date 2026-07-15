import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const requiredFiles = [
  'apps/web/app/api/native-runtime/status/route.ts',
  'apps/web/app/api/native-runtime/recording/finalize/route.ts',
  'apps/web/lib/native-runtime/ffmpeg.ts',
  'apps/web/app/control-room/operations/RecordingRuntimePanel.tsx',
  'apps/web/app/control-room/operations/StreamingRuntimePanel.tsx',
];
function read(file) { return readFileSync(join(root, file), 'utf8'); }
for (const file of requiredFiles) if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
if (!failures.length) {
  const runtime = read('apps/web/lib/native-runtime/ffmpeg.ts');
  for (const token of ['getNativeRuntimeStatus', 'finalizeNativeRecording', 'where.exe', 'which', 'libx264', 'aac', 'ffprobe', 'artifactPath']) {
    if (!runtime.includes(token)) failures.push(`native runtime missing ${token}`);
  }
  const recording = read('apps/web/app/control-room/operations/RecordingRuntimePanel.tsx');
  for (const token of ['Native FFmpeg Recording', 'disabled={!nativeReady}', 'onStartNative', 'onStopNative']) {
    if (!recording.includes(token)) failures.push(`recording panel missing dynamic native control ${token}`);
  }
  const streaming = read('apps/web/app/control-room/operations/StreamingRuntimePanel.tsx');
  for (const token of ["fetch('/api/native-runtime/status'", 'disabled={!canStart}', 'disabled={!canStop}', 'secret://']) {
    if (!streaming.includes(token)) failures.push(`streaming panel missing dynamic readiness ${token}`);
  }
  if (/disabled\s+title=\{missingRuntimeReason\}/.test(streaming)) failures.push('streaming panel still has permanent literal disabled controls');
}
if (failures.length) {
  console.error('UBOS v5.12.0 Step 5 validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('UBOS v5.12.0 Step 5 validation passed: native status API, dynamic gates, and recording finalization are wired.');
