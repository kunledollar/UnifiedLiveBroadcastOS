export type BroadcastPlatform =
  | 'youtube'
  | 'facebook'
  | 'twitch'
  | 'linkedin'
  | 'tiktok'
  | 'kick'
  | 'x'
  | 'instagram'
  | 'custom_rtmp'
  | 'srt'
  | 'rist'
  | 'ndi'
  | 'local_recording'
  | 'cloud_archive'
  | 'clean_feed'
  | 'aux_output'
  | 'confidence_output';

export type BroadcastDestinationStatus =
  | 'disconnected'
  | 'connected'
  | 'ready'
  | 'unavailable'
  | 'error'
  | 'disabled';

export type OutputFormat =
  | 'horizontal_16_9'
  | 'vertical_9_16'
  | 'square_1_1'
  | 'clean'
  | 'aux'
  | 'confidence';

export type StreamProtocol =
  | 'rtmp'
  | 'rtmps'
  | 'srt'
  | 'rist'
  | 'ndi'
  | 'hls'
  | 'recording';

export type StreamProfileStatus = 'draft' | 'ready' | 'unavailable' | 'disabled';

export type OutputSourceView =
  | 'program'
  | 'vertical'
  | 'horizontal'
  | 'clean'
  | 'aux'
  | 'confidence'
  | 'multiview';

export type OutputRouteStatus = 'unassigned' | 'assigned' | 'ready' | 'warning' | 'error';

export type OutputHealthStatus = 'unknown' | 'healthy' | 'degraded' | 'offline' | 'unavailable';

export interface RedactedDestinationConfig {
  streamKeyConfigured: boolean;
  endpointConfigured: boolean;
  authConfigured: boolean;
  redactedEndpoint?: string;
}

export interface BroadcastDestination {
  id: string;
  name: string;
  platform: BroadcastPlatform;
  status: BroadcastDestinationStatus;
  outputFormat: OutputFormat;
  streamProfileId: string;
  routeId?: string;
  redactedConfig: RedactedDestinationConfig;
  health: OutputHealthStatus;
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StreamProfile {
  id: string;
  name: string;
  protocol: StreamProtocol;
  resolution: string;
  fps: number;
  bitrateKbps: number;
  keyframeInterval: number;
  encoder: string;
  audioBitrateKbps: number;
  status: StreamProfileStatus;
}

export interface OutputRoute {
  id: string;
  destinationId: string;
  sourceView: OutputSourceView;
  status: OutputRouteStatus;
  warnings?: string[];
}

export interface OutputHealth {
  destinationId: string;
  bitrateKbps?: number;
  latencyMs?: number;
  droppedFrames?: number;
  reconnectCount?: number;
  lastError?: string;
  status: OutputHealthStatus;
}

export interface DistributionManifest {
  destinations: BroadcastDestination[];
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  containsRuntimeHandles: false;
  containsSecrets: false;
}

export const DISTRIBUTION_COMMAND_STUBS = [
  'CREATE_DESTINATION',
  'UPDATE_DESTINATION',
  'ENABLE_DESTINATION',
  'DISABLE_DESTINATION',
  'ASSIGN_ROUTE',
  'REMOVE_DESTINATION',
  'UPDATE_STREAM_PROFILE',
] as const;

export type DistributionCommandStub = (typeof DISTRIBUTION_COMMAND_STUBS)[number];
