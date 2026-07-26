import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PermissionsEngine,
  PERMISSION_WORKSPACE_KEYS,
  normalizePermissionWorkspace,
  defaultRolePermissions,
  defaultWorkspacePermissions,
  defaultActionRules,
  defaultPermissionsEngineConfig,
  type PermissionContext,
} from './permissionsEngine.js';

function context(partial: Partial<PermissionContext> = {}): PermissionContext {
  return {
    role: partial.role ?? 'Director',
    workspace: partial.workspace ?? 'director',
    confidence: partial.confidence ?? 0.95,
    severityScore: partial.severityScore ?? 0.1,
    outputHealth: partial.outputHealth ?? 'stable',
  };
}

// ── Workspace normalization ─────────────────────────────────────────────────

test('APE: exactly the six named workspaces exist', () => {
  assert.deepEqual([...PERMISSION_WORKSPACE_KEYS], [
    'director',
    'production',
    'graphics',
    'replay',
    'distribution',
    'automation',
  ]);
});

test('APE: normalizePermissionWorkspace maps real catalog ids onto the six named workspaces', () => {
  assert.equal(normalizePermissionWorkspace('director'), 'director');
  assert.equal(normalizePermissionWorkspace('graphics-operator'), 'graphics');
  assert.equal(normalizePermissionWorkspace('replay-operator'), 'replay');
  assert.equal(normalizePermissionWorkspace('streaming-operator'), 'distribution');
  assert.equal(normalizePermissionWorkspace('distribution-operator'), 'distribution');
  assert.equal(normalizePermissionWorkspace('automation-operator'), 'automation');
});

test('APE: normalizePermissionWorkspace routes Technical Director to production, not director', () => {
  assert.equal(normalizePermissionWorkspace('technical-director'), 'production');
});

test('APE: normalizePermissionWorkspace defaults to the permissive production bucket for null/unknown input', () => {
  assert.equal(normalizePermissionWorkspace(null), 'production');
  assert.equal(normalizePermissionWorkspace(undefined), 'production');
  assert.equal(normalizePermissionWorkspace('some-unrecognized-id'), 'production');
});

// ── Default matrices ─────────────────────────────────────────────────────────

test('APE: every one of the eight GuidanceRole values has a role permission entry', () => {
  const roles = defaultRolePermissions();
  for (const role of [
    'Director',
    'Technical Director',
    'Graphics Operator',
    'Audio Engineer',
    'Replay Operator',
    'Streaming Operator',
    'Solo Streamer',
    'Compact Operator',
  ] as const) {
    assert.ok(roles[role], `missing role permission entry for ${role}`);
  }
});

test('APE: Director and Solo Streamer are the only roles permitted every action by default', () => {
  const roles = defaultRolePermissions();
  const actions = ['triggerSceneTransition', 'activateGraphicsLayer', 'autoAdjustAudio', 'failoverRoute', 'switchToBackupDestination'] as const;
  for (const role of ['Director', 'Solo Streamer'] as const) {
    for (const action of actions) {
      assert.equal(roles[role][action], true, `${role} should default to permitted for ${action}`);
    }
  }
  // Graphics Operator is scoped to its own domain only.
  assert.equal(roles['Graphics Operator'].activateGraphicsLayer, true);
  assert.equal(roles['Graphics Operator'].triggerSceneTransition, false);
  assert.equal(roles['Graphics Operator'].autoAdjustAudio, false);
});

test('APE: Replay workspace honestly permits nothing today (no replay AutomationActionType exists yet)', () => {
  const workspaces = defaultWorkspacePermissions();
  assert.ok(Object.values(workspaces.replay).every((v) => v === false));
});

test('APE: Director/production/automation workspaces default to full access, graphics/distribution are scoped', () => {
  const workspaces = defaultWorkspacePermissions();
  for (const workspace of ['director', 'production', 'automation'] as const) {
    assert.ok(Object.values(workspaces[workspace]).every((v) => v === true), `${workspace} should be fully permissive`);
  }
  assert.equal(workspaces.graphics.activateGraphicsLayer, true);
  assert.equal(workspaces.graphics.triggerSceneTransition, false);
  assert.equal(workspaces.distribution.failoverRoute, true);
  assert.equal(workspaces.distribution.activateGraphicsLayer, false);
});

test('APE: only creative actions (scene transitions, graphics activation) require stable output by default', () => {
  const rules = defaultActionRules();
  assert.equal(rules.triggerSceneTransition?.requiresStableOutput, true);
  assert.equal(rules.activateGraphicsLayer?.requiresStableOutput, true);
  assert.equal(rules.failoverRoute, undefined);
  assert.equal(rules.switchToBackupDestination, undefined);
});

// ── canPerform() — the five-factor gate ─────────────────────────────────────

test('APE: canPerform allows a permitted, confident, safe, healthy action', () => {
  const engine = new PermissionsEngine();
  const decision = engine.canPerform('activateGraphicsLayer', context());
  assert.deepEqual(decision, { allowed: true, reason: null });
});

