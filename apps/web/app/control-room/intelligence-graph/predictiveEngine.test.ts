import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

test('PE predicts audio clipping and output degradation from rising trends', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'director', system: 'ubos' });

  for (const peak of [0.5, 0.65, 0.8, 0.93]) {
    graph.ingest({
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      workspace: 'production',
      operator: 'director',
      payload: { peak },
    });
  }
  for (const dropped of [0, 1, 3, 6]) {
    graph.ingest({
      id: 'output:program',
      type: 'output.health_update',
      source: 'output-engine',
      workspace: 'production',
      payload: { dropped_frames: dropped, latency: 10 + dropped },
    });
  }

  const predictions = graph.getPredictions();
  assert.ok(
    predictions.some((p) => p.category === 'audio_clipping' && p.message === 'Audio clipping likely'),
  );
  assert.ok(
    predictions.some((p) => p.category === 'output_degradation' && p.message === 'Output degradation likely'),
  );
  assert.ok(predictions.every((p) => p.confidence > 0 && p.confidence <= 1));
  assert.ok(predictions[0]!.confidence >= predictions[predictions.length - 1]!.confidence);
});

test('PE predicts scene transition, graphics activation, and routing failure', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'op-1', system: 'ubos' });

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
  graph.ingest({
    id: 'routing:1',
    type: 'routing.path_change',
    source: 'routing-engine',
    payload: { source: 'cam-a', destination: 'program', broken: true },
  });

  const predictions = graph.getPredictions();
  assert.ok(predictions.some((p) => p.message === 'Scene transition likely'));
  assert.ok(predictions.some((p) => p.message === 'Graphics activation likely'));
  assert.ok(predictions.some((p) => p.message === 'Routing failure likely'));
});

test('PE predicts operator workspace activation and automation triggers', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'graphics', operator: 'gfx-op', system: 'ubos' });

  for (let i = 0; i < 3; i++) {
    graph.ingest({
      id: 'operator:1',
      type: 'operator.presence',
      source: 'multi-user',
      workspace: 'graphics',
      operator: 'gfx-op',
      payload: { name: 'gfx-op', workspace: 'graphics' },
    });
  }
  graph.ingest({
    id: 'automation:1',
    type: 'automation.trigger_fired',
    source: 'automation-engine',
    workspace: 'graphics',
    payload: { name: 'auto-lower-third', enabled: true, runCount: 2 },
  });

  const predictions = graph.getPredictions();
  assert.ok(
    predictions.some(
      (p) =>
        p.category === 'operator_action' &&
        p.message.includes('graphics'),
    ),
  );
  assert.ok(
    predictions.some(
      (p) => p.category === 'automation_trigger' && p.message === 'Automation trigger likely',
    ),
  );

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.predictionCount >= 1);
  assert.ok(snapshot.latestPredictions.length >= 1);
});

test('PE computeConfidence uses weighted formula factors', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'op', system: 'ubos' });
  const pe = graph.predictiveEngine;

  const node = {
    id: 'audio:mix',
    type: 'AudioNode' as const,
    attributes: { peak: 0.95 },
    confidence: 0.9,
    timestamp: Date.now(),
    workspace: 'production',
    operator: 'op',
    trend: 'rising' as const,
    eventType: 'audio.level',
  };

  const { confidence, factors } = pe.computeConfidence(node, 0.9, 0.9);
  assert.ok(confidence > 0.4 && confidence <= 1);
  assert.equal(factors.temporalTrendWeight, 1);
  assert.equal(factors.operatorRelevance, 1);
  assert.equal(factors.workspaceRelevance, 1);
  assert.ok(factors.engineConfidence > 0.5);
});
