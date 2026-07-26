/**
 * Studio Automation 1.0 — Step 107
 *
 * UBOS's first autonomous *action* layer, sitting above Studio Intelligence
 * 1.0 (Step 106), WIE 2.0 (Step 105), the Predictive Engine (86), Insight
 * Fusion Engine (87), Operator Guidance Engine (88), and UIIL (90) per the
 * spec's "powered by" list.
 *
 * ── Decision-only by design ─────────────────────────────────────────────
 * This module computes automation *decisions* — which predicted actions
 * are eligible to execute autonomously, which are blocked and why, which
 * lost a conflict, and a timeline of all of it — as pure, testable data.
 * It does **not** dispatch real broadcast commands.
 *
 * That is a deliberate architectural choice, not a shortcut: this
 * codebase already has a real, wired automation *runtime*
 * (`automation-engine/automationEngine.ts`, Step 67 — condition/action
 * triggers evaluated every orchestration tick, each with its own
 * `enabled` flag and *real* side effects on `routingEngine`/
 * `audioEngine`/etc.) and a real Production Graph command dispatcher
 * (`packages/shared/src/production-graph.ts`,
 * `LocalProductionCommandDispatcher`) used by session sync — neither of
 * which any existing "automation platform" layer in this codebase
 * (including the v5.10 rundown/macro UI, which explicitly logs command
 * *intents* rather than dispatching) actually calls into for autonomous
 * firing. Wiring Step 107 directly into either would mean inventing a
 * new, unreviewed autonomous-control path for a live broadcast studio —
 * exactly what "do not create duplicate command or runtime systems" and
 * "do not expose unsupported controls" forbid. Every "action" this module
 * names (`activateGraphicsLayer`, `triggerSceneTransition`, ...) is a
 * *label*, matching the Step 107 spec's own `resolveAction()` code sample
 * (which likewise only returns a string, never calls a dispatcher).
 * `AutomationDecision.status` is honest about this: `'wouldExecute'`
 * means "every safety gate passed, this is what the operator's chosen
 * automation-enabled path would fire", not "this already happened".
 *
 * Seven responsibilities:
 *
 *   1. Predictive automation — `evaluateSafety()` gates each of Studio
 *      Intelligence's resolved predictions on confidence, severity,
 *      operator opt-in, and studio health.
 *   2. Cross-workspace automation — `groupIntoSyncBatches()` groups
 *      simultaneously-eligible, *non-conflicting* decisions across
 *      different subsystems into one batch that would fire in sync (the
 *      spec's own example: scene + graphics + audio together).
 *   3. Automation safety modeling — `AUTOMATION_SAFETY_THRESHOLDS`,
 *      applied by `evaluateSafety()`.
 *   4. Automation conflict resolution — `resolveAutomationConflicts()`,
 *      reusing WIE 2.0's own conflict *detection* (`predictionsConflict`)
 *      but tie-breaking with the four factors the spec names: severity,
 *      confidence, operator role, studio health.
 *   5. Automation timeline — `buildAutomationTimeline()`.
 *   6. Automation HUD integration — `toHudTimelineEntries()` shapes
 *      decisions into the exact `HudTimelineEntry`-compatible shape HUD
 *      2.0's existing `'automation'` timeline kind already renders (no
 *      new HUD zone, no new kind — Step 104 already has one).
 *
 * Kept dependency-free of React/`@ubos/ui`/`hud/`, matching every other
 * intelligence-graph engine's layering.
 */
