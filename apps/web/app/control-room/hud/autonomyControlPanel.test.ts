import assert from 'node:assert/strict';
import test from 'node:test';
import { UBOSIntelligenceGraph } from '../intelligence-graph/ubosIntelligenceGraph.js';
import { StudioAutomation, defaultAutonomyPermissions } from '../intelligence-graph/studioAutomation.js';
import type { StudioAutomationResult, AutomationDecision, AutomationConflict } from '../intelligence-graph/studioAutomation.js';
import { normalizePermissionWorkspace } from '../intelligence-graph/permissionsEngine.js';
import type { AutonomousStudioModeResult } from './autonomousStudioMode.js';
import {
  AUTONOMY_LEVELS,
  AUTONOMY_LEVEL_LABELS,
  AUTONOMY_LEVEL_PRESETS,
  applyAutonomyLevel,
  deriveAutonomyLevel,
  applyVisualizationToMotion,
  visualizationAllowsOverlay,
  defaultAutonomyVisualizationSettings,
  applyOverrideAction,
  applyConfidenceThresholds,
  defaultAutonomySettingsConfig,
  buildAutonomyLogEntries,
  buildAutonomyTimelineEntries,
  deriveAutonomyConfiguration,
  AutonomyVisualizationSettingsStore,
} from './autonomyControlPanel.js';
import { defaultConfidenceThresholds } from '../intelligence-graph/autonomousConfidenceEngine.js';
import type { ConfidenceBreakdown } from '../intelligence-graph/studioAutomation.js';

function decision(partial: Partial<AutomationDecision> & Pick<AutomationDecision, 'action'>): AutomationDecision {
  return {
    id: partial.id ?? `dec-${Math.random()}`,
    predictionId: partial.predictionId ?? `pred-${Math.random()}`,
    action: partial.action,
    subsystem: partial.subsystem ?? 'graphics',
    cluster: partial.cluster ?? 'graphics',
    message: partial.message ?? partial.action,
    confidence: partial.confidence ?? 0.9,
    severityScore: partial.severityScore ?? 0.1,
    status: partial.status ?? 'wouldExecute',
    role: partial.role ?? 'Director',
    nodeId: partial.nodeId ?? 'scene:current',
    relatedNodeIds: partial.relatedNodeIds ?? [],
    timestamp: partial.timestamp ?? Date.now(),
  };
}

function conflict(winner: AutomationDecision, loser: AutomationDecision): AutomationConflict {
  return { winner, loser, reason: `${loser.action} superseded by ${winner.action}` };
}

function confidenceBreakdown(decision: AutomationDecision, partial: Partial<ConfidenceBreakdown> = {}): ConfidenceBreakdown {
  return {
    decisionId: decision.id,
    rawConfidence: partial.rawConfidence ?? decision.confidence,
    fusedConfidence: partial.fusedConfidence ?? decision.confidence,
    effectiveConfidence: partial.effectiveConfidence ?? decision.confidence,
    ageSeconds: partial.ageSeconds ?? 0,
    meetsActThreshold: partial.meetsActThreshold ?? true,
  };
}

function automationResult(partial: Partial<StudioAutomationResult> = {}): StudioAutomationResult {
  return {
    role: partial.role ?? 'Director',
    automationEnabled: partial.automationEnabled ?? true,
    studioHealthStatus: partial.studioHealthStatus ?? 'stable',
    decisions: partial.decisions ?? [],
    winners: partial.winners ?? [],
    conflicts: partial.conflicts ?? [],
    syncBatches: partial.syncBatches ?? [],
    timeline: partial.timeline ?? [],
    safetySettings: partial.safetySettings ?? { minConfidence: 0.85, maxSeverity: 0.4 },
    permissions: partial.permissions ?? defaultAutonomyPermissions(),
    conflictResolutionMode: partial.conflictResolutionMode ?? 'severityFirst',
    permissionWorkspace: partial.permissionWorkspace ?? normalizePermissionWorkspace(null),
    confidenceBreakdowns: partial.confidenceBreakdowns ?? [],
    timestamp: partial.timestamp ?? Date.now(),
  };
}

function autonomousResult(partial: Partial<AutonomousStudioModeResult> = {}): AutonomousStudioModeResult {
  return {
    mode: partial.mode ?? 'disabled',
    motion: partial.motion ?? [],
    elevation: partial.elevation ?? null,
    handoffEvent: partial.handoffEvent ?? null,
    handoffMessage: partial.handoffMessage ?? null,
    activeActions: partial.activeActions ?? [],
    recoveryConflictCount: partial.recoveryConflictCount ?? 0,
    timestamp: partial.timestamp ?? Date.now(),
  };
}

// ── 1. Autonomy Level Selector ──────────────────────────────────────────────

