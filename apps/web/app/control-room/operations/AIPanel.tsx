'use client';

import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { OperationsPanel } from './OperationsChrome';

export function AIPanel() {
  return (
    <OperationsPanel title="AI Assistant">
      <ConsoleSection title="Status">
        <InspectorRow
          label="AI assistant"
          value={<StatusBadge variant="offline">Not enabled</StatusBadge>}
        />
        <InspectorRow
          label="Automation"
          value={<StatusBadge variant="neutral">Inactive</StatusBadge>}
        />
        <InspectorRow
          label="Recommendations"
          value={<StatusBadge variant="neutral">Unavailable</StatusBadge>}
        />
      </ConsoleSection>
      <p className="text-ubos-caption text-ubos-fg-muted">
        AI assistant not enabled. Automation and recommendations are unavailable in this build.
      </p>
    </OperationsPanel>
  );
}
