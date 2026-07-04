'use client';

import type { ProductionLock } from '@ubos/shared';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CollaborationEmptyState } from './CollaborationEmptyState';
import { formatLockAge } from './collaboration-utils';

export function ProductionLocksPanel({
  locks,
  conflicts = 0,
  className,
}: {
  locks: ProductionLock[];
  conflicts?: number;
  className?: string;
}) {
  const activeLocks = locks.filter((lock) => Date.parse(lock.expiresAt) > Date.now());

  if (!activeLocks.length) {
    return (
      <CollaborationEmptyState
        message={locks.length ? 'No active locks · Lock metadata unavailable' : 'No active locks'}
        {...(className ? { className } : {})}
      />
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {conflicts > 0 ? (
        <StatusBadge variant="warning">Conflict detected · {conflicts} open</StatusBadge>
      ) : null}
      {activeLocks.map((lock) => (
        <div
          key={lock.id}
          className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-2"
        >
          <div className="flex items-center justify-between gap-ubos-2">
            <span className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>
              {lock.label ?? `${lock.lockType} · ${lock.targetId}`}
            </span>
            <StatusBadge variant={lock.conflictStatus === 'conflict' ? 'warning' : 'neutral'}>
              {lock.lockType}
            </StatusBadge>
          </div>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Owner: {lock.ownerName ?? lock.ownerOperatorId} · {formatLockAge(lock.createdAt)} · expires{' '}
            {formatLockAge(lock.expiresAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
