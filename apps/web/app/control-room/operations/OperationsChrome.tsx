'use client';

import type { ReactNode } from 'react';
import { cn, ubosTypographyClasses } from '@ubos/ui';

export function OperationsPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-h-0 flex-col gap-ubos-2', className)}>
      <div className="flex items-center justify-between gap-ubos-2">
        <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CompactOpsActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex shrink-0 flex-wrap items-center gap-0.5', className)}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}
