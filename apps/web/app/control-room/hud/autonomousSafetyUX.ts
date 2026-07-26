/**
 * Autonomous Studio Mode Safety UX — Step 110.
 *
 * The visual and behavioral safety layer that activates whenever Studio
 * Automation is running: safety overlays, conflict warnings, fallback
 * visuals, override prompts, stabilization indicators, and risk
 * visualization. Ensures autonomy stays safe, predictable, reversible,
 * and operator-controlled.
 *
 * ── Powered by Studio Automation 1.0, not "2.0" ──────────────────────
 * Same honesty note as Step 109: the spec names "Studio Automation 2.0",
 * which does not exist in this repository. This module is built against
 * Studio Automation 1.0's real `StudioAutomationResult` (Step 107) and
 * Step 109's `AutonomousStudioModeResult`.
 *
 * ── Every signal is real, nothing is fabricated ──────────────────────
 *   - Conflict warnings come straight from `StudioAutomationResult.conflicts`
 *     (Step 107's own conflict resolution — this module does not
 *     re-resolve anything).
 *   - "Override prompts" are decisions Step 107 already blocked
 *     (`buildAutomationDecisions`/`evaluateSafety`) that are additionally
 *     high-severity, low-confidence, part of a conflict, or an
 *     output-degradation risk — i.e. cases a human should look at
 *     *because* automation would not act, not a new "awaiting approval"
 *     state Step 107 never modeled.
 *   - "Fallback" is Step 109's own `handedBack` handoff event
 *     (autonomy stepping back to disabled) — not a distinct runtime mode
 *     Step 107 tracks separately. There is only one way automation
 *     becomes disabled today (`StudioAutomation.setAutomationEnabled(false)`,
 *     not wired to any operator control yet), so `reason` is
 *     necessarily generic until a future step distinguishes *why*.
 *   - Stabilization indicators read Studio Intelligence 1.0's real
 *     per-dimension health (Step 106) — `replay`/`streaming` correctly
 *     stay `'none'` (no glow) since those dimensions have no data
 *     source today (the same documented gap as Steps 106/107).
 *
 * ── UBDS reuse, without a runtime `@ubos/ui` dependency ──────────────
 * Pure logic; mirrors `UbosElevationLevel` via `autonomousStudioMode.ts`
 * (Step 109) rather than re-mirroring a third time. Only the `.tsx`
 * component layer (`AutonomousSafetyOverlay.tsx`,
 * `AutonomousConflictWarning.tsx`, `AutonomousOverridePrompt.tsx`)
 * imports `@ubos/ui` for the real color/typography values.
 */
import type {
  StudioAutomationResult,
  AutomationConflict,
  AutomationDecision,
  AutomationActionType,
} from '../intelligence-graph/studioAutomation.js';
import { AUTOMATION_SAFETY_THRESHOLDS } from '../intelligence-graph/studioAutomation.js';
import type { FusionCluster } from '../intelligence-graph/insightFusionEngine.js';
import {
  scoreSeverityBand,
  SEVERITY_IMPLICATIONS,
  type SeverityBand,
  type MotionIntensity,
} from '../intelligence-graph/workspaceIntelligenceEngine2.js';
import type {
  StudioHealth,
  StudioHealthDimension,
  StudioHealthStatus,
} from '../intelligence-graph/studioIntelligence.js';
import type { AutonomousStudioModeResult, UbosElevationLevel } from './autonomousStudioMode.js';

// ── 1. Autonomous Safety Overlay ────────────────────────────────────────────

export type VignetteIntensity = 'none' | 'subtle' | 'strong';

export type SafetyOverlayState = {
  active: boolean;
  vignetteIntensity: VignetteIntensity;
  glow: boolean;
};

/**
 * The overlay appears whenever autonomy is active (`active`/`recovering`
 * — Step 109's non-`disabled` states), with a stronger vignette while
 * recovering from a conflict, per "increased depth" communicating higher
 * priority during recovery.
 */
export function resolveSafetyOverlay(autonomous: AutonomousStudioModeResult): SafetyOverlayState {
  const active = autonomous.mode !== 'disabled';
  return {
    active,
    vignetteIntensity: !active ? 'none' : autonomous.mode === 'recovering' ? 'strong' : 'subtle',
    glow: active,
  };
}

// ── 2. Autonomous Conflict Warning Layer ────────────────────────────────────

export type ConflictWarningType =
  | 'scene-vs-graphics'
  | 'graphics-vs-audio'
  | 'routing-vs-output'
  | 'replay-vs-program'
  | 'streaming-vs-routing'
  | 'other';

/**
 * The five named conflict types from the spec, as unordered cluster
 * pairs. `replay`/`streaming` have no dedicated `FusionCluster` today
 * (the same gap Steps 105-107 already document), so
 * `replay-vs-program`/`streaming-vs-routing` can never actually be
 * produced by a real conflict yet — kept in the table for forward
 * compatibility rather than omitted, since the spec names them
 * explicitly.
 */