test('APE: canPerform denies when the role is not permitted, before checking anything else', () => {
  const engine = new PermissionsEngine();
  // Audio Engineer is not permitted triggerSceneTransition by default.
  const decision = engine.canPerform('triggerSceneTransition', context({ role: 'Audio Engineer' }));
  assert.deepEqual(decision, { allowed: false, reason: 'roleNotPermitted' });
});

test('APE: canPerform denies when the workspace is not permitted, even for a permitted role', () => {
  const engine = new PermissionsEngine();
  // Director is role-permitted everywhere, but the replay workspace permits nothing.
  const decision = engine.canPerform('activateGraphicsLayer', context({ workspace: 'replay' }));
  assert.deepEqual(decision, { allowed: false, reason: 'workspaceNotPermitted' });
});

test('APE: canPerform denies on confidence below the configured minimum (strict less-than)', () => {
  const engine = new PermissionsEngine();
  const atThreshold = engine.canPerform('activateGraphicsLayer', context({ confidence: 0.85 }));
  assert.equal(atThreshold.allowed, true); // exactly at threshold passes (spec sample uses strict <)
  const belowThreshold = engine.canPerform('activateGraphicsLayer', context({ confidence: 0.84 }));
  assert.deepEqual(belowThreshold, { allowed: false, reason: 'confidenceTooLow' });
});

test('APE: canPerform denies on severity above the configured maximum (strict greater-than)', () => {
  const engine = new PermissionsEngine();
  const atThreshold = engine.canPerform('activateGraphicsLayer', context({ severityScore: 0.4 }));
  assert.equal(atThreshold.allowed, true); // exactly at threshold passes
  const aboveThreshold = engine.canPerform('activateGraphicsLayer', context({ severityScore: 0.41 }));
  assert.deepEqual(aboveThreshold, { allowed: false, reason: 'severityTooHigh' });
});

test('APE: canPerform denies unconditionally when output health is critical, regardless of action', () => {
  const engine = new PermissionsEngine();
  const decision = engine.canPerform('failoverRoute', context({ role: 'Streaming Operator', workspace: 'distribution', outputHealth: 'critical' }));
  assert.deepEqual(decision, { allowed: false, reason: 'outputCritical' });
});

test('APE: creative actions additionally require stable (not just non-critical) output', () => {
  const engine = new PermissionsEngine();
  const warningHealth = engine.canPerform('activateGraphicsLayer', context({ outputHealth: 'warning' }));
  assert.deepEqual(warningHealth, { allowed: false, reason: 'actionRequiresStableOutput' });
});

test('APE: recovery actions (failoverRoute/switchToBackupDestination) are allowed during non-critical instability, unlike creative actions', () => {
  const engine = new PermissionsEngine();
  const decision = engine.canPerform('failoverRoute', context({ role: 'Streaming Operator', workspace: 'distribution', outputHealth: 'unstable' }));
  assert.deepEqual(decision, { allowed: true, reason: null });
});

// ── Configuration mutation ──────────────────────────────────────────────────

test('APE: setRolePermission/setWorkspacePermission grant or revoke a single action without affecting others', () => {
  const engine = new PermissionsEngine();
  engine.setRolePermission('Audio Engineer', 'triggerSceneTransition', true);
  assert.equal(engine.isRolePermitted('triggerSceneTransition', 'Audio Engineer'), true);
  assert.equal(engine.isRolePermitted('autoAdjustAudio', 'Audio Engineer'), true); // untouched, was already true

  engine.setWorkspacePermission('replay', 'autoAdjustAudio', true);
  assert.equal(engine.isWorkspacePermitted('autoAdjustAudio', 'replay'), true);
  assert.equal(engine.isWorkspacePermitted('failoverRoute', 'replay'), false); // untouched
});

test('APE: setSafety merges partial updates over the current safety settings', () => {
  const engine = new PermissionsEngine();
  engine.setSafety({ minConfidence: 0.5 });
  const decision = engine.canPerform('activateGraphicsLayer', context({ confidence: 0.6 }));
  assert.equal(decision.allowed, true);
  assert.equal(engine.getConfig().safety.maxSeverity, defaultPermissionsEngineConfig().safety.maxSeverity);
});

test('APE: setActionRule can add a new rule or relax an existing one', () => {
  const engine = new PermissionsEngine();
  engine.setActionRule('failoverRoute', { requiresStableOutput: true });
  const decision = engine.canPerform('failoverRoute', context({ role: 'Streaming Operator', workspace: 'distribution', outputHealth: 'warning' }));
  assert.deepEqual(decision, { allowed: false, reason: 'actionRequiresStableOutput' });

  engine.setActionRule('activateGraphicsLayer', { requiresStableOutput: false });
  const relaxed = engine.canPerform('activateGraphicsLayer', context({ outputHealth: 'warning' }));
  assert.equal(relaxed.allowed, true);
});

test('APE: reset() restores the default configuration exactly', () => {
  const engine = new PermissionsEngine();
  engine.setRolePermission('Audio Engineer', 'triggerSceneTransition', true);
  engine.setSafety({ minConfidence: 0.1 });
  engine.reset();

  assert.deepEqual(engine.getConfig(), defaultPermissionsEngineConfig());
});
