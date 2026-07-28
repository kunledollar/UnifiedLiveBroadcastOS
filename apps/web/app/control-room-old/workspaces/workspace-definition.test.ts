import assert from 'node:assert/strict';
import test from 'node:test';
import { workspaceCatalog } from './workspace-definition.js';

test('the complete workspace catalog is deterministic, serializable, and safe metadata', () => {
  assert.equal(workspaceCatalog.length, 9);
  assert.doesNotThrow(() => JSON.stringify(workspaceCatalog));
  assert.equal(new Set(workspaceCatalog.map((workspace) => workspace.id)).size, 9);
  assert.doesNotMatch(JSON.stringify(workspaceCatalog), /MediaStream|HTMLMediaElement|HTMLVideoElement|WebRTC|socket/i);
});

test('every workspace has an operational mission and protects Program and Preview', () => {
  for (const workspace of workspaceCatalog) {
    assert.ok(workspace.mission.length > 10, `${workspace.id} needs a mission`);
    assert.ok(workspace.requiredPanels.includes('Program'));
    assert.ok(workspace.requiredPanels.includes('Preview'));
    assert.ok(workspace.defaultPanels.length > 0);
  }
});

test('workspace workbenches differ by operator mission', () => {
  const director = workspaceCatalog.find((workspace) => workspace.id === 'director')!;
  const streaming = workspaceCatalog.find((workspace) => workspace.id === 'streaming-operator')!;
  assert.notDeepEqual(director.defaultPanels, streaming.defaultPanels);
  assert.ok(streaming.defaultPanels.includes('Destinations'));
});
