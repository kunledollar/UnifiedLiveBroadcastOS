'use client';

import type { DevicePluginDefinition } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { pluginStatusVariant, protocolLabel } from './device-utils';

export function PluginBrowser({
  plugins,
  className,
}: {
  plugins: DevicePluginDefinition[];
  className?: string;
}) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Plugin Browser</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Future integrations · No SDK loaded
        </p>
      </div>
      <div className="grid gap-1 p-ubos-2 sm:grid-cols-2">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-1.5"
          >
            <div className="flex items-center justify-between gap-1">
              <span className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>{plugin.name}</span>
              <StatusBadge variant={pluginStatusVariant(plugin.status)}>{plugin.status}</StatusBadge>
            </div>
            <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
              {plugin.manufacturer}
            </p>
            <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
              {plugin.protocols.map(protocolLabel).join(' · ')}
            </p>
          </div>
        ))}
      </div>
    </BroadcastPanel>
  );
}
