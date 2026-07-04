'use client';

import { StatusBadge } from '@ubos/ui';
import type { ConsoleChannel } from './audio-console-utils';
import { deriveChannelHealth, healthLabel, healthVariant } from './audio-console-utils';

export function ChannelStatus({ channel }: { channel: ConsoleChannel }) {
  const health = deriveChannelHealth(channel);
  return <StatusBadge variant={healthVariant(health)}>{healthLabel(health)}</StatusBadge>;
}
