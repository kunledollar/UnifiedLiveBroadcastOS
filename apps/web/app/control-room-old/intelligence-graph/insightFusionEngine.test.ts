import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import { InsightFusionEngine } from './insightFusionEngine.js';
import type { InferenceResult } from './uigInferenceEngine.js';
import type { Prediction } from './predictiveEngine.js';

test('IFE suppresses noise and merges signals for the same node/cluster', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'director', system: 'ubos' });
  const ife = new InsightFusionEngine(graph);

  const insights: InferenceResult[] = [
    {
      id: 'w1',
      rule: 'rule.audio_danger',
      kind: 'warning',
      message: 'Audio clipping risk',
      confidence: 0.92,
      nodeId: 'audio:mix',
      relatedNodeIds: ['audio:mix'],
      emphasis: 'critical',
      timestamp: Date.now(),
    },
    {
      id: 'g1',
      rule: 'rule.audio_danger',
      kind: 'guidance',
      message: 'Reduce gain or enable limiter on the hot channel',
      confidence: 0.85,
      nodeId: 'audio:mix',
      relatedNodeIds: ['audio:mix'],
      timestamp: Date.now(),
    },
    {
      id: 'noise',
      rule: 'rule.noise',
      kind: 'insight',
      message: 'Low signal',
      confidence: 0.2,
      nodeId: 'audio:mix',
      relatedNodeIds: ['audio:mix'],
      timestamp: Date.now(),
    },
  ];

  const predictions: Prediction[] = [
    {
      id: 'p1',
      category: 'audio_clipping',
      message: 'Audio clipping likely',
      nodeId: 'audio:mix',
      confidence: 0.88,
      relatedNodeIds: ['audio:mix'],
      timestamp: Date.now(),
      rule: 'predict.audio_clipping',
      factors: {
        temporalTrendWeight: 1,
        engineConfidence: 0.9,
        crossEngineAgreement: 0.9,
        operatorRelevance: 1,
        workspaceRelevance: 1,
        base: 0.9,
      },
    },
  ];

  const fused = ife.fuse(insights, predictions);
  assert.ok(fused.length >= 1);
  assert.ok(fused.every((f) => f.confidence >= 0.4));
  const audio = fused.find((f) => f.cluster === 'audio');
  assert.ok(audio);
  assert.ok(audio.sourceCount >= 2);
  assert.ok(audio.message.toLowerCase().includes('clip'));
  assert.ok(audio.recommendedAction.length > 0);
  assert.ok(['critical', 'warning', 'prediction'].includes(audio.severity));
});

test('IFE ranks critical/warning above info and boosts workspace relevance', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'op', system: 'ubos' });
  const ife = graph.fusionEngine;

  const fused = ife.fuse(
    [
      {
        id: 'info1',
        rule: 'x',
        kind: 'insight',
        message: 'Monitor scene',
        confidence: 0.95,
        nodeId: 'scene:current',
        relatedNodeIds: ['scene:current'],
        workspace: 'analytics',
        timestamp: 1,
      },
      {
        id: 'warn1',
        rule: 'rule.missing_source',
        kind: 'warning',
        message: 'Scene has missing source',
        confidence: 0.8,
        nodeId: 'scene:current',
        relatedNodeIds: ['scene:current'],
        workspace: 'production',
        emphasis: 'critical',
        timestamp: 2,
      },
    ],
    [],
  );

  assert.ok(fused.length >= 1);
  assert.equal(fused[0]?.cluster, 'scene');
  assert.ok(
    fused[0]?.severity === 'critical' || fused[0]?.severity === 'warning',
    `expected critical/warning, got ${fused[0]?.severity}`,
  );
  assert.ok(fused[0]?.recommendedAction.toLowerCase().includes('source') ||
    fused[0]?.recommendedAction.toLowerCase().includes('scene'));
});

test('IFE runs in graph pipeline and exposes top operator guidance', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'production', operator: 'director', system: 'ubos' });

  for (const peak of [0.5, 0.7, 0.95]) {
    graph.ingest({
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      workspace: 'production',
      payload: { peak },
    });
  }
  graph.ingest({
    id: 'routing:1',
    type: 'routing.path_change',
    source: 'routing-engine',
    workspace: 'production',
    payload: { source: 'cam-a', destination: 'program', broken: true },
  });
  graph.ingest({
    id: 'output:program',
    type: 'output.frame_drop',
    source: 'output-engine',
    workspace: 'production',
    payload: { dropped_frames: 5 },
  });

  const fused = graph.getFusedInsights();
  assert.ok(fused.length >= 1);
  assert.ok(fused.length <= 7);
  assert.ok(graph.getTopFusedInsights(3).length <= 3);

  // Should be ranked (first not weaker severity*confidence than later on average)
  for (let i = 1; i < fused.length; i++) {
    const prev = graph.fusionEngine.rank(fused[i - 1]!);
    const next = graph.fusionEngine.rank(fused[i]!);
    assert.ok(prev >= next - 1e-9);
  }

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.fusedCount >= 1);
  assert.ok(snapshot.latestFusedInsights.length >= 1);
  assert.ok(snapshot.latestFusedInsights[0]?.recommendedAction);
});
