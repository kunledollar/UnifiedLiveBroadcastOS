/**
 * Autonomous Studio Mode UX (Step 109).
 *
 * Governs how UBOS looks, behaves, and communicates while Studio
 * Automation is active: workspace transitions, HUD behavior, theme
 * shifts, panel elevation, motion intensity, and operator handoff.
 *
 * ── Powered by Studio Automation 1.0, not "2.0" ──────────────────────
 * The Step 109 spec names "Studio Automation 2.0" as a power source.
 * This repository has not implemented a Studio Automation 2.0 — the
 * automation engine actually present is Studio Automation 1.0 (Step 107,
 * `../intelligence-graph/studioAutomation.ts`), which is decision-only
 * (see that file's module doc). This module is built against Studio
 * Automation 1.0's real `StudioAutomationResult`, not a fictitious 2.0
 * API, per "never fake success" / "evidence first".
 *
 * ── Data-grounded mode states, not fabricated ones ───────────────────
 * The spec asks for autonomy to be "felt" through workspace transitions,
 * HUD messaging, theme shifts, and operator handoff — but every state
 * this module names is derived from a real field on
 * `StudioAutomationResult` (`automationEnabled`, `winners`, `conflicts`,
 * `decisions`), not invented. There is deliberately no "awaiting
 * operator approval" state, for example — Step 107 has no concept of a
 * decision that pauses for confirmation, so this module does not
 * pretend one exists.
 *
 * ── UBDS reuse, without a runtime `@ubos/ui` dependency ──────────────
 * The authoritative elevation/motion *values* live in `@ubos/ui`'s
 * `tokens/autonomousMode.ts` (Step 109's UBDS addition) — this module
 * mirrors the same small lookup tables locally rather than importing
 * `@ubos/ui`, exactly like every other pure `intelligence-graph`/`hud`
 * decision module in this codebase (`workspaceIntelligenceEngine2.ts`'s
 * `ThemeModifierId`, `studioIntelligence.ts`'s `StudioMotionPrimitive`,
 * etc.) — pure logic files stay framework/package-free so they can run
 * under the plain `node:test` runner; only the `.tsx` component layer
 * (`AutonomousModeBanner.tsx`) imports `@ubos/ui` directly for the real
 * CSS/color values. `UbosElevationLevel` is mirrored as the same
 * `0 | 1 | 2 | 3 | 4` union `@ubos/ui`'s `elevation.ts` defines.
 */
import type {
  StudioAutomationResult,
  AutomationActionType,
  AutomationDecision,
} from '../intelligence-graph/studioAutomation';

/** Mirrors `AutonomousActionCategory` from `@ubos/ui`'s `tokens/autonomousMode.ts`. */
export type AutonomousActionCategory = 'transition' | 'graphics' | 'audio' | 'routing' | 'output';

/** Mirrors `UbosElevationLevel` from `@ubos/ui`'s `tokens/elevation.ts`. */
export type UbosElevationLevel = 0 | 1 | 2 | 3 | 4;

/** Mirrors `autonomousElevationMap` from `@ubos/ui`'s `tokens/autonomousMode.ts` exactly. */
export const autonomousElevationMap: Record<AutonomousActionCategory, UbosElevationLevel> = {
  transition: 3,
  graphics: 3,
  audio: 3,
  routing: 4,
  output: 4,
};

/** Mirrors `AutonomousMotionToken` from `@ubos/ui`'s `tokens/autonomousMode.ts`. */
export type AutonomousMotionToken = 'autoPulse' | 'autoGlow' | 'autoShake' | 'autoFade';

/**
 * Mirrors `autonomousMotionSystem` from `@ubos/ui`'s `tokens/autonomousMode.ts`
 * exactly (same keyframe names, same durations/curves) — kept here as
 * plain string labels this module can reason about without depending on
 * the design-system package; the *real* CSS class/animation application
 * happens in the `.tsx` layer, which imports the canonical
 * `autonomousMotionSystem` from `@ubos/ui` for the actual animation
 * shorthand values.
 */
