'use client';

import type { RemoteCollaborationEvent } from '@ubos/shared';
import { cn, ubosTypographyClasses } from '@ubos/ui';
import { CollaborationEmptyState } from './CollaborationEmptyState';

export function CollaborationTimeline({
  events,
  className,
}: {
  events: RemoteCollaborationEvent[];
  className?: string;
}) {
  if (!events.length) {
    return (
      <CollaborationEmptyState
        message="No collaboration events recorded"
        {...(className ? { className } : {})}
      />
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {events.slice(0, 20).map((event) => (
        <div
          key={event.id}
          className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/40 px-ubos-2 py-1.5"
        >
          <div className="flex items-center justify-between gap-ubos-2">
            <span className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-secondary')}>
              {event.message}
            </span>
            <span className={cn(ubosTypographyClasses.metadata, 'shrink-0 text-ubos-fg-muted')}>
              {event.type}
            </span>
          </div>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            {event.operatorName ?? event.operatorId ?? 'system'} ·{' '}
            {new Date(event.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}
