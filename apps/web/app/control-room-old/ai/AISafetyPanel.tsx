'use client';

import { ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { AIAssistantMode } from '@ubos/shared';
import { aiModeLabel } from './ai-utils';

const FORBIDDEN_ACTIONS = [
  'Switch Program',
  'Start/stop stream',
  'Start/stop recording',
  'Remove guests',
  'Publish graphics',
  'Execute automation',
  'Change routing',
] as const;

export function AISafetyPanel({
  mode,
  className,
}: {
  mode: AIAssistantMode;
  className?: string;
}) {
  return (
    <ConsoleSection title="AI Safety" {...(className ? { className } : {})}>
      <InspectorRow
        label="Mode"
        value={<StatusBadge variant="neutral">{aiModeLabel(mode)}</StatusBadge>}
      />
      <InspectorRow
        label="Execution"
        value={<StatusBadge variant="warning">Requires operator approval</StatusBadge>}
      />
      <InspectorRow label="Autonomous switching" value="Disabled" />
      <div className="mt-2 space-y-1">
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          AI may only observe metadata and suggest actions:
        </p>
        <ul className="list-inside list-disc space-y-0.5 text-ubos-caption text-ubos-fg-secondary">
          {FORBIDDEN_ACTIONS.map((action) => (
            <li key={action}>AI cannot {action.toLowerCase()}</li>
          ))}
        </ul>
      </div>
      <p className={cn(ubosTypographyClasses.metadata, 'mt-2 text-ubos-warning-text')}>
        Human approval required for all AI suggestions. No production commands are executed in this phase.
      </p>
    </ConsoleSection>
  );
}