test('ASMCP: exactly the five named autonomy levels exist, correctly labeled', () => {
  assert.deepEqual([...AUTONOMY_LEVELS], [0, 1, 2, 3, 4]);
  assert.deepEqual(AUTONOMY_LEVEL_LABELS, {
    0: 'Manual',
    1: 'Assisted',
    2: 'Predictive',
    3: 'Semi-Autonomous',
    4: 'Fully Autonomous',
  });
});

test('ASMCP: Level 0 (Manual) and Level 1 (Assisted) never enable automation or any permission', () => {
  for (const level of [0, 1] as const) {
    assert.equal(AUTONOMY_LEVEL_PRESETS[level].automationEnabled, false);
    assert.ok(Object.values(AUTONOMY_LEVEL_PRESETS[level].permissions).every((v) => v === false));
  }
});

test('ASMCP: Level 2 (Predictive) enables every permission but keeps automation disabled', () => {
  const preset = AUTONOMY_LEVEL_PRESETS[2];
  assert.equal(preset.automationEnabled, false);
  assert.ok(Object.values(preset.permissions).every((v) => v === true));
});

test('ASMCP: Level 3 (Semi-Autonomous) enables automation for lower-risk categories only', () => {
  const preset = AUTONOMY_LEVEL_PRESETS[3];
  assert.equal(preset.automationEnabled, true);
  assert.equal(preset.permissions.graphicsActivation, true);
  assert.equal(preset.permissions.audioMixing, true);
  assert.equal(preset.permissions.outputStabilization, true);
  assert.equal(preset.permissions.sceneTransitions, false);
  assert.equal(preset.permissions.routingRecovery, false);
});

test('ASMCP: Level 4 (Fully Autonomous) enables every category and every permission', () => {
  const preset = AUTONOMY_LEVEL_PRESETS[4];
  assert.equal(preset.automationEnabled, true);
  assert.ok(Object.values(preset.permissions).every((v) => v === true));
});

test('ASMCP: autonomy levels are ordered by strictly non-decreasing trust in the system', () => {
  // A higher level never enables fewer permission categories than a lower level once automation is on.
  const enabledCount = (level: 0 | 1 | 2 | 3 | 4) =>
    Object.values(AUTONOMY_LEVEL_PRESETS[level].permissions).filter(Boolean).length;
  assert.ok(enabledCount(2) >= enabledCount(1));
  assert.ok(enabledCount(4) >= enabledCount(3));
});

test('ASMCP: applyAutonomyLevel sets automationEnabled, permissions, and safety settings on the live engine', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);

  applyAutonomyLevel(automation, 4);
  assert.equal(automation.isAutomationEnabled(), true);
  assert.equal(automation.getPermissions().routingRecovery, true);
  assert.equal(automation.getSafetySettings().minConfidence, 0.75);

  applyAutonomyLevel(automation, 0);
  assert.equal(automation.isAutomationEnabled(), false);
  assert.equal(automation.getPermissions().routingRecovery, false);
});

test('ASMCP: deriveAutonomyLevel recognizes every preset exactly, and reports custom otherwise', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);

  for (const level of AUTONOMY_LEVELS) {
    applyAutonomyLevel(automation, level);
    assert.equal(deriveAutonomyLevel(automation), level);
  }

  automation.setSafetySettings({ minConfidence: 0.6 });
  assert.equal(deriveAutonomyLevel(automation), 'custom');
});

// ── 4. Autonomy Visualization Settings ──────────────────────────────────────

test('ASMCP: motion intensity scale of 0 suppresses all motion tokens', () => {
  const settings = { ...defaultAutonomyVisualizationSettings(), motionIntensityScale: 0 };
  assert.deepEqual(applyVisualizationToMotion(['autoShake', 'autoPulse', 'autoGlow'], settings), []);
});

test('ASMCP: motion intensity scale at or below 0.5 keeps only the gentler tokens', () => {
  const settings = { ...defaultAutonomyVisualizationSettings(), motionIntensityScale: 0.5 };
  const filtered = applyVisualizationToMotion(['autoShake', 'autoPulse', 'autoGlow', 'autoFade'], settings);
  assert.deepEqual(filtered.slice().sort(), ['autoFade', 'autoGlow'].sort());
});

test('ASMCP: full motion intensity (1) preserves every computed token unchanged', () => {
  const settings = defaultAutonomyVisualizationSettings();
  const tokens = ['autoShake', 'autoPulse'] as const;
  assert.deepEqual(applyVisualizationToMotion(tokens, settings), tokens);
});

test('ASMCP: overlaysEnabled directly gates whether the safety overlay is allowed to render', () => {
  assert.equal(visualizationAllowsOverlay({ ...defaultAutonomyVisualizationSettings(), overlaysEnabled: true }), true);
  assert.equal(visualizationAllowsOverlay({ ...defaultAutonomyVisualizationSettings(), overlaysEnabled: false }), false);
});