import type { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';
import type { Prediction, PredictionCategory } from './predictiveEngine.js';
import type { FusedInsight, FusionCluster } from './insightFusionEngine.js';
import type { GuidanceRole } from './operatorGuidanceEngine.js';
import { predictionsConflict } from './workspaceIntelligenceEngine2.js';
import {
  fusedInsightSeverityScore,
  type StudioSubsystem,
  type StudioHealthStatus,
} from './studioIntelligence.js';
import {
  PermissionsEngine,
  normalizePermissionWorkspace,
  type PermissionWorkspaceKey,
} from './permissionsEngine.js';
import {
  AutonomousConfidenceEngine,
  clamp01,
  type ConfidenceSignals,
} from './autonomousConfidenceEngine.js';

// ── Predictive automation ───────────────────────────────────────────────────

export type AutomationActionType =
  | 'activateGraphicsLayer'
  | 'triggerSceneTransition'
  | 'autoAdjustAudio'
  | 'switchToBackupDestination'
  | 'failoverRoute'
  | 'none';

/**
 * Mirrors the Step 107 code sample's `resolveAction()` switch exactly,
 * extended with `routing_failure` → `failoverRoute` (named explicitly in
 * the spec's Cross-Workspace Automation example: "routing + streaming").
 * `operator_action`/`automation_trigger` predictions have no autonomous
 * action of their own — they describe operator/automation *behavior*,
 * not a studio state change to act on — and resolve to `'none'`.
 */
const CATEGORY_ACTION: Record<PredictionCategory, AutomationActionType> = {
  scene_transition: 'triggerSceneTransition',
  graphics_activation: 'activateGraphicsLayer',
  audio_clipping: 'autoAdjustAudio',
  output_degradation: 'switchToBackupDestination',
  routing_failure: 'failoverRoute',
  operator_action: 'none',
  automation_trigger: 'none',
};

export function resolveAction(category: PredictionCategory): AutomationActionType {
  return CATEGORY_ACTION[category];
}

/**
 * Which `FusionCluster` (Step 87) each prediction category's action
 * belongs to — used to look up "how risky is this subsystem right now"
 * for the severity gate. A small local duplicate of the same mapping
 * `insightFusionEngine.ts`/`workspaceIntelligenceEngine2.ts` each already
 * carry their own copy of, for the same decoupling reason.
 */
const CATEGORY_CLUSTER: Record<PredictionCategory, FusionCluster> = {
  scene_transition: 'scene',
  graphics_activation: 'graphics',
  audio_clipping: 'audio',
  output_degradation: 'output',
  routing_failure: 'routing',
  operator_action: 'operator',
  automation_trigger: 'automation',
};

/**
 * "Severity" for automation purposes is *not* the prediction's own
 * confidence (that would make the confidence and severity gates
 * redundant) — it is how risky the surrounding subsystem already looks,
 * from real fused insights in the same cluster. No fused insight in that
 * cluster means no known problem, which honestly scores as 0 (safe),
 * never a fabricated pessimistic default.
 */
export function severityScoreForCluster(cluster: FusionCluster, fusedInsights: readonly FusedInsight[]): number {
  const inCluster = fusedInsights.filter((insight) => insight.cluster === cluster);
  if (inCluster.length === 0) return 0;
  return Math.max(...inCluster.map(fusedInsightSeverityScore));
}

// ── Automation safety modeling ──────────────────────────────────────────────

/**
 * Exact thresholds named in the Step 107 spec's Automation Safety
 * Modeling section — also the *default* `AutonomySafetySettings` (Step
 * 111 makes these operator-configurable; nothing here changes behavior
 * for a caller that never configures anything).
 */
export const AUTOMATION_SAFETY_THRESHOLDS = {
  minConfidence: 0.85,
  maxSeverity: 0.4,
} as const;

export type AutonomySafetySettings = {
  minConfidence: number;
  maxSeverity: number;
};

export function defaultAutonomySafetySettings(): AutonomySafetySettings {
  return { ...AUTOMATION_SAFETY_THRESHOLDS };
}

export type AutomationDecisionStatus =
  | 'wouldExecute'
  | 'blockedByConfidence'
  | 'blockedBySeverity'
  | 'blockedByOperatorDisabled'
  | 'blockedByStudioHealth'
  | 'blockedByPermission'
  | 'blockedByRole'
  | 'blockedByWorkspace'
  | 'blockedByConfidenceDecay'
  | 'supersededByConflict'
  | 'overridden';

export type AutomationDecision = {
  id: string;
  predictionId: string;
  action: AutomationActionType;
  subsystem: StudioSubsystem;
  cluster: FusionCluster;
  message: string;
  confidence: number;
  severityScore: number;
  status: AutomationDecisionStatus;
  role: GuidanceRole;
  nodeId: string;
  relatedNodeIds: readonly string[];
  timestamp: number;
};

export type AutomationSafetyInput = {
  automationEnabled: boolean;
  studioHealthStatus: StudioHealthStatus;
};

/**
 * Individually gates one prediction, before any cross-decision conflict
 * resolution. Order matches the spec's own bullet order (confidence,
 * severity, operator opt-in, no-conflicts / studio-health) — the first
 * gate that fails determines the block reason, since a decision can only
 * carry one status. `settings` defaults to the Step 107 hardcoded
 * thresholds so every existing call site keeps its exact prior behavior;
 * Step 111 is what actually varies it.
 */
export function evaluateSafety(
  confidence: number,
  severityScore: number,
  input: AutomationSafetyInput,
  settings: AutonomySafetySettings = AUTOMATION_SAFETY_THRESHOLDS,
): AutomationDecisionStatus {
  if (confidence <= settings.minConfidence) return 'blockedByConfidence';
  if (severityScore >= settings.maxSeverity) return 'blockedBySeverity';
  if (!input.automationEnabled) return 'blockedByOperatorDisabled';
  if (input.studioHealthStatus !== 'stable') return 'blockedByStudioHealth';
  return 'wouldExecute';
}

const SUBSYSTEM_BY_CLUSTER: Partial<Record<FusionCluster, StudioSubsystem>> = {
  scene: 'scenes',
  graphics: 'graphics',
  audio: 'audio',
  routing: 'routing',
  output: 'outputHealth',
};

// ── Automation permissions (Step 111) ───────────────────────────────────────

/**
 * The seven named permission categories from the Step 111 spec. Every
 * one gets a real slot even though `replayTriggers`/`streamingRecovery`
 * can never actually gate anything today — no `AutomationActionType`
 * maps to either (no `replay`/`streaming` prediction category exists,
 * the same documented gap since Step 105) — kept for forward
 * compatibility and so the control panel can show all seven, not five.
 */
export type AutonomyPermissionKey =
  | 'sceneTransitions'
  | 'graphicsActivation'
  | 'audioMixing'
  | 'routingRecovery'
  | 'outputStabilization'
  | 'replayTriggers'
  | 'streamingRecovery';

export const AUTONOMY_PERMISSION_KEYS: readonly AutonomyPermissionKey[] = [
  'sceneTransitions',
  'graphicsActivation',
  'audioMixing',
  'routingRecovery',
  'outputStabilization',
  'replayTriggers',
  'streamingRecovery',
];

export type AutonomyPermissions = Record<AutonomyPermissionKey, boolean>;

export function defaultAutonomyPermissions(): AutonomyPermissions {
  return {
    sceneTransitions: true,
    graphicsActivation: true,
    audioMixing: true,
    routingRecovery: true,
    outputStabilization: true,
    replayTriggers: true,
    streamingRecovery: true,
  };
}

/** Which permission category gates each real action. `none` has no permission (nothing to gate). */
const ACTION_PERMISSION_KEY: Partial<Record<AutomationActionType, AutonomyPermissionKey>> = {
  triggerSceneTransition: 'sceneTransitions',
  activateGraphicsLayer: 'graphicsActivation',
  autoAdjustAudio: 'audioMixing',
  failoverRoute: 'routingRecovery',
  switchToBackupDestination: 'outputStabilization',
};

/**
 * Builds one `AutomationDecision` per candidate prediction, individually
 * safety-gated (before conflict resolution — see `resolveAutomationConflicts`).
 * `settings`/`permissions` default to Step 107's original always-on
 * behavior, so this remains fully backward compatible; Step 111's
 * control panel is the first real caller to vary them.
 *
 * `workspace`/`permissionsEngine` are Step 112's addition — the
 * Permissions Engine's role/workspace gate is checked *first* (the
 * spec's own order: role, then workspace, then Step 111's category
 * toggle, then safety), since "is this role, in this workspace, even
 * allowed to touch this category of action" is a more fundamental gate
 * than "is this specific prediction confident/safe enough right now".
 * `workspace` defaults to `null` (normalizes to `production`, the
 * broadest/most permissive bucket) and `permissionsEngine` defaults to
 * a fresh instance with its own default (fully permissive for
 * Director/production/automation) config, so this remains fully
 * backward compatible with every pre-Step-112 call site.
 */
export function buildAutomationDecisions(
  predictions: readonly Prediction[],
  fusedInsights: readonly FusedInsight[],
  role: GuidanceRole,
  input: AutomationSafetyInput,
  settings: AutonomySafetySettings = AUTOMATION_SAFETY_THRESHOLDS,
  permissions: AutonomyPermissions = defaultAutonomyPermissions(),
  workspace: string | null = null,
  permissionsEngine: PermissionsEngine = new PermissionsEngine(),
): AutomationDecision[] {
  const permissionWorkspace = normalizePermissionWorkspace(workspace);

  return predictions
    .map((prediction) => {
      const action = resolveAction(prediction.category);
      if (action === 'none') return null;

      const cluster = CATEGORY_CLUSTER[prediction.category];
      const severityScore = severityScoreForCluster(cluster, fusedInsights);

      const permissionKey = ACTION_PERMISSION_KEY[action];
      const categoryPermitted = !permissionKey || permissions[permissionKey];

      let status: AutomationDecisionStatus;
      if (!permissionsEngine.isRolePermitted(action, role)) {
        status = 'blockedByRole';
      } else if (!permissionsEngine.isWorkspacePermitted(action, permissionWorkspace)) {
        status = 'blockedByWorkspace';
      } else if (!categoryPermitted) {
        status = 'blockedByPermission';
      } else {
        status = evaluateSafety(prediction.confidence, severityScore, input, settings);
      }

      const decision: AutomationDecision = {
        id: `auto-decision-${prediction.id}`,
        predictionId: prediction.id,
        action,
        subsystem: SUBSYSTEM_BY_CLUSTER[cluster] ?? 'outputHealth',
        cluster,
        message: prediction.message,
        confidence: prediction.confidence,
        severityScore,
        status,
        role,
        nodeId: prediction.nodeId,
        relatedNodeIds: prediction.relatedNodeIds,
        timestamp: prediction.timestamp,
      };
      return decision;
    })
    .filter((d): d is AutomationDecision => d !== null);
}

// ── Automation conflict resolution ──────────────────────────────────────────

/**
 * Which studio subsystems each role treats as its own primary focus, for
 * the automation conflict tie-break's "operator role" factor. A small,
 * automation-specific table distinct from `ROLE_PANELS`/`ROLE_CLUSTERS` in
 * WIE 1.0/OGE (those drive *display* relevance; this drives which of two
 * *actions* the current operator would rather have fire).
 */
const ROLE_PRIMARY_SUBSYSTEMS: Record<GuidanceRole, readonly StudioSubsystem[]> = {
  Director: ['scenes', 'outputHealth'],
  'Technical Director': ['routing', 'outputHealth'],
  'Graphics Operator': ['graphics'],
  'Audio Engineer': ['audio'],
  'Replay Operator': ['replay'],
  'Streaming Operator': ['streaming', 'outputHealth'],
  'Solo Streamer': ['scenes', 'graphics', 'audio', 'outputHealth'],
  'Compact Operator': ['scenes', 'audio', 'outputHealth'],
};

function isRolePrimary(role: GuidanceRole, subsystem: StudioSubsystem): boolean {
  return ROLE_PRIMARY_SUBSYSTEMS[role].includes(subsystem);
}

/**
 * Inverse of `CATEGORY_CLUSTER`, for reconstructing a real, distinguishing
 * `PredictionCategory` per decision below. `predictionsConflict` treats
 * same-category predictions as *corroborating*, not conflicting — using a
 * single fixed placeholder category for every decision would make it
 * silently never detect a conflict at all.
 */
const CLUSTER_TO_CATEGORY: Partial<Record<FusionCluster, PredictionCategory>> = {
  scene: 'scene_transition',
  graphics: 'graphics_activation',
  audio: 'audio_clipping',
  output: 'output_degradation',
  routing: 'routing_failure',
};

/**
 * Reconstructs the minimal `Prediction`-shaped object `predictionsConflict`
 * (WIE 2.0, Step 105) needs from an `AutomationDecision` — conflict
 * *detection* stays WIE 2.0's, not re-derived here.
 */
function asConflictCandidate(decision: AutomationDecision): Prediction {
  return {
    id: decision.predictionId,
    category: CLUSTER_TO_CATEGORY[decision.cluster] ?? 'operator_action',
    message: decision.message,
    nodeId: decision.nodeId,
    confidence: decision.confidence,
    relatedNodeIds: [...decision.relatedNodeIds],
    timestamp: decision.timestamp,
    rule: 'studio-automation',
    factors: {
      temporalTrendWeight: 0,
      engineConfidence: 0,
      crossEngineAgreement: 0,
      operatorRelevance: 0,
      workspaceRelevance: 0,
      base: 0,
    },
  };
}

export type AutomationConflict = {
  winner: AutomationDecision;
  loser: AutomationDecision;
  reason: string;
};

/**
 * Which factor `pickAutomationWinner` checks *first* — Step 111's
 * "conflict resolution mode" safety setting. `severityFirst` is Step
 * 107's original, default order (severity, confidence, role, timestamp);
 * `confidenceFirst` and `roleFirst` promote that factor ahead of
 * severity while keeping the same remaining fallback chain. Studio
 * health is never a factor here regardless of mode — see the note below.
 */
export type ConflictResolutionMode = 'severityFirst' | 'confidenceFirst' | 'roleFirst';

export function defaultConflictResolutionMode(): ConflictResolutionMode {
  return 'severityFirst';
}

/**
 * Resolves conflicts among *already individually eligible*
 * (`wouldExecute`) decisions, per the spec's four-factor priority order:
 * severity (lower/safer wins), confidence (higher wins), operator role
 * (the role-primary subsystem wins), studio health. Studio health is not
 * a differentiator *within* this tie-break — every candidate reaching
 * conflict resolution already passed the same global
 * `blockedByStudioHealth` gate — so it is honestly omitted from the
 * per-pair comparison below rather than included as a no-op factor.
 * `mode` defaults to `severityFirst`, Step 107's original order, so
 * every existing call site keeps its exact prior behavior.
 */
export function resolveAutomationConflicts(
  decisions: readonly AutomationDecision[],
  role: GuidanceRole,
  mode: ConflictResolutionMode = 'severityFirst',
): { winners: AutomationDecision[]; superseded: AutomationDecision[]; conflicts: AutomationConflict[] } {
  const eligible = decisions.filter((d) => d.status === 'wouldExecute');
  const supersededIds = new Set<string>();
  const conflicts: AutomationConflict[] = [];

  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      const a = eligible[i]!;
      const b = eligible[j]!;
      if (supersededIds.has(a.id) && supersededIds.has(b.id)) continue;
      if (!predictionsConflict(asConflictCandidate(a), asConflictCandidate(b))) continue;

      const winner = pickAutomationWinner(a, b, role, mode);
      const loser = winner === a ? b : a;
      if (supersededIds.has(loser.id)) continue;

      supersededIds.add(loser.id);
      conflicts.push({
        winner,
        loser,
        reason: `${loser.action} superseded by ${winner.action} — severity ${loser.severityScore.toFixed(2)} vs ${winner.severityScore.toFixed(2)}, confidence ${Math.round(loser.confidence * 100)}% vs ${Math.round(winner.confidence * 100)}%`,
      });
    }
  }

  const winners: AutomationDecision[] = [];
  const superseded: AutomationDecision[] = [];
  for (const decision of decisions) {
    if (decision.status !== 'wouldExecute') continue;
    if (supersededIds.has(decision.id)) {
      superseded.push({ ...decision, status: 'supersededByConflict' });
    } else {
      winners.push(decision);
    }
  }
  return { winners, superseded, conflicts };
}

