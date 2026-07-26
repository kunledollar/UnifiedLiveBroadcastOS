import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from '../intelligence-graph/ubosIntelligenceGraph.js';
import { UIIntegrationLayer, UI_ACTION_CLASS } from '../intelligence-graph/uiIntelligenceIntegrationLayer.js';
import type { WorkspaceUiSignal } from '../intelligence-graph/workspaceIntelligenceEngine.js';
import {
  OUTPUT_REGION_IDS,
  OUTPUT_REGION_PANEL,
  outputRegionClassName,
  outputRegionAction,
} from './outputIntelligence.js';

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

test('Program Output 2.0: exactly the four canonical regions are wired, each to a real WIE panel (Step 102)', () => {
  assert.deepEqual([...OUTPUT_REGION_IDS], ['program', 'preview', 'routing', 'intelligenceTimeline']);
  assert.equal(OUTPUT_REGION_PANEL.program, 'programOutputPanel');
  assert.equal(OUTPUT_REGION_PANEL.preview, 'scenePanel');
  assert.equal(OUTPUT_REGION_PANEL.routing, 'routingPanel');
  assert.equal(OUTPUT_REGION_PANEL.intelligenceTimeline, 'guidancePanel');
  // Preview means the same thing everywhere in UBOS — the same panel Triad's own preview lane uses.
  assert.equal(OUTPUT_REGION_PANEL.preview, 'scenePanel');
});

test('Program Output 2.0: an output degradation warning warns only the Program region (Step 102)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'warn', panel: 'programOutputPanel' })]);
  layer.apply();

  assert.equal(outputRegionClassName('program', layer), UI_ACTION_CLASS.warn);
  assert.equal(outputRegionClassName('preview', layer), '');
  assert.equal(outputRegionClassName('routing', layer), '');
  assert.equal(outputRegionClassName('intelligenceTimeline', layer), '');
});

test('Program Output 2.0: a predicted transition highlights Preview and a routing failure warns Routing, independently (Step 102)', () => {
  const layer = new UIIntegrationLayer([
    signal({ action: 'pulse', panel: 'scenePanel' }),
    signal({ action: 'warn', panel: 'routingPanel' }),
  ]);
  layer.apply();

  assert.equal(outputRegionClassName('preview', layer), UI_ACTION_CLASS.pulse);
  assert.equal(outputRegionClassName('routing', layer), UI_ACTION_CLASS.warn);
  assert.equal(outputRegionAction('preview', layer), 'pulse');
  assert.equal(outputRegionAction('routing', layer), 'warn');
  assert.equal(outputRegionAction('program', layer), null);
});

test('Program Output 2.0: end-to-end through the real graph — an output frame-drop event reaches the Program region (Step 102)', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'director', system: 'ubos' });
  graph.guidanceEngine.setContext('Director', 'director');

  for (let i = 0; i < 3; i += 1) {
    graph.ingest({
      id: `output:frame-drop:${i}`,
      type: 'output.frame_drop',
      source: 'output-engine',
      workspace: 'director',
      payload: { droppedFrames: 5 + i },
    });
  }

  const programClass = outputRegionClassName('program', graph.uiIntegration);
  assert.ok(
    programClass === UI_ACTION_CLASS.warn || programClass === UI_ACTION_CLASS.highlight,
    `expected Program region to react to frame drops, got "${programClass}"`,
  );
});
