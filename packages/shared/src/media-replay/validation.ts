import type { MediaAsset, MediaClip, Playlist, ReplayClip } from './types.js';

const RUNTIME_HANDLE_KEYS = [
  'stream',
  'track',
  'mediaStream',
  'canvas',
  'context',
  'imageBitmap',
  'element',
  'node',
  'ref',
  'file',
  'blob',
  'video',
  'audio',
  'webgl',
] as const;

const SAFE_URL_PROTOCOLS = ['https:', 'http:'] as const;

export type MediaValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function mediaMetadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): MediaValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = mediaMetadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
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
    const child = mediaMetadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function sanitizeMediaSourceUri(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (value.startsWith('blob:') || value.startsWith('file:')) return null;
  try {
    const url = new URL(value.trim());
    if (!SAFE_URL_PROTOCOLS.includes(url.protocol as (typeof SAFE_URL_PROTOCOLS)[number])) {
      return null;
    }
    return url.toString();
  } catch {
    return value.startsWith('/') || value.startsWith('./') ? value : null;
  }
}

export function validateTrimPoints(inPointMs: number, outPointMs: number): MediaValidationIssue | null {
  if (!Number.isFinite(inPointMs) || !Number.isFinite(outPointMs)) {
    return { code: 'INVALID_TRIM', message: 'Trim points must be finite numbers.', field: 'trim' };
  }
  if (inPointMs < 0 || outPointMs < 0) {
    return { code: 'NEGATIVE_TRIM', message: 'Trim points cannot be negative.', field: 'trim' };
  }
  if (outPointMs <= inPointMs) {
    return { code: 'INVALID_TRIM_RANGE', message: 'Out point must be after in point.', field: 'trim' };
  }
  return null;
}

export function validateDurationMs(durationMs: number): MediaValidationIssue | null {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return { code: 'INVALID_DURATION', message: 'Duration cannot be negative.', field: 'durationMs' };
  }
  return null;
}

export function validateMediaAsset(asset: MediaAsset, assets: MediaAsset[]): MediaValidationIssue[] {
  const issues: MediaValidationIssue[] = [];
  if (!asset.id.trim()) issues.push({ code: 'MISSING_ID', message: 'Asset id is required.' });
  if (assets.some((item) => item.id === asset.id && item !== asset)) {
    issues.push({ code: 'DUPLICATE_ASSET_ID', message: 'Asset id must be unique.' });
  }
  if (asset.sourceUri && !sanitizeMediaSourceUri(asset.sourceUri)) {
    issues.push({ code: 'UNSAFE_SOURCE_URI', message: 'Source URI is not a safe reference.' });
  }
  if (asset.durationMs !== undefined) {
    const durationIssue = validateDurationMs(asset.durationMs);
    if (durationIssue) issues.push(durationIssue);
  }
  const runtimeIssue = mediaMetadataContainsRuntimeHandle(asset.metadata);
  if (runtimeIssue) issues.push(runtimeIssue);
  return issues;
}

export function validateMediaClip(
  clip: MediaClip,
  clips: MediaClip[],
  assets: MediaAsset[],
): MediaValidationIssue[] {
  const issues: MediaValidationIssue[] = [];
  if (clips.some((item) => item.id === clip.id && item !== clip)) {
    issues.push({ code: 'DUPLICATE_CLIP_ID', message: 'Clip id must be unique.' });
  }
  const trimIssue = validateTrimPoints(clip.inPointMs, clip.outPointMs);
  if (trimIssue) issues.push(trimIssue);
  const durationIssue = validateDurationMs(clip.durationMs);
  if (durationIssue) issues.push(durationIssue);
  if (!assets.some((asset) => asset.id === clip.assetId)) {
    issues.push({ code: 'MISSING_ASSET_REFERENCE', message: 'Clip references a missing asset.' });
  }
  return issues;
}

export function validatePlaylist(playlist: Playlist, assets: MediaAsset[], clips: MediaClip[]) {
  const issues: MediaValidationIssue[] = [];
  for (const item of playlist.items) {
    if (item.assetId && !assets.some((asset) => asset.id === item.assetId)) {
      issues.push({ code: 'PLAYLIST_MISSING_ASSET', message: `Playlist item "${item.label}" references missing asset.` });
    }
    if (item.clipId && !clips.some((clip) => clip.id === item.clipId)) {
      issues.push({ code: 'PLAYLIST_MISSING_CLIP', message: `Playlist item "${item.label}" references missing clip.` });
    }
  }
  return issues;
}

export function validateReplayClip(clip: ReplayClip): MediaValidationIssue[] {
  const issues: MediaValidationIssue[] = [];
  const trimIssue = validateTrimPoints(clip.startTimeMs, clip.endTimeMs);
  if (trimIssue) issues.push(trimIssue);
  const durationIssue = validateDurationMs(clip.durationMs);
  if (durationIssue) issues.push(durationIssue);
  return issues;
}
