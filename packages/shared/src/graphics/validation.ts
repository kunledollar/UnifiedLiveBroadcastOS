import type { GraphicsAsset, GraphicsLayer, LowerThirdTemplate } from './types.js';

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
  'webgl',
] as const;

const SAFE_URL_PROTOCOLS = ['https:', 'http:'] as const;

export type GraphicsValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function metadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): GraphicsValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = metadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
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
    const child = metadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function sanitizeBrowserUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!SAFE_URL_PROTOCOLS.includes(url.protocol as (typeof SAFE_URL_PROTOCOLS)[number])) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function validateGraphicsOpacity(opacity: number): GraphicsValidationIssue | null {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    return {
      code: 'INVALID_OPACITY',
      message: 'Opacity must be between 0 and 1.',
      field: 'opacity',
    };
  }
  return null;
}

export function validateGraphicsLayerOrder(
  layers: GraphicsLayer[],
  layerId: string,
  order: number,
): GraphicsValidationIssue | null {
  const duplicate = layers.find((layer) => layer.id !== layerId && layer.order === order);
  if (duplicate) {
    return {
      code: 'DUPLICATE_LAYER_ORDER',
      message: `Layer order ${order} is already used by "${duplicate.name}".`,
      field: 'order',
    };
  }
  return null;
}

export function validateGraphicsLayer(
  layer: GraphicsLayer,
  layers: GraphicsLayer[],
  assets: GraphicsAsset[],
): GraphicsValidationIssue[] {
  const issues: GraphicsValidationIssue[] = [];

  if (!layer.id.trim()) {
    issues.push({ code: 'MISSING_LAYER_ID', message: 'Layer id is required.', field: 'id' });
  }
  const duplicateId = layers.find((item) => item.id === layer.id && item !== layer);
  if (duplicateId) {
    issues.push({ code: 'DUPLICATE_LAYER_ID', message: 'Layer id must be unique.', field: 'id' });
  }

  const opacityIssue = validateGraphicsOpacity(layer.opacity);
  if (opacityIssue) issues.push(opacityIssue);

  const orderIssue = validateGraphicsLayerOrder(layers, layer.id, layer.order);
  if (orderIssue) issues.push(orderIssue);

  const asset = assets.find((item) => item.id === layer.assetId);
  if (!asset) {
    issues.push({
      code: 'MISSING_ASSET_REFERENCE',
      message: 'Asset reference missing for layer.',
      field: 'assetId',
    });
  } else if (asset.status === 'missing_asset' || asset.status === 'unavailable') {
    issues.push({
      code: 'ASSET_UNAVAILABLE',
      message: `Referenced asset "${asset.name}" is unavailable.`,
      field: 'assetId',
    });
  }

  const runtimeIssue = metadataContainsRuntimeHandle(layer.metadata);
  if (runtimeIssue) issues.push(runtimeIssue);

  if (layer.assetId && assets.find((item) => item.id === layer.assetId)?.type === 'html_overlay') {
    const url = layer.metadata?.url;
    if (url !== undefined && sanitizeBrowserUrl(url) === null) {
      issues.push({
        code: 'UNSAFE_HTML_OVERLAY_URL',
        message: 'HTML overlay URL must be a safe http(s) reference.',
        field: 'metadata.url',
      });
    }
  }

  return issues;
}

export function validateLowerThirdTemplate(template: LowerThirdTemplate): GraphicsValidationIssue[] {
  const issues: GraphicsValidationIssue[] = [];
  if (!template.title.trim()) {
    issues.push({ code: 'MISSING_TITLE', message: 'Lower third title is required.', field: 'title' });
  }
  const runtimeIssue = metadataContainsRuntimeHandle(template.style);
  if (runtimeIssue) issues.push(runtimeIssue);
  return issues;
}

export function validateCompositionLayers(layers: GraphicsLayer[], assets: GraphicsAsset[]) {
  return layers.flatMap((layer) => validateGraphicsLayer(layer, layers, assets));
}
