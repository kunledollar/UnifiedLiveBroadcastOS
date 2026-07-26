import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from '../intelligence-graph/ubosIntelligenceGraph.js';
import { UIIntegrationLayer, UI_ACTION_CLASS } from '../intelligence-graph/uiIntelligenceIntegrationLayer.js';
import type { WorkspaceUiSignal } from '../intelligence-graph/workspaceIntelligenceEngine.js';
import type { Prediction } from '../intelligence-graph/predictiveEngine.js';
import type { FusedInsight } from '../intelligence-graph/insightFusionEngine.js';
import type { GuidanceAction } from '../intelligence-graph/operatorGuidanceEngine.js';
import type { InferenceResult } from '../intelligence-graph/uigInferenceEngine.js';
import {
  HUD_ZONE_IDS,
  HUD_ZONE_PANELS,
  hudZoneAction,
  hudZoneClassName,
  hudZoneCollapsed,
  selectPrimaryInsights,
  selectGuidanceActions,
  selectWarnings,
  selectTimelineEntries,
  routeGlobalIntelligenceToHud,
} from './hudIntelligence.js';

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

function prediction(partial: Partial<Prediction> & Pick<Prediction, 'category'>): Prediction {
  return {
    id: partial.id ?? `pred-${partial.category}`,
    category: partial.category,
    message: partial.message ?? partial.category,
    nodeId: partial.nodeId ?? 'node-1',
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

// ── Zone wiring / outer treatment ───────────────────────────────────────────

test('Operator HUD 2.0: exactly the four canonical zones are wired (Step 104)', () => {
  assert.deepEqual([...HUD_ZONE_IDS], ['primaryInsight', 'guidance', 'warning', 'timeline']);
  assert.deepEqual([...HUD_ZONE_PANELS.primaryInsight], [
    'scenePanel',
    'graphicsPanel',
    'audioPanel',
    'programOutputPanel',
  ]);
  assert.deepEqual([...HUD_ZONE_PANELS.guidance], ['guidancePanel', 'operatorPanel']);
  assert.deepEqual([...HUD_ZONE_PANELS.warning], [
    'programOutputPanel',
    'routingPanel',
    'audioPanel',
    'systemPanel',
  ]);
  assert.deepEqual([...HUD_ZONE_PANELS.timeline], ['guidancePanel', 'automationPanel', 'replayPanel']);
});

test('Operator HUD 2.0: a predicted graphics activation pulses the Primary Insight zone only (Step 104)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'pulse', panel: 'graphicsPanel' })]);
  layer.apply();

  assert.equal(hudZoneAction('primaryInsight', layer), 'pulse');
  assert.equal(hudZoneClassName('primaryInsight', layer), UI_ACTION_CLASS.pulse);
  assert.equal(hudZoneAction('guidance', layer), null);
  assert.equal(hudZoneAction('warning', layer), null);
  assert.equal(hudZoneAction('timeline', layer), null);
});

test('Operator HUD 2.0: an output warning drives both the Primary Insight and Warning zones (Step 104)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'warn', panel: 'programOutputPanel' })]);
  layer.apply();

  assert.equal(hudZoneClassName('primaryInsight', layer), UI_ACTION_CLASS.warn);
  assert.equal(hudZoneClassName('warning', layer), UI_ACTION_CLASS.warn);
  assert.equal(hudZoneClassName('guidance', layer), '');
});

test('Operator HUD 2.0: operator guidance elevates the Guidance zone (Step 104)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'elevate', panel: 'guidancePanel' })]);
  layer.apply();

  assert.equal(hudZoneAction('guidance', layer), 'elevate');
  assert.equal(hudZoneClassName('guidance', layer), UI_ACTION_CLASS.elevate);
  assert.equal(hudZoneAction('timeline', layer), 'elevate');
});

