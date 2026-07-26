import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import type { Prediction } from './predictiveEngine.js';
import type { FusedInsight } from './insightFusionEngine.js';
import type { GuidanceAction } from './operatorGuidanceEngine.js';
import type { InferenceResult } from './uigInferenceEngine.js';
import {
  scoreSeverityBand,
  severityImplicationsFor,
  SEVERITY_IMPLICATIONS,
  decideThemeModifier,
  predictionsConflict,
  resolvePredictionConflicts,
  roleFocusedInsights,
  WORKSPACE_INTELLIGENCE_ZONES,
  WORKSPACE_ZONE_CLUSTERS,
  workspaceFocusedInsights,
  workspaceFocusedPredictions,
  buildStudioTimeline,
  WorkspaceIntelligenceEngine2,
  type RoleRelevanceSource,
} from './workspaceIntelligenceEngine2.js';

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
    id: partial.id ?? `insight-${partial.severity}`,
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

function automationTrigger(partial: Partial<InferenceResult> = {}): InferenceResult {
  return {
    id: partial.id ?? 'auto-1',
    rule: partial.rule ?? 'automation-rule',
    kind: partial.kind ?? 'automation_trigger',
    message: partial.message ?? 'Automation fired',
    confidence: partial.confidence ?? 0.8,
    relatedNodeIds: partial.relatedNodeIds ?? [],
    timestamp: partial.timestamp ?? Date.now(),
  };
}

// ── Global severity scoring ─────────────────────────────────────────────────

test('WIE 2.0: severity bands match the Step 105 thresholds exactly', () => {
  assert.equal(scoreSeverityBand(0), 'informational');
  assert.equal(scoreSeverityBand(0.19), 'informational');
  assert.equal(scoreSeverityBand(0.2), 'low');
  assert.equal(scoreSeverityBand(0.39), 'low');
  assert.equal(scoreSeverityBand(0.4), 'medium');
  assert.equal(scoreSeverityBand(0.59), 'medium');
  assert.equal(scoreSeverityBand(0.6), 'high');
  assert.equal(scoreSeverityBand(0.79), 'high');
  assert.equal(scoreSeverityBand(0.8), 'critical');
  assert.equal(scoreSeverityBand(1), 'critical');
});

test('WIE 2.0: severity scoring clamps out-of-range and non-finite input safely', () => {
  assert.equal(scoreSeverityBand(-5), 'informational');
  assert.equal(scoreSeverityBand(50), 'critical');
  assert.equal(scoreSeverityBand(Number.NaN), 'informational');
});

test('WIE 2.0: severity implications escalate elevation, motion, and HUD emphasis monotonically', () => {
  const bands = ['informational', 'low', 'medium', 'high', 'critical'] as const;
  for (let i = 1; i < bands.length; i += 1) {
    const prevBand = bands[i - 1]!;
    const currBand = bands[i]!;
    const prev = SEVERITY_IMPLICATIONS[prevBand];
    const curr = SEVERITY_IMPLICATIONS[currBand];
    assert.ok(curr.elevation >= prev.elevation, `${currBand} elevation should be >= ${prevBand}`);
  }
  assert.equal(severityImplicationsFor(0.9).elevation, 4);
  assert.equal(severityImplicationsFor(0.9).hudEmphasis, true);
  assert.equal(severityImplicationsFor(0.05).hudEmphasis, false);
});

test('WIE 2.0: theme modifier decision follows the global severity band', () => {
  assert.deepEqual(decideThemeModifier(0.05), { band: 'informational', modifier: null });
  assert.deepEqual(decideThemeModifier(0.5), { band: 'medium', modifier: 'enableGradientShift' });
  assert.deepEqual(decideThemeModifier(0.95), { band: 'critical', modifier: 'switchToCriticalVariant' });
});

// ── Cross-workspace prediction fusion + conflict resolution ────────────────

test('WIE 2.0: a predicted graphics activation conflicts with a predicted scene transition on the same scene (Step 105 example)', () => {
  const now = Date.now();
  const sceneTransition = prediction({
    id: 'p-scene', category: 'scene_transition', nodeId: 'scene:current', confidence: 0.6, timestamp: now,
  });
  const graphicsActivation = prediction({
    id: 'p-graphics', category: 'graphics_activation', nodeId: 'graphics:lower-third',
    relatedNodeIds: ['scene:current'], confidence: 0.85, timestamp: now + 500,
  });

  assert.equal(predictionsConflict(sceneTransition, graphicsActivation), true);

  const { resolved, conflicts } = resolvePredictionConflicts([sceneTransition, graphicsActivation]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0]!.id, 'p-graphics'); // higher confidence wins
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0]!.winner.id, 'p-graphics');
  assert.equal(conflicts[0]!.loser.id, 'p-scene');
});

test('WIE 2.0: predictions do not conflict across a wide time gap, even on the same node', () => {
  const now = Date.now();
  const a = prediction({ id: 'a', category: 'scene_transition', nodeId: 'scene:x', timestamp: now });
  const b = prediction({ id: 'b', category: 'graphics_activation', nodeId: 'scene:x', timestamp: now + 60_000 });

  assert.equal(predictionsConflict(a, b), false);
  const { resolved, conflicts } = resolvePredictionConflicts([a, b]);
  assert.equal(resolved.length, 2);
  assert.equal(conflicts.length, 0);
});

