import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import { resolvePredictionConflicts } from './workspaceIntelligenceEngine2.js';
import type { Prediction } from './predictiveEngine.js';
import type { FusedInsight } from './insightFusionEngine.js';
import type { GuidanceAction } from './operatorGuidanceEngine.js';
import {
  STUDIO_SUBSYSTEMS,
  STUDIO_HEALTH_DIMENSIONS,
  groupPredictionsBySubsystem,
  computeStudioHealth,
  buildStudioGuidance,
  selectStudioTheme,
  studioMotionForSeverity,
  StudioIntelligence,
} from './studioIntelligence.js';

function prediction(partial: Partial<Prediction> & Pick<Prediction, 'category'>): Prediction {
  return {
    id: partial.id ?? `pred-${partial.category}-${Math.random()}`,
    category: partial.category,
    message: partial.message ?? partial.category,
    nodeId: partial.nodeId ?? 'scene:current',
    confidence: partial.confidence ?? 0.8,
    relatedNodeIds: partial.relatedNodeIds ?? [],
    timestamp: partial.timestamp ?? Date.now(),
    rule: partial.rule ?? 'test-rule',
    factors: partial.factors ?? {
      temporalTrendWeight: 0,
      engineConfidence: 0,
      crossEngineAgreement: 0,
      operatorRelevance: 0,
      workspaceRelevance: 0,
      base: 0,
    },
  };
}

function fusedInsight(
  partial: Partial<FusedInsight> & Pick<FusedInsight, 'severity'>,
): FusedInsight {
  return {
    id: partial.id ?? `insight-${partial.severity}-${Math.random()}`,
    cluster: partial.cluster ?? 'output',
    nodeId: partial.nodeId ?? null,
    severity: partial.severity,
    message: partial.message ?? partial.severity,
    confidence: partial.confidence ?? 0.8,
    recommendedAction: partial.recommendedAction ?? 'monitor',
    sourceCount: partial.sourceCount ?? 1,
    relatedNodeIds: partial.relatedNodeIds ?? [],
    timestamp: partial.timestamp ?? Date.now(),
    sources: partial.sources ?? [partial.message ?? partial.severity],
  };
}

function guidanceAction(partial: Partial<GuidanceAction> = {}): GuidanceAction {
  return {
    id: partial.id ?? 'guide-1',
    role: partial.role ?? 'Director',
    workspace: partial.workspace ?? 'director',
    nodeId: partial.nodeId ?? null,
    cluster: partial.cluster ?? 'output',
    severity: partial.severity ?? 'Warning Action',
    message: partial.message ?? 'Take action',
    confidence: partial.confidence ?? 0.8,
    timestamp: partial.timestamp ?? Date.now(),
  };
}

// ── Whole-studio prediction fusion ──────────────────────────────────────────

test('Studio Intelligence 1.0: exactly the seven canonical subsystems are defined (Step 106)', () => {
  assert.deepEqual([...STUDIO_SUBSYSTEMS], [
    'scenes',
    'graphics',
    'audio',
    'routing',
    'replay',
    'streaming',
    'outputHealth',
  ]);
});

test('Studio Intelligence 1.0: groups resolved predictions into their studio subsystem', () => {
  const predictions = [
    prediction({ id: 'p1', category: 'scene_transition' }),
    prediction({ id: 'p2', category: 'graphics_activation' }),
    prediction({ id: 'p3', category: 'audio_clipping' }),
    prediction({ id: 'p4', category: 'routing_failure' }),
    prediction({ id: 'p5', category: 'output_degradation' }),
    prediction({ id: 'p6', category: 'operator_action' }), // unmapped — excluded
  ];

  const grouped = groupPredictionsBySubsystem(predictions);
  assert.deepEqual(grouped.scenes.map((p) => p.id), ['p1']);
  assert.deepEqual(grouped.graphics.map((p) => p.id), ['p2']);
  assert.deepEqual(grouped.audio.map((p) => p.id), ['p3']);
  assert.deepEqual(grouped.routing.map((p) => p.id), ['p4']);
  assert.deepEqual(grouped.outputHealth.map((p) => p.id), ['p5']);
  assert.deepEqual(grouped.replay, []);
  assert.deepEqual(grouped.streaming, []);
  const allGroupedIds = Object.values(grouped).flat().map((p) => p.id);
  assert.ok(!allGroupedIds.includes('p6'));
});

