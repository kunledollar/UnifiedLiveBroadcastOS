'use client';

import type { OperatorPresence } from '@ubos/shared';
import { AssetList, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CollaborationEmptyState } from './CollaborationEmptyState';
import { formatOperatorRole, presenceStatusVariant } from './collaboration-utils';

export function OperatorPresencePanel({
  operators,
  collaborationEnabled,
  className,
}: {
  operators: OperatorPresence[];
  collaborationEnabled: boolean;
  className?: string;
}) {
  if (!collaborationEnabled && !operators.length) {
    return (
      <CollaborationEmptyState
        message="Collaboration disabled · No operators connected"
        {...(className ? { className } : {})}
      />
    );
  }

  if (!operators.length) {
    return (
      <CollaborationEmptyState
        message="No operators connected"
        {...(className ? { className } : {})}
      />
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        {operators.length} operator{operators.length === 1 ? '' : 's'}
        {operators.some((op) => op.isSimulation) ? ' · Demo simulation metadata' : ''}
      </p>
      <AssetList isEmpty={false}>
        {operators.map((operator) => (
          <div
            key={operator.id}
            className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-2"
          >
            <div className="flex items-center justify-between gap-ubos-2">
              <div className="min-w-0">
                <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
                  {operator.name}
                  {operator.isLocal ? ' (You)' : ''}
                </div>
                <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                  {formatOperatorRole(operator.role)} · {operator.activeWorkspace ?? 'workspace n/a'} ·{' '}
                  {operator.currentPanel ?? 'panel n/a'}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <StatusBadge variant={presenceStatusVariant(operator.status)}>{operator.status}</StatusBadge>
                {operator.lockCount ? (
                  <StatusBadge variant="warning">{operator.lockCount} lock(s)</StatusBadge>
                ) : null}
              </div>
            </div>
            {operator.selectedObject ? (
              <p className={cn(ubosTypographyClasses.caption, 'mt-1 text-ubos-fg-muted')}>
                Selection: {operator.selectedObject.label}
              </p>
            ) : null}
          </div>
        ))}
      </AssetList>
    </div>
  );
}
