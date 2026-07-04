'use client';

import { ConsoleSection, InspectorRow, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { OperatorPresence, ProductionLock } from '@ubos/shared';

export function RemoteProductionPanel({
  operators,
  guestCount,
  locks,
  activeRouteCount,
  outputHealth,
  productionStatus,
  recoveryStatus,
  collaborationEnabled,
  className,
}: {
  operators: OperatorPresence[];
  guestCount: number;
  locks: ProductionLock[];
  activeRouteCount: number;
  outputHealth: string;
  productionStatus: string;
  recoveryStatus: string;
  collaborationEnabled: boolean;
  className?: string;
}) {
  const connectedOperators = operators.filter((op) => op.status === 'connected').length;
  const activeLocks = locks.filter((lock) => Date.parse(lock.expiresAt) > Date.now()).length;

  if (!collaborationEnabled) {
    return (
      <div className={cn('rounded-ubos-md border border-dashed border-ubos-border-subtle p-ubos-3', className)}>
        <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>
          Remote production not configured · Collaboration disabled
        </p>
      </div>
    );
  }

  return (
    <ConsoleSection title="Remote Production">
      <InspectorRow label="Connected operators" value={String(connectedOperators)} />
      <InspectorRow label="Connected guests" value={String(guestCount)} />
      <InspectorRow label="Active locks" value={String(activeLocks)} />
      <InspectorRow label="Routing" value={activeRouteCount ? `${activeRouteCount} routes` : 'not configured'} />
      <InspectorRow label="Output health" value={outputHealth} />
      <InspectorRow label="Production" value={productionStatus} />
      <InspectorRow label="Recovery" value={recoveryStatus} />
      <div className="flex flex-wrap gap-1 pt-2">
        <StatusBadge variant={connectedOperators > 0 ? 'success' : 'offline'}>
          {connectedOperators > 0 ? 'Team metadata ready' : 'Presence unavailable'}
        </StatusBadge>
      </div>
    </ConsoleSection>
  );
}
