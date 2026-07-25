import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import {
  TemporalPatternEngine,
  type TemporalSample,
} from './temporalPatternEngine.js';

function sample(confidence: number, metric?: number, timestamp = Date.now()): TemporalSample {
  return {
    timestamp,
    attributes: metric !== undefined ? { peak: metric } : {},
    confidence,
    ...(metric !== undefined ? { metric } : {}),
  };
}

test('TPE detects trend, spike, drop, anomaly, and cycle on history windows', () => {
  const graph = new UBOSIntelligenceGraph();
  const tpe = new TemporalPatternEngine(graph);

  assert.equal(
    tpe.detectTrend([sample(0.4), sample(0.5), sample(0.75)]),
    'rising',
  );
  assert.equal(
    tpe.detectTrend([sample(0.9), sample(0.7), sample(0.4)]),
    'falling',
  );
  assert.equal(
    tpe.detectTrend([sample(0.5), sample(0.9), sample(0.2), sample(0.55)]),
    'volatile',
  );

  assert.equal(tpe.detectSpike([sample(0.4), sample(0.8)]), true);
  assert.equal(tpe.detectDrop([sample(0.8), sample(0.4)]), true);
  assert.equal(tpe.detectSpike([sample(0.5), sample(0.55)]), false);

  const anomalyHistory = [
    sample(0.5),
    sample(0.52),
    sample(0.48),
    sample(0.51),
    sample(0.49),
    sample(0.95),
  ];
  assert.equal(tpe.detectAnomaly(anomalyHistory), true);

  const cycleHistory = [
    sample(0.1),
    sample(0.2),
    sample(0.3),
    sample(0.1),
    sample(0.2),
    sample(0.3),
  ];
  assert.equal(tpe.detectCycle(cycleHistory), true);
  assert.equal(tpe.detectCycle([sample(0.1), sample(0.2), sample(0.3)]), false);
});

test('TPE update accumulates history and smooths confidence on re-ingest', () => {
  const graph = new UBOSIntelligenceGraph();

  for (let i = 0; i < 5; i++) {
    graph.ingest({
      id: 'audio:mix',
      type: 'audio.level',
      source: 'audio-engine',
      payload: { peak: 0.4 + i * 0.12 },
      confidence: 0.5 + i * 0.08,
    });
  }

  const node = graph.getNode('audio:mix');
  assert.ok(node);
  assert.ok((node.history?.length ?? 0) >= 3);
  assert.ok(node.history!.length <= 10);
  assert.ok(typeof node.trend === 'string');
  assert.ok(typeof node.smoothedConfidence === 'number');
  assert.ok(node.attributes.tpe_trend);

  // Rising peaks should yield rising/volatile trend or spike somewhere in series
  assert.ok(
    node.trend === 'rising' || node.spike === true || node.trend === 'volatile',
    `expected rising/spike/volatile, got trend=${node.trend} spike=${node.spike}`,
  );
});

test('TPE feeds temporal inference rules into the graph', () => {
  const graph = new UBOSIntelligenceGraph();

  // Build a clear spike on audio peak
  graph.ingest({
    id: 'audio:mix',
    type: 'audio.level',
    source: 'audio-engine',
    payload: { peak: 0.3 },
  });
  graph.ingest({
    id: 'audio:mix',
    type: 'audio.level',
    source: 'audio-engine',
    payload: { peak: 0.3 },
  });
  graph.ingest({
    id: 'audio:mix',
    type: 'audio.level',
    source: 'audio-engine',
    payload: { peak: 0.95 },
  });

  const node = graph.getNode('audio:mix');
  assert.ok(node?.spike || node?.anomaly || node?.trend === 'rising');

  const results = graph.getInferenceResults();
  assert.ok(
    results.some(
      (r) =>
        r.rule?.startsWith('rule.temporal_') ||
        r.message.toLowerCase().includes('temporal') ||
        r.message.toLowerCase().includes('predictive audio'),
    ),
    'expected temporal inference results',
  );

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.temporal);
  assert.ok(
    snapshot.temporal.spikes +
      snapshot.temporal.drops +
      snapshot.temporal.anomalies +
      snapshot.temporal.rising >= 0,
  );
});
