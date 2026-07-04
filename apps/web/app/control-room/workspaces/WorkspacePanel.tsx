'use client';

import type { ReactNode } from 'react';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';

export function WorkspacePanel({
  title,
  subtitle,
  children,
  className,
  scroll = true,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  scroll?: boolean;
  compact?: boolean;
}) {
  return (
    <BroadcastPanel
      variant="inset"
      padding={false}
      className={cn('flex min-h-0 min-w-0 flex-col overflow-hidden border-0 shadow-none', className)}
    >
      <header className="shrink-0 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>{title}</h3>
        {subtitle ? (
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>{subtitle}</p>
        ) : null}
      </header>
      <div
        className={cn(
          'min-h-0 flex-1',
          scroll ? 'ubos-scroll overflow-y-auto' : 'overflow-hidden',
          compact ? 'p-ubos-1' : 'p-ubos-2',
        )}
      >
        {children}
      </div>
    </BroadcastPanel>
  );
}

export function WorkspacePanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[4rem] items-center justify-center rounded-ubos-md border border-dashed border-ubos-border-subtle bg-ubos-midnight/40 px-ubos-3 py-ubos-4 text-center">
      <span className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>{message}</span>
    </div>
  );
}