test('Operator HUD 2.0: highest-priority action wins across multiple candidate panels (Step 104)', () => {
  const layer = new UIIntegrationLayer([
    signal({ action: 'dim', panel: 'audioPanel' }),
    signal({ action: 'highlight', panel: 'scenePanel' }),
  ]);
  layer.apply();

  // highlight (priority 5) beats dim (priority 1) for the Primary Insight zone.
  assert.equal(hudZoneAction('primaryInsight', layer), 'highlight');
});

test('Operator HUD 2.0: suppress collapses the whole HUD zone, not just fades it (Step 104)', () => {
  const layer = new UIIntegrationLayer([signal({ action: 'suppress', panel: 'routingPanel' })]);
  layer.apply();

  assert.equal(hudZoneCollapsed('warning', layer), true);
  assert.equal(hudZoneCollapsed('primaryInsight', layer), false);
});

test('Operator HUD 2.0: no signal means no treatment and no collapse (Step 104)', () => {
  const layer = new UIIntegrationLayer([]);
  layer.apply();

  for (const zoneId of HUD_ZONE_IDS) {
    assert.equal(hudZoneAction(zoneId, layer), null);
    assert.equal(hudZoneClassName(zoneId, layer), '');
    assert.equal(hudZoneCollapsed(zoneId, layer), false);
  }
});

// ── Zone content selection ──────────────────────────────────────────────────

test('Operator HUD 2.0: Primary Insight selects only the four canonical prediction categories, most-recent first up to the limit (Step 104)', () => {
  const predictions = [
    prediction({ id: 'p1', category: 'scene_transition' }),
    prediction({ id: 'p2', category: 'routing_failure' }), // not a Primary Insight category
    prediction({ id: 'p3', category: 'graphics_activation' }),
    prediction({ id: 'p4', category: 'audio_clipping' }),
    prediction({ id: 'p5', category: 'output_degradation' }),
  ];

  const selected = selectPrimaryInsights(predictions, 3);
  assert.equal(selected.length, 3);
  assert.ok(selected.every((p) => p.category !== 'routing_failure'));
  assert.deepEqual(selected.map((p) => p.id), ['p1', 'p3', 'p4']);
});

test('Operator HUD 2.0: Guidance zone passes through ranked operator guidance up to the limit (Step 104)', () => {
  const guidance = [
    guidanceAction({ id: 'g1', severity: 'Critical Action' }),
    guidanceAction({ id: 'g2', severity: 'Warning Action' }),
    guidanceAction({ id: 'g3', severity: 'Prepare Action' }),
    guidanceAction({ id: 'g4', severity: 'Monitor' }),
  ];

  const selected = selectGuidanceActions(guidance, 2);
  assert.deepEqual(selected.map((g) => g.id), ['g1', 'g2']);
});

test('Operator HUD 2.0: Warning zone only surfaces critical/warning fused insights, never predictions/info (Step 104)', () => {
  const insights = [
    fusedInsight({ id: 'i1', severity: 'critical' }),
    fusedInsight({ id: 'i2', severity: 'prediction' }),
    fusedInsight({ id: 'i3', severity: 'warning' }),
    fusedInsight({ id: 'i4', severity: 'info' }),
  ];

  const selected = selectWarnings(insights);
  assert.deepEqual(selected.map((i) => i.id), ['i1', 'i3']);
});

test('Operator HUD 2.0: Timeline merges predictions, guidance, insights, and automation triggers newest-first (Step 104)', () => {
  const now = Date.now();
  const predictions = [prediction({ id: 'p1', category: 'scene_transition', timestamp: now - 3000 })];
  const guidance = [guidanceAction({ id: 'g1', timestamp: now - 1000 })];
  const insights = [fusedInsight({ id: 'i1', severity: 'warning', timestamp: now - 2000 })];
  const triggers = [automationTrigger({ id: 'a1', timestamp: now })];

  const entries = selectTimelineEntries(predictions, guidance, insights, triggers, 10);

  assert.deepEqual(entries.map((e) => e.id), ['auto-a1', 'guide-g1', 'insight-i1', 'pred-p1']);
  assert.deepEqual(entries.map((e) => e.kind), ['automation', 'guidance', 'insight', 'prediction']);
});

