import { GuestStatus, type Guest, type SceneSource, type SceneSourceType } from '@ubos/shared';

export type SourceHealthFilter = 'all' | 'ready' | 'offline' | 'unavailable' | 'mock';
export type SourceHealthStatus =
  | 'ready'
  | 'offline'
  | 'permission_required'
  | 'unavailable'
  | 'mock'
  | 'hidden';

const sourceTypeLabels: Record<SceneSourceType, string> = {
  camera: 'Camera',
  screen: 'Screen',
  media: 'Media',
  overlay: 'Overlay',
  browser: 'Browser',
  audio: 'Audio',
  guest: 'Guest',
};

export function getSourceTypeLabel(type: SceneSourceType) {
  return sourceTypeLabels[type] ?? type;
}

export function deriveSourceHealth(source: SceneSource, guests: Guest[]): SourceHealthStatus {
  if (!source.isVisible) return 'hidden';

  const runtimeStatus = String(source.settings?.runtimeStatus ?? '');
  if (runtimeStatus === 'mock') return 'mock';
  if (runtimeStatus === 'permission_required') return 'permission_required';
  if (runtimeStatus === 'unavailable') return 'unavailable';

  if (source.type === 'guest') {
    const guestId = String(source.settings?.guestId ?? '');
    const guest = guests.find((item) => item.id === guestId);
    if (
      guest &&
      [GuestStatus.Disconnected, GuestStatus.Removed, GuestStatus.Rejected].includes(guest.status)
    ) {
      return 'offline';
    }
  }

  if (!source.isVisible) return 'offline';
  return 'ready';
}

export function sourceHealthLabel(status: SourceHealthStatus) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'offline':
      return 'Offline';
    case 'permission_required':
      return 'Permission required';
    case 'unavailable':
      return 'Unavailable';
    case 'mock':
      return 'Mock';
    case 'hidden':
      return 'Hidden';
  }
}

export function sourceHealthVariant(status: SourceHealthStatus) {
  switch (status) {
    case 'ready':
      return 'success' as const;
    case 'mock':
    case 'permission_required':
      return 'warning' as const;
    case 'offline':
    case 'unavailable':
    case 'hidden':
      return 'offline' as const;
  }
}

export function getSourceTelemetry(source: SceneSource) {
  const resolution = source.settings?.resolution;
  const fps = source.settings?.fps;
  const resolutionLabel = typeof resolution === 'string' ? resolution : undefined;
  const fpsLabel = typeof fps === 'number' || typeof fps === 'string' ? String(fps) : undefined;
  const audioEnabled = source.type === 'audio' ? !source.muted : source.settings?.audioEnabled;

  return {
    resolution: resolutionLabel,
    fps: fpsLabel,
    audioEnabled: typeof audioEnabled === 'boolean' ? audioEnabled : undefined,
  };
}

export function filterSources({
  sources,
  search,
  typeFilter,
  healthFilter,
  guests,
}: {
  sources: SceneSource[];
  search: string;
  typeFilter: SceneSourceType | 'all';
  healthFilter: SourceHealthFilter;
  guests: Guest[];
}) {
  const query = search.trim().toLowerCase();
  return sources.filter((source) => {
    const health = deriveSourceHealth(source, guests);
    if (typeFilter !== 'all' && source.type !== typeFilter) return false;
    if (healthFilter === 'ready' && health !== 'ready') return false;
    if (healthFilter === 'offline' && health !== 'offline' && health !== 'hidden') return false;
    if (healthFilter === 'unavailable' && health !== 'unavailable') return false;
    if (healthFilter === 'mock' && health !== 'mock') return false;

    if (!query) return true;
    return (
      source.name.toLowerCase().includes(query) ||
      getSourceTypeLabel(source.type).toLowerCase().includes(query)
    );
  });
}

export const sourceAddTypes: SceneSourceType[] = [
  'camera',
  'screen',
  'media',
  'browser',
  'audio',
  'overlay',
];
