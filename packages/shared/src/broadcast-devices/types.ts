export type BroadcastProtocolType =
  | 'ndi'
  | 'sdi'
  | 'srt'
  | 'rtmp'
  | 'rtsp'
  | 'http'
  | 'rest'
  | 'websocket'
  | 'osc'
  | 'midi'
  | 'gpio'
  | 'rs232'
  | 'rs422'
  | 'visca'
  | 'visca_over_ip'
  | 'onvif'
  | 'atem'
  | 'hyperdeck'
  | 'rosstalk'
  | 'mos'
  | 'nmos'
  | 'snmp'
  | 'tcp'
  | 'udp'
  | 'custom_plugin';

export type DeviceCategory =
  | 'cameras'
  | 'capture_cards'
  | 'audio'
  | 'graphics'
  | 'replay'
  | 'outputs'
  | 'ptz'
  | 'lighting'
  | 'automation'
  | 'networking'
  | 'recording'
  | 'virtual'
  | 'custom';

export type DeviceType =
  | 'camera'
  | 'ptz_camera'
  | 'capture_card'
  | 'audio_console'
  | 'video_router'
  | 'ndi_device'
  | 'sdi_input'
  | 'hyperdeck'
  | 'replay_server'
  | 'teleprompter'
  | 'tally'
  | 'gpio'
  | 'lighting_controller'
  | 'midi_device'
  | 'switcher'
  | 'graphics_engine'
  | 'streaming_encoder'
  | 'virtual_device'
  | 'custom';

export type DeviceConnectionStatus =
  | 'disconnected'
  | 'discovering'
  | 'connected'
  | 'ready'
  | 'unavailable'
  | 'error'
  | 'disabled';

export type DeviceCapabilityType =
  | 'ptz'
  | 'record'
  | 'stream'
  | 'preview'
  | 'replay'
  | 'graphics'
  | 'routing'
  | 'audio'
  | 'tally'
  | 'intercom'
  | 'lighting'
  | 'macros'
  | 'camera_shading';

export type DeviceHealthStatus = 'unknown' | 'healthy' | 'degraded' | 'warning' | 'critical' | 'unavailable';

export type PluginIntegrationStatus = 'available' | 'unavailable' | 'coming_soon' | 'disabled';

export interface DeviceCapability {
  type: DeviceCapabilityType;
  supported: boolean;
  notes?: string;
}

export interface ProtocolDefinition {
  id: string;
  name: string;
  protocol: BroadcastProtocolType;
  version: string;
  transport: string;
  authentication: 'none' | 'configured' | 'unavailable';
  capabilities: DeviceCapabilityType[];
  supportedCommands: string[];
}

export interface DeviceHealth {
  status: DeviceHealthStatus;
  connectionState: DeviceConnectionStatus;
  temperatureC?: number;
  firmwareVersion?: string;
  warnings: string[];
  errors: string[];
  diagnostics: string[];
}

export interface RoutingEndpoint {
  id: string;
  label: string;
  direction: 'input' | 'output';
  sourceId?: string;
  destinationId?: string;
  assignedRouteId?: string;
  status: 'unassigned' | 'assigned' | 'ready' | 'warning' | 'unavailable';
}

export interface BroadcastDevice {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  category: DeviceCategory;
  deviceType: DeviceType;
  protocol: BroadcastProtocolType;
  ipAddress?: string;
  port?: number;
  status: DeviceConnectionStatus;
  health: DeviceHealthStatus;
  capabilities: DeviceCapability[];
  firmware?: string;
  lastSeen?: string;
  notes?: string;
}

export interface DevicePluginDefinition {
  id: string;
  name: string;
  manufacturer: string;
  protocols: BroadcastProtocolType[];
  status: PluginIntegrationStatus;
  description?: string;
}

export interface DeviceManifest {
  devices: BroadcastDevice[];
  protocols: ProtocolDefinition[];
  routingEndpoints: RoutingEndpoint[];
  plugins: DevicePluginDefinition[];
  containsRuntimeHandles: false;
}

export const DEVICE_COMMAND_STUBS = [
  'DISCOVER_DEVICES',
  'SELECT_DEVICE',
  'ENABLE_DEVICE',
  'DISABLE_DEVICE',
  'ASSIGN_ROUTE',
  'ACKNOWLEDGE_WARNING',
] as const;

export type DeviceCommandStub = (typeof DEVICE_COMMAND_STUBS)[number];
