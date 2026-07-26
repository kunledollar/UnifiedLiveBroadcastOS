'use client';

/**
 * Autonomous Mode Banner (Step 109) — makes Autonomous Studio Mode
 * "felt", per the Step 109 spec: shows which autonomous actions are
 * currently active, how many conflicts were just resolved, and the
 * operator handoff message when autonomy activates, recovers, or hands
 * control back.
 *
 * Renders inside `OperatorHUD` (Step 104), reusing the exact `@ubos/ui`
 * Autonomous Studio Mode UX tokens (Step 109's UBDS addition) for
 * elevation and motion — this component is the one place in the
 * autonomous-mode stack that imports `@ubos/ui` directly; the pure
 * decision logic in `autonomousStudioMode.ts` stays package-free.
 *
 * Renders nothing while automation is `disabled` (the default, safe
 * state — see `studioAutomation.ts`), matching the same "no operator
 * toggle exists yet, so this stays invisible until Studio Automation is
 * actually enabled" honesty as Step 107's HUD Timeline entries.
 */
import { ubosTypographyClasses, ubosElevationClasses, autonomousMotionSystem } from '@ubos/ui';
import type { AutonomousStudioModeResult } from './autonomousStudioMode';

const MODE_LABEL: Record<AutonomousStudioModeResult['mode'], string> = {
  disabled: 'Autonomy Disabled',
  idle: 'Autonomy Idle',
  active: 'Autonomy Active',
  recovering: 'Autonomous Recovery',
};

export function AutonomousModeBanner({ autonomous }: { autonomous: AutonomousStudioModeResult }) {
  if (autonomous.mode === 'disabled') return null;

  const elevation = autonomous.elevation ?? 3;
  const animation = autonomous.motion.map((token) => autonomousMotionSystem[token]).join(', ') || undefined;

  return (
    <div
      className={`autonomous-mode-banner ${ubosElevationClasses[elevation]}`}
      style={{ animation }}
      data-testid="autonomous-mode-banner"
      data-ubos-autonomous-mode={autonomous.mode}
    >
      <div className="autonomous-mode-banner-header">
        <span className={ubosTypographyClasses.hud}>{MODE_LABEL[autonomous.mode]}</span>
        {autonomous.recoveryConflictCount > 0 && (
          <span className={ubosTypographyClasses.microText}>
            {autonomous.recoveryConflictCount} conflict{autonomous.recoveryConflictCount === 1 ? '' : 's'} resolved
          </span>
        )}
      </div>

      {autonomous.handoffMessage && (
        <p className={`${ubosTypographyClasses.intelligence} autonomous-mode-handoff`}>{autonomous.handoffMessage}</p>
      )}

      {autonomous.activeActions.length > 0 && (
        <ul className="hud-zone-list">
          {autonomous.activeActions.map((action) => (
            <li key={action.id} className="hud-zone-item">
              <span className="hud-zone-dot bg-ubos-selection" />
              <span className={ubosTypographyClasses.intelligence} title={action.message}>
                {action.action}
              </span>
              <span className={`shrink-0 ${ubosTypographyClasses.microText}`}>
                {(action.confidence * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
