import assert from 'node:assert/strict';
import test from 'node:test';
import { mockProductionScenes } from './mockProductionScenes.js';
import { readinessSummary } from './readiness.js';
test('production scene catalog is serializable and uses stable IDs', () => {
  assert.doesNotThrow(() => JSON.stringify(mockProductionScenes));
  assert.equal(new Set(mockProductionScenes.map((scene) => scene.id)).size, mockProductionScenes.length);
  for (const scene of mockProductionScenes) assert.equal(typeof scene.id, 'string');
});
test('catalog exposes each operational presentation state', () => {
  for (const state of ['program', 'preview', 'ready', 'standby', 'warning', 'error', 'disabled', 'scheduled']) assert.ok(mockProductionScenes.some((scene) => scene.operationalState === state));
});
test('readiness summary surfaces warning and error metadata without runtime objects', () => {
  const panel = mockProductionScenes.find((scene) => scene.id === 'ps-panel-discussion');
  assert.ok(panel); assert.equal(readinessSummary(panel.readiness).warning, 2);
  assert.ok(!JSON.stringify(mockProductionScenes).match(/MediaStream|HTMLVideoElement|socket/i));
});
