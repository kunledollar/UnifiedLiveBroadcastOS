'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export function OperatorFeedback({
  message,
  programSceneName,
  className,
}: {
  message: string | null;
  programSceneName: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-ubos-2 rounded-ubos-sm border border-ubos-selection-border bg-ubos-selection-muted px-ubos-2 py-1',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <StatusBadge variant="success">{message}</StatusBadge>
      <span className={cn(ubosTypographyClasses.metadata, 'ubos-truncate text-ubos-fg-secondary')}>
        {programSceneName}
      </span>
      <StatusBadge variant="live">Live</StatusBadge>
    </div>
  );
}
