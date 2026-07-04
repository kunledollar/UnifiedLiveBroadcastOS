'use client';

import type { RoutingEndpoint } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DeviceEmptyState } from './DeviceEmptyState';
import { getRouteAssignment, getRoutingInputs, getRoutingOutputs } from './device-utils';

export function RoutingMatrix({
  routingEndpoints,
  className,
}: {
  routingEndpoints: RoutingEndpoint[];
  className?: string;
}) {
  const inputs = getRoutingInputs(routingEndpoints);
  const outputs = getRoutingOutputs(routingEndpoints);

  if (!inputs.length || !outputs.length) {
    return <DeviceEmptyState message="Routing unavailable" {...(className ? { className } : {})} />;
  }

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Routing Matrix</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata routing assignments · No real routing
        </p>
      </div>
      <div className="overflow-x-auto p-ubos-2">
        <table className="w-full min-w-[28rem] border-collapse text-ubos-caption">
          <thead>
            <tr className="border-b border-ubos-border-subtle text-left text-ubos-fg-muted">
              <th className="px-2 py-1 font-medium">Source</th>
              {outputs.map((output) => (
                <th key={output.id} className="px-2 py-1 font-medium">
                  {output.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inputs.map((input) => (
              <tr key={input.id} className="border-b border-ubos-border-subtle/60">
                <td className="px-2 py-1 font-medium text-ubos-fg-secondary">{input.label}</td>
                {outputs.map((output) => {
                  const assignment = getRouteAssignment(input.id, output.id, routingEndpoints);
                  return (
                    <td key={`${input.id}-${output.id}`} className="px-2 py-1">
                      {assignment ? (
                        <StatusBadge variant="success">assigned</StatusBadge>
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
