import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolvePrototypeWorkspace } from './workspace-resolver';

const root = resolve(process.cwd(), 'app');
const read = (relative: string) => readFileSync(resolve(root, relative), 'utf8');

test('operational control room keeps its runtime-backed WorkspaceShell', () => {
  const layout = read('control-room/layout.tsx');
  assert.match(layout, /WorkspaceShell/);
  assert.doesNotMatch(layout, /UbosNextShell/);
});

test('UBOS Next is an isolated presentation lab without runtime or media ownership', () => {
  const layout = read('control-room-next/layout.tsx');
  const view = read('control-room/ubos-next/PrototypeWorkspaceView.tsx');
  assert.match(layout, /UbosNextShell/);
  assert.doesNotMatch(layout, /ProductionRuntimeHost|WorkspaceHost|WorkspaceDockManager/);
  assert.doesNotMatch(view, /<video|MediaStream|ProductionRuntimeHost|dispatch\s*\(/);
  assert.match(read('control-room/ubos-next/UbosNextShell.tsx'), /UBOS Next Presentation Lab — Demonstration Data — No Runtime Connected/);
});

test('prototype workspace resolution is safe during static prerendering', () => {
  assert.equal(resolvePrototypeWorkspace(null).id, 'director');
  assert.equal(resolvePrototypeWorkspace('/control-room-next/replay-operator').id, 'replay-operator');
  assert.equal(resolvePrototypeWorkspace('/control-room-next/not-a-workspace').id, 'director');
  const shell = read('control-room/ubos-next/UbosNextShell.tsx');
  assert.doesNotMatch(shell, /href=\{`\/control-room\/\$\{item\.id\}`/);
  assert.match(shell, /href=\{`\/control-room-next\/\$\{item\.id\}`/);
});
