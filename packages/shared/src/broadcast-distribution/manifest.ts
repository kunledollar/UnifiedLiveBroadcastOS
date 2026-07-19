import type {
  BroadcastDestination,
  DistributionManifest,
  OutputHealth,
  OutputRoute,
  StreamProfile,
} from './types.js';

const now = () => new Date().toISOString();

export function createDefaultStreamProfiles(): StreamProfile[] {
  return [
    {
      id: 'profile-youtube-1080p',
      name: 'YouTube 1080p30',
      protocol: 'rtmps',
      resolution: '1920x1080',
      fps: 30,
      bitrateKbps: 6000,
      keyframeInterval: 2,
      encoder: 'h264',
      audioBitrateKbps: 160,
      status: 'ready',
    },
    {
      id: 'profile-vertical-1080p',
      name: 'Vertical 1080x1920',
      protocol: 'rtmps',
      resolution: '1080x1920',
      fps: 30,
      bitrateKbps: 4500,
      keyframeInterval: 2,
      encoder: 'h264',
      audioBitrateKbps: 128,
      status: 'ready',
    },
    {
      id: 'profile-srt-main',
      name: 'SRT Main Feed',
      protocol: 'srt',
      resolution: '1920x1080',
      fps: 60,
      bitrateKbps: 8000,
      keyframeInterval: 2,
      encoder: 'h264',
      audioBitrateKbps: 192,
      status: 'ready',
    },
    {
      id: 'profile-recording-master',
      name: 'Local Recording Master',
      protocol: 'recording',
      resolution: '1920x1080',
      fps: 30,
      bitrateKbps: 12000,
      keyframeInterval: 2,
      encoder: 'h264',
      audioBitrateKbps: 256,
      status: 'ready',
    },
  ];
}