export const autonomousMotionLabels: readonly AutonomousMotionToken[] = [
  'autoPulse',
  'autoGlow',
  'autoShake',
  'autoFade',
];

// ── Autonomous mode state ───────────────────────────────────────────────────

export type AutonomousModeState = 'disabled' | 'idle' | 'active' | 'recovering';

/**
 * Resolves the current autonomous mode straight from Studio Automation
 * 1.0's real output:
 *   - `disabled` — the operator has not enabled automation.
 *   - `recovering` — automation just resolved a conflict between two
 *     eligible decisions (Step 107's `conflicts`).
 *   - `active` — at least one decision is currently eligible to execute
 *     (`winners`).
 *   - `idle` — automation is enabled, nothing is in conflict, and
 *     nothing is currently eligible.
 */
export function resolveAutonomousMode(automation: StudioAutomationResult): AutonomousModeState {
  if (!automation.automationEnabled) return 'disabled';
  if (automation.conflicts.length > 0) return 'recovering';
  if (automation.winners.length > 0) return 'active';
  return 'idle';
}

// ── Autonomous motion physics ───────────────────────────────────────────────

/**
 * Maps the resolved mode onto the Step 109 UBDS motion tokens:
 * `autoGlow` while an action is actively eligible, `autoShake` while
 * recovering from a conflict, `autoPulse` while idle but with at least
 * one predicted (not-yet-eligible) decision on the board, `autoFade`
 * while disabled (autonomy has stepped back).
 */
export function autonomousMotionForMode(mode: AutonomousModeState, hasPendingDecisions: boolean): AutonomousMotionToken[] {
  switch (mode) {
    case 'active':
      return ['autoGlow'];
    case 'recovering':
      return ['autoShake'];
    case 'idle':
      return hasPendingDecisions ? ['autoPulse'] : [];
    case 'disabled':
      return ['autoFade'];
  }
}

// ── Autonomous panel elevation ──────────────────────────────────────────────

const ACTION_TO_ELEVATION_CATEGORY: Record<AutomationActionType, AutonomousActionCategory | null> = {
  triggerSceneTransition: 'transition',
  activateGraphicsLayer: 'graphics',
  autoAdjustAudio: 'audio',
  failoverRoute: 'routing',
  switchToBackupDestination: 'output',
  none: null,
};

/** UBDS elevation level for a given automation action, per the Step 109 spec's mapping. */
export function autonomousElevationForAction(action: AutomationActionType): UbosElevationLevel | null {
  const category = ACTION_TO_ELEVATION_CATEGORY[action];
  return category ? autonomousElevationMap[category] : null;
}

/** The highest elevation among a set of decisions — "elevation communicates autonomous priority". */
export function highestAutonomousElevation(decisions: readonly AutomationDecision[]): UbosElevationLevel | null {
  let highest: UbosElevationLevel | null = null;
  for (const decision of decisions) {
    const level = autonomousElevationForAction(decision.action);
    if (level !== null && (highest === null || level > highest)) highest = level;
  }
  return highest;
}

// ── Autonomous operator handoff ─────────────────────────────────────────────

export type AutonomousHandoffEvent =
  | 'activated'
  | 'handedBack'
  | 'enteredRecovery'
  | 'exitedRecovery'
  | null;

const HANDOFF_MESSAGE: Record<Exclude<AutonomousHandoffEvent, null>, string> = {
  activated: 'Autonomy active — Studio Automation is now executing eligible actions.',
  handedBack: 'Autonomy handed back — control returned to the operator.',
  enteredRecovery: 'Autonomous recovery in progress — resolving an automation conflict.',
  exitedRecovery: 'Autonomous recovery complete.',
};

