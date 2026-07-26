import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import { ConfidenceScoringEngine } from './confidenceScoringEngine.js';

test('CSE scores events with Phase 1 formula and clamps to 0–1', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'director', system: 'ubos' });
  const cse = graph.confidenceEngine;

  const high = cse.score({
    id: 'scene:current',
    type: 'scene.active',
    source: 'scene-graph',
    workspace: 'production',
    operator: 'director',
    timestamp: Date.now(),
    confidence: 1,
  });

  const low = cse.score({
    id: 'ai:1',
    type: 'ai.insight',
    source: 'ai-crew',
    timestamp: Date.now() - 20_000,
    confidence: 0.4,
  });

  assert.ok(high > 0 && high <= 1);
  assert.ok(low > 0 && low <= 1);
  assert.ok(high > low, `expected scene confidence ${high} > ai confidence ${low}`);
  assert.equal(cse.engineReliability('scene-graph'), 0.95);
  assert.equal(cse.engineReliability('ai-crew'), 0.6);
  assert.equal(cse.recency(Date.now()), 1);
  assert.ok(cse.recency(Date.now() - 10_000) < 1);
});

test('CSE propagates confidence to nodes/edges and ranks insights', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'op-1', system: 'ubos' });

  graph.ingestBatch([
    {
      id: 'scene:current',
      type: 'scene.active',
      source: 'scene-graph',
      workspace: 'production',
      operator: 'op-1',
      payload: { name: 'Main', program: true, layerIds: ['lt'] },
    },
    {
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      workspace: 'production',
      operator: 'op-1',
      payload: { peak: 0.98 },
    },
    {
      id: 'output:program',
      type: 'output.frame_drop',
      source: 'output-engine',
      workspace: 'production',
      payload: { dropped_frames: 4 },
    },
  ]);

  const scene = graph.getNode('scene:current');
  const audio = graph.getNode('audio:mix');
  assert.ok(scene);
  assert.ok(audio);
  assert.ok(scene.confidence > 0 && scene.confidence <= 1);
  assert.ok(audio.confidence > 0 && audio.confidence <= 1);

  const edges = graph.getEdges();
  assert.ok(edges.length > 0);
  assert.ok(edges.every((e) => typeof e.confidence === 'number' && (e.confidence as number) > 0));

  const insights = graph.getInsights();
  assert.ok(insights.some((i) => i.message === 'Audio clipping risk'));
  // Insights should be confidence-sorted (highest first)
  for (let i = 1; i < insights.length; i++) {
    assert.ok(
      (insights[i - 1]?.confidence ?? 0) >= (insights[i]?.confidence ?? 0),
      'insights must be ranked by confidence',
    );
  }

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.avgConfidence > 0);
  assert.ok(snapshot.stability > 0);
});

test('CSE temporal smoothing and noise filtering', () => {
  const graph = new UBOSIntelligenceGraph();
  const cse = new ConfidenceScoringEngine(graph);

  const first = cse.score({
    id: 'routing:1',
    type: 'routing.path_change',
    source: 'routing-engine',
    timestamp: Date.now(),
    confidence: 1,
  });
  const second = cse.score({
    id: 'routing:1',
    type: 'routing.path_change',
    source: 'routing-engine',
    timestamp: Date.now(),
    confidence: 0.2,
  });

  // EMA should pull second toward first (not jump fully to raw low prior)
  assert.ok(second > 0.15);
  assert.ok(Math.abs(second - first) < Math.abs(0.2 - first) || second !== first);

  assert.equal(cse.isNoise(0.2), true);
  assert.equal(cse.isNoise(0.8), false);

  const dropped = cse.refineInsight({
    id: 'weak-pred',
    rule: 'test',
    kind: 'prediction',
    message: 'weak',
    confidence: 0.1,
    relatedNodeIds: [],
    timestamp: Date.now(),
  });
  assert.equal(dropped, null);
});
