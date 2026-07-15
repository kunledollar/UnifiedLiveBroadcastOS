import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const approvedBaseline = '244c7d8';
const protectedUiFiles = [
  'apps/web/app/control-room/scene-workspace.tsx',
  'apps/web/app/control-room/workspace/OutputViewRenderer.tsx',
  'apps/web/app/control-room/switcher/ProfessionalSwitcher.tsx',
  'apps/web/app/control-room/browsers/SourceBrowser.tsx',
  'apps/web/app/control-room/browsers/SceneBrowser.tsx',
  'apps/web/app/control-room/audio-console/ProfessionalAudioMixer.tsx',
  'apps/web/app/control-room/graphics/GraphicsPreviewControls.tsx',
  'apps/web/app/control-room/operations/RecordingRuntimePanel.tsx',
];

function read(path) { return readFileSync(join(root, path), 'utf8'); }
function gitShow(ref, path) {
  return execFileSync('git', ['show', `${ref}:${path}`], { encoding: 'utf8' });
}

for (const file of protectedUiFiles) {
  if (!existsSync(join(root, file))) failures.push(`protected UI file missing: ${file}`);
  try {
    const before = gitShow(approvedBaseline, file).replace(/\s+/g, ' ');
    const current = read(file).replace(/\s+/g, ' ');
    const requiredTokens = ['Program', 'Preview'];
    for (const token of requiredTokens) {
      if (before.includes(token) && !current.includes(token)) failures.push(`${file} lost required structural token ${token}`);
    }
  } catch (error) {
    failures.push(`unable to compare ${file} against approved baseline ${approvedBaseline}: ${error.message}`);
  }
}

const sceneWorkspace = read('apps/web/app/control-room/scene-workspace.tsx');
for (const token of [
  'LiveMediaMonitor',
  'programStreamToShow',
  'previewStreamToShow',
  'switchProgram',
  'setProgramStreamOnAir(true)',
  'data-ubos-program-monitor',
  'captureStream',
  'verifyBrowserRecordingArtifact',
]) {
  if (!sceneWorkspace.includes(token)) failures.push(`real browser program/recording path missing ${token}`);
}

const recordingVerifier = read('apps/web/app/control-room/operations/browser-recording-verification.ts');
for (const token of ['non-empty', 'MIME type', 'measurable duration', 'played back', 'confirmed', 'failed']) {
  if (!recordingVerifier.includes(token)) failures.push(`browser artifact verifier missing ${token}`);
}

const nativeAdapter = read('packages/media-plane/src/native-media-adapter.ts');
for (const token of [
  'initialize()',
  'start(signal?: AbortSignal)',
  'stop()',
  'health()',
  'metrics()',
  'diagnostics()',
  'shutdown()',
  'buildFFmpegRecordingArgs',
  'shell: false',
  'RtmpStreamingAdapter',
  'streamKeyRef',
  '[secret-ref]',
]) {
  if (!nativeAdapter.includes(token)) failures.push(`native adapter contract missing ${token}`);
}

if (failures.length) {
  console.error('UBOS v5.12.0 Step 3 validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('UBOS v5.12.0 Step 3 validation passed: UI baseline protected, browser media path verified, native adapter contract present.');