const CONFLICT_TYPE_BY_CLUSTER_PAIR: Readonly<Record<string, ConflictWarningType>> = {
  'graphics,scene': 'scene-vs-graphics',
  'audio,graphics': 'graphics-vs-audio',
  'output,routing': 'routing-vs-output',
};

function clusterPairKey(a: FusionCluster, b: FusionCluster): string {
  return [a, b].sort().join(',');
}

export function describeConflictType(clusterA: FusionCluster, clusterB: FusionCluster): ConflictWarningType {
  return CONFLICT_TYPE_BY_CLUSTER_PAIR[clusterPairKey(clusterA, clusterB)] ?? 'other';
}

export type ConflictWarning = {
  id: string;
  type: ConflictWarningType;
  severityScore: number;
  confidence: number;
  recommendedAction: AutomationActionType;
  message: string;
  timestamp: number;
};

/** Straight from Step 107's own conflict resolution — no re-resolution here. */
export function buildConflictWarnings(automation: StudioAutomationResult): ConflictWarning[] {
  return automation.conflicts.map((conflict: AutomationConflict) => ({
    id: `conflict-warning-${conflict.loser.id}`,
    type: describeConflictType(conflict.winner.cluster, conflict.loser.cluster),
    severityScore: conflict.loser.severityScore,
    confidence: conflict.loser.confidence,
    recommendedAction: conflict.winner.action,
    message: conflict.reason,
    timestamp: conflict.loser.timestamp,
  }));
}

// ── 3. Autonomous Fallback Visuals ──────────────────────────────────────────

export type FallbackVisualState = {
  inFallback: boolean;
  reason: string | null;
};

const FALLBACK_REASON = 'Automation stepped back — control returned to the operator. Studio is stabilizing.';

/**
 * "Fallback" is the tick where Step 109 reports a `handedBack` handoff —
 * autonomy just stepped back to `disabled`. Not a distinct runtime mode
 * of its own; there is exactly one way automation becomes disabled
 * today, so `reason` stays generic until a future step distinguishes why
 * (operator-initiated vs. a safety trip, once one exists).
 */
export function resolveFallback(autonomous: AutonomousStudioModeResult): FallbackVisualState {
  const inFallback = autonomous.mode === 'disabled' && autonomous.handoffEvent === 'handedBack';
  return { inFallback, reason: inFallback ? FALLBACK_REASON : null };
}

// ── 4. Autonomous Override Prompts ──────────────────────────────────────────

export type OverridePromptReason =
  | 'highSeverity'
  | 'lowConfidence'
  | 'multiWorkspaceConflict'
  | 'outputDegradationRisk';

/** Below the auto-execute confidence floor but still worth a human decision — distinct from, and lower than, Step 107's own 0.85 auto-execute bar. */
const LOW_CONFIDENCE_THRESHOLD = 0.5;

/**
 * Which of the spec's four override-prompt categories a blocked decision
 * qualifies for. `highSeverity` reuses Step 107's own
 * `AUTOMATION_SAFETY_THRESHOLDS.maxSeverity` (the same bar that blocked
 * it from auto-executing in the first place).
 */
export function overridePromptReasons(
  decision: AutomationDecision,
  conflictLoserIds: ReadonlySet<string>,
): OverridePromptReason[] {
  const reasons: OverridePromptReason[] = [];
  if (decision.severityScore >= AUTOMATION_SAFETY_THRESHOLDS.maxSeverity) reasons.push('highSeverity');
  if (decision.confidence < LOW_CONFIDENCE_THRESHOLD) reasons.push('lowConfidence');
  if (conflictLoserIds.has(decision.id)) reasons.push('multiWorkspaceConflict');
  if (decision.action === 'switchToBackupDestination') reasons.push('outputDegradationRisk');
  return reasons;
}

export type OverridePrompt = {
  id: string;
  reasons: readonly OverridePromptReason[];
  action: AutomationActionType;
  message: string;
  severityScore: number;
  confidence: number;
  timestamp: number;
};

/**
 * Prompts come only from decisions automation did *not* execute
 * (`wouldExecute`/`overridden` are excluded — those either already ran
 * or were already handled) that additionally match at least one of the
 * spec's four reasons.
 *
 * Returns nothing while automation is disabled entirely: "override
 * prompt" only means something in contrast to autonomy actually
 * considering an action — every decision is trivially "blocked" when the
 * operator has not opted in yet (`blockedByOperatorDisabled`), and
 * surfacing those as if they needed a real override decision would be
 * misleading, not helpful.
 */
export function buildOverridePrompts(automation: StudioAutomationResult): OverridePrompt[] {
  if (!automation.automationEnabled) return [];

  const conflictLoserIds = new Set(automation.conflicts.map((c) => c.loser.id));
  const prompts: OverridePrompt[] = [];

  for (const decision of automation.decisions) {
    if (decision.status === 'wouldExecute' || decision.status === 'overridden') continue;
    const reasons = overridePromptReasons(decision, conflictLoserIds);
    if (reasons.length === 0) continue;
    prompts.push({
      id: `override-${decision.id}`,
      reasons,
      action: decision.action,
      message: decision.message,
      severityScore: decision.severityScore,
      confidence: decision.confidence,
      timestamp: decision.timestamp,
    });
  }

  return prompts.sort((a, b) => b.timestamp - a.timestamp || b.severityScore - a.severityScore);
}

