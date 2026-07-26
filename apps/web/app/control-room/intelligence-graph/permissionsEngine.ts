/**
 * Autonomous Studio Mode Permissions Engine (APE) — Step 112.
 *
 * The gatekeeper for Studio Automation: decides whether autonomy is
 * allowed to perform a given action based on five factors named in the
 * spec — role, workspace, action, safety (confidence/severity), and
 * system state (output health) — via one `canPerform()` call, matching
 * the Step 112 code sample's `PermissionsEngine.canPerform(action,
 * context)` shape exactly (adapted to this codebase's real types
 * instead of the sample's untyped `config`/`context` objects).
 *
 * ── Same "Studio Automation 2.0" naming gap as Steps 109-111 ─────────
 * Built against Studio Automation 1.0 (Step 107/111) — this repository
 * has never implemented a "Studio Automation 2.0".
 *
 * ── Layering, not duplication ─────────────────────────────────────────
 * Step 111 already added a *flat* per-category `AutonomyPermissions`
 * on/off toggle (`sceneTransitions`/`graphicsActivation`/...) and
 * configurable `AutonomySafetySettings`/studio-health gating inside
 * `studioAutomation.ts`. APE adds a *second, finer-grained* dimension —
 * which specific **role**, in which specific **workspace**, may perform
 * which specific action — layered on top of, not replacing, Step 111's
 * coarse toggle. This mirrors the existing layering precedent exactly:
 * `automationEnabled` (global on/off) → `AutonomyPermissions` (per-
 * category on/off) → APE (per-role/per-workspace on/off) are three
 * strictly increasing levels of granularity, each independently useful,
 * none redundant with the others.
 *
 * `canPerform()` is deliberately self-contained and re-checks
 * confidence/severity/system-health itself (per the spec's own
 * five-factor `canPerform` shape) — `isRolePermitted()`/
 * `isWorkspacePermitted()` are exposed separately so
 * `studioAutomation.ts`'s `buildAutomationDecisions()` can reuse just
 * the new role/workspace dimension without double-checking the safety
 * gate it already performs via `evaluateSafety()` (Step 107/111).
 *
 * Kept dependency-free of React/`@ubos/ui`/`hud/`, matching every other
 * intelligence-graph engine.
 */
import type { GuidanceRole } from './operatorGuidanceEngine.js';
import type { AutomationActionType, AutonomySafetySettings } from './studioAutomation.js';
import type { StudioHealthStatus } from './studioIntelligence.js';

// ── Workspace permission dimension ──────────────────────────────────────────

/**
 * The six named workspaces from the spec, matching `@ubos/shared`'s
 * `WorkspacePresetId` naming pattern (`director`/`production`/
 * `graphics-operator`/`replay-operator`/`distribution-operator`/
 * `automation-operator`) without importing that cross-package type into
 * a framework-free engine file — the same decoupling rationale every
 * other locally-mirrored union in this codebase already uses.
 */
export type PermissionWorkspaceKey = 'director' | 'production' | 'graphics' | 'replay' | 'distribution' | 'automation';

export const PERMISSION_WORKSPACE_KEYS: readonly PermissionWorkspaceKey[] = [
  'director',
  'production',
  'graphics',
  'replay',
  'distribution',
  'automation',
];

/**
 * Normalizes a real workspace context string (as already carried
 * through `WieGlobalResult.workspace`/`StudioIntelligenceResult.workspace`
 * — Next.js catalog ids like `director`, `graphics-operator`,
 * `streaming-operator`, or the orchestration engine's raw `production`
 * default) onto one of the six named permission workspaces. Mirrors
 * `normalizeRole()`'s (Step 88) own string-matching style. Falls back to
 * `production` — the broadest, most permissive bucket — for anything
 * unrecognized, rather than the narrowest, since an unrecognized
 * workspace is a normalization gap, not evidence the operator is
 * somewhere restricted.
 */
export function normalizePermissionWorkspace(raw: string | null | undefined): PermissionWorkspaceKey {
  if (!raw) return 'production';
  const key = raw.trim().toLowerCase();
  if (key.includes('technical-director') || key.includes('technical director')) return 'production';
  if (key.includes('director')) return 'director';
  if (key.includes('graphics')) return 'graphics';
  if (key.includes('replay')) return 'replay';
  if (key.includes('distribution') || key.includes('streaming')) return 'distribution';
  if (key.includes('automation')) return 'automation';
  return 'production';
}

// ── Permission matrices ─────────────────────────────────────────────────────

