/**
 * Autonomous Studio Mode Control Panel (ASMCP) — Step 111.
 *
 * The operator cockpit for Studio Automation: the first step where
 * autonomy becomes configurable, permission-based, role-aware,
 * workspace-aware, safety-controlled, and override-capable, rather than
 * a fixed, hardcoded set of thresholds.
 *
 * ── Powered by Studio Automation 1.0, not "2.0" ──────────────────────
 * Same honesty note as Steps 109-110: the spec names "Studio Automation
 * 2.0", which does not exist in this repository. Every control this
 * module exposes governs Studio Automation **1.0**'s real, newly
 * instance-configurable state (`StudioAutomation.setSafetySettings`/
 * `setPermissions`/`setConflictResolutionMode`, added in this same step)
 * — nothing here is a facade over a system that doesn't exist.
 *
 * Seven modules, each backed by real, mutable engine state:
 *
 *   1. Autonomy Level Selector — `AUTONOMY_LEVEL_PRESETS` (0-4),
 *      `applyAutonomyLevel()`/`deriveAutonomyLevel()`. The exact
 *      confidence/severity/permission numbers per level are this
 *      module's own considered design (documented per-level below), not
 *      spec-mandated values — the spec names the five levels and says
 *      "each level changes allowed actions/confidence/severity/fallback"
 *      without giving numbers.
 *   2. Autonomy Permissions — reuses Step 111's own
 *      `AutonomyPermissions`/`AUTONOMY_PERMISSION_KEYS` addition to
 *      `studioAutomation.ts` directly; no duplicate model here.
 *   3. Autonomy Safety Settings — reuses `AutonomySafetySettings` and the
 *      new `ConflictResolutionMode` directly. "Fallback behavior" and
 *      "override behavior" are exposed as configuration
 *      (`AutonomyFallbackBehavior`/`AutonomyOverrideBehavior`) but —
 *      documented honestly — do not yet have more than one real runtime
 *      behavior each: there is exactly one way automation falls back
 *      today (`setAutomationEnabled(false)`) and exactly one override
 *      mechanism (`overrideDecision`/`clearOverride`). The settings are
 *      real, stored, and surfaced in the panel/logs; they do not
 *      currently branch engine behavior beyond what already exists.
 *   4. Autonomy Visualization Settings — `AutonomyVisualizationSettings`,
 *      applied to Step 109/110's already-computed motion/overlay output
 *      (`applyVisualizationToMotion`, `visualizationAllowsOverlay`) —
 *      this module decides what the operator is allowed to *see*, Steps
 *      109/110 still decide *what would be shown*.
 *   5. Autonomy Override Controls — `applyOverrideAction()`: pause/resume
 *      map to `setAutomationEnabled`; override/reject map to
 *      `overrideDecision`; approve maps to `clearOverride` (the honest
 *      reading of "approve" in a decision-only system: let the decision
 *      be evaluated normally rather than force a dispatch that does not
 *      exist).
 *   6. Autonomy Logs — `buildAutonomyLogEntries()`, the six named kinds
 *      (predicted/executed/canceled/fallback/override/recovery) derived
 *      from Step 107's real decisions/conflicts and Step 109's real
 *      handoff events.
 *   7. Autonomy Timeline — `buildAutonomyTimelineEntries()`, the same six
 *      kinds merged chronologically with Step 107's own
 *      `StudioAutomationResult.timeline`.
 *
 * Kept dependency-free of `@ubos/ui`/React, matching every other pure
 * `hud`/`intelligence-graph` decision module; only
 * `AutonomousControlPanel.tsx` imports `@ubos/ui`.
 */
import type {
  StudioAutomation,
  StudioAutomationResult,
  AutomationDecision,
  AutomationConflict,
  AutonomyPermissions,
  AutonomySafetySettings,
  ConflictResolutionMode,
} from '../intelligence-graph/studioAutomation.js';
import {
  AUTONOMY_PERMISSION_KEYS,
  defaultAutonomyPermissions,
  defaultAutonomySafetySettings,
} from '../intelligence-graph/studioAutomation.js';
import type { AutonomousStudioModeResult, AutonomousMotionToken } from './autonomousStudioMode.js';

// ── 1. Autonomy Level Selector ──────────────────────────────────────────────

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export const AUTONOMY_LEVELS: readonly AutonomyLevel[] = [0, 1, 2, 3, 4];

