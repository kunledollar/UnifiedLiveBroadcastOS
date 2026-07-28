'use client';

import { useMemo } from 'react';
import type { AutomationState } from './automation-state';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { AutomationInspector } from './AutomationInspector';
import { AutomationModeSelector } from './AutomationModeSelector';
import { CountdownPanel } from './CountdownPanel';
import { CueList } from './CueList';
import { MacroPanel } from './MacroPanel';
import { RunOfShowPanel } from './RunOfShowPanel';
import { SegmentTimeline } from './SegmentTimeline';
import type { AutomationAction } from './automation-state';
import { getAllCues, getCurrentSegment, getNextSegment } from './automation-utils';

export function AutomationWorkspace({
  state,
  dispatch,
  className,
}: {
  state: AutomationState;
  dispatch: (action: AutomationAction) => void;
  className?: string;
}) {
  const { runOfShow, macros, automationMode, selectedSegmentId, selectedCueId } = state;

  const selectedSegment =
    runOfShow.segments.find((segment) => segment.id === selectedSegmentId) ??
    getCurrentSegment(runOfShow);
  const segmentCues = selectedSegment?.cues ?? [];
  const allCues = useMemo(() => getAllCues(runOfShow), [runOfShow]);
  const selectedCue =
    allCues.find((cue) => cue.id === selectedCueId) ??
    segmentCues[0] ??
    null;
  const nextCue = allCues.find((cue) => cue.status === 'pending' || cue.status === 'armed') ?? null;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            Automation Workspace
          </h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Run of show · Cues · Macros · Metadata only
          </p>
        </div>
        <StatusBadge variant="warning">Automation metadata staged</StatusBadge>
      </div>

      <AutomationModeSelector
        mode={automationMode}
        onChange={(mode) => dispatch({ type: 'SET_AUTOMATION_MODE', mode })}
        className="shrink-0 px-ubos-2"
      />

      <ResizableSplit
        initialRatio={0.32}
        minPrimary={0.22}
        maxPrimary={0.45}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
            <RunOfShowPanel
              runOfShow={runOfShow}
              selectedSegmentId={selectedSegmentId}
              onSelectSegment={(segmentId) => dispatch({ type: 'SELECT_SEGMENT', segmentId })}
              className="min-h-0 flex-1"
            />
            <SegmentTimeline runOfShow={runOfShow} automationMode={automationMode} className="shrink-0" />
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.55}
            primary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <CueList
                  cues={segmentCues.length ? segmentCues : allCues}
                  selectedCueId={selectedCueId}
                  onSelectCue={(cueId) => dispatch({ type: 'SELECT_CUE', cueId })}
                  onArmCue={(cueId) => dispatch({ type: 'ARM_CUE', cueId })}
                  onExecuteCue={(cueId) => dispatch({ type: 'EXECUTE_CUE', cueId })}
                  onSkipCue={(cueId) => dispatch({ type: 'SKIP_CUE', cueId })}
                  className="min-h-0 flex-1"
                />
                <MacroPanel
                  macros={macros}
                  onArmMacro={(macroId) => dispatch({ type: 'ARM_MACRO', macroId })}
                  onDisableMacro={(macroId) => dispatch({ type: 'DISABLE_MACRO', macroId })}
                  className="shrink-0"
                />
              </div>
            }
            secondary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <CountdownPanel runOfShow={runOfShow} nextCue={nextCue} />
                <AutomationInspector
                  segment={selectedSegment}
                  cue={selectedCue}
                  macro={macros[0] ?? null}
                  segments={runOfShow.segments}
                />
                <BroadcastPanel variant="inset" padding={false} className="shrink-0 border-0 shadow-none">
                  <div className="p-ubos-2 text-ubos-caption text-ubos-fg-muted">
                    Current: {getCurrentSegment(runOfShow)?.name ?? 'No active segment'} · Next:{' '}
                    {getNextSegment(runOfShow)?.name ?? 'unavailable'}
                  </div>
                </BroadcastPanel>
              </div>
            }
          />
        }
      />
    </div>
  );
}
