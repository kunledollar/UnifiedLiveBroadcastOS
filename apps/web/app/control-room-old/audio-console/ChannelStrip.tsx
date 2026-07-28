'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';
import type { ConsoleChannel } from './audio-console-utils';
import { AudioMeter, GainIndicator, PeakIndicator } from './AudioMeter';
import { MuteButton, SoloButton } from './ChannelControls';
import { ChannelStatus } from './ChannelStatus';

export function ChannelStrip({
  channel,
  compact = false,
  className,
}: {
  channel: ConsoleChannel;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex w-[4.5rem] shrink-0 flex-col items-center gap-ubos-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-1 py-ubos-2',
        className,
      )}
    >
      <span
        className={cn(
          ubosTypographyClasses.metadata,
          'w-full ubos-truncate text-center font-bold uppercase text-ubos-fg-secondary',
        )}
        title={channel.label}
      >
        {compact ? channel.label.slice(0, 4) : channel.label}
      </span>

      <ChannelStatus channel={channel} />

      <AudioMeter level={channel.level} muted={channel.muted} />

      <div className="flex gap-0.5">
        <MuteButton muted={channel.muted} />
        <SoloButton />
      </div>

      <div className="grid w-full grid-cols-2 gap-0.5 text-center">
        <div>
          <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Gain</span>
          <GainIndicator gain={channel.gain} />
        </div>
        <div>
          <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Peak</span>
          <PeakIndicator level={channel.level} muted={channel.muted} />
        </div>
      </div>
    </div>
  );
}
