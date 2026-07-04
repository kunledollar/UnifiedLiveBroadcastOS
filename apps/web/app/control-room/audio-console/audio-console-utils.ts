import type { AudioChannel } from '@ubos/shared';
import type { AudioNode } from '@ubos/shared';

export type ConsoleChannel = {
  id: string;
  label: string;
  level: number | null;
  muted: boolean;
  gain: number | null;
  kind: AudioChannel['kind'] | 'master' | 'aux' | 'browser' | 'desktop' | 'replay';
  group: AudioGroupId;
};

export type AudioGroupId =
  | 'microphones'
  | 'remote'
  | 'media'
  | 'system'
  | 'master';

export const audioGroupLabels: Record<AudioGroupId, string> = {
  microphones: 'Microphones',
  remote: 'Remote',
  media: 'Media',
  system: 'System',
  master: 'Master',
};

export function inferGroup(
  kind: ConsoleChannel['kind'],
  label: string,
): AudioGroupId {
  const normalized = label.toLowerCase();
  if (kind === 'master' || normalized.includes('master')) return 'master';
  if (kind === 'guest' || normalized.includes('guest')) return 'remote';
  if (kind === 'media' || normalized.includes('media') || normalized.includes('replay')) return 'media';
  if (
    kind === 'system' ||
    normalized.includes('system') ||
    normalized.includes('desktop') ||
    normalized.includes('browser')
  )
    return 'system';
  return 'microphones';
}

export function fromAudioChannel(channel: AudioChannel): ConsoleChannel {
  const kind = channel.label.toLowerCase().includes('master')
    ? 'master'
    : channel.kind;
  return {
    id: channel.id,
    label: channel.label,
    level: channel.muted ? 0 : channel.level,
    muted: channel.muted,
    gain: null,
    kind,
    group: inferGroup(kind, channel.label),
  };
}

export function fromAudioNode(node: AudioNode): ConsoleChannel {
  const label = node.label;
  const kind: ConsoleChannel['kind'] = node.guestId
    ? 'guest'
    : label.toLowerCase().includes('master')
      ? 'master'
      : label.toLowerCase().includes('media')
        ? 'media'
        : label.toLowerCase().includes('system')
          ? 'system'
          : 'mic';
  return {
    id: node.id,
    label: node.label,
    level: null,
    muted: node.muted,
    gain: node.gain,
    kind,
    group: inferGroup(kind, label),
  };
}

export function groupChannels(channels: ConsoleChannel[]) {
  const groups: Record<AudioGroupId, ConsoleChannel[]> = {
    microphones: [],
    remote: [],
    media: [],
    system: [],
    master: [],
  };
  for (const channel of channels) {
    groups[channel.group].push(channel);
  }
  return groups;
}

export type ChannelHealthStatus =
  | 'connected'
  | 'muted'
  | 'idle'
  | 'live'
  | 'warning'
  | 'offline'
  | 'unavailable'
  | 'no-signal';

export function deriveChannelHealth(channel: ConsoleChannel): ChannelHealthStatus {
  if (channel.muted) return 'muted';
  if (channel.level === null) return 'unavailable';
  if (channel.level <= 0) return 'no-signal';
  if (channel.level > 85) return 'warning';
  if (channel.level > 0) return 'live';
  return 'idle';
}

export function meterSegmentColor(levelPercent: number, muted: boolean) {
  if (muted) return 'bg-ubos-offline';
  if (levelPercent > 85) return 'bg-ubos-program';
  if (levelPercent > 65) return 'bg-ubos-warning';
  return 'bg-ubos-success';
}

export function healthVariant(status: ChannelHealthStatus) {
  switch (status) {
    case 'live':
    case 'connected':
      return 'success' as const;
    case 'muted':
    case 'idle':
      return 'neutral' as const;
    case 'warning':
      return 'warning' as const;
    case 'offline':
    case 'unavailable':
    case 'no-signal':
      return 'offline' as const;
  }
}

export function healthLabel(status: ChannelHealthStatus) {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'muted':
      return 'Muted';
    case 'idle':
      return 'Idle';
    case 'live':
      return 'Live';
    case 'warning':
      return 'Warning';
    case 'offline':
      return 'Offline';
    case 'unavailable':
      return 'Unavailable';
    case 'no-signal':
      return 'No Signal';
  }
}
