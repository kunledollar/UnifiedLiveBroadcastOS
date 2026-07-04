import type {
  BroadcastDestination,
  BroadcastDestinationStatus,
  BroadcastPlatform,
  OutputFormat,
  OutputHealth,
  OutputHealthStatus,
  OutputRoute,
  OutputRouteStatus,
  OutputSourceView,
  StreamProfile,
} from '@ubos/shared';

export const SOURCE_VIEWS: OutputSourceView[] = [
  'program',
  'vertical',
  'horizontal',
  'clean',
  'aux',
  'confidence',
  'multiview',
];

export function platformLabel(platform: BroadcastPlatform): string {
  const labels: Record<BroadcastPlatform, string> = {
    youtube: 'YouTube',
    facebook: 'Facebook',
    twitch: 'Twitch',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    kick: 'Kick',
    x: 'X / Twitter',
    instagram: 'Instagram',
    custom_rtmp: 'Custom RTMP',
    srt: 'SRT',
    rist: 'RIST',
    ndi: 'NDI',
    local_recording: 'Local Recording',
    cloud_archive: 'Cloud Archive',
    clean_feed: 'Clean Feed',
    aux_output: 'Aux Output',
    confidence_output: 'Confidence Output',
  };
  return labels[platform] ?? platform;
}

export function outputFormatLabel(format: OutputFormat): string {
  const labels: Record<OutputFormat, string> = {
    horizontal_16_9: '16:9 Horizontal',
    vertical_9_16: '9:16 Vertical',
    square_1_1: '1:1 Square',
    clean: 'Clean Feed',
    aux: 'Aux',
    confidence: 'Confidence',
  };
  return labels[format] ?? format;
}

export function destinationStatusVariant(
  status: BroadcastDestinationStatus,
): 'offline' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'connected':
    case 'ready':
      return 'success';
    case 'error':
      return 'error';
    case 'unavailable':
      return 'warning';
    case 'disabled':
      return 'neutral';
    default:
      return 'offline';
  }
}

export function routeStatusVariant(
  status: OutputRouteStatus,
): 'offline' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'ready':
    case 'assigned':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'neutral';
  }
}

export function healthStatusVariant(
  status: OutputHealthStatus,
): 'offline' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'offline':
      return 'offline';
    case 'unavailable':
      return 'error';
    default:
      return 'neutral';
  }
}

export function getDestinationRoute(
  destinationId: string,
  routes: OutputRoute[],
): OutputRoute | undefined {
  return routes.find((route) => route.destinationId === destinationId);
}

export function getDestinationHealth(
  destinationId: string,
  health: OutputHealth[],
): OutputHealth | undefined {
  return health.find((item) => item.destinationId === destinationId);
}

export function getStreamProfile(
  profileId: string,
  profiles: StreamProfile[],
): StreamProfile | undefined {
  return profiles.find((profile) => profile.id === profileId);
}

export function getRecordingDestinations(destinations: BroadcastDestination[]): BroadcastDestination[] {
  return destinations.filter((destination) =>
    ['local_recording', 'cloud_archive', 'clean_feed'].includes(destination.platform),
  );
}

export function outputHealthSummaryLabel(input: {
  destinations: BroadcastDestination[];
  health: OutputHealth[];
}): string {
  const active = input.destinations.filter(
    (destination) => destination.status === 'connected' || destination.status === 'ready',
  ).length;
  const degraded = input.health.filter((item) => item.status === 'degraded').length;
  const unavailable = input.health.filter((item) => item.status === 'unavailable').length;

  if (!input.destinations.length) return 'Outputs idle';
  if (unavailable === input.health.length) return 'Health unavailable';
  if (degraded > 0) return `Outputs degraded (${degraded})`;
  if (active > 0) return `Outputs ready (${active})`;
  return 'Outputs disconnected';
}

export function formatBitrate(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return 'unavailable';
  return `${value} kbps`;
}

export function formatLatency(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return 'unavailable';
  return `${value} ms`;
}

export function formatMetric(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return 'unavailable';
  return String(value);
}

export function getMatrixCell(
  sourceView: OutputSourceView,
  destinationId: string,
  routes: OutputRoute[],
): OutputRoute | undefined {
  return routes.find(
    (route) => route.sourceView === sourceView && route.destinationId === destinationId,
  );
}
