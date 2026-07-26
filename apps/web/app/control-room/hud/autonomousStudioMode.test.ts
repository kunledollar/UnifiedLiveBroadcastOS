import assert from 'node:assert/strict';
import test from 'node:test';
import type { StudioAutomationResult, AutomationDecision } from '../intelligence-graph/studioAutomation.js';
import {
  defaultAutonomySafetySettings,
  defaultAutonomyPermissions,
  defaultConflictResolutionMode,
} from '../intelligence-graph/studioAutomation.js';
import {
  resolveAutonomousMode,
  autonomousMotionForMode,
  autonomousElevationForAction,
  highestAutonomousElevation,
  detectHandoff,
  handoffMessage,
  AutonomousStudioModeController,
} from './autonomousStudioMode.js';

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

function automationResult(partial: Partial<StudioAutomationResult> = {}): StudioAutomationResult {
  return {
    role: partial.role ?? 'Director',
    automationEnabled: partial.automationEnabled ?? false,
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

// ── Autonomous mode state ────────────────────────────────────────────────────

test('Autonomous Studio Mode UX: disabled when automation is not enabled, regardless of any pending decisions', () => {
  const result = automationResult({ automationEnabled: false, winners: [decision({ action: 'activateGraphicsLayer' })] });
  assert.equal(resolveAutonomousMode(result), 'disabled');
});

test('Autonomous Studio Mode UX: recovering takes priority over active when a conflict just resolved', () => {
  const winner = decision({ action: 'activateGraphicsLayer' });
  const loser = decision({ action: 'triggerSceneTransition', status: 'supersededByConflict' });
  const result = automationResult({
    automationEnabled: true,
    winners: [winner],
    conflicts: [{ winner, loser, reason: 'test' }],
  });
  assert.equal(resolveAutonomousMode(result), 'recovering');
});

test('Autonomous Studio Mode UX: active when at least one decision is eligible and there is no conflict', () => {
  const result = automationResult({ automationEnabled: true, winners: [decision({ action: 'autoAdjustAudio' })] });
  assert.equal(resolveAutonomousMode(result), 'active');
});

test('Autonomous Studio Mode UX: idle when enabled but nothing is currently eligible or conflicting', () => {
  const result = automationResult({ automationEnabled: true, winners: [], conflicts: [] });
  assert.equal(resolveAutonomousMode(result), 'idle');
});

// ── Autonomous motion physics ────────────────────────────────────────────────

test('Autonomous Studio Mode UX: motion tokens follow the resolved mode, per the Step 109 spec wording', () => {
  assert.deepEqual(autonomousMotionForMode('active', true), ['autoGlow']);
  assert.deepEqual(autonomousMotionForMode('recovering', true), ['autoShake']);
  assert.deepEqual(autonomousMotionForMode('disabled', true), ['autoFade']);
  assert.deepEqual(autonomousMotionForMode('idle', true), ['autoPulse']);
  assert.deepEqual(autonomousMotionForMode('idle', false), []);
});

// ── Autonomous panel elevation ────────────────────────────────────────────────

test('Autonomous Studio Mode UX: elevation per action matches the Step 109 spec exactly', () => {
  assert.equal(autonomousElevationForAction('triggerSceneTransition'), 3);
  assert.equal(autonomousElevationForAction('activateGraphicsLayer'), 3);
  assert.equal(autonomousElevationForAction('autoAdjustAudio'), 3);
  assert.equal(autonomousElevationForAction('failoverRoute'), 4);
  assert.equal(autonomousElevationForAction('switchToBackupDestination'), 4);
  assert.equal(autonomousElevationForAction('none'), null);
});

test('Autonomous Studio Mode UX: highest elevation wins across simultaneous active actions', () => {
  const decisions = [
    decision({ action: 'activateGraphicsLayer' }), // Level 3
    decision({ action: 'failoverRoute' }), // Level 4
    decision({ action: 'autoAdjustAudio' }), // Level 3
  ];
  assert.equal(highestAutonomousElevation(decisions), 4);
});

test('Autonomous Studio Mode UX: highest elevation is null when there are no active actions', () => {
  assert.equal(highestAutonomousElevation([]), null);
});

// ── Autonomous operator handoff ──────────────────────────────────────────────

test('Autonomous Studio Mode UX: handoff detects activation and hand-back transitions', () => {
  assert.equal(detectHandoff('idle', 'active'), 'activated');
  assert.equal(detectHandoff('disabled', 'active'), 'activated');
  assert.equal(detectHandoff('active', 'idle'), 'handedBack');
  assert.equal(detectHandoff('active', 'disabled'), 'handedBack');
});

test('Autonomous Studio Mode UX: handoff detects entering and exiting recovery', () => {
  assert.equal(detectHandoff('active', 'recovering'), 'enteredRecovery');
  assert.equal(detectHandoff('recovering', 'active'), 'exitedRecovery');
});

test('Autonomous Studio Mode UX: no handoff event when the mode does not change', () => {
  assert.equal(detectHandoff('active', 'active'), null);
  assert.equal(detectHandoff('idle', 'idle'), null);
});

test('Autonomous Studio Mode UX: every handoff event has an operator-facing message', () => {
  for (const event of ['activated', 'handedBack', 'enteredRecovery', 'exitedRecovery'] as const) {
    assert.ok(handoffMessage(event));
  }
  assert.equal(handoffMessage(null), null);
});

// ── The orchestrator ─────────────────────────────────────────────────────────

test('Autonomous Studio Mode UX: controller tracks mode transitions across successive compute() calls', () => {
  const controller = new AutonomousStudioModeController();

  const disabled = controller.compute(automationResult({ automationEnabled: false }));
  assert.equal(disabled.mode, 'disabled');
  assert.equal(disabled.handoffEvent, null); // starts disabled, no transition yet

  const winner = decision({ action: 'activateGraphicsLayer' });
  const active = controller.compute(automationResult({ automationEnabled: true, winners: [winner] }));
  assert.equal(active.mode, 'active');
  assert.equal(active.handoffEvent, 'activated');
  assert.equal(active.handoffMessage, 'Autonomy active — Studio Automation is now executing eligible actions.');
  assert.deepEqual(active.activeActions, [winner]);
  assert.equal(active.elevation, 3);

  const idle = controller.compute(automationResult({ automationEnabled: true, winners: [] }));
  assert.equal(idle.mode, 'idle');
  assert.equal(idle.handoffEvent, 'handedBack');
});

test('Autonomous Studio Mode UX: controller reports recovery conflict count and elevation from active actions only', () => {
  const controller = new AutonomousStudioModeController();
  const winner = decision({ action: 'failoverRoute' });
  const loser = decision({ action: 'triggerSceneTransition', status: 'supersededByConflict' });

  const recovering = controller.compute(
    automationResult({ automationEnabled: true, winners: [winner], conflicts: [{ winner, loser, reason: 'test' }] }),
  );
  assert.equal(recovering.mode, 'recovering');
  assert.equal(recovering.recoveryConflictCount, 1);
  assert.equal(recovering.elevation, 4);
  assert.deepEqual(recovering.motion, ['autoShake']);
});

test('Autonomous Studio Mode UX: repeat compute() calls with the same automation timestamp do not double-count a handoff', () => {
  const controller = new AutonomousStudioModeController();
  const snapshot = automationResult({
    automationEnabled: true,
    winners: [decision({ action: 'activateGraphicsLayer' })],
    timestamp: 12345,
  });

  // Simulate multiple components (OperatorHUD, WorkspaceShell, ControlRoomCanvas)
  // all reading the same tick's automation snapshot independently.
  const first = controller.compute(snapshot);
  const second = controller.compute(snapshot);
  const third = controller.compute(snapshot);

  assert.equal(first.handoffEvent, 'activated');
  assert.equal(second.handoffEvent, 'activated'); // same cached result, not re-derived as "no change"
  assert.equal(third.handoffEvent, 'activated');
  assert.equal(second, first); // literally the same cached object
});

test('Autonomous Studio Mode UX: a genuinely new tick (different timestamp) is processed even with identical mode', () => {
  const controller = new AutonomousStudioModeController();
  const tick1 = automationResult({ automationEnabled: true, winners: [decision({ action: 'activateGraphicsLayer' })], timestamp: 1 });
  const tick2 = automationResult({ automationEnabled: true, winners: [decision({ action: 'activateGraphicsLayer' })], timestamp: 2 });

  const first = controller.compute(tick1);
  const second = controller.compute(tick2);

  assert.equal(first.handoffEvent, 'activated');
  assert.equal(second.handoffEvent, null); // still active, no new transition
  assert.notEqual(second, first);
});

test('Autonomous Studio Mode UX: reset() returns the controller to its initial disabled state', () => {
  const controller = new AutonomousStudioModeController();
  controller.compute(automationResult({ automationEnabled: true, winners: [decision({ action: 'autoAdjustAudio' })] }));
  controller.reset();

  const result = controller.getResult();
  assert.equal(result.mode, 'disabled');
  assert.equal(result.activeActions.length, 0);
  assert.equal(result.handoffEvent, null);

  // Confirms the *previous mode* was also reset, not just the cached result —
  // re-activating immediately after reset should read as a fresh activation.
  const reactivated = controller.compute(
    automationResult({ automationEnabled: true, winners: [decision({ action: 'autoAdjustAudio' })] }),
  );
  assert.equal(reactivated.handoffEvent, 'activated');
});
