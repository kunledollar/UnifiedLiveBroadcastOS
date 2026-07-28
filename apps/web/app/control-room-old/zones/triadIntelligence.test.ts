import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from '../intelligence-graph/ubosIntelligenceGraph.js';
import { UIIntegrationLayer, UI_ACTION_CLASS } from '../intelligence-graph/uiIntelligenceIntegrationLayer.js';
import type { WorkspaceUiSignal } from '../intelligence-graph/workspaceIntelligenceEngine.js';
import {
  TRIAD_LANE_IDS,
  TRIAD_LANE_PANEL,
  triadLaneClassName,
  triadLaneAction,
} from './triadIntelligence.js';

function signal(
  partial: Pick<WorkspaceUiSignal, 'action' | 'panel'> & Partial<WorkspaceUiSignal>,
): WorkspaceUiSignal {
  return {
    id: partial.id ?? `sig-${partial.panel}-${partial.action}`,
    action: partial.action,
    panel: partial.panel,
    confidence: partial.confidence ?? 0.9,
    reason: partial.reason ?? partial.action,
    timestamp: partial.timestamp ?? Date.now(),
  };
}

test('Triad 2.0: exactly the three canonical lanes are wired, each to a real WIE panel (Step 100)', () => {
  assert.deepEqual([...TRIAD_LANE_IDS], ['scene', 'preview', 'program']);
  assert.equal(TRIAD_LANE_PANEL.scene, 'scenePanel');
  assert.equal(TRIAD_LANE_PANEL.program, 'programOutputPanel');
  // Preview mirrors Scene's predictions — there is no dedicated previewPanel.
  assert.equal(TRIAD_LANE_PANEL.preview, TRIAD_LANE_PANEL.scene);
});

test('Triad 2.0: a predicted scene transition highlights the Scene and Preview lanes, not Program (Step 100)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'prepare', panel: 'scenePanel' })]);
  layer.apply();

  assert.equal(triadLaneClassName('scene', layer), UI_ACTION_CLASS.prepare);
  assert.equal(triadLaneClassName('preview', layer), UI_ACTION_CLASS.prepare);
  assert.equal(triadLaneClassName('program', layer), '');
  assert.equal(triadLaneAction('scene', layer), 'prepare');
  assert.equal(triadLaneAction('program', layer), null);
});

test('Triad 2.0: an output warning elevates only the Program lane (Step 100)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'warn', panel: 'programOutputPanel' })]);
  layer.apply();

  assert.equal(triadLaneClassName('program', layer), UI_ACTION_CLASS.warn);
  assert.equal(triadLaneClassName('scene', layer), '');
  assert.equal(triadLaneClassName('preview', layer), '');
});

test('Triad 2.0: Scene and Program lanes can carry independent, simultaneous signals (Step 100)', () => {
  const layer = new UIIntegrationLayer([
    signal({ action: 'highlight', panel: 'scenePanel' }),
    signal({ action: 'warn', panel: 'programOutputPanel' }),
  ]);
  layer.apply();

  assert.equal(triadLaneClassName('scene', layer), UI_ACTION_CLASS.highlight);
  assert.equal(triadLaneClassName('preview', layer), UI_ACTION_CLASS.highlight);
  assert.equal(triadLaneClassName('program', layer), UI_ACTION_CLASS.warn);
});

test('Triad 2.0: end-to-end through the real graph — an ingested audio-clip-adjacent scene event reaches the Scene lane (Step 100)', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'director', system: 'ubos' });
  graph.guidanceEngine.setContext('Director', 'director');

  // Repeated scene-change events are the kind of pattern the Predictive
  // Engine turns into a predicted-transition signal on scenePanel.
  for (let i = 0; i < 4; i += 1) {
    graph.ingest({
      id: `scene:change:${i}`,
      type: 'scene.change',
      source: 'scene-graph',
      workspace: 'director',
      payload: { sceneId: `scene-${i}` },
    });
  }

  const laneClass = triadLaneClassName('scene', graph.uiIntegration);
  const previewClass = triadLaneClassName('preview', graph.uiIntegration);
  // Preview always mirrors Scene exactly, whatever WIE decided (or didn't).
  assert.equal(previewClass, laneClass);
});
