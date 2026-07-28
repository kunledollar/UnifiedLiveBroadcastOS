'use client';

import { ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { AIAssistantState } from '@ubos/shared';
import { aiModeLabel, aiStatusLabel, aiStatusVariant } from './ai-utils';

export function AIProductionSummary({
  assistant,
  summaryLines,
  className,
}: {
  assistant: AIAssistantState;
  summaryLines: string[];
  className?: string;
}) {
  const unavailable =
    assistant.status === 'disabled' || assistant.status === 'unavailable';

  return (
    <ConsoleSection title="Production Summary" {...(className ? { className } : {})}>
      <InspectorRow
        label="Assistant"
        value={<StatusBadge variant={aiStatusVariant(assistant.status)}>{aiStatusLabel(assistant)}</StatusBadge>}
      />
      <InspectorRow label="Mode" value={aiModeLabel(assistant.mode)} />
      <InspectorRow label="Last updated" value={assistant.lastUpdated} />
      {unavailable ? (
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>
          {assistant.status === 'disabled'
            ? 'AI assistant not enabled'
            : 'Analysis unavailable'}
        </p>
      ) : summaryLines.length ? (
        <ul className="mt-1 space-y-0.5 text-ubos-caption text-ubos-fg-secondary">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>
          No production summary available
        </p>
      )}
    </ConsoleSection>
  );
}
