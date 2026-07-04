'use client';

import type { ReactNode } from 'react';
import { OperationsPanel } from './OperationsChrome';

export function PreviewPanel({ monitor }: { monitor: ReactNode }) {
  return (
    <OperationsPanel title="Preview">
      <p className="text-ubos-metadata text-ubos-fg-muted">
        Compact preview monitor. Program output remains dominant in the center workspace.
      </p>
      <div className="h-48 shrink-0 overflow-hidden rounded-ubos-md border border-ubos-border-subtle">
        {monitor}
      </div>
    </OperationsPanel>
  );
}