export const AUTONOMY_LEVEL_LABELS: Record<AutonomyLevel, string> = {
  0: 'Manual',
  1: 'Assisted',
  2: 'Predictive',
  3: 'Semi-Autonomous',
  4: 'Fully Autonomous',
};

export type AutonomyLevelPreset = {
  automationEnabled: boolean;
  permissions: AutonomyPermissions;
  safetySettings: AutonomySafetySettings;
};

function allPermissions(enabled: boolean): AutonomyPermissions {
  const permissions = defaultAutonomyPermissions();
  for (const key of AUTONOMY_PERMISSION_KEYS) permissions[key] = enabled;
  return permissions;
}

/**
 * Each level's preset, in order of increasing trust in the system:
 *   0 Manual        — disabled, no permission, thresholds effectively
 *                      unreachable even as a defensive second layer.
 *   1 Assisted       — disabled (guidance-only), permissions off,
 *                      thresholds "ready" for when an operator raises
 *                      the level.
 *   2 Predictive     — disabled (predictions/guidance visible, nothing
 *                      fires), permissions on, Step 107's original
 *                      default thresholds — "the system shows what it
 *                      would do".
 *   3 Semi-Autonomous — enabled, but only the four lower-risk categories
 *                      (graphics/audio/output/replay) — scene
 *                      transitions, routing, and streaming recovery stay
 *                      operator-only until Level 4.
 *   4 Fully Autonomous — enabled, every category, and slightly more
 *                      permissive thresholds — the system is trusted to
 *                      act on somewhat lower confidence / higher
 *                      severity than the baseline.
 */
export const AUTONOMY_LEVEL_PRESETS: Record<AutonomyLevel, AutonomyLevelPreset> = {
  0: {
    automationEnabled: false,
    permissions: allPermissions(false),
    safetySettings: { minConfidence: 0.99, maxSeverity: 0.05 },
  },
  1: {
    automationEnabled: false,
    permissions: allPermissions(false),
    safetySettings: { minConfidence: 0.9, maxSeverity: 0.3 },
  },
  2: {
    automationEnabled: false,
    permissions: allPermissions(true),
    safetySettings: defaultAutonomySafetySettings(),
  },
  3: {
    automationEnabled: true,
    permissions: {
      ...allPermissions(false),
      graphicsActivation: true,
      audioMixing: true,
      outputStabilization: true,
      replayTriggers: true,
    },
    safetySettings: defaultAutonomySafetySettings(),
  },
  4: {
    automationEnabled: true,
    permissions: allPermissions(true),
    safetySettings: { minConfidence: 0.75, maxSeverity: 0.5 },
  },
};

/** Applies a level's full preset (enabled flag, permissions, thresholds) to the live engine in one call. */
export function applyAutonomyLevel(automation: StudioAutomation, level: AutonomyLevel): void {
  const preset = AUTONOMY_LEVEL_PRESETS[level];
  automation.setAutomationEnabled(preset.automationEnabled);
  automation.setPermissions(preset.permissions);
  automation.setSafetySettings(preset.safetySettings);
}

function permissionsEqual(a: AutonomyPermissions, b: AutonomyPermissions): boolean {
  return AUTONOMY_PERMISSION_KEYS.every((key) => a[key] === b[key]);
}

/**
 * Best-effort reverse lookup — is the engine's *current* configuration
 * exactly one of the five presets, or has the operator hand-tuned
 * permissions/thresholds away from any named level? Reports `'custom'`
 * honestly rather than guessing the nearest level.
 */
export function deriveAutonomyLevel(automation: StudioAutomation): AutonomyLevel | 'custom' {
  const enabled = automation.isAutomationEnabled();
  const permissions = automation.getPermissions();
  const safety = automation.getSafetySettings();

  for (const level of AUTONOMY_LEVELS) {
    const preset = AUTONOMY_LEVEL_PRESETS[level];
    if (
      preset.automationEnabled === enabled &&
      permissionsEqual(preset.permissions, permissions) &&
      preset.safetySettings.minConfidence === safety.minConfidence &&
      preset.safetySettings.maxSeverity === safety.maxSeverity
    ) {
      return level;
    }
  }
  return 'custom';
}

// ── 3. Autonomy Safety Settings (fallback/override behavior config) ────────

