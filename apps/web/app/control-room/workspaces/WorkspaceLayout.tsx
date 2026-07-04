'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export function WorkspaceLayout({
  workspaceId,
  children,
  className,
}: {
  workspaceId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      key={workspaceId}
      className={cn(
        'h-full min-h-0 animate-ubos-fade-in overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}