test('WIE 2.0: same-category predictions on the same node corroborate, they do not conflict', () => {
  const now = Date.now();
  const a = prediction({ id: 'a', category: 'audio_clipping', nodeId: 'audio:mix', timestamp: now });
  const b = prediction({ id: 'b', category: 'audio_clipping', nodeId: 'audio:mix', timestamp: now + 100 });

  assert.equal(predictionsConflict(a, b), false);
  const { resolved } = resolvePredictionConflicts([a, b]);
  assert.equal(resolved.length, 2);
});

test('WIE 2.0: unrelated predictions on different nodes never conflict', () => {
  const now = Date.now();
  const a = prediction({ id: 'a', category: 'scene_transition', nodeId: 'scene:x', timestamp: now });
  const b = prediction({ id: 'b', category: 'audio_clipping', nodeId: 'audio:mix', timestamp: now });

  assert.equal(predictionsConflict(a, b), false);
});

test('WIE 2.0: resolving conflicts across three overlapping predictions keeps only the strongest', () => {
  const now = Date.now();
  const weak = prediction({ id: 'weak', category: 'scene_transition', nodeId: 'scene:x', confidence: 0.5, timestamp: now });
  const medium = prediction({ id: 'medium', category: 'graphics_activation', nodeId: 'scene:x', confidence: 0.7, timestamp: now + 200 });
  const strong = prediction({ id: 'strong', category: 'audio_clipping', nodeId: 'scene:x', confidence: 0.9, timestamp: now + 400 });

  const { resolved, conflicts } = resolvePredictionConflicts([weak, medium, strong]);
  assert.deepEqual(resolved.map((p) => p.id), ['strong']);
  assert.equal(conflicts.length, 2);
});

// ── Role-aware intelligence ─────────────────────────────────────────────────

test('WIE 2.0: role-focused insights delegate to the provided relevance source and respect the limit', () => {
  const relevantIds = new Set(['i1', 'i3']);
  const fakeSource: RoleRelevanceSource = {
    isRelevantToRole: (insight) => relevantIds.has(insight.id),
  };
  const insights = [
    fusedInsight({ id: 'i1', severity: 'warning' }),
    fusedInsight({ id: 'i2', severity: 'critical' }),
    fusedInsight({ id: 'i3', severity: 'info' }),
  ];

  const focused = roleFocusedInsights('Director', insights, fakeSource, 1);
  assert.deepEqual(focused.map((i) => i.id), ['i1']);

  const focusedAll = roleFocusedInsights('Director', insights, fakeSource, 5);
  assert.deepEqual(focusedAll.map((i) => i.id), ['i1', 'i3']);
});

// ── Workspace-aware intelligence ────────────────────────────────────────────

test('WIE 2.0: exactly the five canonical workspace zones are defined, matching the Step 105 spec', () => {
  assert.deepEqual([...WORKSPACE_INTELLIGENCE_ZONES], [
    'triad',
    'inspector',
    'programOutput',
    'replay',
    'streaming',
  ]);
});

test('WIE 2.0: Triad focuses on fused scene/graphics/audio; Inspector sees everything (deep diagnostics)', () => {
  const insights = [
    fusedInsight({ id: 'scene', severity: 'warning', cluster: 'scene' }),
    fusedInsight({ id: 'graphics', severity: 'warning', cluster: 'graphics' }),
    fusedInsight({ id: 'audio', severity: 'warning', cluster: 'audio' }),
    fusedInsight({ id: 'routing', severity: 'warning', cluster: 'routing' }),
    fusedInsight({ id: 'automation', severity: 'warning', cluster: 'automation' }),
  ];

  const triad = workspaceFocusedInsights('triad', insights);
  assert.deepEqual(triad.map((i) => i.id).sort(), ['audio', 'graphics', 'scene']);

  const inspector = workspaceFocusedInsights('inspector', insights);
  assert.equal(inspector.length, insights.length);
});

test('WIE 2.0: Program Output focuses on output health, Streaming on destination stability (routing-led)', () => {
  const insights = [
    fusedInsight({ id: 'output', severity: 'critical', cluster: 'output' }),
    fusedInsight({ id: 'routing', severity: 'warning', cluster: 'routing' }),
    fusedInsight({ id: 'scene', severity: 'info', cluster: 'scene' }),
  ];

  const programOutput = workspaceFocusedInsights('programOutput', insights);
  assert.deepEqual(programOutput.map((i) => i.id), ['output']);

  const streaming = workspaceFocusedInsights('streaming', insights);
  assert.deepEqual(streaming.map((i) => i.id).sort(), ['output', 'routing']);
});

