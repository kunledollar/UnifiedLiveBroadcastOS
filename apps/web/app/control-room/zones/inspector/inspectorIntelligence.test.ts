import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from '../../intelligence-graph/ubosIntelligenceGraph.js';
import { UIIntegrationLayer, UI_ACTION_CLASS } from '../../intelligence-graph/uiIntelligenceIntegrationLayer.js';
import type { WorkspaceUiSignal } from '../../intelligence-graph/workspaceIntelligenceEngine.js';
import {
  INSPECTOR_REGION_IDS,
  INSPECTOR_REGION_PANEL,
  inspectorRegionClassName,
  inspectorRegionAction,
} from './inspectorIntelligence.js';

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

test('Inspector 2.0: exactly the four canonical regions are wired, each to a real WIE panel (Step 101)', () => {
  assert.deepEqual([...INSPECTOR_REGION_IDS], ['navigation', 'body', 'metadata', 'intelligenceBar']);
  assert.equal(INSPECTOR_REGION_PANEL.navigation, 'scenePanel');
  assert.equal(INSPECTOR_REGION_PANEL.body, 'scenePanel');
  assert.equal(INSPECTOR_REGION_PANEL.metadata, 'guidancePanel');
  assert.equal(INSPECTOR_REGION_PANEL.intelligenceBar, 'guidancePanel');
});

test('Inspector 2.0: a predicted scene transition highlights Navigation and Body, not Metadata/Intelligence Bar (Step 101)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'prepare', panel: 'scenePanel' })]);
  layer.apply();

  assert.equal(inspectorRegionClassName('navigation', layer), UI_ACTION_CLASS.prepare);
  assert.equal(inspectorRegionClassName('body', layer), UI_ACTION_CLASS.prepare);
  assert.equal(inspectorRegionClassName('metadata', layer), '');
  assert.equal(inspectorRegionClassName('intelligenceBar', layer), '');
});

test('Inspector 2.0: elevated guidance highlights Metadata and Intelligence Bar independently of Navigation/Body (Step 101)', () => {
  const layer = new UIIntegrationLayer([
    signal({ action: 'elevate', panel: 'guidancePanel' }),
    signal({ action: 'highlight', panel: 'scenePanel' }),
  ]);
  layer.apply();

  assert.equal(inspectorRegionClassName('metadata', layer), UI_ACTION_CLASS.elevate);
  assert.equal(inspectorRegionClassName('intelligenceBar', layer), UI_ACTION_CLASS.elevate);
  assert.equal(inspectorRegionClassName('navigation', layer), UI_ACTION_CLASS.highlight);
  assert.equal(inspectorRegionAction('navigation', layer), 'highlight');
  assert.equal(inspectorRegionAction('metadata', layer), 'elevate');
});

test('Inspector 2.0: end-to-end through the real graph — a missing-source scene event reaches Navigation and Body (Step 101)', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'director', system: 'ubos' });
  graph.guidanceEngine.setContext('Director', 'director');

  graph.ingest({
    id: 'scene:missing-source',
    type: 'scene.missing_source',
    source: 'scene-graph',
    workspace: 'director',
    payload: { sceneId: 'scene-1', missing: true },
  });

  const navClass = inspectorRegionClassName('navigation', graph.uiIntegration);
  const bodyClass = inspectorRegionClassName('body', graph.uiIntegration);
  // Navigation and Body always mirror each other exactly, whatever WIE decided.
  assert.equal(navClass, bodyClass);
});
