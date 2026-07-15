import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const appRoot = join(root, 'apps/web/app');
const filesToScan = [
  'apps/web/app/control-room/menu/UbosMenuBar.tsx',
  'apps/web/app/control-room/command-center/CommandCenterTopMenu.tsx',
];
const forbiddenEnabledHrefs = [
  '/control-room/settings',
  '/control-room/streaming-runtime',
  '/control-room/compositor',
];
const failures = [];

function read(path) { return readFileSync(join(root, path), 'utf8'); }

for (const route of forbiddenEnabledHrefs) {
  const page = join(appRoot, route.replace(/^\//, ''), 'page.tsx');
  if (existsSync(page)) continue;
  for (const file of filesToScan) {
    const text = read(file);
    if (text.includes(`href: '${route}'`) || text.includes(`href=\"${route}\"`)) {
      failures.push(`${file} exposes missing route ${route}`);
    }
  }
}

const manifestPath = join(root, 'scripts/v512-control-wiring-manifest.json');
if (!existsSync(manifestPath)) failures.push('missing v5.12.0 control wiring manifest');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
if (manifest) {
  const controls = manifest.controls ?? [];
  const requiredControls = [
    'source-selection','scene-selection','preview-assignment','program-take','cut','auto',
    'transition-selection','transition-duration','graphics-prepare','graphics-take','graphics-clear',
    'recording-start','recording-stop','output-start','output-stop','audio-mute','audio-gain',
    'navigation','keyboard-shortcuts'
  ];
  for (const id of requiredControls) if (!controls.some((control) => control.id === id)) failures.push(`manifest missing audited control ${id}`);
  for (const control of controls) {
    for (const key of ['ui','handler','command','transport','processor','engine','backend','state','persistence','before','action','after','evidence']) {
      if (!control[key]) failures.push(`control ${control.id} missing ${key}`);
    }
    if (['LIVE', 'LIVE_BROWSER', 'LIVE_NATIVE'].includes(control.after) && !/verified|real execution|backend|browser media|MediaRecorder|MediaDevices/i.test(`${control.evidence} ${control.backend} ${control.engine}`)) {
      failures.push(`control ${control.id} claims LIVE without runtime evidence`);
    }
    if (!['LIVE','LIVE_BROWSER','LIVE_NATIVE','SIMULATED','UNAVAILABLE','DEAD'].includes(control.after)) failures.push(`control ${control.id} has invalid after classification`);
    if (control.after === 'SIMULATED' && !/simulat|browser|metadata|local/i.test(`${control.action} ${control.evidence} ${control.transport} ${control.engine}`)) {
      failures.push(`control ${control.id} is synthetic without simulation label`);
    }
    if (!['UNAVAILABLE','DEAD'].includes(control.after) && /none|disabled/.test(String(control.command).toLowerCase())) {
      failures.push(`enabled control ${control.id} dispatches no command`);
    }
  }
}

const sceneWorkspace = read('apps/web/app/control-room/scene-workspace.tsx');
for (const token of ['stageScene', 'switchProgram', 'dispatchProductionGraphCommand', 'PreviewCommand', 'CutCommand', 'AutoCommand', 'updateProductionState']) {
  if (!sceneWorkspace.includes(token)) failures.push(`Control Room missing runtime wiring token ${token}`);
}
const streamingPanel = read('apps/web/app/control-room/operations/StreamingRuntimePanel.tsx');
for (const token of [
  'Output controls are disabled',
  'missingRuntimeReason',
  'disabled={!canStart}',
  'disabled={!canStop}',
  "fetch('/api/native-runtime/status'",
]) {
  if (!streamingPanel.includes(token)) failures.push(`Streaming output unavailable guard missing ${token}`);
}
const recordingPanel = read('apps/web/app/control-room/operations/RecordingRuntimePanel.tsx');
for (const token of ['MediaRecorder', 'preparing', 'recording', 'completed', 'failed', 'Metadata only']) {
  if (!recordingPanel.includes(token)) failures.push(`Recording panel missing state/label ${token}`);
}

const auditPath = join(root, 'docs/architecture/ubos-v5.12.0-capability-wiring-audit.md');
if (!existsSync(auditPath)) failures.push('missing v5.12.0 capability audit document');
else {
  const audit = readFileSync(auditPath, 'utf8');
  for (const term of ['LIVE', 'SIMULATED', 'UNAVAILABLE', 'DEAD', 'Primary vertical workflow status', 'Step 2 control wiring matrix', 'Final Step 2 counts']) {
    if (!audit.includes(term)) failures.push(`audit missing required term: ${term}`);
  }
}

if (failures.length) {
  console.error('UBOS v5.12.0 capability wiring validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`UBOS v5.12.0 capability wiring validation passed (${manifest?.controls?.length ?? 0} controls audited).`);