// ── 5. Autonomous Stabilization Indicators ──────────────────────────────────

export type StabilizerGlow = 'stabilizing' | 'recovering' | 'critical' | 'none';

export type StabilizerIndicator = {
  dimension: StudioHealthDimension;
  glow: StabilizerGlow;
};

/** The four named subsystems from the spec, in that exact order. */
export const STABILIZER_DIMENSIONS: readonly StudioHealthDimension[] = ['routing', 'audio', 'output', 'graphics'];

/** "soft blue glow (stabilizing), yellow pulse (recovering), red pulse (critical)" — per the spec exactly. */
export function stabilizerGlowForStatus(status: StudioHealthStatus): StabilizerGlow {
  switch (status) {
    case 'stable':
      return 'stabilizing';
    case 'warning':
    case 'unstable':
      return 'recovering';
    case 'critical':
      return 'critical';
    case 'unknown':
    default:
      return 'none';
  }
}

export function resolveStabilizerIndicators(studioHealth: StudioHealth): StabilizerIndicator[] {
  return STABILIZER_DIMENSIONS.map((dimension) => {
    const dimensionResult = studioHealth.dimensions.find((d) => d.dimension === dimension);
    return {
      dimension,
      glow: dimensionResult ? stabilizerGlowForStatus(dimensionResult.status) : 'none',
    };
  });
}

// ── 6. Autonomous Risk Visualization ────────────────────────────────────────

export type GradientStrength = 'flat' | 'linear' | 'radialHighlight' | 'critical';

/** Mirrors the Step 94/95 elevation→gradient-shape pairing, keyed by severity band instead of elevation level directly. */
const GRADIENT_STRENGTH_BY_BAND: Record<SeverityBand, GradientStrength> = {
  informational: 'flat',
  low: 'flat',
  medium: 'linear',
  high: 'radialHighlight',
  critical: 'critical',
};

export type RiskVisual = {
  severityBand: SeverityBand;
  /** How opaque the risk indicator should render — higher confidence, more solid. Clamped so nothing goes fully invisible. */
  confidenceOpacity: number;
  motionIntensity: MotionIntensity;
  elevation: UbosElevationLevel;
  gradientStrength: GradientStrength;
};

/**
 * Composes WIE 2.0's own severity banding/implications (Step 105) with a
 * confidence-driven opacity — reuse, not a parallel scoring system.
 */
export function riskVisualization(severityScore: number, confidence: number): RiskVisual {
  const band = scoreSeverityBand(severityScore);
  const implication = SEVERITY_IMPLICATIONS[band];
  return {
    severityBand: band,
    confidenceOpacity: Math.max(0.15, Math.min(1, confidence)),
    motionIntensity: implication.motionIntensity,
    elevation: implication.elevation,
    gradientStrength: GRADIENT_STRENGTH_BY_BAND[band],
  };
}

// ── The orchestrator ────────────────────────────────────────────────────────

export type AutonomousSafetyUXResult = {
  overlay: SafetyOverlayState;
  conflictWarnings: ConflictWarning[];
  fallback: FallbackVisualState;
  overridePrompts: OverridePrompt[];
  stabilizers: StabilizerIndicator[];
  timestamp: number;
};

function emptyResult(): AutonomousSafetyUXResult {
  return {
    overlay: { active: false, vignetteIntensity: 'none', glow: false },
    conflictWarnings: [],
    fallback: { inFallback: false, reason: null },
    overridePrompts: [],
    stabilizers: STABILIZER_DIMENSIONS.map((dimension) => ({ dimension, glow: 'none' as const })),
    timestamp: 0,
  };
}

/**
 * Stateful, memoized by object identity (same rationale as
 * `AutonomousStudioModeController`, Step 109) so multiple HUD readers
 * within one tick never recompute redundantly.
 */
export class AutonomousSafetyUXController {
  private result: AutonomousSafetyUXResult = emptyResult();
  private lastProcessedAutomation: StudioAutomationResult | null = null;

  compute(
    automation: StudioAutomationResult,
    autonomous: AutonomousStudioModeResult,
    studioHealth: StudioHealth,
  ): AutonomousSafetyUXResult {
    if (this.lastProcessedAutomation === automation) {
      return this.result;
    }

    this.result = {
      overlay: resolveSafetyOverlay(autonomous),
      conflictWarnings: buildConflictWarnings(automation),
      fallback: resolveFallback(autonomous),
      overridePrompts: buildOverridePrompts(automation),
      stabilizers: resolveStabilizerIndicators(studioHealth),
      timestamp: Date.now(),
    };
    this.lastProcessedAutomation = automation;
    return this.result;
  }

  getResult(): AutonomousSafetyUXResult {
    return this.result;
  }

  reset(): void {
    this.result = emptyResult();
    this.lastProcessedAutomation = null;
  }
}

export const autonomousSafetyUXController = new AutonomousSafetyUXController();