function severityRank(a: AutomationDecision, b: AutomationDecision): AutomationDecision | null {
  return a.severityScore === b.severityScore ? null : a.severityScore < b.severityScore ? a : b;
}

function confidenceRank(a: AutomationDecision, b: AutomationDecision): AutomationDecision | null {
  return a.confidence === b.confidence ? null : a.confidence > b.confidence ? a : b;
}

function roleRank(a: AutomationDecision, b: AutomationDecision, role: GuidanceRole): AutomationDecision | null {
  const aPrimary = isRolePrimary(role, a.subsystem);
  const bPrimary = isRolePrimary(role, b.subsystem);
  return aPrimary === bPrimary ? null : aPrimary ? a : b;
}

function pickAutomationWinner(
  a: AutomationDecision,
  b: AutomationDecision,
  role: GuidanceRole,
  mode: ConflictResolutionMode,
): AutomationDecision {
  const chain =
    mode === 'confidenceFirst'
      ? [confidenceRank, severityRank, (x: AutomationDecision, y: AutomationDecision) => roleRank(x, y, role)]
      : mode === 'roleFirst'
        ? [(x: AutomationDecision, y: AutomationDecision) => roleRank(x, y, role), severityRank, confidenceRank]
        : [severityRank, confidenceRank, (x: AutomationDecision, y: AutomationDecision) => roleRank(x, y, role)];

  for (const rank of chain) {
    const winner = rank(a, b);
    if (winner) return winner;
  }
  // Deterministic tie-break — earlier timestamp wins.
  return a.timestamp <= b.timestamp ? a : b;
}

