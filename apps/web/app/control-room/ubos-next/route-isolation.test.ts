import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
