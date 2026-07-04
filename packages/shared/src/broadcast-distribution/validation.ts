import type {
  BroadcastDestination,
  DistributionManifest,
  OutputRoute,
  StreamProfile,
} from './types.js';

const RUNTIME_HANDLE_KEYS = [
  'stream',
  'socket',
  'ffmpeg',
  'process',
  'encoder',
  'mediastream',
  'webrtc',
  'timer',
  'secret',
  'token',
  'password',
  'streamkey',
  'stream_key',
  'oauth',
] as const;

const SECRET_PATTERNS = [
  /sk_live_/i,
  /rtmp:\/\/[^:]+:[^@]+@/i,
  /rtmps:\/\/[^:]+:[^@]+@/i,
  /password=/i,
  /token=/i,
  /bearer\s+/i,
];

export type DistributionValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function distributionMetadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): DistributionValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = distributionMetadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
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
    const child = distributionMetadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function containsSecretValue(value: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeDistributionText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

export function validateStreamUrl(url: string): DistributionValidationIssue | null {
  if (!url) return null;
  if (containsSecretValue(url)) {
    return { code: 'SECRET_IN_URL', message: 'URLs must not contain credentials or secrets.' };
  }
  if (/[\0\n\r`$;&|<>]/.test(url)) {
    return { code: 'UNSAFE_URL', message: 'Unsafe URL characters rejected.' };
  }
  return null;
}

export function validateStreamProfile(profile: StreamProfile): DistributionValidationIssue[] {
  const issues: DistributionValidationIssue[] = [];
  if (!profile.name.trim()) {
    issues.push({ code: 'MISSING_PROFILE_NAME', message: 'Stream profile name is required.' });
  }
  if (!Number.isFinite(profile.fps) || profile.fps <= 0 || profile.fps > 120) {
    issues.push({ code: 'INVALID_FPS', message: 'FPS must be between 1 and 120.' });
  }
  if (!Number.isFinite(profile.bitrateKbps) || profile.bitrateKbps <= 0) {
    issues.push({ code: 'INVALID_BITRATE', message: 'Bitrate must be positive.' });
  }
  if (!Number.isFinite(profile.keyframeInterval) || profile.keyframeInterval <= 0) {
    issues.push({ code: 'INVALID_KEYFRAME', message: 'Keyframe interval must be positive.' });
  }
  if (!Number.isFinite(profile.audioBitrateKbps) || profile.audioBitrateKbps <= 0) {
    issues.push({ code: 'INVALID_AUDIO_BITRATE', message: 'Audio bitrate must be positive.' });
  }
  return issues;
}

export function validateBroadcastDestination(
  destination: BroadcastDestination,
  destinations: BroadcastDestination[],
): DistributionValidationIssue[] {
  const issues: DistributionValidationIssue[] = [];
  if (destinations.some((item) => item.id === destination.id && item !== destination)) {
    issues.push({ code: 'DUPLICATE_DESTINATION_ID', message: 'Destination id must be unique.' });
  }
  if (!destination.name.trim()) {
    issues.push({ code: 'MISSING_DESTINATION_NAME', message: 'Destination name is required.' });
  }
  const sanitizedName = sanitizeDistributionText(destination.name);
  if (sanitizedName !== destination.name) {
    issues.push({ code: 'UNSAFE_HTML', message: 'Destination name cannot contain unsafe HTML.' });
  }
  if (destination.redactedConfig.redactedEndpoint) {
    const urlIssue = validateStreamUrl(destination.redactedConfig.redactedEndpoint);
    if (urlIssue) issues.push(urlIssue);
  }
  for (const warning of destination.warnings ?? []) {
    if (containsSecretValue(warning)) {
      issues.push({ code: 'SECRET_IN_WARNING', message: 'Warnings cannot contain secrets.' });
    }
  }
  return issues;
}

export function validateOutputRoute(
  route: OutputRoute,
  destinations: BroadcastDestination[],
): DistributionValidationIssue[] {
  const issues: DistributionValidationIssue[] = [];
  if (!destinations.some((destination) => destination.id === route.destinationId)) {
    issues.push({ code: 'UNKNOWN_DESTINATION', message: 'Route references unknown destination.' });
  }
  return issues;
}

export function validateDistributionManifest(manifest: DistributionManifest): DistributionValidationIssue[] {
  const issues: DistributionValidationIssue[] = [];
  if (manifest.containsRuntimeHandles !== false) {
    issues.push({ code: 'RUNTIME_HANDLES_FORBIDDEN', message: 'Distribution manifest cannot contain runtime handles.' });
  }
  if (manifest.containsSecrets !== false) {
    issues.push({ code: 'SECRETS_FORBIDDEN', message: 'Distribution manifest cannot contain secrets.' });
  }
  for (const profile of manifest.streamProfiles) {
    issues.push(...validateStreamProfile(profile));
  }
  for (const destination of manifest.destinations) {
    issues.push(...validateBroadcastDestination(destination, manifest.destinations));
  }
  for (const route of manifest.outputRoutes) {
    issues.push(...validateOutputRoute(route, manifest.destinations));
  }
  const runtimeIssue = distributionMetadataContainsRuntimeHandle(manifest);
  if (runtimeIssue) issues.push(runtimeIssue);
  return issues;
}
