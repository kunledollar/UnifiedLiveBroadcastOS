'use client';

import type { ProtocolDefinition } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DeviceEmptyState } from './DeviceEmptyState';
import { protocolLabel } from './device-utils';

export function ProtocolPanel({
  protocols,
  selectedProtocolId,
  onSelectProtocol,
  className,
}: {
  protocols: ProtocolDefinition[];
  selectedProtocolId?: string | null;
  onSelectProtocol?: (protocolId: string) => void;
  className?: string;
}) {
  const selected =
    protocols.find((protocol) => protocol.id === selectedProtocolId) ?? protocols[0] ?? null;

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Protocol Manager</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Protocol definitions only · No communication
        </p>
      </div>
      <div className="space-y-ubos-2 p-ubos-2">
        {!protocols.length ? (
          <DeviceEmptyState message="No protocols configured" />
        ) : (
          <>
            <div className="flex flex-wrap gap-1">
              {protocols.map((protocol) => (
                <button
                  key={protocol.id}
                  type="button"
                  onClick={() => onSelectProtocol?.(protocol.id)}
                  className={cn(
                    'rounded-ubos-sm border px-2 py-1 text-ubos-caption',
                    selected?.id === protocol.id
                      ? 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text'
                      : 'border-ubos-border-subtle bg-ubos-midnight/50 text-ubos-fg-secondary',
                  )}
                >
                  {protocol.name}
                </button>
              ))}
            </div>
            {selected ? (
              <div className="space-y-1 text-ubos-caption text-ubos-fg-secondary">
                <div className="flex flex-wrap gap-1">
                  <StatusBadge variant="neutral">{protocolLabel(selected.protocol)}</StatusBadge>
                  <StatusBadge variant="neutral">v{selected.version}</StatusBadge>
                  <StatusBadge variant="neutral">{selected.transport}</StatusBadge>
                </div>
                <p>Auth: {selected.authentication}</p>
                <p>Capabilities: {selected.capabilities.join(', ')}</p>
                <p>Commands: {selected.supportedCommands.join(', ')}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </BroadcastPanel>
  );
}
