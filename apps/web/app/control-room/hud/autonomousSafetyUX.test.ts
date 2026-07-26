import assert from 'node:assert/strict';
import test from 'node:test';
import type { StudioAutomationResult, AutomationDecision, AutomationConflict } from '../intelligence-graph/studioAutomation.js';
import {
  defaultAutonomySafetySettings,
  defaultAutonomyPermissions,
  defaultConflictResolutionMode,
} from '../intelligence-graph/studioAutomation.js';
import type { StudioHealth, StudioHealthDimensionResult } from '../intelligence-graph/studioIntelligence.js';
import type { AutonomousStudioModeResult } from './autonomousStudioMode.js';
import {
  resolveSafetyOverlay,
  describeConflictType,
  buildConflictWarnings,
  resolveFallback,
  overridePromptReasons,
  buildOverridePrompts,
  STABILIZER_DIMENSIONS,
  stabilizerGlowForStatus,
  resolveStabilizerIndicators,
  riskVisualization,
  AutonomousSafetyUXController,
} from './autonomousSafetyUX.js';

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
    safetySettings: partial.safetySettings ?? defaultAutonomySafetySettings(),
    permissions: partial.permissions ?? defaultAutonomyPermissions(),
    conflictResolutionMode: partial.conflictResolutionMode ?? defaultConflictResolutionMode(),
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

function healthDimension(
  partial: Partial<StudioHealthDimensionResult> & Pick<StudioHealthDimensionResult, 'dimension' | 'status'>,
): StudioHealthDimensionResult {
  return {
    dimension: partial.dimension,
    score: partial.score ?? null,
    status: partial.status,
    sampleCount: partial.sampleCount ?? 0,
  };
}

function studioHealth(dimensions: StudioHealthDimensionResult[]): StudioHealth {
  return { dimensions, score: 1, status: 'stable' };
}

// ── 1. Autonomous Safety Overlay ────────────────────────────────────────────

test('Safety UX: overlay is inactive while disabled, subtle while active, strong while recovering', () => {
  assert.deepEqual(resolveSafetyOverlay(autonomousResult({ mode: 'disabled' })), {
    active: false, vignetteIntensity: 'none', glow: false,
  });
  assert.deepEqual(resolveSafetyOverlay(autonomousResult({ mode: 'idle' })), {
    active: true, vignetteIntensity: 'subtle', glow: true,
  });
  assert.deepEqual(resolveSafetyOverlay(autonomousResult({ mode: 'active' })), {
    active: true, vignetteIntensity: 'subtle', glow: true,
  });
  assert.deepEqual(resolveSafetyOverlay(autonomousResult({ mode: 'recovering' })), {
    active: true, vignetteIntensity: 'strong', glow: true,
  });
});

// ── 2. Autonomous Conflict Warning Layer ────────────────────────────────────

test('Safety UX: conflict types match the three currently-producible named pairs from the spec', () => {
  assert.equal(describeConflictType('scene', 'graphics'), 'scene-vs-graphics');
  assert.equal(describeConflictType('graphics', 'scene'), 'scene-vs-graphics'); // order-independent
  assert.equal(describeConflictType('graphics', 'audio'), 'graphics-vs-audio');
  assert.equal(describeConflictType('routing', 'output'), 'routing-vs-output');
  assert.equal(describeConflictType('scene', 'audio'), 'other');
});

test('Safety UX: conflict warnings are read straight from Step 107 conflicts, not re-resolved', () => {
  const winner = decision({ action: 'activateGraphicsLayer', cluster: 'graphics', severityScore: 0.05, confidence: 0.9 });
  const loser = decision({ action: 'triggerSceneTransition', cluster: 'scene', severityScore: 0.3, confidence: 0.7 });
  const automation = automationResult({ conflicts: [conflict(winner, loser)] });

  const warnings = buildConflictWarnings(automation);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]!.type, 'scene-vs-graphics');
  assert.equal(warnings[0]!.severityScore, 0.3);
  assert.equal(warnings[0]!.confidence, 0.7);
  assert.equal(warnings[0]!.recommendedAction, 'activateGraphicsLayer');
});

// ── 3. Autonomous Fallback Visuals ──────────────────────────────────────────