test('WIE 2.0: Replay has no dedicated cluster and returns no fused insights, but sorts predictions chronologically', () => {
  const insights = [fusedInsight({ id: 'a', severity: 'warning', cluster: 'scene' })];
  assert.deepEqual(workspaceFocusedInsights('replay', insights), []);

  const now = Date.now();
  const predictions = [
    prediction({ id: 'late', category: 'scene_transition', timestamp: now + 5000 }),
    prediction({ id: 'early', category: 'audio_clipping', timestamp: now }),
    prediction({ id: 'mid', category: 'graphics_activation', timestamp: now + 2000 }),
  ];
  const replayFocus = workspaceFocusedPredictions('replay', predictions);
  assert.deepEqual(replayFocus.map((p) => p.id), ['early', 'mid', 'late']);
});

test('WIE 2.0: workspace zone cluster table has no overlap contradictions for defined zones', () => {
  assert.deepEqual(WORKSPACE_ZONE_CLUSTERS.triad, ['scene', 'graphics', 'audio']);
  assert.deepEqual(WORKSPACE_ZONE_CLUSTERS.programOutput, ['output']);
  assert.deepEqual(WORKSPACE_ZONE_CLUSTERS.streaming, ['routing', 'output']);
  assert.equal(WORKSPACE_ZONE_CLUSTERS.inspector, 'all');
});

// ── Studio-wide intelligence timeline ───────────────────────────────────────

test('WIE 2.0: studio timeline merges predictions, guidance, insights, automation, and output health, newest first', () => {
  const now = Date.now();
  const predictions = [prediction({ id: 'p1', category: 'scene_transition', timestamp: now - 4000 })];
  const guidance = [guidanceAction({ id: 'g1', timestamp: now - 1000 })];
  const insights = [fusedInsight({ id: 'i1', severity: 'warning', timestamp: now - 2000 })];
  const triggers = [automationTrigger({ id: 'a1', timestamp: now })];
  const outputNodes = [
    {
      id: 'output:program',
      type: 'OutputNode' as const,
      attributes: {},
      confidence: 0.7,
      timestamp: now - 3000,
      spike: true,
    },
  ];

  const timeline = buildStudioTimeline(predictions, guidance, insights, triggers, outputNodes as never);
  assert.deepEqual(timeline.map((e) => e.id), [
    'auto-a1',
    'guide-g1',
    'insight-i1',
    'output-health-output:program-spike-' + (now - 3000),
    'pred-p1',
  ]);
  assert.deepEqual(timeline.map((e) => e.kind), [
    'automation',
    'guidance',
    'insight',
    'output_health',
    'prediction',
  ]);
  assert.ok(timeline.every((e) => SEVERITY_IMPLICATIONS[e.severityBand] !== undefined));
});

test('WIE 2.0: studio timeline ignores output nodes with no spike/drop/anomaly', () => {
  const outputNodes = [
    { id: 'output:program', type: 'OutputNode' as const, attributes: {}, confidence: 0.5, timestamp: Date.now() },
  ];
  const timeline = buildStudioTimeline([], [], [], [], outputNodes as never);
  assert.equal(timeline.length, 0);
});

test('WIE 2.0: studio timeline respects the display limit', () => {
  const now = Date.now();
  const predictions = [
    prediction({ id: 'p1', category: 'scene_transition', timestamp: now }),
    prediction({ id: 'p2', category: 'graphics_activation', timestamp: now - 1 }),
    prediction({ id: 'p3', category: 'audio_clipping', timestamp: now - 2 }),
  ];
  const timeline = buildStudioTimeline(predictions, [], [], [], [], 2);
  assert.equal(timeline.length, 2);
});

// ── The orchestrator, end-to-end through the real graph ─────────────────────

test('WIE 2.0: compute() resolves conflicting predictions and scores global severity through the real graph', () => {
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

  const wie2 = new WorkspaceIntelligenceEngine2(graph);
  const result = wie2.compute();

  assert.equal(result.role, 'Director');
  assert.ok(result.globalSeverityScore >= 0 && result.globalSeverityScore <= 1);
  assert.ok(SEVERITY_IMPLICATIONS[result.globalSeverityBand] !== undefined);
  assert.ok(Array.isArray(result.resolvedPredictions));
  assert.ok(Array.isArray(result.timeline));
  assert.equal(wie2.getResult(), result);
});

test('WIE 2.0: workspaceFocus() reads live fused insights and resolved predictions from the graph', () => {
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

  const wie2 = new WorkspaceIntelligenceEngine2(graph);
  wie2.compute();

  const focus = wie2.workspaceFocus('streaming');
  assert.ok(Array.isArray(focus.insights));
  assert.ok(Array.isArray(focus.predictions));
});

test('WIE 2.0: reset() clears back to an empty result', () => {
  const graph = new UBOSIntelligenceGraph();
  const wie2 = new WorkspaceIntelligenceEngine2(graph);
  wie2.compute();
  wie2.reset();

  const result = wie2.getResult();
  assert.equal(result.resolvedPredictions.length, 0);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.globalSeverityScore, 0);
  assert.equal(result.globalSeverityBand, 'informational');
  assert.equal(result.theme.modifier, null);
  assert.equal(result.timeline.length, 0);
});
