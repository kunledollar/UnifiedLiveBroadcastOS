'use client';

import type { AutomationState } from './automation-state';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { AutomationModeSelector } from './AutomationModeSelector';
import { CountdownPanel } from './CountdownPanel';
import { RunOfShowPanel } from './RunOfShowPanel';
import { SegmentTimeline } from './SegmentTimeline';
import type { AutomationAction } from './automation-state';
import { getAllCues } from './automation-utils';

export function AutomationPanel({
  state,
  dispatch,
  className,
}: {
  state: AutomationState;
  dispatch: (action: AutomationAction) => void;
  className?: string;
}) {
  const nextCue = getAllCues(state.runOfShow).find(
    (cue) => cue.status === 'pending' || cue.status === 'armed',
  );

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <BroadcastPanel variant="inset" padding={false} className="border-0 shadow-none">
        <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
          <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Automation</h3>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Run of show metadata · No execution
          </p>
        </div>
        <div className="space-y-ubos-2 overflow-y-auto p-ubos-2">
          <AutomationModeSelector
            mode={state.automationMode}
            onChange={(mode) => dispatch({ type: 'SET_AUTOMATION_MODE', mode })}
          />
          <SegmentTimeline runOfShow={state.runOfShow} automationMode={state.automationMode} />
          <CountdownPanel runOfShow={state.runOfShow} nextCue={nextCue ?? null} />
          <RunOfShowPanel
            runOfShow={state.runOfShow}
            selectedSegmentId={state.selectedSegmentId}
            onSelectSegment={(segmentId) => dispatch({ type: 'SELECT_SEGMENT', segmentId })}
          />
        </div>
      </BroadcastPanel>
    </div>
  );
}
