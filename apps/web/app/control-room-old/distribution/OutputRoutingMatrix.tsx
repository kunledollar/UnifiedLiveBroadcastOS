'use client';

import type { BroadcastDestination, OutputRoute } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DistributionEmptyState } from './DistributionEmptyState';
import { SOURCE_VIEWS, getMatrixCell, platformLabel, routeStatusVariant } from './distribution-utils';

export function OutputRoutingMatrix({
  destinations,
  outputRoutes,
  className,
}: {
  destinations: BroadcastDestination[];
  outputRoutes: OutputRoute[];
  className?: string;
}) {
  if (!destinations.length) {
    return <DistributionEmptyState message="Output route missing" {...(className ? { className } : {})} />;
  }

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Output Routing Matrix</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata routing · No live publishing
        </p>
      </div>
      <div className="overflow-x-auto p-ubos-2">
        <table className="w-full min-w-[32rem] border-collapse text-ubos-caption">
          <thead>
            <tr className="border-b border-ubos-border-subtle text-left text-ubos-fg-muted">
              <th className="px-2 py-1 font-medium">Source</th>
              {destinations.map((destination) => (
                <th key={destination.id} className="px-2 py-1 font-medium">
                  {platformLabel(destination.platform)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCE_VIEWS.map((sourceView) => (
              <tr key={sourceView} className="border-b border-ubos-border-subtle/60">
                <td className="px-2 py-1 font-medium capitalize text-ubos-fg-secondary">{sourceView}</td>
                {destinations.map((destination) => {
                  const route = getMatrixCell(sourceView, destination.id, outputRoutes);
                  return (
                    <td key={`${sourceView}-${destination.id}`} className="px-2 py-1">
                      {route ? (
                        <div className="space-y-0.5">
                          <StatusBadge variant={routeStatusVariant(route.status)}>{route.status}</StatusBadge>
                          {route.warnings?.length ? (
                            <div className="text-ubos-metadata text-ubos-warning-text">
                              {route.warnings[0]}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-ubos-fg-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BroadcastPanel>
  );
}
