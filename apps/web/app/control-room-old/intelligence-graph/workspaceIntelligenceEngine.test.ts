import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

test('WIE maps nodes/clusters to panels and highlights critical audio', () => {
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

  const signals = graph.getWorkspaceSignals();
  assert.ok(signals.length >= 1);
  assert.equal(graph.workspaceIntelligence.mapNodeToPanel('audio:mix'), 'audioPanel');
  assert.equal(graph.workspaceIntelligence.mapClusterToPanel('output'), 'programOutputPanel');

  assert.ok(
    signals.some(
      (s) =>
        s.panel === 'audioPanel' &&
        (s.action === 'highlight' || s.action === 'warn' || s.action === 'pulse'),
    ),
  );
  assert.ok(signals.some((s) => s.panel === 'workspaceShell' && s.action === 'elevate'));
});

test('WIE prepares scene panel and pulses graphics on predictions', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'dir', system: 'ubos' });
  graph.guidanceEngine.setContext('Director', 'director');

  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'director',
    payload: { name: 'A', program: true, layerIds: ['lt'] },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'director',
    payload: { name: 'B', program: true, layerIds: ['lt'] },
  });
  graph.ingest({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'director',
    payload: { name: 'C', program: true, layerIds: ['lt'] },
  });
  graph.ingest({
    id: 'graphics:lt',
    type: 'graphics.active',
    source: 'graphics-engine',
    workspace: 'director',
    payload: { sceneId: 'current' },
  });

  const signals = graph.computeWorkspaceSignals('Director', 'director');
  assert.ok(
    signals.some((s) => s.panel === 'scenePanel' && (s.action === 'prepare' || s.action === 'highlight' || s.action === 'warn')),
  );
  assert.ok(
    signals.some((s) => s.panel === 'graphicsPanel' && (s.action === 'pulse' || s.action === 'prepare' || s.action === 'highlight')),
  );
});

test('WIE dims irrelevant panels for Audio Engineer and warns on output', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'audio', operator: 'ae', system: 'ubos' });
  graph.guidanceEngine.setContext('Audio Engineer', 'audio');

  graph.ingest({
    id: 'audio:mix',
    type: 'audio.level',
    source: 'audio-engine',
    workspace: 'audio',
    payload: { peak: 0.96 },
  });
  graph.ingest({
    id: 'output:program',
    type: 'output.frame_drop',
    source: 'output-engine',
    workspace: 'distribution',
    payload: { dropped_frames: 6 },
  });

  graph.generateOperatorGuidance('Audio Engineer', 'audio');
  const signals = graph.getWorkspaceSignals();

  assert.ok(signals.some((s) => s.action === 'dim' && s.panel === 'replayPanel'));
  assert.ok(signals.some((s) => s.action === 'dim' && s.panel === 'graphicsPanel'));

  // Streaming role should warn program output
  graph.generateOperatorGuidance('Streaming Operator', 'distribution');
  const streamSignals = graph.getWorkspaceSignals();
  assert.ok(
    streamSignals.some(
      (s) => s.panel === 'programOutputPanel' && (s.action === 'warn' || s.action === 'highlight'),
    ),
  );

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.workspaceSignalCount >= 1);
  assert.ok(snapshot.latestWorkspaceSignals.length >= 1);
  assert.ok(graph.getPanelUiAction('workspaceShell') === 'elevate' || graph.getPanelUiAction('guidancePanel') !== null);
});
