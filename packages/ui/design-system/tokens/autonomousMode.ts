/**
 * UBOS Design System (UBDS) — Autonomous Studio Mode UX Tokens (Step 109)
 *
 * Defines how UBOS *looks, behaves, and communicates* when Studio
 * Automation is active — the Autonomous Studio Theme, autonomous panel
 * elevation, and the four "special motion curves" (autoPulse/autoGlow/
 * autoShake/autoFade) named in the Step 109 spec.
 *
 * ── Note on "Studio Automation 2.0" ──────────────────────────────────
 * The Step 109 spec lists "Studio Automation 2.0" as a power source.
 * This repository has not implemented a Studio Automation 2.0 — the most
 * recent automation engine actually present is Studio Automation 1.0
 * (Step 107, `apps/web/app/control-room/intelligence-graph/
 * studioAutomation.ts`), which is decision-only (see that file's module
 * doc for the full investigation of why it does not dispatch real
 * commands). This module and its application-layer wiring
 * (`apps/web/app/control-room/hud/autonomousStudioMode.ts`) are built
 * against Studio Automation 1.0's real output rather than inventing a
 * fictitious 2.0 API, per "never fake success" / "evidence first".
 *
 * ── Reuse, not new colors ────────────────────────────────────────────
 * The spec's "Autonomous Studio Theme" names three accent colors —
 * autonomous blue, critical yellow, predictive purple — that already
 * exist in UBDS's broadcast color language (Step 91): Active Blue
 * (`selection`, operator focus), Warning Yellow (`warning`, universal
 * override tone), and Automation Purple (`automation`, "automation
 * engine / macros / scheduled actions" — already exactly the right
 * semantic for "predictive" automation). No new pigments were added;
 * the Autonomous Studio Theme is a *named composition* of these three
 * plus the existing deep-black background layers and the existing
 * Radial Highlight Gradient (Step 95) for "cinematic lighting".
 *
 * ── Reuse, not new motion primitives ─────────────────────────────────
 * `autoPulse`/`autoGlow`/`autoShake`/`autoFade` are distinctly-named
 * keyframes (`ubos-auto-pulse`/`ubos-auto-glow`/`ubos-auto-shake`/
 * `ubos-auto-fade`, defined in `theme/css-variables.css`, matching this
 * codebase's `ubos-*` keyframe naming convention) rather than aliases of
 * the Step 91/96 primitives — the spec explicitly calls these "special
 * motion curves" distinct from standard UBDS motion, so an operator (or
 * a future CSS author) can tell "this is because autonomy is active"
 * apart from "this is a regular per-panel intelligence signal". Visually
 * they are close relatives of `pulse`/`elevate`/`shake`/`fade` — same
 * physical language, autonomous-mode-specific timing and color tinting
 * (Active Blue / Automation Purple, not the generic per-signal palette).
 */
import { ubosColors } from './colors.js';
import { ubosGradients } from './gradients.js';
import type { UbosElevationLevel } from './elevation.js';

/** Step 109 milestone identifier. */
export const AUTONOMOUS_UX_STEP = 109 as const;

// ── Autonomous Studio Theme ─────────────────────────────────────────────────

export interface AutonomousStudioTheme {
  name: 'autonomousStudio';
  background: {
    /** "deep blacks" */
    deep: string;
    /** raised surface within the deep background */
    surface: string;
  };
  accent: {
    /** "autonomous blue accents" — reuses Active Blue (Step 91). */
    autonomousBlue: string;
    /** "critical yellow overlays" — reuses Warning Yellow (Step 91). */
    criticalYellow: string;
    /** "predictive purple pulses" — reuses Automation Purple (Step 91). */
    predictivePurple: string;
  };
  /** "strong gradients" / "cinematic lighting" — reuses the Radial Highlight Gradient (Step 95). */
  gradient: string;
}

export const autonomousStudioTheme: AutonomousStudioTheme = {
  name: 'autonomousStudio',
  background: {
    deep: ubosColors.background.carbon,
    surface: ubosColors.background.midnight,
  },
  accent: {
    autonomousBlue: ubosColors.selection.DEFAULT,
    criticalYellow: ubosColors.warning.DEFAULT,
    predictivePurple: ubosColors.automation.DEFAULT,
  },
  gradient: ubosGradients.radialHighlight,
};

// ── Autonomous panel elevation ──────────────────────────────────────────────

/**
 * The five autonomous action categories the spec names, mapped onto
 * UBDS's existing 0-4 elevation scale (Step 94) exactly as given:
 * transition/graphics/audio at Level 3 (Highlighted Panel), routing/
 * output recovery at Level 4 (Critical Panel) — routing failures and
 * output recovery carry the highest autonomous priority because they
 * threaten the live signal path itself, not just one composited layer.
 */
export type AutonomousActionCategory = 'transition' | 'graphics' | 'audio' | 'routing' | 'output';

export const autonomousElevationMap: Record<AutonomousActionCategory, UbosElevationLevel> = {
  transition: 3,
  graphics: 3,
  audio: 3,
  routing: 4,
  output: 4,
};

// ── Autonomous motion physics ───────────────────────────────────────────────

export type AutonomousMotionToken = 'autoPulse' | 'autoGlow' | 'autoShake' | 'autoFade';

export const autonomousMotionTokens: readonly AutonomousMotionToken[] = [
  'autoPulse',
  'autoGlow',
  'autoShake',
  'autoFade',
];

/** CSS `animation` shorthand for each autonomous motion token, matching the Step 109 code sample's durations/curves exactly. */
export const autonomousMotionSystem: Record<AutonomousMotionToken, string> = {
  autoPulse: 'ubos-auto-pulse 1.2s ease-in-out infinite',
  autoGlow: 'ubos-auto-glow 0.8s ease-in-out forwards',
  autoShake: 'ubos-auto-shake 0.4s ease-in-out',
  autoFade: 'ubos-auto-fade 0.2s linear forwards',
};

/**
 * Semantic meaning of each autonomous motion token, per the spec's own
 * wording — used by the application layer to pick which token(s) apply
 * to a given autonomous state, without re-deriving the mapping.
 */
export const autonomousMotionMeaning: Record<AutonomousMotionToken, string> = {
  autoPulse: 'predictive autonomous action',
  autoGlow: 'active autonomous action',
  autoShake: 'autonomous warning',
  autoFade: 'autonomous fallback',
};

// ── Autonomous HUD mode ──────────────────────────────────────────────────────

export interface AutonomousHudModeConfig {
  mode: 'autonomous';
  showActions: boolean;
  showWarnings: boolean;
  showTimeline: boolean;
}

export const autonomousHudModeDefaults: AutonomousHudModeConfig = {
  mode: 'autonomous',
  showActions: true,
  showWarnings: true,
  showTimeline: true,
};