export type RolePermissionMatrix = Record<GuidanceRole, Partial<Record<AutomationActionType, boolean>>>;
export type WorkspacePermissionMatrix = Record<PermissionWorkspaceKey, Partial<Record<AutomationActionType, boolean>>>;

/**
 * Default role permissions — this agent's own considered design (the
 * spec names role-based permissions as a responsibility without giving
 * a matrix): Director and Solo Streamer (who covers every role solo)
 * get every action; specialized operators get only their own domain;
 * Technical Director and Streaming Operator (both infrastructure-
 * focused) get routing/output recovery; Compact Operator mirrors its
 * existing `ROLE_PRIMARY_SUBSYSTEMS` scope from Step 107 (scenes/audio/
 * output, no routing).
 */
export function defaultRolePermissions(): RolePermissionMatrix {
  return {
    Director: {
      triggerSceneTransition: true,
      activateGraphicsLayer: true,
      autoAdjustAudio: true,
      failoverRoute: true,
      switchToBackupDestination: true,
    },
    'Technical Director': {
      triggerSceneTransition: false,
      activateGraphicsLayer: false,
      autoAdjustAudio: false,
      failoverRoute: true,
      switchToBackupDestination: true,
    },
    'Graphics Operator': {
      triggerSceneTransition: false,
      activateGraphicsLayer: true,
      autoAdjustAudio: false,
      failoverRoute: false,
      switchToBackupDestination: false,
    },
    'Audio Engineer': {
      triggerSceneTransition: false,
      activateGraphicsLayer: false,
      autoAdjustAudio: true,
      failoverRoute: false,
      switchToBackupDestination: false,
    },
    'Replay Operator': {
      triggerSceneTransition: false,
      activateGraphicsLayer: false,
      autoAdjustAudio: false,
      failoverRoute: false,
      switchToBackupDestination: false,
    },
    'Streaming Operator': {
      triggerSceneTransition: false,
      activateGraphicsLayer: false,
      autoAdjustAudio: false,
      failoverRoute: true,
      switchToBackupDestination: true,
    },
    'Solo Streamer': {
      triggerSceneTransition: true,
      activateGraphicsLayer: true,
      autoAdjustAudio: true,
      failoverRoute: true,
      switchToBackupDestination: true,
    },
    'Compact Operator': {
      triggerSceneTransition: true,
      activateGraphicsLayer: true,
      autoAdjustAudio: true,
      failoverRoute: false,
      switchToBackupDestination: true,
    },
  };
}

/**
 * Default workspace permissions — again this agent's own design.
 * Director/Production/Automation are broad control surfaces (full
 * access); Graphics is scoped to graphics only; Distribution is scoped
 * to routing/output recovery (the destination-facing actions); Replay
 * honestly permits nothing today — no `AutomationActionType` maps to a
 * replay trigger yet (the same documented gap since Step 105), so this
 * is not a restrictive design choice, it is an accurate reflection of
 * what exists.
 */
export function defaultWorkspacePermissions(): WorkspacePermissionMatrix {
  const full = {
    triggerSceneTransition: true,
    activateGraphicsLayer: true,
    autoAdjustAudio: true,
    failoverRoute: true,
    switchToBackupDestination: true,
  };
  return {
    director: { ...full },
    production: { ...full },
    automation: { ...full },
    graphics: {
      triggerSceneTransition: false,
      activateGraphicsLayer: true,
      autoAdjustAudio: false,
      failoverRoute: false,
      switchToBackupDestination: false,
    },
    distribution: {
      triggerSceneTransition: false,
      activateGraphicsLayer: false,
      autoAdjustAudio: false,
      failoverRoute: true,
      switchToBackupDestination: true,
    },
    replay: {
      triggerSceneTransition: false,
      activateGraphicsLayer: false,
      autoAdjustAudio: false,
      failoverRoute: false,
      switchToBackupDestination: false,
    },
  };
}

// ── Action-specific rules ───────────────────────────────────────────────────

export type ActionRule = {
  /**
   * "requiresStableOutput" only makes sense for *routine, creative*
   * actions (scene transitions, graphics activation) — automation
   * should wait for calm output before making a creative change.
   * `failoverRoute`/`switchToBackupDestination` are *recovery* actions
   * whose entire purpose is acting during instability, so they
   * deliberately do **not** carry this rule — the separate, more severe
   * `outputHealth === 'critical'` hard block above still applies to
   * every action regardless.
   */
  requiresStableOutput?: boolean;
};