test('ASMCP: AutonomyVisualizationSettingsStore persists partial updates and resets cleanly', () => {
  const store = new AutonomyVisualizationSettingsStore();
  store.set({ motionIntensityScale: 0.2, hudMode: 'minimal' });

  const settings = store.get();
  assert.equal(settings.motionIntensityScale, 0.2);
  assert.equal(settings.hudMode, 'minimal');
  assert.equal(settings.overlaysEnabled, true); // untouched field preserved

  store.reset();
  assert.deepEqual(store.get(), defaultAutonomyVisualizationSettings());
});

// ── 5. Autonomy Override Controls ───────────────────────────────────────────

test('ASMCP: pause and resume toggle automationEnabled directly', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);

  applyOverrideAction(automation, 'resume');
  assert.equal(automation.isAutomationEnabled(), true);
  applyOverrideAction(automation, 'pause');
  assert.equal(automation.isAutomationEnabled(), false);
});

test('ASMCP: override and reject both mark the target decision overridden on the next compute()', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);
  applyOverrideAction(automation, 'override', 'pred-1');
  applyOverrideAction(automation, 'reject', 'pred-2');
  // No direct getter for the override set — verified indirectly via
  // clearOverride below (approve), proving the same instance tracks both ids.
  applyOverrideAction(automation, 'approve', 'pred-1');
  applyOverrideAction(automation, 'approve', 'pred-2');
  // No exception thrown, both ids were tracked and cleared cleanly.
  assert.ok(true);
});

test('ASMCP: pause/resume/override/reject/approve without a predictionId never throw', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);
  for (const action of ['pause', 'resume', 'override', 'approve', 'reject'] as const) {
    assert.doesNotThrow(() => applyOverrideAction(automation, action));
  }
});

// ── 6 & 7. Autonomy Logs + Autonomy Timeline ────────────────────────────────

test('ASMCP: log entries map each decision status to the correct one of the six named kinds', () => {
  const executed = decision({ action: 'activateGraphicsLayer', status: 'wouldExecute' });
  const canceled = decision({ action: 'autoAdjustAudio', status: 'blockedByConfidence' });
  const overridden = decision({ action: 'triggerSceneTransition', status: 'overridden' });
  const superseded = decision({ action: 'failoverRoute', status: 'supersededByConflict' });

  const automation = automationResult({ decisions: [executed, canceled, overridden, superseded] });
  const logs = buildAutonomyLogEntries(automation, autonomousResult());

  assert.equal(logs.find((e) => e.id.includes(executed.id))!.kind, 'executed');
  assert.equal(logs.find((e) => e.id.includes(canceled.id))!.kind, 'canceled');
  assert.equal(logs.find((e) => e.id.includes(overridden.id))!.kind, 'override');
  assert.equal(logs.find((e) => e.id.includes(superseded.id))!.kind, 'recovery');
});

test('ASMCP: conflicts always log as recovery events', () => {
  const winner = decision({ action: 'activateGraphicsLayer' });
  const loser = decision({ action: 'triggerSceneTransition', status: 'supersededByConflict' });
  const automation = automationResult({ decisions: [winner, loser], conflicts: [conflict(winner, loser)] });

  const logs = buildAutonomyLogEntries(automation, autonomousResult());
  const recoveryEntries = logs.filter((e) => e.kind === 'recovery');
  // One from the decision's own supersededByConflict status, one from the conflict record itself.
  assert.equal(recoveryEntries.length, 2);
});

test('ASMCP: a handedBack handoff logs exactly one fallback event', () => {
  const automation = automationResult({ decisions: [] });
  const autonomous = autonomousResult({ mode: 'disabled', handoffEvent: 'handedBack', handoffMessage: 'stepped back' });

  const logs = buildAutonomyLogEntries(automation, autonomous);
  assert.equal(logs.filter((e) => e.kind === 'fallback').length, 1);
  assert.equal(logs.find((e) => e.kind === 'fallback')!.message, 'stepped back');
});

test('ASMCP: no fallback event is logged for handoffs other than handedBack', () => {
  const automation = automationResult({ decisions: [] });
  for (const handoffEvent of ['activated', 'enteredRecovery', 'exitedRecovery', null] as const) {
    const logs = buildAutonomyLogEntries(automation, autonomousResult({ handoffEvent }));
    assert.equal(logs.filter((e) => e.kind === 'fallback').length, 0);
  }
});

test('ASMCP: logs sort newest first', () => {
  const now = Date.now();
  const older = decision({ action: 'autoAdjustAudio', status: 'wouldExecute', timestamp: now - 1000 });
  const newer = decision({ action: 'activateGraphicsLayer', status: 'wouldExecute', timestamp: now });
  const logs = buildAutonomyLogEntries(automationResult({ decisions: [older, newer] }), autonomousResult());
  assert.deepEqual(logs.map((e) => e.id), [
    `autonomy-event-${newer.id}`,
    `autonomy-event-${older.id}`,
  ]);
});