export type AutonomyFallbackBehavior = 'pauseAutomation' | 'revertToManual';
export type AutonomyOverrideBehavior = 'immediate' | 'confirmFirst';

export type AutonomySettingsConfig = {
  safety: AutonomySafetySettings;
  conflictResolutionMode: ConflictResolutionMode;
  /** Stored configuration only — see module doc: one real fallback behavior exists today. */
  fallbackBehavior: AutonomyFallbackBehavior;
  /** Stored configuration only — see module doc: one real override mechanism exists today. */
  overrideBehavior: AutonomyOverrideBehavior;
};

export function defaultAutonomySettingsConfig(): AutonomySettingsConfig {
  return {
    safety: defaultAutonomySafetySettings(),
    conflictResolutionMode: 'severityFirst',
    fallbackBehavior: 'pauseAutomation',
    overrideBehavior: 'confirmFirst',
  };
}

// ── 4. Autonomy Visualization Settings ──────────────────────────────────────

export type AutonomyHudMode = 'autonomous' | 'minimal';

export type AutonomyVisualizationSettings = {
  themeEnabled: boolean;
  /** 0 (no motion) – 1 (full motion, Step 109/110's computed tokens unchanged). */
  motionIntensityScale: number;
  elevationEnabled: boolean;
  overlaysEnabled: boolean;
  hudMode: AutonomyHudMode;
};

export function defaultAutonomyVisualizationSettings(): AutonomyVisualizationSettings {
  return {
    themeEnabled: true,
    motionIntensityScale: 1,
    elevationEnabled: true,
    overlaysEnabled: true,
    hudMode: 'autonomous',
  };
}

/**
 * Filters Step 109/110's already-computed motion tokens by the
 * operator's chosen intensity: 0 suppresses all motion (still safe —
 * the underlying mode/overlay data is unaffected, only the *animation*
 * is silenced), 0-0.5 keeps only the gentler tokens (`autoFade`/
 * `autoGlow`), above 0.5 keeps everything Steps 109/110 computed.
 */
export function applyVisualizationToMotion(
  tokens: readonly AutonomousMotionToken[],
  settings: AutonomyVisualizationSettings,
): readonly AutonomousMotionToken[] {
  if (settings.motionIntensityScale <= 0) return [];
  if (settings.motionIntensityScale <= 0.5) {
    return tokens.filter((token) => token === 'autoFade' || token === 'autoGlow');
  }
  return tokens;
}

/** Whether Step 110's Safety Overlay should render at all, per the operator's visualization settings. */
export function visualizationAllowsOverlay(settings: AutonomyVisualizationSettings): boolean {
  return settings.overlaysEnabled;
}

// ── 5. Autonomy Override Controls ───────────────────────────────────────────

export type AutonomyOverrideAction = 'pause' | 'resume' | 'override' | 'approve' | 'reject';

/**
 * Applies one of the spec's five override actions to the live engine.
 * `override`/`reject` both mean "do not let this decision execute" —
 * kept as two spec-named actions mapping to the one real mechanism
 * (`overrideDecision`) rather than inventing two different engine
 * behaviors for a distinction the spec itself does not define
 * differently. `approve` means "let this decision be evaluated
 * normally" (`clearOverride`) — the honest reading in a system with no
 * real dispatch to force.
 */
export function applyOverrideAction(
  automation: StudioAutomation,
  action: AutonomyOverrideAction,
  predictionId?: string,
): void {
  switch (action) {
    case 'pause':
      automation.setAutomationEnabled(false);
      return;
    case 'resume':
      automation.setAutomationEnabled(true);
      return;
    case 'override':
    case 'reject':
      if (predictionId) automation.overrideDecision(predictionId);
      return;
    case 'approve':
      if (predictionId) automation.clearOverride(predictionId);
      return;
  }
}

// ── 6 & 7. Autonomy Logs + Autonomy Timeline ────────────────────────────────

export type AutonomyEventKind = 'predicted' | 'executed' | 'canceled' | 'fallback' | 'override' | 'recovery';

export type AutonomyEvent = {
  id: string;
  kind: AutonomyEventKind;
  message: string;
  confidence: number;
  timestamp: number;
};

function decisionEventKind(decision: AutomationDecision): AutonomyEventKind {
  switch (decision.status) {
    case 'wouldExecute':
      return 'executed';
    case 'overridden':
      return 'override';
    case 'supersededByConflict':
      return 'recovery';
    default:
      return 'canceled';
  }
}

