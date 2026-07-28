'use client';

import { useEffect, useState } from 'react';
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
  runtimeStatus,
  queueSize,
  compactChrome = false,
  detailsDefaultOpen = false,
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
  runtimeStatus?: 'idle' | 'executing' | 'transition_active' | 'locked' | 'error';
  queueSize?: number;
  compactChrome?: boolean;
  detailsDefaultOpen?: boolean;
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
  const [detailsOpen, setDetailsOpen] = useState(detailsDefaultOpen);

  useEffect(() => {
    setDetailsOpen(detailsDefaultOpen);
  }, [detailsDefaultOpen]);

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
            className={cn('hidden md:flex', compactChrome && 'lg:hidden')}
          />
          <SwitcherStatusBar
            switcherReady={switcherReady}
            transitionReady={transitionReady}
            programLocked={programLocked}
            automationMode={automationMode}
            runtimeStatus={runtimeStatus ?? 'idle'}
            queueSize={queueSize ?? 0}
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
            variant="full"
            className="hidden xl:block"
          />

          <TransitionDurationControl
            value={productionState.transitionDuration}
            transitionType={productionState.transitionType}
            onChange={onDurationChange}
            variant="compact"
            className="hidden md:block xl:hidden"
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

        {/* Row 3: Collapsible details — progress, feedback, history, shortcuts */}
        <details
          className="group min-h-0 shrink-0"
          open={detailsOpen}
          onToggle={(event) => setDetailsOpen((event.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight px-2 py-1 text-ubos-metadata font-semibold uppercase tracking-wide text-ubos-fg-muted hover:bg-ubos-slate hover:text-ubos-fg-secondary">
            <span aria-hidden="true" className="transition-transform group-open:rotate-90">
              ▸
            </span>
            Details
            <span className="font-normal normal-case tracking-normal text-ubos-fg-disabled">
              — progress, feedback, history, shortcuts
            </span>
          </summary>
          <div className="mt-ubos-2 grid min-h-0 grid-cols-1 gap-ubos-2 md:grid-cols-2 xl:grid-cols-4">
            <TransitionProgress
              active={transitionActive}
              durationMs={productionState.transitionDuration}
            />
            <OperatorFeedback message={feedbackLabel} programSceneName={programSceneName} />
            <SwitcherHistory items={transitionHistory} className="hidden md:block" />
            <ShortcutStrip className="hidden lg:block" />
          </div>
        </details>

        <TransitionDurationControl
          value={productionState.transitionDuration}
          transitionType={productionState.transitionType}
          onChange={onDurationChange}
          variant="compact"
          className="md:hidden"
        />

        <SwitcherStatusBar
          switcherReady={switcherReady}
          transitionReady={transitionReady}
          programLocked={programLocked}
          automationMode={automationMode}
          runtimeStatus={runtimeStatus ?? 'idle'}
          queueSize={queueSize ?? 0}
          className="lg:hidden"
        />
      </div>
    </BroadcastPanel>
  );
}

/** @deprecated Use ProfessionalSwitcher */
export const ProductionSwitcher = ProfessionalSwitcher;