test('Safety UX: fallback is only reported on the exact handedBack transition tick', () => {
  assert.equal(resolveFallback(autonomousResult({ mode: 'disabled', handoffEvent: 'handedBack' })).inFallback, true);
  assert.ok(resolveFallback(autonomousResult({ mode: 'disabled', handoffEvent: 'handedBack' })).reason);
  assert.equal(resolveFallback(autonomousResult({ mode: 'disabled', handoffEvent: null })).inFallback, false);
  assert.equal(resolveFallback(autonomousResult({ mode: 'active', handoffEvent: 'activated' })).inFallback, false);
  assert.equal(resolveFallback(autonomousResult({ mode: 'disabled', handoffEvent: null })).reason, null);
});

// ── 4. Autonomous Override Prompts ──────────────────────────────────────────

test('Safety UX: override prompt reasons match all four named categories independently', () => {
  const highSeverity = decision({ action: 'triggerSceneTransition', severityScore: 0.5, confidence: 0.95, status: 'blockedBySeverity' });
  assert.deepEqual(overridePromptReasons(highSeverity, new Set()), ['highSeverity']);

  const lowConfidence = decision({ action: 'triggerSceneTransition', severityScore: 0.1, confidence: 0.3, status: 'blockedByConfidence' });
  assert.deepEqual(overridePromptReasons(lowConfidence, new Set()), ['lowConfidence']);

  const conflicted = decision({ id: 'c1', action: 'triggerSceneTransition', severityScore: 0.1, confidence: 0.95, status: 'supersededByConflict' });
  assert.deepEqual(overridePromptReasons(conflicted, new Set(['c1'])), ['multiWorkspaceConflict']);

  const outputRisk = decision({ action: 'switchToBackupDestination', severityScore: 0.1, confidence: 0.95, status: 'blockedByOperatorDisabled' });
  assert.deepEqual(overridePromptReasons(outputRisk, new Set()), ['outputDegradationRisk']);

  const clean = decision({ action: 'triggerSceneTransition', severityScore: 0.1, confidence: 0.95, status: 'blockedByOperatorDisabled' });
  assert.deepEqual(overridePromptReasons(clean, new Set()), []);
});

test('Safety UX: override prompts are empty while automation is disabled entirely, even for otherwise-qualifying decisions', () => {
  const highSeverityBlocked = decision({
    action: 'switchToBackupDestination',
    severityScore: 0.9,
    confidence: 0.1,
    status: 'blockedByOperatorDisabled',
  });
  const prompts = buildOverridePrompts(automationResult({ automationEnabled: false, decisions: [highSeverityBlocked] }));
  assert.deepEqual(prompts, []);
});

test('Safety UX: override prompts exclude decisions that already executed or were overridden', () => {
  const executed = decision({ action: 'activateGraphicsLayer', status: 'wouldExecute', severityScore: 0.5 });
  const overridden = decision({ action: 'autoAdjustAudio', status: 'overridden', confidence: 0.1 });
  const blocked = decision({ action: 'triggerSceneTransition', status: 'blockedBySeverity', severityScore: 0.5 });

  const prompts = buildOverridePrompts(automationResult({ decisions: [executed, overridden, blocked] }));
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0]!.action, 'triggerSceneTransition');
});

test('Safety UX: a decision matching multiple reasons carries all of them', () => {
  const decisionWithMultipleReasons = decision({
    action: 'switchToBackupDestination',
    severityScore: 0.5,
    confidence: 0.3,
    status: 'blockedBySeverity',
  });
  const prompts = buildOverridePrompts(automationResult({ decisions: [decisionWithMultipleReasons] }));
  assert.equal(prompts.length, 1);
  assert.deepEqual([...prompts[0]!.reasons].sort(), ['highSeverity', 'lowConfidence', 'outputDegradationRisk']);
});

// ── 5. Autonomous Stabilization Indicators ──────────────────────────────────

test('Safety UX: exactly the four named subsystems are tracked, in the spec\'s order', () => {
  assert.deepEqual([...STABILIZER_DIMENSIONS], ['routing', 'audio', 'output', 'graphics']);
});

test('Safety UX: stabilizer glow matches the spec\'s three colors plus none for unknown', () => {
  assert.equal(stabilizerGlowForStatus('stable'), 'stabilizing');
  assert.equal(stabilizerGlowForStatus('warning'), 'recovering');
  assert.equal(stabilizerGlowForStatus('unstable'), 'recovering');
  assert.equal(stabilizerGlowForStatus('critical'), 'critical');
  assert.equal(stabilizerGlowForStatus('unknown'), 'none');
});