export function createSampleBroadcastDestinations(timestamp = now()): BroadcastDestination[] {
  const redacted = {
    streamKeyConfigured: false,
    endpointConfigured: true,
    authConfigured: false,
    redactedEndpoint: 'rtmps://***.live.example.com/app',
  };

  return [
    {
      id: 'dest-youtube',
      name: 'YouTube Live',
      platform: 'youtube',
      status: 'disconnected',
      outputFormat: 'horizontal_16_9',
      streamProfileId: 'profile-youtube-1080p',
      routeId: 'route-program-youtube',
      redactedConfig: redacted,
      health: 'unavailable',
      warnings: ['Stream key not configured'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-facebook',
      name: 'Facebook Live',
      platform: 'facebook',
      status: 'disconnected',
      outputFormat: 'horizontal_16_9',
      streamProfileId: 'profile-youtube-1080p',
      routeId: 'route-program-facebook',
      redactedConfig: redacted,
      health: 'unavailable',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-tiktok',
      name: 'TikTok Live',
      platform: 'tiktok',
      status: 'disabled',
      outputFormat: 'vertical_9_16',
      streamProfileId: 'profile-vertical-1080p',
      routeId: 'route-vertical-tiktok',
      redactedConfig: { ...redacted, endpointConfigured: false },
      health: 'offline',
      warnings: ['Output route missing', 'Streaming runtime unavailable'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-instagram',
      name: 'Instagram Live',
      platform: 'instagram',
      status: 'unavailable',
      outputFormat: 'square_1_1',
      streamProfileId: 'profile-vertical-1080p',
      routeId: 'route-vertical-instagram',
      redactedConfig: redacted,
      health: 'unavailable',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-twitch',
      name: 'Twitch',
      platform: 'twitch',
      status: 'disconnected',
      outputFormat: 'horizontal_16_9',
      streamProfileId: 'profile-youtube-1080p',
      routeId: 'route-program-twitch',
      redactedConfig: redacted,
      health: 'unavailable',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-custom-rtmp',
      name: 'Custom RTMP',
      platform: 'custom_rtmp',
      status: 'disconnected',
      outputFormat: 'horizontal_16_9',
      streamProfileId: 'profile-srt-main',
      redactedConfig: redacted,
      health: 'unavailable',
      warnings: ['Stream key redacted'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-local-recording',
      name: 'Local Recording',
      platform: 'local_recording',
      status: 'ready',
      outputFormat: 'clean',
      streamProfileId: 'profile-recording-master',
      routeId: 'route-clean-recording',
      redactedConfig: {
        streamKeyConfigured: false,
        endpointConfigured: true,
        authConfigured: false,
        redactedEndpoint: 'file:///recordings/show-master',
      },
      health: 'unknown',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-cloud-archive',
      name: 'Cloud Archive',
      platform: 'cloud_archive',
      status: 'disabled',
      outputFormat: 'clean',
      streamProfileId: 'profile-recording-master',
      redactedConfig: {
        streamKeyConfigured: false,
        endpointConfigured: false,
        authConfigured: false,
      },
      health: 'unavailable',
      warnings: ['No archive destination'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'dest-confidence',
      name: 'Confidence Output',
      platform: 'confidence_output',
      status: 'ready',
      outputFormat: 'confidence',
      streamProfileId: 'profile-youtube-1080p',
      routeId: 'route-confidence-guests',
      redactedConfig: {
        streamKeyConfigured: false,
        endpointConfigured: true,
        authConfigured: false,
      },
      health: 'healthy',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

export function createSampleOutputRoutes(destinations: BroadcastDestination[]): OutputRoute[] {
  const find = (id: string) => destinations.find((destination) => destination.id === id)?.id ?? id;
  return [
    {
      id: 'route-program-youtube',
      destinationId: find('dest-youtube'),
      sourceView: 'program',
      status: 'assigned',
    },
    {
      id: 'route-program-facebook',
      destinationId: find('dest-facebook'),
      sourceView: 'program',
      status: 'assigned',
    },
    {
      id: 'route-program-twitch',
      destinationId: find('dest-twitch'),
      sourceView: 'program',
      status: 'assigned',
    },
    {
      id: 'route-vertical-tiktok',
      destinationId: find('dest-tiktok'),
      sourceView: 'vertical',
      status: 'warning',
      warnings: ['Output format mismatch warning'],
    },
    {
      id: 'route-vertical-instagram',
      destinationId: find('dest-instagram'),
      sourceView: 'vertical',
      status: 'assigned',
    },
    {
      id: 'route-clean-recording',
      destinationId: find('dest-local-recording'),
      sourceView: 'clean',
      status: 'ready',
    },
    {
      id: 'route-confidence-guests',
      destinationId: find('dest-confidence'),
      sourceView: 'confidence',
      status: 'ready',
    },
  ];
}

export function createSampleOutputHealth(destinations: BroadcastDestination[]): OutputHealth[] {
  return destinations.map((destination) => ({
    destinationId: destination.id,
    status: destination.health,
    ...(destination.status === 'ready' || destination.status === 'connected'
      ? {}
      : {
          lastError:
            destination.status === 'error'
              ? 'Destination error metadata only'
              : 'Health telemetry unavailable',
        }),
  }));
}

export function createDistributionManifest(input?: {
  destinations?: BroadcastDestination[];
  streamProfiles?: StreamProfile[];
  outputRoutes?: OutputRoute[];
}): DistributionManifest {
  const streamProfiles = input?.streamProfiles ?? createDefaultStreamProfiles();
  const destinations = input?.destinations ?? createSampleBroadcastDestinations();
  const outputRoutes = input?.outputRoutes ?? createSampleOutputRoutes(destinations);
  return {
    destinations,
    streamProfiles,
    outputRoutes,
    containsRuntimeHandles: false,
    containsSecrets: false,
  };
}

export function isDistributionManifestReplaySafe(manifest: DistributionManifest): boolean {
  return manifest.containsRuntimeHandles === false && manifest.containsSecrets === false;
}
