import type {
  GraphicsAsset,
  GraphicsAssetType,
  GraphicsLayer,
  GraphicsLayerProgramState,
  LowerThirdTemplate,
  ProductionAsset,
  SceneGraphicsComposition,
} from '@ubos/shared';
import { createEmptySceneGraphicsComposition } from '@ubos/shared';

export const graphicsBrowserCategories: Array<{ id: GraphicsAssetType | 'templates' | 'brand'; label: string }> = [
  { id: 'lower_third', label: 'Lower Thirds' },
  { id: 'logo', label: 'Logos' },
  { id: 'watermark', label: 'Watermarks' },
  { id: 'ticker', label: 'Tickers' },
  { id: 'countdown', label: 'Countdowns' },
  { id: 'sponsor_card', label: 'Sponsor Cards' },
  { id: 'scoreboard', label: 'Scoreboards' },
  { id: 'image', label: 'Brand Assets' },
  { id: 'templates', label: 'Templates' },
  { id: 'brand', label: 'Brand Kit' },
];

export function productionAssetToGraphicsAsset(asset: ProductionAsset): GraphicsAsset {
  const typeMap: Record<ProductionAsset['type'], GraphicsAssetType> = {
    lower_third: 'lower_third',
    overlay: 'text',
    background: 'image',
    video: 'image',
    image: 'image',
  };
  const statusMap: Record<ProductionAsset['status'], GraphicsAsset['status']> = {
    ready: 'ready',
    queued: 'draft',
    disabled: 'disabled',
  };
  const now = new Date().toISOString();
  return {
    id: asset.id,
    name: asset.name,
    type: typeMap[asset.type] ?? 'image',
    status: statusMap[asset.status] ?? 'unavailable',
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultLowerThirdTemplate(name = 'New Lower Third'): LowerThirdTemplate {
  return {
    id: `lt-${Date.now()}`,
    name,
    title: 'Name Surname',
    subtitle: 'Title or Role',
    role: 'Host',
    organization: 'Organization',
    style: { variant: 'broadcast', alignment: 'left' },
    animation: { type: 'fade', durationMs: 500 },
    durationMs: 8000,
  };
}

export function createGraphicsLayerFromAsset(
  asset: GraphicsAsset,
  sceneId: string,
  order: number,
): GraphicsLayer {
  return {
    id: `layer-${asset.id}-${Date.now()}`,
    name: asset.name,
    assetId: asset.id,
    sceneId,
    order,
    visible: true,
    locked: false,
    opacity: 1,
    position: { x: 0.05, y: 0.78 },
    size: { width: 0.4, height: 0.12 },
    anchor: { horizontal: 'left', vertical: 'bottom' },
    blendMode: 'normal',
    transition: { type: 'fade', durationMs: 400 },
    timing: { inMs: 0, holdMs: 8000 },
    programState: 'hidden',
    previewState: 'hidden',
    metadata: {},
  };
}

export function layerStateLabel(state: GraphicsLayerProgramState): string {
  switch (state) {
    case 'live':
      return 'LIVE';
    case 'preview':
      return 'PREVIEW';
    case 'hidden':
      return 'Hidden';
    default:
      return 'Unavailable';
  }
}

export function layerStateVariant(
  state: GraphicsLayerProgramState,
): 'live' | 'preview' | 'neutral' | 'warning' | 'offline' {
  switch (state) {
    case 'live':
      return 'live';
    case 'preview':
      return 'preview';
    case 'hidden':
      return 'neutral';
    default:
      return 'offline';
  }
}

export function ensureSceneComposition(
  compositions: Record<string, SceneGraphicsComposition>,
  sceneId: string,
): SceneGraphicsComposition {
  return compositions[sceneId] ?? createEmptySceneGraphicsComposition(sceneId);
}

export function sortLayersDesc(layers: GraphicsLayer[]): GraphicsLayer[] {
  return [...layers].sort((a, b) => b.order - a.order);
}