// ── Cross-workspace automation ──────────────────────────────────────────────

export type AutomationSyncBatch = {
  id: string;
  decisions: readonly AutomationDecision[];
  subsystems: readonly StudioSubsystem[];
  timestamp: number;
};

const SYNC_WINDOW_MS = 4000;

/**
 * Groups non-conflicting, simultaneously-eligible decisions across
 * *different* subsystems into batches that would fire together, per the
 * spec's example: a predicted scene transition, a graphics activation,
 * and an audio adjustment executing in sync. Decisions that already
 * conflicted with each other never reach this function together (only
 * one of them is a `winner`), so every batch member is guaranteed to
 * target a distinct subsystem.
 */
export function groupIntoSyncBatches(winners: readonly AutomationDecision[]): AutomationSyncBatch[] {
  const sorted = [...winners].sort((a, b) => a.timestamp - b.timestamp);
  const batches: AutomationSyncBatch[] = [];
  const used = new Set<string>();

  for (let i = 0; i < sorted.length; i += 1) {
    const seed = sorted[i]!;
    if (used.has(seed.id)) continue;
    const members = [seed];
    used.add(seed.id);

    for (let j = i + 1; j < sorted.length; j += 1) {
      const candidate = sorted[j]!;
      if (used.has(candidate.id)) continue;
      if (candidate.timestamp - seed.timestamp > SYNC_WINDOW_MS) break;
      if (members.some((m) => m.subsystem === candidate.subsystem)) continue;
      members.push(candidate);
      used.add(candidate.id);
    }

    if (members.length > 1) {
      batches.push({
        id: `sync-batch-${seed.id}`,
        decisions: members,
        subsystems: members.map((m) => m.subsystem),
        timestamp: seed.timestamp,
      });
    }
  }
  return batches;
}

