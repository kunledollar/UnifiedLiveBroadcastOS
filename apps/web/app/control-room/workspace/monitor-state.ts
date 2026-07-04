import { GuestStatus, type Guest, type MediaRoute, type Scene, type SceneSource } from '@ubos/shared';
import type { ProductionGraph } from '@ubos/shared';

export type OutputViewMode =
  | 'program'
  | 'multiview'
  | 'vertical'
  | 'horizontal'
  | 'clean'
  | 'aux'
  | 'confidence';

export const outputViewModes: Array<{
  value: OutputViewMode;
  label: string;
  description: string;
}> = [
  { value: 'program', label: 'Program', description: 'Main live 16:9 output' },
  { value: 'multiview', label: 'Multiview', description: 'Production monitoring grid' },
  { value: 'vertical', label: 'Vertical', description: '9:16 social output' },
  { value: 'horizontal', label: 'Horizontal', description: '16:9 horizontal output' },
  { value: 'clean', label: 'Clean', description: 'Program without graphics' },
  { value: 'aux', label: 'Aux', description: 'Secondary output routing' },
  { value: 'confidence', label: 'Confidence', description: 'Guest/host return feed' },
];

const legacyViewModeMap: Record<string, OutputViewMode> = {
  dual: 'program',
  program: 'program',
  compact: 'program',
  vertical: 'vertical',
  multiview: 'multiview',
};

export function normalizeOutputViewMode(value: string | null | undefined): OutputViewMode {
  if (!value) return 'program';
  if (value in legacyViewModeMap) return legacyViewModeMap[value]!;
  if (outputViewModes.some((mode) => mode.value === value)) return value as OutputViewMode;
  return 'program';
}

export function getVisibleSources(scene: Scene, options?: { excludeGraphics?: boolean }) {
  const sources = scene.sources.filter((source) => source.isVisible);
  if (!options?.excludeGraphics) return sources;
  return sources.filter((source) => !['overlay'].includes(source.type));
}

export function getSceneWithoutGraphics(scene: Scene): Scene {
  return {
    ...scene,
    sources: scene.sources.filter((source) => source.type !== 'overlay'),
    overlays: [],
  };
}

export function getVerticalRoutes(routes: MediaRoute[]) {
  return routes.filter((route) => route.isActive && route.metadata?.onVertical === true);
}

export function getAuxRoutes(routes: MediaRoute[]) {
  return routes.filter((route) => route.isActive && !route.isOnProgram);
}

const disconnectedGuestStatuses = new Set<GuestStatus>([
  GuestStatus.Disconnected,
  GuestStatus.Removed,
  GuestStatus.Rejected,
]);

const connectedGuestStatuses = new Set<GuestStatus>([
  GuestStatus.Connected,
  GuestStatus.OnAir,
  GuestStatus.GreenRoom,
]);

export function getConfidenceRoute(routes: MediaRoute[], guests: Guest[]) {
  return routes.find(
    (route) =>
      route.isActive &&
      route.guestId &&
      connectedGuestStatuses.has(
        guests.find((guest) => guest.id === route.guestId)?.status ?? GuestStatus.Disconnected,
      ) &&
      route.routeType.includes('guest'),
  );
}

export function getProgramRoutes(routes: MediaRoute[]) {
  return routes.filter((route) => route.isActive && route.isOnProgram);
}

export function deriveMonitorTelemetry({
  routes,
  graph,
  healthFps,
}: {
  routes: MediaRoute[];
  graph?: ProductionGraph;
  healthFps?: string;
}) {
  const recording = graph?.recording;
  const recordingFps = recording?.metadata?.fps;
  const fps =
    typeof recordingFps === 'number'
      ? String(recordingFps)
      : healthFps && healthFps !== 'unavailable'
        ? healthFps
        : 'unavailable';

  const resolution =
    typeof recording?.metadata?.resolution === 'string'
      ? recording.metadata.resolution
      : '1920×1080';

  const onProgramCount = getProgramRoutes(routes).length;

  return {
    resolution,
    fps,
    isLive: onProgramCount > 0,
    recordingStatus: recording?.status ?? 'idle',
    outputStatus: onProgramCount > 0 ? `${onProgramCount} route${onProgramCount === 1 ? '' : 's'}` : 'standby',
  };
}

export function deriveSceneWarning({
  scene,
  routes,
  guests,
  role,
}: {
  scene: Scene;
  routes: MediaRoute[];
  guests: Guest[];
  role: 'program' | 'preview';
}) {
  const visibleSources = getVisibleSources(scene);
  if (!visibleSources.length) return 'No source assigned.';

  const offlineGuestSource = visibleSources.find((source) => {
    if (source.type !== 'guest') return false;
    const guestId = String(source.settings?.guestId ?? '');
    const guest = guests.find((item) => item.id === guestId);
    return guest ? disconnectedGuestStatuses.has(guest.status) : false;
  });
  if (offlineGuestSource) return 'Guest not connected.';

  const missingMedia = visibleSources.find(
    (source) => source.type === 'media' && !source.settings?.assetId && !source.settings?.url,
  );
  if (missingMedia) return 'Media not selected.';

  const browserSource = visibleSources.find((source) => source.type === 'browser');
  if (browserSource && !browserSource.settings?.url) return 'Browser source unavailable.';

  const activeRoutes = role === 'program' ? getProgramRoutes(routes) : routes.filter((route) => route.isActive);
  if (!activeRoutes.length && visibleSources.some((source) => source.type === 'camera' || source.type === 'guest')) {
    return 'Source offline.';
  }

  return undefined;
}

export function deriveEmptyStateMessage({
  mode,
  scene,
  routes,
  guests,
}: {
  mode: OutputViewMode | 'preview';
  scene: Scene;
  routes: MediaRoute[];
  guests: Guest[];
}): string | undefined {
  switch (mode) {
    case 'program':
    case 'horizontal': {
      const warning = deriveSceneWarning({ scene, routes, guests, role: 'program' });
      if (warning) return warning;
      return getVisibleSources(scene).length ? undefined : 'No source assigned.';
    }
    case 'preview': {
      const warning = deriveSceneWarning({ scene, routes, guests, role: 'preview' });
      if (warning) return warning;
      return getVisibleSources(scene).length ? undefined : 'No source assigned.';
    }
    case 'vertical':
      if (!getVerticalRoutes(routes).length) return 'Vertical output not configured.';
      return getVisibleSources(scene).length ? undefined : 'No source assigned.';
    case 'clean': {
      const cleanScene = getSceneWithoutGraphics(scene);
      if (!getVisibleSources(cleanScene).length) return 'Clean feed unavailable.';
      return undefined;
    }
    case 'aux':
      return getAuxRoutes(routes).length ? undefined : 'No aux output assigned.';
    case 'confidence':
      return getConfidenceRoute(routes, guests) ? undefined : 'Confidence monitor unavailable.';
    case 'multiview':
      return routes.some((route) => route.isActive) || scene.sources.length
        ? undefined
        : 'Multiview not active.';
    default:
      return undefined;
  }
}

export function getPrimarySourceLabel(scene: Scene) {
  const source = getVisibleSources(scene)[0];
  return source ? formatSourceLabel(source) : 'No source';
}

export function formatSourceLabel(source: SceneSource) {
  return `${source.name} · ${source.type}`;
}