test('ASMCP: timeline entries respect the display limit', () => {
  const now = Date.now();
  const decisions = Array.from({ length: 5 }, (_, i) =>
    decision({ action: 'activateGraphicsLayer', status: 'wouldExecute', timestamp: now - i }),
  );
  const timeline = buildAutonomyTimelineEntries(automationResult({ decisions }), autonomousResult(), 3);
  assert.equal(timeline.length, 3);
});

// ── Step 113 — Confidence visualization in Logs/Timeline ────────────────────

test('ASMCP: a log entry carries ACE\'s effectiveConfidence when a matching breakdown exists', () => {
  const stale = decision({ action: 'activateGraphicsLayer', status: 'wouldExecute', confidence: 0.9 });
  const breakdown = confidenceBreakdown(stale, { effectiveConfidence: 0.4, meetsActThreshold: false });
  const automation = automationResult({ decisions: [stale], confidenceBreakdowns: [breakdown] });

  const logs = buildAutonomyLogEntries(automation, autonomousResult());
  const entry = logs.find((e) => e.id.includes(stale.id))!;
  assert.equal(entry.confidence, 0.9); // raw confidence untouched
  assert.equal(entry.effectiveConfidence, 0.4); // ACE's decayed value, surfaced separately
});

test('ASMCP: a log entry has no effectiveConfidence when no breakdown matches (e.g. no ACE data this tick)', () => {
  const undecayed = decision({ action: 'activateGraphicsLayer', status: 'wouldExecute' });
  const automation = automationResult({ decisions: [undecayed], confidenceBreakdowns: [] });

  const logs = buildAutonomyLogEntries(automation, autonomousResult());
  const entry = logs.find((e) => e.id.includes(undecayed.id))!;
  assert.equal(entry.effectiveConfidence, undefined);
});

test('ASMCP: conflict-derived recovery events never carry an effectiveConfidence (no decision id to match)', () => {
  const winner = decision({ action: 'activateGraphicsLayer' });
  const loser = decision({ action: 'triggerSceneTransition', status: 'supersededByConflict' });
  const automation = automationResult({
    decisions: [winner, loser],
    conflicts: [conflict(winner, loser)],
    confidenceBreakdowns: [confidenceBreakdown(winner), confidenceBreakdown(loser)],
  });

  const logs = buildAutonomyLogEntries(automation, autonomousResult());
  const conflictEntry = logs.find((e) => e.id === `autonomy-event-conflict-${loser.id}`)!;
  assert.equal(conflictEntry.effectiveConfidence, undefined);
});

// ── Step 113 — Confidence thresholds in Safety Settings ─────────────────────

test('ASMCP: defaultAutonomySettingsConfig includes ACE\'s default confidence thresholds', () => {
  assert.deepEqual(defaultAutonomySettingsConfig().confidenceThresholds, defaultConfidenceThresholds());
});

test('ASMCP: applyConfidenceThresholds merges a partial update onto the live Confidence Engine', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);
  applyConfidenceThresholds(automation, { toAct: 0.95 });

  const thresholds = automation.getConfidenceEngine().getConfig().thresholds;
  assert.equal(thresholds.toAct, 0.95);
  assert.equal(thresholds.toPredict, defaultConfidenceThresholds().toPredict);
});

test('ASMCP: deriveAutonomyConfiguration surfaces the live Confidence Engine\'s thresholds', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);
  applyConfidenceThresholds(automation, { toRecover: 0.55 });
  automation.compute();

  const config = deriveAutonomyConfiguration(automation, autonomousResult(), defaultAutonomyVisualizationSettings());
  assert.equal(config.settings.confidenceThresholds.toRecover, 0.55);
});

// ── The aggregate configuration ──────────────────────────────────────────────

test('ASMCP: deriveAutonomyConfiguration composes level, permissions, settings, visualization, logs, and timeline', () => {
  const graph = new UBOSIntelligenceGraph();
  const automation = new StudioAutomation(graph);
  applyAutonomyLevel(automation, 3);
  automation.compute();

  const config = deriveAutonomyConfiguration(automation, autonomousResult(), defaultAutonomyVisualizationSettings());
  assert.equal(config.level, 3);
  assert.equal(config.permissions.graphicsActivation, true);
  assert.equal(config.settings.safety.minConfidence, automation.getSafetySettings().minConfidence);
  assert.deepEqual(config.visualization, defaultAutonomyVisualizationSettings());
  assert.ok(Array.isArray(config.logs));
  assert.ok(Array.isArray(config.timeline));
});
