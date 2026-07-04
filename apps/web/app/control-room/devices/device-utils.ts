import type {
  BroadcastDevice,
  BroadcastProtocolType,
  DeviceCategory,
  DeviceConnectionStatus,
  DeviceHealthStatus,
  DevicePluginDefinition,
  PluginIntegrationStatus,
  RoutingEndpoint,
} from '@ubos/shared';

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  'cameras',
  'capture_cards',
  'audio',
  'graphics',
  'replay',
  'outputs',
  'ptz',
  'lighting',
  'automation',
  'networking',
  'recording',
  'virtual',
  'custom',
];

export function categoryLabel(category: DeviceCategory): string {
  const labels: Record<DeviceCategory, string> = {
    cameras: 'Cameras',
    capture_cards: 'Capture Cards',
    audio: 'Audio',
    graphics: 'Graphics',
    replay: 'Replay',
    outputs: 'Outputs',
    ptz: 'PTZ',
    lighting: 'Lighting',
    automation: 'Automation',
    networking: 'Networking',
    recording: 'Recording',
    virtual: 'Virtual Devices',
    custom: 'Custom',
  };
  return labels[category] ?? category;
}

export function protocolLabel(protocol: BroadcastProtocolType): string {
  return protocol.replace(/_/g, ' ').toUpperCase();
}

export function deviceStatusVariant(
  status: DeviceConnectionStatus,
): 'offline' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'connected':
    case 'ready':
      return 'success';
    case 'discovering':
      return 'warning';
    case 'error':
      return 'error';
    case 'disabled':
      return 'neutral';
    default:
      return 'offline';
  }
}

export function healthStatusVariant(
  status: DeviceHealthStatus,
): 'offline' | 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'degraded':
    case 'warning':
      return 'warning';
    case 'critical':
      return 'error';
    case 'unavailable':
      return 'offline';
    default:
      return 'neutral';
  }
}

export function pluginStatusVariant(
  status: PluginIntegrationStatus,
): 'offline' | 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'available':
      return 'success';
    case 'coming_soon':
      return 'warning';
    default:
      return 'offline';
  }
}

export function getDevicesByCategory(
  devices: BroadcastDevice[],
  category: DeviceCategory,
): BroadcastDevice[] {
  return devices.filter((device) => device.category === category);
}

export function deviceHealthSummaryLabel(devices: BroadcastDevice[]): string {
  if (!devices.length) return 'No devices';
  const connected = devices.filter(
    (device) => device.status === 'connected' || device.status === 'ready',
  ).length;
  const unavailable = devices.filter((device) => device.health === 'unavailable').length;
  if (unavailable === devices.length) return 'Devices unavailable';
  if (connected > 0) return `Devices ready (${connected})`;
  return 'No device detected';
}

export function getRoutingInputs(endpoints: RoutingEndpoint[]): RoutingEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.direction === 'input');
}

export function getRoutingOutputs(endpoints: RoutingEndpoint[]): RoutingEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.direction === 'output');
}

export function getRouteAssignment(
  inputId: string,
  outputId: string,
  endpoints: RoutingEndpoint[],
): RoutingEndpoint | undefined {
  const output = endpoints.find((endpoint) => endpoint.id === outputId);
  if (!output?.assignedRouteId) return undefined;
  return output.sourceId === inputId ? output : undefined;
}

export function formatLastSeen(value?: string): string {
  return value ?? 'unavailable';
}

export function groupPluginsByManufacturer(
  plugins: DevicePluginDefinition[],
): Record<string, DevicePluginDefinition[]> {
  return plugins.reduce<Record<string, DevicePluginDefinition[]>>((groups, plugin) => {
    const key = plugin.manufacturer;
    groups[key] = groups[key] ?? [];
    groups[key].push(plugin);
    return groups;
  }, {});
}