test('Studio Intelligence 1.0: a three-way prediction conflict (scene transition vs. graphics activation vs. audio peak) reaches one subsystem, per the spec example', () => {
  const now = Date.now();
  const sceneTransition = prediction({
    id: 'scene', category: 'scene_transition', nodeId: 'scene:current', confidence: 0.5, timestamp: now,
  });
  const graphicsActivation = prediction({
    id: 'graphics', category: 'graphics_activation', nodeId: 'scene:current', confidence: 0.7, timestamp: now + 100,
  });
  const audioPeak = prediction({
    id: 'audio', category: 'audio_clipping', nodeId: 'scene:current', confidence: 0.9, timestamp: now + 200,
  });

  // studioPredictions is fed directly by WIE 2.0's own conflict resolution
  // (Step 105) — Studio Intelligence does not re-resolve conflicts, it
  // consumes the winner.
  const { resolved: winners } = resolvePredictionConflicts([sceneTransition, graphicsActivation, audioPeak]);
  assert.deepEqual(winners.map((p) => p.id), ['audio']);

  const grouped = groupPredictionsBySubsystem(winners);
  assert.deepEqual(grouped.audio.map((p) => p.id), ['audio']);
  assert.deepEqual(grouped.scenes, []);
  assert.deepEqual(grouped.graphics, []);
});

// ── Studio health modeling ───────────────────────────────────────────────────

test('Studio Intelligence 1.0: exactly the six canonical health dimensions are defined (Step 106)', () => {
  assert.deepEqual([...STUDIO_HEALTH_DIMENSIONS], ['output', 'routing', 'graphics', 'audio', 'replay', 'streaming']);
});

test('Studio Intelligence 1.0: health dimensions with no live signal source report unknown, not a fabricated score', () => {
  const health = computeStudioHealth([]);
  for (const dimension of health.dimensions) {
    assert.equal(dimension.score, null);
    assert.equal(dimension.status, 'unknown');
    assert.equal(dimension.sampleCount, 0);
  }
  // No dimension data at all → overall studio health defaults to fully stable, not fabricated critical.
  assert.equal(health.score, 1);
  assert.equal(health.status, 'stable');
});

test('Studio Intelligence 1.0: replay and streaming stay unknown even when other dimensions have real critical signals', () => {
  const insights = [fusedInsight({ id: 'i1', severity: 'critical', cluster: 'output', confidence: 0.95 })];
  const health = computeStudioHealth(insights);

  const replay = health.dimensions.find((d) => d.dimension === 'replay')!;
  const streaming = health.dimensions.find((d) => d.dimension === 'streaming')!;
  assert.equal(replay.status, 'unknown');
  assert.equal(streaming.status, 'unknown');

  const output = health.dimensions.find((d) => d.dimension === 'output')!;
  assert.equal(output.status, 'critical');
  assert.ok(output.score !== null && output.score < 0.1);
});

test('Studio Intelligence 1.0: overall health status follows the Step 106 code sample thresholds exactly', () => {
  // All four mapped dimensions healthy (low-severity info signals) → stable.
  const stable = computeStudioHealth([
    fusedInsight({ id: 's1', severity: 'info', cluster: 'output', confidence: 0.5 }),
    fusedInsight({ id: 's2', severity: 'info', cluster: 'routing', confidence: 0.5 }),
    fusedInsight({ id: 's3', severity: 'info', cluster: 'graphics', confidence: 0.5 }),
    fusedInsight({ id: 's4', severity: 'info', cluster: 'audio', confidence: 0.5 }),
  ]);
  assert.equal(stable.status, 'stable');

  // All four mapped dimensions critical, high confidence → critical overall.
  const critical = computeStudioHealth([
    fusedInsight({ id: 'c1', severity: 'critical', cluster: 'output', confidence: 0.95 }),
    fusedInsight({ id: 'c2', severity: 'critical', cluster: 'routing', confidence: 0.95 }),
    fusedInsight({ id: 'c3', severity: 'critical', cluster: 'graphics', confidence: 0.95 }),
    fusedInsight({ id: 'c4', severity: 'critical', cluster: 'audio', confidence: 0.95 }),
  ]);
  assert.equal(critical.status, 'critical');
  assert.ok(critical.score < 0.2);
});

// ── Studio-wide guidance ──────────────────────────────────────────────────────

test('Studio Intelligence 1.0: studio guidance annotates every action with a severity band, preserving OGE ranking and role', () => {
  const guidance = [
    guidanceAction({ id: 'g1', role: 'Director', confidence: 0.9 }),
    guidanceAction({ id: 'g2', role: 'Audio Engineer', confidence: 0.3 }),
  ];

  const studioGuidance = buildStudioGuidance(guidance);
  assert.deepEqual(studioGuidance.map((g) => g.id), ['g1', 'g2']);
  assert.equal(studioGuidance[0]!.role, 'Director');
  assert.equal(studioGuidance[0]!.severityBand, 'critical');
  assert.equal(studioGuidance[1]!.role, 'Audio Engineer');
  assert.equal(studioGuidance[1]!.severityBand, 'low');
});