// ── Automation timeline ─────────────────────────────────────────────────────

export type AutomationTimelineEntryKind = 'predicted' | 'wouldExecute' | 'blocked' | 'conflict' | 'overridden';

export type AutomationTimelineEntry = {
  id: string;
  kind: AutomationTimelineEntryKind;
  action: AutomationActionType;
  message: string;
  confidence: number;
  timestamp: number;
};

function statusToTimelineKind(status: AutomationDecisionStatus): AutomationTimelineEntryKind {
  switch (status) {
    case 'wouldExecute':
      return 'wouldExecute';
    case 'supersededByConflict':
      return 'conflict';
    case 'overridden':
      return 'overridden';
    default:
      return 'blocked';
  }
}

/**
 * Timeline of predicted automations, would-execute automations, blocked
 * automations, conflicts, and operator overrides — the five sources named
 * in the spec's Automation Timeline section, newest first.
 */
export function buildAutomationTimeline(
  decisions: readonly AutomationDecision[],
  conflicts: readonly AutomationConflict[],
  limit = 10,
): AutomationTimelineEntry[] {
  const entries: AutomationTimelineEntry[] = [
    ...decisions.map((decision) => ({
      id: `auto-timeline-${decision.id}`,
      kind: statusToTimelineKind(decision.status),
      action: decision.action,
      message: decision.message,
      confidence: decision.confidence,
      timestamp: decision.timestamp,
    })),
    ...conflicts.map((conflict) => ({
      id: `auto-conflict-${conflict.loser.id}`,
      kind: 'conflict' as const,
      action: conflict.loser.action,
      message: `${conflict.loser.action} conflicted with ${conflict.winner.action} — ${conflict.winner.action} wins`,
      confidence: conflict.loser.confidence,
      timestamp: conflict.loser.timestamp,
    })),
  ];

  return entries
    .sort((a, b) => b.timestamp - a.timestamp || b.confidence - a.confidence)
    .slice(0, limit);
}