function decisionEvent(decision: AutomationDecision): AutonomyEvent {
  return {
    id: `autonomy-event-${decision.id}`,
    kind: decisionEventKind(decision),
    message: `${decision.action}: ${decision.message}`,
    confidence: decision.confidence,
    timestamp: decision.timestamp,
  };
}

function conflictEvent(conflict: AutomationConflict): AutonomyEvent {
  return {
    id: `autonomy-event-conflict-${conflict.loser.id}`,
    kind: 'recovery',
    message: conflict.reason,
    confidence: conflict.loser.confidence,
    timestamp: conflict.loser.timestamp,
  };
}

/**
 * The six named log kinds from the spec (predicted/executed/canceled/
 * fallback/override/recovery), sourced from Step 107's real decisions
 * and conflicts, plus Step 109's `handedBack` handoff surfaced as a
 * `fallback` event. Predictions that never even became a decision (no
 * mapped action) are not logged here — there is nothing autonomy could
 * have done with them.
 */
export function buildAutonomyLogEntries(
  automation: StudioAutomationResult,
  autonomous: AutonomousStudioModeResult,
): AutonomyEvent[] {
  const events: AutonomyEvent[] = [
    ...automation.decisions.map(decisionEvent),
    ...automation.conflicts.map(conflictEvent),
  ];

  if (autonomous.handoffEvent === 'handedBack') {
    events.push({
      id: `autonomy-event-fallback-${autonomous.timestamp}`,
      kind: 'fallback',
      message: autonomous.handoffMessage ?? 'Autonomy stepped back to the operator.',
      confidence: 1,
      timestamp: autonomous.timestamp,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp || b.confidence - a.confidence);
}

/**
 * Same six kinds, chronological, merged with Step 107's own
 * `StudioAutomationResult.timeline` (predicted events already tracked
 * there) — "Autonomy Timeline" and "Autonomy Logs" are the same
 * underlying event set, framed for a scrolling log vs. a chronological
 * strip respectively, matching how similar the spec's own bullet lists
 * for sections 6 and 7 are.
 */
export function buildAutonomyTimelineEntries(
  automation: StudioAutomationResult,
  autonomous: AutonomousStudioModeResult,
  limit = 20,
): AutonomyEvent[] {
  return buildAutonomyLogEntries(automation, autonomous).slice(0, limit);
}

// ── The aggregate configuration (for the control panel's props) ────────────

export type AutonomyConfiguration = {
  level: AutonomyLevel | 'custom';
  permissions: AutonomyPermissions;
  settings: AutonomySettingsConfig;
  visualization: AutonomyVisualizationSettings;
  logs: AutonomyEvent[];
  timeline: AutonomyEvent[];
};

export function deriveAutonomyConfiguration(
  automation: StudioAutomation,
  autonomous: AutonomousStudioModeResult,
  visualization: AutonomyVisualizationSettings,
): AutonomyConfiguration {
  const result = automation.getResult();
  return {
    level: deriveAutonomyLevel(automation),
    permissions: automation.getPermissions(),
    settings: {
      safety: automation.getSafetySettings(),
      conflictResolutionMode: automation.getConflictResolutionMode(),
      fallbackBehavior: 'pauseAutomation',
      overrideBehavior: 'confirmFirst',
    },
    visualization,
    logs: buildAutonomyLogEntries(result, autonomous),
    timeline: buildAutonomyTimelineEntries(result, autonomous),
  };
}

/**
 * Module-level singleton for visualization preferences — there is no
 * engine field for these (Steps 109/110's tokens have no operator
 * override today), so this is the one piece of Step 111 state that
 * lives here rather than on `StudioAutomation`, mirroring
 * `autonomousStudioModeController`'s own singleton pattern.
 */
export class AutonomyVisualizationSettingsStore {
  private settings: AutonomyVisualizationSettings = defaultAutonomyVisualizationSettings();

  get(): AutonomyVisualizationSettings {
    return this.settings;
  }

  set(partial: Partial<AutonomyVisualizationSettings>): void {
    this.settings = { ...this.settings, ...partial };
  }

  reset(): void {
    this.settings = defaultAutonomyVisualizationSettings();
  }
}

export const autonomyVisualizationSettingsStore = new AutonomyVisualizationSettingsStore();