// ── Studio-level intelligence themes ────────────────────────────────────────

test('Studio Intelligence 1.0: every operator role resolves to one of the six named studio modes', () => {
  const roleModes: Array<[GuidanceRoleForTest, string]> = [
    ['Director', 'director'],
    ['Technical Director', 'director'],
    ['Graphics Operator', 'graphics'],
    ['Audio Engineer', 'audio'],
    ['Replay Operator', 'replay'],
    ['Streaming Operator', 'streaming'],
    ['Solo Streamer', 'solo'],
    ['Compact Operator', 'solo'],
  ];
  for (const [role, expectedMode] of roleModes) {
    const theme = selectStudioTheme(role, 0);
    assert.equal(theme.mode, expectedMode);
  }
});

type GuidanceRoleForTest = GuidanceAction['role'];

test('Studio Intelligence 1.0: studio theme modifier follows the global severity score, same as WIE 2.0', () => {
  assert.equal(selectStudioTheme('Director', 0.05).modifier, null);
  assert.equal(selectStudioTheme('Director', 0.5).modifier, 'enableGradientShift');
  assert.equal(selectStudioTheme('Director', 0.95).modifier, 'switchToCriticalVariant');
});

// ── Cinematic studio intelligence transitions ───────────────────────────────

test('Studio Intelligence 1.0: cinematic motion escalates with severity band and is empty when informational', () => {
  assert.deepEqual(studioMotionForSeverity('informational'), []);
  assert.deepEqual(studioMotionForSeverity('low'), ['fade']);
  assert.deepEqual(studioMotionForSeverity('medium'), ['glow']);
  assert.deepEqual(studioMotionForSeverity('high'), ['pulse', 'glow']);
  assert.deepEqual(studioMotionForSeverity('critical'), ['shake', 'elevate']);
});

// ── The orchestrator, end-to-end through the real graph ──────────────────────

test('Studio Intelligence 1.0: compute() summarizes WIE 2.0 output without recomputing it', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'director', operator: 'director', system: 'ubos' });
  graph.guidanceEngine.setContext('Director', 'director');

  for (let i = 0; i < 4; i += 1) {
    graph.ingest({
      id: `output:frame-drop:${i}`,
      type: 'output.frame_drop',
      source: 'output-engine',
      workspace: 'director',
      payload: { droppedFrames: 5 + i },
    });
  }

  // runInference() already computed WIE 2.0's global result on every ingest.
  const studio = new StudioIntelligence(graph);
  const result = studio.compute();

  assert.equal(result.role, 'Director');
  assert.equal(result.studioSeverityScore, graph.getGlobalIntelligence().globalSeverityScore);
  assert.equal(result.studioTimeline, graph.getGlobalIntelligence().timeline);
  assert.ok(Array.isArray(result.studioPredictions));
  assert.ok(result.studioHealth.dimensions.length === 6);
  assert.equal(studio.getResult(), result);
});

test('Studio Intelligence 1.0: reset() clears back to an empty, honest result', () => {
  const graph = new UBOSIntelligenceGraph();
  const studio = new StudioIntelligence(graph);
  studio.compute();
  studio.reset();

  const result = studio.getResult();
  assert.equal(result.studioPredictions.length, 0);
  assert.equal(result.studioSeverityScore, 0);
  assert.equal(result.studioSeverityBand, 'informational');
  assert.equal(result.studioHealth.status, 'stable');
  assert.equal(result.studioTheme.modifier, null);
  assert.deepEqual(result.studioMotion, []);
});

test('Studio Intelligence 1.0: wired end-to-end through UBOSIntelligenceGraph.getSnapshot()', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'streaming-operator', operator: 'streaming', system: 'ubos' });
  graph.guidanceEngine.setContext('Streaming Operator', 'streaming-operator');

  for (let i = 0; i < 3; i += 1) {
    graph.ingest({
      id: `routing:path:${i}`,
      type: 'routing.destination_error',
      source: 'routing-engine',
      workspace: 'streaming-operator',
      payload: { source: 'cam-a', destination: 'youtube', broken: true },
    });
  }

  const snapshot = graph.getSnapshot();
  assert.ok(snapshot.studioIntelligence !== undefined);
  assert.equal(snapshot.studioHealthStatus, snapshot.studioIntelligence.studioHealth.status);
  assert.equal(snapshot.studioSeverityBand, snapshot.studioIntelligence.studioSeverityBand);
  assert.equal(snapshot.studioTheme.mode, 'streaming');
});