test('Safety UX: replay/streaming never appear among the four tracked stabilizers (no data source yet)', () => {
  const health = studioHealth([
    healthDimension({ dimension: 'output', status: 'critical' }),
    healthDimension({ dimension: 'routing', status: 'stable' }),
    healthDimension({ dimension: 'graphics', status: 'warning' }),
    healthDimension({ dimension: 'audio', status: 'stable' }),
    healthDimension({ dimension: 'replay', status: 'unknown' }),
    healthDimension({ dimension: 'streaming', status: 'unknown' }),
  ]);

  const indicators = resolveStabilizerIndicators(health);
  assert.deepEqual(indicators.map((i) => i.dimension), ['routing', 'audio', 'output', 'graphics']);
  assert.deepEqual(indicators.map((i) => i.glow), ['stabilizing', 'stabilizing', 'critical', 'recovering']);
});

test('Safety UX: a missing dimension result defaults to no glow, never fabricated', () => {
  const indicators = resolveStabilizerIndicators(studioHealth([]));
  assert.ok(indicators.every((i) => i.glow === 'none'));
});

// ── 6. Autonomous Risk Visualization ────────────────────────────────────────

test('Safety UX: risk visualization escalates severity band, elevation, and motion intensity together', () => {
  const low = riskVisualization(0.1, 0.9);
  assert.equal(low.severityBand, 'informational');
  assert.equal(low.gradientStrength, 'flat');

  const critical = riskVisualization(0.95, 0.9);
  assert.equal(critical.severityBand, 'critical');
  assert.equal(critical.gradientStrength, 'critical');
  assert.equal(critical.elevation, 4);
  assert.equal(critical.motionIntensity, 'critical');
});

test('Safety UX: confidence opacity is clamped and never fully invisible', () => {
  assert.equal(riskVisualization(0.1, 0).confidenceOpacity, 0.15);
  assert.equal(riskVisualization(0.1, 1.5).confidenceOpacity, 1);
  assert.equal(riskVisualization(0.1, 0.6).confidenceOpacity, 0.6);
});

// ── The orchestrator ─────────────────────────────────────────────────────────

test('Safety UX: controller composes all six responsibilities from the same tick\'s inputs', () => {
  const controller = new AutonomousSafetyUXController();
  const winner = decision({ action: 'activateGraphicsLayer', cluster: 'graphics' });
  const loser = decision({ action: 'triggerSceneTransition', cluster: 'scene', status: 'supersededByConflict' });
  const automation = automationResult({
    decisions: [winner, loser],
    winners: [winner],
    conflicts: [conflict(winner, loser)],
  });
  const autonomous = autonomousResult({ mode: 'recovering', handoffEvent: 'enteredRecovery' });
  const health = studioHealth([
    healthDimension({ dimension: 'output', status: 'critical' }),
  ]);

  const result = controller.compute(automation, autonomous, health);
  assert.equal(result.overlay.active, true);
  assert.equal(result.overlay.vignetteIntensity, 'strong');
  assert.equal(result.conflictWarnings.length, 1);
  assert.equal(result.fallback.inFallback, false);
  assert.ok(Array.isArray(result.overridePrompts));
  assert.equal(result.stabilizers.find((s) => s.dimension === 'output')!.glow, 'critical');
  assert.equal(controller.getResult(), result);
});

test('Safety UX: controller memoizes by automation object identity within a tick', () => {
  const controller = new AutonomousSafetyUXController();
  const automation = automationResult();
  const autonomous = autonomousResult({ mode: 'idle' });
  const health = studioHealth([]);

  const first = controller.compute(automation, autonomous, health);
  const second = controller.compute(automation, autonomous, health);
  assert.equal(first, second);
});

test('Safety UX: reset() clears back to an empty, honest result', () => {
  const controller = new AutonomousSafetyUXController();
  controller.compute(
    automationResult({ conflicts: [conflict(decision({ action: 'activateGraphicsLayer' }), decision({ action: 'autoAdjustAudio' }))] }),
    autonomousResult({ mode: 'recovering' }),
    studioHealth([]),
  );
  controller.reset();

  const result = controller.getResult();
  assert.equal(result.overlay.active, false);
  assert.equal(result.conflictWarnings.length, 0);
  assert.equal(result.overridePrompts.length, 0);
  assert.ok(result.stabilizers.every((s) => s.glow === 'none'));
});
