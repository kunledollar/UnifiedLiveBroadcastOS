import type {
  BroadcastDevice,
  DeviceManifest,
  ProtocolDefinition,
  RoutingEndpoint,
} from './types.js';

const RUNTIME_HANDLE_KEYS = [
  'socket',
  'stream',
  'serial',
  'gpio',
  'midi',
  'driver',
  'sdk',
  'handle',
  'password',
  'apikey',
  'api_key',
  'token',
  'secret',
  'credential',
  'websocket',
  'process',
] as const;

const SECRET_PATTERNS = [
  /password=/i,
  /api[_-]?key=/i,
  /token=/i,
  /bearer\s+/i,
  /:\/\/[^:]+:[^@]+@/i,
];

export type DeviceValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function deviceMetadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): DeviceValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = deviceMetadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
      if (nested) return nested;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (RUNTIME_HANDLE_KEYS.some((handle) => lowerKey.includes(handle))) {
      return {
        code: 'RUNTIME_HANDLE_REJECTED',
        message: `Runtime handle key "${key}" is not allowed in ${path}.`,
        field: `${path}.${key}`,
      };
    }
    const child = deviceMetadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function containsDeviceSecret(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeDeviceText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

export function validateDeviceNetworkAddress(ipAddress?: string, port?: number): DeviceValidationIssue[] {
  const issues: DeviceValidationIssue[] = [];
  if (ipAddress && containsDeviceSecret(ipAddress)) {
    issues.push({ code: 'SECRET_IN_ADDRESS', message: 'IP address cannot contain credentials.' });
  }
  if (port !== undefined && (!Number.isInteger(port) || port < 0 || port > 65535)) {
    issues.push({ code: 'INVALID_PORT', message: 'Port must be between 0 and 65535.' });
  }
  return issues;
}

export function validateBroadcastDevice(
  device: BroadcastDevice,
  devices: BroadcastDevice[],
): DeviceValidationIssue[] {
  const issues: DeviceValidationIssue[] = [];
  if (devices.some((item) => item.id === device.id && item !== device)) {
    issues.push({ code: 'DUPLICATE_DEVICE_ID', message: 'Device id must be unique.' });
  }
  if (!device.name.trim()) {
    issues.push({ code: 'MISSING_DEVICE_NAME', message: 'Device name is required.' });
  }
  const sanitized = sanitizeDeviceText(device.name);
  if (sanitized !== device.name) {
    issues.push({ code: 'UNSAFE_HTML', message: 'Device name cannot contain unsafe HTML.' });
  }
  issues.push(...validateDeviceNetworkAddress(device.ipAddress, device.port));
  if (device.notes && sanitizeDeviceText(device.notes) !== device.notes) {
    issues.push({ code: 'UNSAFE_NOTES', message: 'Device notes cannot contain unsafe HTML.' });
  }
  return issues;
}

export function validateProtocolDefinition(protocol: ProtocolDefinition): DeviceValidationIssue[] {
  const issues: DeviceValidationIssue[] = [];
  if (!protocol.name.trim()) {
    issues.push({ code: 'MISSING_PROTOCOL_NAME', message: 'Protocol name is required.' });
  }
  return issues;
}

export function validateRoutingEndpoint(
  endpoint: RoutingEndpoint,
  endpoints: RoutingEndpoint[],
): DeviceValidationIssue[] {
  const issues: DeviceValidationIssue[] = [];
  if (endpoints.some((item) => item.id === endpoint.id && item !== endpoint)) {
    issues.push({ code: 'DUPLICATE_ENDPOINT_ID', message: 'Routing endpoint id must be unique.' });
  }
  return issues;
}

export function validateDeviceManifest(manifest: DeviceManifest): DeviceValidationIssue[] {
  const issues: DeviceValidationIssue[] = [];
  if (manifest.containsRuntimeHandles !== false) {
    issues.push({ code: 'RUNTIME_HANDLES_FORBIDDEN', message: 'Device manifest cannot contain runtime handles.' });
  }
  for (const device of manifest.devices) {
    issues.push(...validateBroadcastDevice(device, manifest.devices));
  }
  for (const protocol of manifest.protocols) {
    issues.push(...validateProtocolDefinition(protocol));
  }
  for (const endpoint of manifest.routingEndpoints) {
    issues.push(...validateRoutingEndpoint(endpoint, manifest.routingEndpoints));
  }
  const runtimeIssue = deviceMetadataContainsRuntimeHandle(manifest);
  if (runtimeIssue) issues.push(runtimeIssue);
  return issues;
}
