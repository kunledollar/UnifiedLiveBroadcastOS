'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';

export function CollaborationEmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[4rem] items-center justify-center rounded-ubos-md border border-dashed border-ubos-border-subtle bg-ubos-midnight/40 px-ubos-3 py-ubos-4 text-center',
        className,
      )}
    >
      <span className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>{message}</span>
    </div>
  );
}