export function defaultActionRules(): Partial<Record<AutomationActionType, ActionRule>> {
  return {
    triggerSceneTransition: { requiresStableOutput: true },
    activateGraphicsLayer: { requiresStableOutput: true },
  };
}

// ── The engine ───────────────────────────────────────────────────────────────

export type PermissionsEngineConfig = {
  roles: RolePermissionMatrix;
  workspaces: WorkspacePermissionMatrix;
  safety: AutonomySafetySettings;
  actions: Partial<Record<AutomationActionType, ActionRule>>;
};

export function defaultPermissionsEngineConfig(): PermissionsEngineConfig {
  return {
    roles: defaultRolePermissions(),
    workspaces: defaultWorkspacePermissions(),
    safety: { minConfidence: 0.85, maxSeverity: 0.4 },
    actions: defaultActionRules(),
  };
}

export type PermissionContext = {
  role: GuidanceRole;
  workspace: PermissionWorkspaceKey;
  confidence: number;
  /** 0-1 score, matching `studioAutomation.ts`'s `severityScoreForCluster` convention. */
  severityScore: number;
  outputHealth: StudioHealthStatus;
};

export type PermissionDenialReason =
  | 'roleNotPermitted'
  | 'workspaceNotPermitted'
  | 'confidenceTooLow'
  | 'severityTooHigh'
  | 'outputCritical'
  | 'actionRequiresStableOutput';

export type PermissionDecision = {
  allowed: boolean;
  reason: PermissionDenialReason | null;
};

/**
 * UBOS's gatekeeper for Studio Automation (Step 112). Matches the Step
 * 112 spec's `PermissionsEngine` class shape — `constructor(config)` +
 * `canPerform(action, context)` — with real types instead of the
 * sample's untyped objects.
 */
export class PermissionsEngine {
  private config: PermissionsEngineConfig;

  constructor(config: PermissionsEngineConfig = defaultPermissionsEngineConfig()) {
    this.config = config;
  }

  isRolePermitted(action: AutomationActionType, role: GuidanceRole): boolean {
    return this.config.roles[role]?.[action] ?? false;
  }

  isWorkspacePermitted(action: AutomationActionType, workspace: PermissionWorkspaceKey): boolean {
    return this.config.workspaces[workspace]?.[action] ?? false;
  }

  /**
   * The full five-factor gate, per the spec's own `canPerform` code
   * sample and ordering exactly: role, workspace, safety (confidence
   * then severity), system health, then action-specific rules.
   * Confidence/severity comparisons intentionally use the sample's own
   * `<`/`>` (not `evaluateSafety`'s `<=`/`>=`, Step 107/111) — a small,
   * deliberate difference between two independent gates, noted here
   * rather than silently left inconsistent.
   */
  canPerform(action: AutomationActionType, context: PermissionContext): PermissionDecision {
    if (!this.isRolePermitted(action, context.role)) {
      return { allowed: false, reason: 'roleNotPermitted' };
    }
    if (!this.isWorkspacePermitted(action, context.workspace)) {
      return { allowed: false, reason: 'workspaceNotPermitted' };
    }
    if (context.confidence < this.config.safety.minConfidence) {
      return { allowed: false, reason: 'confidenceTooLow' };
    }
    if (context.severityScore > this.config.safety.maxSeverity) {
      return { allowed: false, reason: 'severityTooHigh' };
    }
    if (context.outputHealth === 'critical') {
      return { allowed: false, reason: 'outputCritical' };
    }
    const rule = this.config.actions[action];
    if (rule?.requiresStableOutput && context.outputHealth !== 'stable') {
      return { allowed: false, reason: 'actionRequiresStableOutput' };
    }
    return { allowed: true, reason: null };
  }

  setRolePermission(role: GuidanceRole, action: AutomationActionType, allowed: boolean): void {
    this.config.roles[role] = { ...this.config.roles[role], [action]: allowed };
  }

  setWorkspacePermission(workspace: PermissionWorkspaceKey, action: AutomationActionType, allowed: boolean): void {
    this.config.workspaces[workspace] = { ...this.config.workspaces[workspace], [action]: allowed };
  }

  setSafety(partial: Partial<AutonomySafetySettings>): void {
    this.config.safety = { ...this.config.safety, ...partial };
  }

  setActionRule(action: AutomationActionType, rule: Partial<ActionRule>): void {
    this.config.actions[action] = { ...this.config.actions[action], ...rule };
  }

  getConfig(): PermissionsEngineConfig {
    return this.config;
  }

  reset(): void {
    this.config = defaultPermissionsEngineConfig();
  }
}
