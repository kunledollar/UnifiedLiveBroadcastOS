'use client';

import type { ReactNode } from 'react';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import type { AudioChannel } from '@ubos/shared';
import type { AudioNode } from '@ubos/shared';
import { AudioGroups } from './AudioGroups';
import { ChannelStrip } from './ChannelStrip';
import { MasterChannel } from './MasterChannel';
import {
  fromAudioChannel,
  fromAudioNode,
  groupChannels,
  type ConsoleChannel,
} from './audio-console-utils';

export function DigitalAudioConsole({
  channels,
  graphChannels = [],
  recordingActive = false,
  className,
}: {
  channels: AudioChannel[];
  graphChannels?: AudioNode[];
  recordingActive?: boolean;
  className?: string;
}) {
  const consoleChannels: ConsoleChannel[] = channels.length
    ? channels.map(fromAudioChannel)
    : graphChannels.map(fromAudioNode);

  if (!consoleChannels.length) {
    return (
      <BroadcastPanel variant="inset" padding={false} className={cn('border-0 shadow-none', className)}>
        <div className="flex h-full items-center justify-between gap-ubos-3 px-ubos-3 py-ubos-2">
          <p className={cn(ubosTypographyClasses.caption, 'text-ubos-fg-muted')}>
            No audio channels configured
          </p>
          <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-disabled')}>
            Add sources to enable mixing
          </span>
        </div>
      </BroadcastPanel>
    );
  }

  const grouped = groupChannels(consoleChannels.filter((channel) => channel.group !== 'master'));
  const groupNodes = Object.fromEntries(
    Object.entries(grouped).map(([key, items]) => [
      key,
      items.map((channel) => <ChannelStrip key={channel.id} channel={channel} />),
    ]),
  ) as Partial<Record<string, ReactNode[]>>;

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('h-full border-0 shadow-none', className)}>
      <div className="flex h-full min-h-0 flex-col gap-ubos-2 px-ubos-2 py-ubos-2">
        <div className="flex shrink-0 flex-wrap items-center gap-ubos-2">
          <span className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            Digital Audio Console
          </span>
          {recordingActive ? <StatusBadge variant="rec">Recording</StatusBadge> : null}
          <StatusBadge variant="neutral">Monitor: Unavailable</StatusBadge>
        </div>

        <div className="ubos-scroll flex min-h-0 flex-1 items-stretch gap-ubos-3 overflow-x-auto overflow-y-hidden">
          <AudioGroups groups={groupNodes} />
          <div className="ml-auto shrink-0 border-l border-ubos-border-subtle pl-ubos-3">
            <MasterChannel channels={consoleChannels} />
          </div>
        </div>
      </div>
    </BroadcastPanel>
  );
}
