'use client';

import type { BroadcastDestination } from '@ubos/shared';
import { BroadcastPanel, MonitorFrame, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { outputFormatLabel, platformLabel } from './distribution-utils';

const PLATFORM_PREVIEW_ORDER: BroadcastDestination['platform'][] = [
  'youtube',
  'tiktok',
  'instagram',
  'linkedin',
  'twitch',
  'custom_rtmp',
];

export function PlatformPreviewPanel({
  destinations,
  className,
}: {
  destinations: BroadcastDestination[];
  className?: string;
}) {
  const previews = PLATFORM_PREVIEW_ORDER.map((platform) =>
    destinations.find((destination) => destination.platform === platform),
  ).filter((destination): destination is BroadcastDestination => Boolean(destination));

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Platform Preview</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata preview only · No platform connection
        </p>
      </div>
      <div className="grid grid-cols-2 gap-ubos-2 p-ubos-2 xl:grid-cols-3">
        {previews.map((destination) => (
          <div key={destination.id} className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-primary')}>
                {platformLabel(destination.platform)}
              </span>
              <StatusBadge variant="neutral">{destination.status}</StatusBadge>
            </div>
            <MonitorFrame
              label={outputFormatLabel(destination.outputFormat)}
              aspectRatio={
                destination.outputFormat === 'vertical_9_16'
                  ? '9/16'
                  : destination.outputFormat === 'square_1_1'
                    ? '1/1'
                    : '16/9'
              }
              className="h-24"
            >
              <div className="flex h-full items-center justify-center text-ubos-metadata text-ubos-fg-muted">
                Metadata only
              </div>
            </MonitorFrame>
          </div>
        ))}
      </div>
    </BroadcastPanel>
  );
}
