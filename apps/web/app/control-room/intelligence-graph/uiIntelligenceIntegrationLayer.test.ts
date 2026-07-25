import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import {
  UIIntegrationLayer,
  UI_ACTION_CLASS,
  ZONE_TO_PANELS,
  uiActionClassName,
  uiStateClassName,
} from './uiIntelligenceIntegrationLayer.js';
import type { WorkspaceUiSignal } from './workspaceIntelligenceEngine.js';

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

test('UIIL applies WIE actions onto panel visual state flags', () => {
  const layer = new UIIntegrationLayer();
  const state = layer.apply([
    signal({ action: 'highlight', panel: 'audioPanel' }),
    signal({ action: 'warn', panel: 'programOutputPanel' }),
    signal({ action: 'prepare', panel: 'scenePanel' }),
    signal({ action: 'pulse', panel: 'graphicsPanel' }),
    signal({ action: 'dim', panel: 'replayPanel' }),
    signal({ action: 'suppress', panel: 'automationPanel' }),
    signal({ action: 'elevate', panel: 'workspaceShell' }),
  ]);

  assert.equal(state.panels.audioPanel.state.highlighted, true);
  assert.equal(state.panels.programOutputPanel.state.warned, true);
  assert.equal(state.panels.scenePanel.state.prepared, true);
  assert.equal(state.panels.graphicsPanel.state.pulsing, true);
  assert.equal(state.panels.replayPanel.state.dimmed, true);
  assert.equal(state.panels.automationPanel.state.suppressed, true);
  assert.equal(state.panels.workspaceShell.state.elevated, true);
  assert.equal(layer.isWorkspaceElevated(), true);
  assert.ok(state.signalCount >= 7);
  assert.ok(state.lastApply > 0);
});

test('UIIL maps zone ids to CSS classes and prefers higher-priority actions', () => {
  const layer = new UIIntegrationLayer([
    signal({ action: 'dim', panel: 'programOutputPanel', confidence: 0.7 }),
    signal({ action: 'warn', panel: 'programOutputPanel', confidence: 0.8 }),
    signal({ action: 'prepare', panel: 'scenePanel', confidence: 0.9 }),
    signal({ action: 'pulse', panel: 'graphicsPanel' }),
  ]);
  layer.apply();

  assert.equal(layer.getPanelAction('programOutputPanel'), 'warn');
  assert.equal(layer.classNameForZone('output'), UI_ACTION_CLASS.warn);
  assert.equal(layer.classNameForZone('graphics-composer'), UI_ACTION_CLASS.pulse);
  // Triad candidates include programOutput (warn) and scene (prepare) → warn wins
  assert.equal(layer.actionForZone('triad'), 'warn');
  assert.equal(layer.classNameForZone('triad'), UI_ACTION_CLASS.warn);
  assert.equal(layer.classNameForZone('scene'), UI_ACTION_CLASS.prepare);
  assert.ok(ZONE_TO_PANELS['audio-mixer']?.includes('audioPanel'));
});

test('UIIL: inspector (Step 101) maps to every diagnosed domain plus operator/guidance', () => {
  const inspectorPanels = ZONE_TO_PANELS.inspector;
  assert.ok(inspectorPanels);
  assert.deepEqual([...inspectorPanels].sort(), [
    'audioPanel',
    'guidancePanel',
    'graphicsPanel',
    'operatorPanel',
    'programOutputPanel',
    'routingPanel',
    'scenePanel',
  ].sort());

  const layer = new UIIntegrationLayer([signal({ action: 'warn', panel: 'audioPanel' })]);
  layer.apply();
  assert.equal(layer.classNameForZone('inspector'), UI_ACTION_CLASS.warn);
});

test('UIIL class helpers and stale-state reset', () => {
  const layer = new UIIntegrationLayer();
  layer.apply([signal({ action: 'highlight', panel: 'audioPanel' })]);
  assert.equal(uiActionClassName('highlight'), 'ubos-highlight');
  assert.match(uiStateClassName(layer.getPanelState('audioPanel')), /ubos-highlight/);

  layer.apply([]);
  assert.equal(layer.getPanelAction('audioPanel'), null);
  assert.equal(layer.classNameForPanel('audioPanel'), '');
  assert.equal(layer.getPanelState('audioPanel').highlighted, false);
});

test('UIG runInference applies UIIL after WIE and exposes zone class names', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'audio', operator: 'ae', system: 'ubos' });
  graph.guidanceEngine.setContext('Audio Engineer', 'audio');

  for (const peak of [0.5, 0.8, 0.97]) {
    graph.ingest({
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      workspace: 'audio',
      payload: { peak },
    });
  }

  const ui = graph.getUiIntelligence();
  assert.ok(ui.signalCount >= 1);
  assert.ok(ui.lastApply > 0);
  assert.ok(graph.uiIntegration.isWorkspaceElevated());

  const audioClass = graph.getZoneUiClassName('audio-mixer');
  assert.ok(
    audioClass === 'ubos-highlight' ||
      audioClass === 'ubos-warn' ||
      audioClass === 'ubos-pulse',
    `expected audio-mixer UI class, got "${audioClass}"`,
  );

  // Irrelevant panels for Audio Engineer should be dimmed
  const replayAction = graph.uiIntegration.actionForZone('replay-monitor');
  assert.equal(replayAction, 'dim');

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.uiIntelligenceSignalCount >= 1);
  assert.ok(snapshot.uiIntelligenceLastApply > 0);

  graph.clear();
  assert.equal(graph.getUiIntelligence().signalCount, 0);
});
