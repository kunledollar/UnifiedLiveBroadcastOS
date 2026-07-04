'use client';

import type { AutomationMacro, ProductionCue, ShowSegment } from '@ubos/shared';
import { validateAutomationMacro, validateProductionCue, validateShowSegment } from '@ubos/shared';
import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { AutomationEmptyState } from './AutomationEmptyState';
import { formatDurationMs } from './automation-utils';

export function AutomationInspector({
  segment,
  cue,
  macro,
  segments,
}: {
  segment: ShowSegment | null;
  cue: ProductionCue | null;
  macro: AutomationMacro | null;
  segments: ShowSegment[];
}) {
  if (!segment && !cue && !macro) {
    return <AutomationEmptyState message="Select a segment, cue, or macro to inspect" />;
  }

  if (macro) {
    const issues = validateAutomationMacro(macro);
    return (
      <ConsoleSection title="Macro Inspector">
        <InspectorRow label="Name" value={macro.name} />
        <InspectorRow label="Mode" value={macro.mode} />
        <InspectorRow label="Steps" value={String(macro.steps.length)} />
        <InspectorRow label="Status" value={macro.status} />
        {issues.map((issue) => (
          <StatusBadge key={issue.code} variant="warning">{issue.message}</StatusBadge>
        ))}
        <p className="pt-2 text-ubos-metadata text-ubos-fg-muted">Macro metadata staged · Execution unavailable</p>
      </ConsoleSection>
    );
  }

  if (cue) {
    const allCues = segments.flatMap((item) => item.cues);
    const issues = validateProductionCue(cue, allCues);
    return (
      <ConsoleSection title="Cue Inspector">
        <InspectorRow label="Name" value={cue.name} />
        <InspectorRow label="Type" value={cue.type} />
        <InspectorRow label="Target" value={`${cue.targetType}/${cue.targetId}`} />
        <InspectorRow label="Timing" value={cue.timing} />
        <InspectorRow label="Offset" value={formatDurationMs(cue.offsetMs)} />
        <InspectorRow label="Status" value={cue.status} />
        <InspectorRow label="Confirmation" value={cue.requiresConfirmation ? 'Required' : 'No'} />
        <InspectorRow label="Auto safe" value={cue.safeForAuto ? 'Yes' : 'No'} />
        {issues.map((issue) => (
          <StatusBadge key={issue.code} variant="warning">{issue.message}</StatusBadge>
        ))}
        <p className="pt-2 text-ubos-metadata text-ubos-fg-muted">Cue metadata staged · Execution unavailable</p>
      </ConsoleSection>
    );
  }

  if (segment) {
    const issues = validateShowSegment(segment, segments);
    return (
      <ConsoleSection title="Segment Inspector">
        <InspectorRow label="Name" value={segment.name} />
        <InspectorRow label="Type" value={segment.type} />
        <InspectorRow label="Duration" value={formatDurationMs(segment.durationMs)} />
        <InspectorRow label="Order" value={String(segment.order)} />
        <InspectorRow label="Status" value={segment.status} />
        <InspectorRow label="Cues" value={String(segment.cues.length)} />
        <InspectorRow label="Notes" value={segment.notes ?? 'none'} />
        {issues.map((issue) => (
          <StatusBadge key={issue.code} variant="warning">{issue.message}</StatusBadge>
        ))}
      </ConsoleSection>
    );
  }

  return null;
}