// ── Automation HUD integration (Step 104's existing 'automation' kind) ─────

/** Minimal shape HUD 2.0's `HudTimelineEntry` (Step 104) already expects. */
export type HudCompatibleTimelineEntry = {
  id: string;
  kind: 'automation';
  message: string;
  confidence: number;
  timestamp: number;
};

/**
 * Shapes automation decisions for HUD 2.0's *existing* Timeline zone —
 * Step 104 already has an `'automation'` timeline kind (sourced from
 * `getAutomationTriggers()`); this reuses that exact kind rather than
 * adding a fifth HUD zone or a new kind, so "upcoming automations" and
 * "would-execute automations" simply show up alongside the automation
 * entries HUD 2.0 already renders. Only `wouldExecute` and
 * `supersededByConflict` decisions surface here — a decision blocked by a
 * routine gate (low confidence, automation disabled) is not
 * operator-actionable HUD content, it is diagnostic detail (available via
 * `getResult().decisions` for Inspector 2.0-style deep views).
 */
export function toHudTimelineEntries(decisions: readonly AutomationDecision[]): HudCompatibleTimelineEntry[] {
  return decisions
    .filter((d) => d.status === 'wouldExecute' || d.status === 'supersededByConflict')
    .map((decision) => ({
      id: `hud-${decision.id}`,
      kind: 'automation' as const,
      message:
        decision.status === 'wouldExecute'
          ? `Automation ready: ${decision.action} (${decision.message})`
          : `Automation superseded: ${decision.action} (${decision.message})`,
      confidence: decision.confidence,
      timestamp: decision.timestamp,
    }));
}

// ── Confidence fusion + decay (Step 113 — ACE) ──────────────────────────────

/**
 * Per-decision output of the Autonomous Confidence Engine — the data
 * behind Step 113's "confidence visualization" (ASMCP Logs/Timeline,
 * see `autonomyControlPanel.ts`) and the input to the decay gate below.
 */
export type ConfidenceBreakdown = {
  decisionId: string;
  /** The prediction's own confidence, unmodified — what every pre-Step-113 caller already sees. */
  rawConfidence: number;
  /** `rawConfidence` fused (safety-aware) with this tick's system health and CSE historical stability. */
  fusedConfidence: number;
  /** `fusedConfidence` after decay for how long this decision has existed. */
  effectiveConfidence: number;
  ageSeconds: number;
  meetsActThreshold: boolean;
};

