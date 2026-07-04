'use client';

import type { ReactNode } from 'react';
import { BroadcastPanel, cn } from '@ubos/ui';

export function CenterProgramWorkspace({
  viewModeSelector,
  children,
  statusFooter,
  className,
}: {
  viewModeSelector?: ReactNode;
  children: ReactNode;
  statusFooter?: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-ubos-carbon',
        className,
      )}
    >
      {viewModeSelector ? (
        <div className="shrink-0 border-b border-ubos-border-subtle px-ubos-3 py-ubos-2">
          {viewModeSelector}
        </div>
      ) : null}

      <BroadcastPanel
        variant="inset"
        padding={false}
        className="mx-ubos-2 mt-ubos-2 min-h-0 flex-1 overflow-hidden border-ubos-program-border shadow-ubos-program-glow"
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden p-ubos-1">{children}</div>
      </BroadcastPanel>

      {statusFooter ? (
        <footer className="shrink-0 border-t border-ubos-border-subtle px-ubos-3 py-ubos-2">
          {statusFooter}
        </footer>
      ) : null}
    </main>
  );
}
