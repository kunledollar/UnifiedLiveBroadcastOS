'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { ConsoleChannel } from './audio-console-utils';
import { AudioMeter, PeakIndicator } from './AudioMeter';
import { MuteButton } from './ChannelControls';

export function MasterChannel({
  channels,
  className,
}: {
  channels: ConsoleChannel[];
  className?: string;
}) {
  const master =
    channels.find((channel) => channel.kind === 'master' || channel.label.toLowerCase().includes('master')) ??
    null;

  const levels = channels
    .map((channel) => channel.level)
    .filter((level): level is number => level !== null);
  const aggregateLevel =
    master?.level ?? (levels.length ? Math.max(...levels) : null);
  const muted = master?.muted ?? channels.every((channel) => channel.muted);

  return (
    <div
      className={cn(
        'flex w-[5.5rem] shrink-0 flex-col items-center gap-ubos-1 rounded-ubos-sm border border-ubos-selection-border bg-ubos-midnight px-1.5 py-ubos-2 shadow-ubos-selection-glow',
        className,
      )}
    >
      <span className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>Master</span>
      <StatusBadge variant={aggregateLevel === null ? 'offline' : muted ? 'neutral' : 'success'}>
        {aggregateLevel === null ? 'Unavailable' : muted ? 'Muted' : 'Output'}
      </StatusBadge>
      <AudioMeter level={aggregateLevel} muted={muted} className="h-20" />
      <MuteButton muted={muted} />
      <PeakIndicator level={aggregateLevel} muted={muted} />
    </div>
  );
}