/**
 * Builds ACE's confidence signals for one decision and fuses/decays them.
 * Exported standalone (not a private method) so it is directly unit
 * testable without a live `UBOSIntelligenceGraph`. `historicalStability`
 * is CSE's own `stabilityScore()` (Step 84, `confidenceScoringEngine.ts`)
 * — reused directly, not re-derived — passed in rather than computed
 * here to keep this function graph-free like the rest of the module.
 */
export function computeConfidenceBreakdown(
  decision: AutomationDecision,
  fusedInsights: readonly FusedInsight[],
  confidenceEngine: AutonomousConfidenceEngine,
  historicalStability: number,
  now: number = Date.now(),
): ConfidenceBreakdown {
  const signals: ConfidenceSignals = {
    prediction: decision.confidence,
    historicalStability: clamp01(historicalStability),
  };

  const clusterInsight = fusedInsights.find((insight) => insight.cluster === decision.cluster);
  if (clusterInsight) {
    // Healthier subsystem (lower severity) → a stronger corroborating confidence signal.
    signals.systemHealth = clamp01(1 - fusedInsightSeverityScore(clusterInsight));
  }

  const fusedConfidence = confidenceEngine.fuse(signals, 'safetyAware');
  const ageSeconds = Math.max(0, (now - decision.timestamp) / 1000);
  const effectiveConfidence = confidenceEngine.decay(fusedConfidence, ageSeconds);

  return {
    decisionId: decision.id,
    rawConfidence: decision.confidence,
    fusedConfidence,
    effectiveConfidence,
    ageSeconds,
    meetsActThreshold: confidenceEngine.meetsThreshold(effectiveConfidence, 'toAct'),
  };
}

// ── The orchestrator ────────────────────────────────────────────────────────

export type StudioAutomationResult = {
  role: GuidanceRole;
  automationEnabled: boolean;
  studioHealthStatus: StudioHealthStatus;
  decisions: AutomationDecision[];
  winners: AutomationDecision[];
  conflicts: AutomationConflict[];
  syncBatches: AutomationSyncBatch[];
  timeline: AutomationTimelineEntry[];
  /** Step 111 — the exact configuration this tick's decisions were computed under. */
  safetySettings: AutonomySafetySettings;
  permissions: AutonomyPermissions;
  conflictResolutionMode: ConflictResolutionMode;
  /** Step 112 — the normalized workspace APE's role/workspace gate evaluated this tick against. */
  permissionWorkspace: PermissionWorkspaceKey;
  /** Step 113 — one ACE breakdown per decision, same order as `decisions`. */
  confidenceBreakdowns: ConfidenceBreakdown[];
  timestamp: number;
};

function emptyResult(): StudioAutomationResult {
  return {
    role: 'Director',
    automationEnabled: false,
    studioHealthStatus: 'unknown',
    decisions: [],
    winners: [],
    conflicts: [],
    syncBatches: [],
    timeline: [],
    safetySettings: defaultAutonomySafetySettings(),
    permissions: defaultAutonomyPermissions(),
    conflictResolutionMode: defaultConflictResolutionMode(),
    permissionWorkspace: 'production',
    confidenceBreakdowns: [],
    timestamp: 0,
  };
}

/**
 * Studio Automation 1.0 (Step 107). Constructor shape matches every other
 * engine on `UBOSIntelligenceGraph` — reads Studio Intelligence 1.0's
 * cached result (`graph.getStudioIntelligence()`) and the live fused
 * insights, exactly like Studio Intelligence reads WIE 2.0's cached
 * result rather than recomputing it.
 *
 * `automationEnabled` defaults to `false` — autonomous execution is
 * opt-in only, per "operator has enabled automation" being a hard safety
 * gate, and per "do not expose unsupported controls": no operator-facing
 * toggle for this capability exists yet, so the safe default is off.
 */
export class StudioAutomation {
  private readonly graph: UBOSIntelligenceGraph;
  private result: StudioAutomationResult = emptyResult();
  private automationEnabled = false;
  private readonly overriddenPredictionIds = new Set<string>();
  private safetySettings: AutonomySafetySettings = defaultAutonomySafetySettings();
  private permissions: AutonomyPermissions = defaultAutonomyPermissions();
  private conflictResolutionMode: ConflictResolutionMode = defaultConflictResolutionMode();
  /** Step 112 — the gatekeeper. See `permissionsEngine.ts`. */
  private readonly permissionsEngine = new PermissionsEngine();
  /** Step 113 — the mathematical backbone. See `autonomousConfidenceEngine.ts`. */
  private readonly confidenceEngine = new AutonomousConfidenceEngine();

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  /** Step 112 — exposes the gatekeeper for direct configuration (role/workspace matrices, action rules). */
  getPermissionsEngine(): PermissionsEngine {
    return this.permissionsEngine;
  }