export function detectHandoff(previousMode: AutonomousModeState, mode: AutonomousModeState): AutonomousHandoffEvent {
  if (previousMode === mode) return null;
  // Recovery transitions are checked first — they are the more specific
  // event when moving between `active` and `recovering` (both "autonomy
  // has control"), rather than a generic hand-back to the operator.
  if (mode === 'recovering' && previousMode !== 'recovering') return 'enteredRecovery';
  if (previousMode === 'recovering' && mode !== 'recovering') return 'exitedRecovery';
  if (mode === 'active' && previousMode !== 'active') return 'activated';
  if (previousMode === 'active' && mode !== 'active') return 'handedBack';
  return null;
}

export function handoffMessage(event: AutonomousHandoffEvent): string | null {
  return event ? HANDOFF_MESSAGE[event] : null;
}

// ── The orchestrator ────────────────────────────────────────────────────────

export type AutonomousStudioModeResult = {
  mode: AutonomousModeState;
  motion: readonly AutonomousMotionToken[];
  elevation: UbosElevationLevel | null;
  handoffEvent: AutonomousHandoffEvent;
  handoffMessage: string | null;
  activeActions: readonly AutomationDecision[];
  recoveryConflictCount: number;
  timestamp: number;
};

function emptyResult(): AutonomousStudioModeResult {
  return {
    mode: 'disabled',
    motion: autonomousMotionForMode('disabled', false),
    elevation: null,
    handoffEvent: null,
    handoffMessage: null,
    activeActions: [],
    recoveryConflictCount: 0,
    timestamp: 0,
  };
}

/**
 * Stateful across ticks (tracks the previous mode to detect handoff
 * transitions) — the same reason `StudioAutomation`/`StudioIntelligence`
 * hold a cached `result` rather than being pure functions end to end.
 *
 * Safe to call `compute()` from multiple components within the same
 * intelligence-graph tick (`OperatorHUD`, `WorkspaceShell`,
 * `ControlRoomCanvas` all read autonomous mode independently): only the
 * *first* call for a given `automation` object actually advances
 * `previousMode`/detects a handoff; repeat calls with that exact same
 * object reference (every reader within one tick shares the same cached
 * `StudioAutomationResult` from `graph.getSnapshot()`) return the
 * already-computed result for that tick unchanged, so a genuine
 * transition is never double-counted (or missed) depending on render
 * order. Tracked by object identity, not `automation.timestamp` — two
 * distinct ticks landing in the same millisecond must still be treated
 * as distinct.
 */
export class AutonomousStudioModeController {
  private previousMode: AutonomousModeState = 'disabled';
  private lastProcessedAutomation: StudioAutomationResult | null = null;
  private result: AutonomousStudioModeResult = emptyResult();

  compute(automation: StudioAutomationResult): AutonomousStudioModeResult {
    if (this.lastProcessedAutomation === automation) {
      return this.result;
    }

    const mode = resolveAutonomousMode(automation);
    const handoffEvent = detectHandoff(this.previousMode, mode);
    const hasPendingDecisions = automation.decisions.length > 0;

    this.result = {
      mode,
      motion: autonomousMotionForMode(mode, hasPendingDecisions),
      elevation: highestAutonomousElevation(automation.winners),
      handoffEvent,
      handoffMessage: handoffMessage(handoffEvent),
      activeActions: automation.winners,
      recoveryConflictCount: automation.conflicts.length,
      timestamp: Date.now(),
    };
    this.previousMode = mode;
    this.lastProcessedAutomation = automation;
    return this.result;
  }

  getResult(): AutonomousStudioModeResult {
    return this.result;
  }

  reset(): void {
    this.previousMode = 'disabled';
    this.lastProcessedAutomation = null;
    this.result = emptyResult();
  }
}

/**
 * Module-level singleton, mirroring `workspaceState`'s own singleton
 * pattern — a fresh instance per render would never observe a mode
 * transition (there would be no "previous" to compare against).
 */
export const autonomousStudioModeController = new AutonomousStudioModeController();