test('Operator HUD 2.0: Timeline respects the display limit (Step 104)', () => {
  const now = Date.now();
  const predictions = [
    prediction({ id: 'p1', category: 'scene_transition', timestamp: now }),
    prediction({ id: 'p2', category: 'graphics_activation', timestamp: now - 1 }),
    prediction({ id: 'p3', category: 'audio_clipping', timestamp: now - 2 }),
  ];

  const entries = selectTimelineEntries(predictions, [], [], [], 2);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((e) => e.id), ['pred-p1', 'pred-p2']);
});

// ── WIE 2.0 routing (Step 105) ───────────────────────────────────────────────

test('Operator HUD 2.0: routeGlobalIntelligenceToHud reads Primary Insight from WIE 2.0 resolved predictions, not the raw feed (Step 105)', () => {
  const now = Date.now();
  const global = {
    resolvedPredictions: [prediction({ id: 'p1', category: 'scene_transition', timestamp: now })],
    timeline: [
      { id: 'auto-a1', kind: 'automation' as const, message: 'Automation fired', confidence: 0.8, timestamp: now },
      { id: 'output-health-1', kind: 'output_health' as const, message: 'Output health spike', confidence: 0.7, timestamp: now - 500 },
    ],
  };
  const guidance = [guidanceAction({ id: 'g1' })];
  const insights = [fusedInsight({ id: 'i1', severity: 'critical' })];

  const routing = routeGlobalIntelligenceToHud(global, guidance, insights);

  assert.deepEqual(routing.primary.map((p) => p.id), ['p1']);
  assert.deepEqual(routing.guidance.map((g) => g.id), ['g1']);
  assert.deepEqual(routing.warning.map((i) => i.id), ['i1']);
  assert.deepEqual(routing.timeline.map((e) => e.id), ['auto-a1', 'output-health-1']);
  assert.deepEqual(routing.timeline.map((e) => e.kind), ['automation', 'output_health']);
});

test('Operator HUD 2.0: routeGlobalIntelligenceToHud respects custom per-zone limits (Step 105)', () => {
  const now = Date.now();
  const global = {
    resolvedPredictions: [
      prediction({ id: 'p1', category: 'scene_transition', timestamp: now }),
      prediction({ id: 'p2', category: 'graphics_activation', timestamp: now - 1 }),
    ],
    timeline: [
      { id: 't1', kind: 'insight' as const, message: 'a', confidence: 0.8, timestamp: now },
      { id: 't2', kind: 'insight' as const, message: 'b', confidence: 0.7, timestamp: now - 1 },
      { id: 't3', kind: 'insight' as const, message: 'c', confidence: 0.6, timestamp: now - 2 },
    ],
  };

  const routing = routeGlobalIntelligenceToHud(global, [], [], { primary: 1, timeline: 2 });
  assert.equal(routing.primary.length, 1);
  assert.equal(routing.timeline.length, 2);
});

// ── End-to-end through the real graph ───────────────────────────────────────

test('Operator HUD 2.0: end-to-end through the real graph — repeated output frame drops warn the Warning zone (Step 104)', () => {
  const graph = new UBOSIntelligenceGraph();
  graph.setContext({ workspace: 'streaming-operator', operator: 'streaming', system: 'ubos' });
  graph.guidanceEngine.setContext('Streaming Operator', 'streaming-operator');

  for (let i = 0; i < 3; i += 1) {
    graph.ingest({
      id: `output:frame-drop:${i}`,
      type: 'output.frame_drop',
      source: 'output-engine',
      workspace: 'streaming-operator',
      payload: { droppedFrames: 5 + i },
    });
  }

  const warningAction = hudZoneAction('warning', graph.uiIntegration);
  assert.ok(
    warningAction === 'warn' || warningAction === 'highlight',
    `expected Warning zone to react to frame drops, got "${warningAction}"`,
  );

  const snapshot = graph.getSnapshot();
  const warnings = selectWarnings(snapshot.latestFusedInsights);
  assert.ok(warnings.length > 0, 'expected at least one critical/warning fused insight');
});
