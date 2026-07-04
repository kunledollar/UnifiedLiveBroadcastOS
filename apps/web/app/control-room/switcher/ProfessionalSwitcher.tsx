'use client';

import { BroadcastPanel, cn } from '@ubos/ui';
import type { ProductionSwitchingState, TransitionType } from '@ubos/shared';
import { HardwareButton, HardwareButtonGroup } from './HardwareButton';
import { OperatorFeedback } from './OperatorFeedback';
import { ProgramPreviewStrip } from './ProgramPreviewStrip';
import { ShortcutStrip } from './ShortcutStrip';
import { SwitcherHistory } from './SwitcherHistory';
import { SwitcherStatusBar } from './SwitcherStatusBar';
import { TransitionDurationControl } from './TransitionDurationControl';
import { TransitionProgress } from './TransitionProgress';
import { TransitionSelector } from './TransitionSelector';
import { TransitionVisualization } from './TransitionVisualization';
import { transitionDisplayLabel } from './switcher-config';

export function ProfessionalSwitcher({
  productionState,
  programSceneName,
  previewSceneName,
  lastTransitionLabel,
  feedbackLabel,
  transitionActive,
  transitionHistory,
  switcherReady,
  transitionReady,
  programLocked,
  automationMode,
  onTake,
  onCut,
  onAuto,
  onPrevious,
  onNext,
  onTransitionChange,
  onDurationChange,
  className,
}: {
  productionState: ProductionSwitchingState;
  programSceneName: string;
  previewSceneName: string;
  lastTransitionLabel: string;
  feedbackLabel: string | null;
  transitionActive: boolean;
  transitionHistory: string[];
  switcherReady: boolean;
  transitionReady: boolean;
  programLocked: boolean;
  automationMode: 'manual' | 'automation';
  onTake: () => void;
  onCut: () => void;
  onAuto: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTransitionChange: (value: TransitionType) => void;
  onDurationChange: (value: number) => void;
  className?: string;
}) {
  const ready = switcherReady && !transitionActive;

  return (
    <BroadcastPanel
      variant="raised"
      padding={false}
      className={cn('h-full min-h-0 border-0 shadow-none', className)}
    >
      <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-2">
        {/* Row 1: Status strip + visualization + readiness */}
        <div className="grid min-h-0 shrink-0 grid-cols-1 gap-ubos-2 lg:grid-cols-[1.2fr_1fr_auto]">
          <ProgramPreviewStrip
            programSceneName={programSceneName}
            previewSceneName={previewSceneName}
            transitionType={productionState.transitionType}
            lastTransitionLabel={lastTransitionLabel}
            ready={ready}
          />
          <TransitionVisualization
            programSceneName={programSceneName}
            previewSceneName={previewSceneName}
            transitionType={productionState.transitionType}
            durationMs={productionState.transitionDuration}
            className="hidden md:flex"
          />
          <SwitcherStatusBar
            switcherReady={switcherReady}
            transitionReady={transitionReady}
            programLocked={programLocked}
            automationMode={automationMode}
            className="hidden items-end justify-end lg:flex"
          />
        </div>

        {/* Row 2: Hardware buttons + transition controls + navigation */}
        <div className="grid min-h-0 shrink-0 grid-cols-1 items-end gap-ubos-2 md:grid-cols-[auto_1fr_auto] xl:grid-cols-[auto_1fr_1fr_auto]">
          <HardwareButtonGroup label="Execute">
            <HardwareButton tone="cut" onClick={onCut} aria-label="Cut preview to program">
              CUT
            </HardwareButton>
            <HardwareButton tone="auto" onClick={onAuto} aria-label="Auto fade preview to program">
              AUTO
            </HardwareButton>
            <HardwareButton
              tone="take"
              onClick={onTake}
              aria-label={`Take with ${transitionDisplayLabel(productionState.transitionType)}`}
            >
              TAKE
            </HardwareButton>
          </HardwareButtonGroup>

          <TransitionSelector
            value={productionState.transitionType}
            onChange={onTransitionChange}
          />

          <TransitionDurationControl
            value={productionState.transitionDuration}
            transitionType={productionState.transitionType}
            onChange={onDurationChange}
            className="hidden xl:block"
          />

          <HardwareButtonGroup label="Navigate">
            <HardwareButton size="md" onClick={onPrevious} aria-label="Previous preview scene">
              Prev
            </HardwareButton>
            <HardwareButton size="md" onClick={onNext} aria-label="Next preview scene">
              Next
            </HardwareButton>
            <HardwareButton size="md" disabled title="Undo not available">
              Undo
            </HardwareButton>
          </HardwareButtonGroup>
        </div>

        {/* Row 3: Progress, feedback, history, shortcuts */}
        <div className="grid min-h-0 shrink-0 grid-cols-1 gap-ubos-2 md:grid-cols-2 xl:grid-cols-4">
          <TransitionProgress
            active={transitionActive}
            durationMs={productionState.transitionDuration}
          />
          <OperatorFeedback message={feedbackLabel} programSceneName={programSceneName} />
          <SwitcherHistory items={transitionHistory} className="hidden md:block" />
          <ShortcutStrip className="hidden lg:block" />
        </div>

        <TransitionDurationControl
          value={productionState.transitionDuration}
          transitionType={productionState.transitionType}
          onChange={onDurationChange}
          className="xl:hidden"
        />

        <SwitcherStatusBar
          switcherReady={switcherReady}
          transitionReady={transitionReady}
          programLocked={programLocked}
          automationMode={automationMode}
          className="lg:hidden"
        />
      </div>
    </BroadcastPanel>
  );
}

/** @deprecated Use ProfessionalSwitcher */
export const ProductionSwitcher = ProfessionalSwitcher;