  /** Step 113 — exposes ACE for direct configuration (fusion weights, decay rate, named thresholds). */
  getConfidenceEngine(): AutonomousConfidenceEngine {
    return this.confidenceEngine;
  }

  setAutomationEnabled(enabled: boolean): void {
    this.automationEnabled = enabled;
  }

  isAutomationEnabled(): boolean {
    return this.automationEnabled;
  }

  /** Step 111 — operator-configurable confidence/severity thresholds, merged over the current settings. */
  setSafetySettings(partial: Partial<AutonomySafetySettings>): void {
    this.safetySettings = { ...this.safetySettings, ...partial };
  }

  getSafetySettings(): AutonomySafetySettings {
    return this.safetySettings;
  }

  /** Step 111 — per-category autonomy permissions, merged over the current permissions. */
  setPermissions(partial: Partial<AutonomyPermissions>): void {
    this.permissions = { ...this.permissions, ...partial };
  }

  getPermissions(): AutonomyPermissions {
    return this.permissions;
  }

  setConflictResolutionMode(mode: ConflictResolutionMode): void {
    this.conflictResolutionMode = mode;
  }

  getConflictResolutionMode(): ConflictResolutionMode {
    return this.conflictResolutionMode;
  }

  /**
   * Operator override — marks a specific in-flight prediction's
   * automation decision as overridden on the *next* `compute()` call.
   * Exposed for a future HUD "cancel this automation" control; nothing
   * in this step wires a UI button to it yet (see module doc).
   */
  overrideDecision(predictionId: string): void {
    this.overriddenPredictionIds.add(predictionId);
  }

  clearOverride(predictionId: string): void {
    this.overriddenPredictionIds.delete(predictionId);
  }

  compute(): StudioAutomationResult {
    const studio = this.graph.getStudioIntelligence();
    const fusedInsights = this.graph.getFusedInsights();

    const safetyInput: AutomationSafetyInput = {
      automationEnabled: this.automationEnabled,
      studioHealthStatus: studio.studioHealth.status,
    };

    const permissionWorkspace = normalizePermissionWorkspace(studio.workspace);
    let decisions = buildAutomationDecisions(
      studio.studioPredictions,
      fusedInsights,
      studio.role,
      safetyInput,
      this.safetySettings,
      this.permissions,
      studio.workspace,
      this.permissionsEngine,
    );
    decisions = decisions.map((decision) =>
      this.overriddenPredictionIds.has(decision.predictionId)
        ? { ...decision, status: 'overridden' as const }
        : decision,
    );

    // Step 113 — ACE fuses each still-eligible decision's confidence with
    // this tick's system health and CSE's historical stability, then
    // decays it by how long the decision has existed, demoting any
    // decision whose *effective* confidence has fallen below the "act"
    // threshold since it was built. Applied before conflict resolution
    // so a now-stale decision can never win a conflict it is already too
    // stale to execute on its own.
    const historicalStability = this.graph.confidenceEngine.stabilityScore();
    const confidenceBreakdowns = decisions.map((decision) =>
      computeConfidenceBreakdown(decision, fusedInsights, this.confidenceEngine, historicalStability),
    );
    decisions = decisions.map((decision, index) => {
      const breakdown = confidenceBreakdowns[index]!;
      return decision.status === 'wouldExecute' && !breakdown.meetsActThreshold
        ? { ...decision, status: 'blockedByConfidenceDecay' as const }
        : decision;
    });

    const { winners, superseded, conflicts } = resolveAutomationConflicts(
      decisions,
      studio.role,
      this.conflictResolutionMode,
    );
    const decisionsWithSupersession = decisions.map(
      (decision) => superseded.find((s) => s.id === decision.id) ?? decision,
    );

    this.result = {
      role: studio.role,
      automationEnabled: this.automationEnabled,
      studioHealthStatus: studio.studioHealth.status,
      decisions: decisionsWithSupersession,
      winners,
      conflicts,
      syncBatches: groupIntoSyncBatches(winners),
      timeline: buildAutomationTimeline(decisionsWithSupersession, conflicts),
      safetySettings: this.safetySettings,
      permissions: this.permissions,
      conflictResolutionMode: this.conflictResolutionMode,
      permissionWorkspace,
      confidenceBreakdowns,
      timestamp: Date.now(),
    };
    return this.result;
  }

  getResult(): StudioAutomationResult {
    return this.result;
  }

  reset(): void {
    this.result = emptyResult();
    this.overriddenPredictionIds.clear();
    this.permissionsEngine.reset();
    this.confidenceEngine.reset();
    this.safetySettings = defaultAutonomySafetySettings();
    this.permissions = defaultAutonomyPermissions();
    this.conflictResolutionMode = defaultConflictResolutionMode();
  }
}
