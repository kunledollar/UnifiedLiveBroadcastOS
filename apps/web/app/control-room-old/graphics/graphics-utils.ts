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
  { id: 'html_overlay', label: 'Full Screen' },
  { id: 'watermark', label: 'Bugs' },
  { id: 'ticker', label: 'Tickers' },
  { id: 'countdown', label: 'Clocks' },
  { id: 'sponsor_card', label: 'Animated Titles' },
  { id: 'scoreboard', label: 'Scoreboards' },
  { id: 'image', label: 'Image Overlays' },
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
  const lowerName = asset.name.toLowerCase();
  const inferredType: GraphicsAssetType = lowerName.includes('logo') || lowerName.includes('bug')
    ? 'logo'
    : lowerName.includes('ticker')
      ? 'ticker'
      : lowerName.includes('clock') || lowerName.includes('countdown')
        ? 'countdown'
        : lowerName.includes('scoreboard') || lowerName.includes('score')
          ? 'scoreboard'
          : lowerName.includes('full screen')
            ? 'html_overlay'
            : lowerName.includes('title')
              ? 'sponsor_card'
              : (typeMap[asset.type] ?? 'image');
  const now = new Date().toISOString();
  return {
    id: asset.id,
    name: asset.name,
    type: inferredType,
    status: statusMap[asset.status] ?? 'unavailable',
    createdAt: now,
    updatedAt: now,
  };
}

export const graphicsAnimationPresets = ['fade', 'slide left', 'slide right', 'slide up', 'zoom', 'scale', 'pop', 'dissolve'] as const;

export const graphicsAnimationSpeeds = {
  fast: 250,
  medium: 500,
  slow: 900,
} as const;

export const builtInLowerThirdTemplateNames = [
  'News',
  'Interview',
  'Sports',
  'Podcast',
  'Webinar',
  'Corporate',
  'Election',
  'Weather',
  'Breaking News',
  'Minimal',
] as const;

export function createDefaultLowerThirdTemplate(name = 'New Lower Third'): LowerThirdTemplate {
  return {
    id: `lt-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
    name,
    title: name === 'Breaking News' ? 'Breaking News' : 'Name Surname',
    subtitle: name === 'Sports' ? 'Score Update' : 'Title or Role',
    role: name,
    organization: 'Organization',
    style: {
      variant: name.toLowerCase(),
      alignment: 'left',
      location: 'Studio A',
      company: 'UBOS',
      backgroundColor: name === 'Breaking News' ? '#b91c1c' : '#111827',
      accentColor: name === 'Minimal' ? '#e5e7eb' : '#38bdf8',
      font: 'Inter',
      size: 42,
      opacity: 0.92,
      padding: 24,
      safeAreas: { titleSafe: true, actionSafe: true, grid: false },
    },
    animation: { type: 'fade', durationMs: graphicsAnimationSpeeds.medium },
    durationMs: 8000,
  };
}

export function createBuiltInLowerThirdTemplates(): LowerThirdTemplate[] {
  return builtInLowerThirdTemplateNames.map((name) => createDefaultLowerThirdTemplate(name));
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
    metadata: {
      runtimeSeparated: true,
      routing: 'preview',
      operation: 'CUT',
      memory: 'metadata-only',
      runtimeState: 'idle',
      logo: { acceptedFormats: ['PNG', 'SVG'], scale: 1, rotation: 0 },
      ticker: { speed: 'medium', paused: false, direction: 'left', loop: true },
      clock: { mode: 'real time', timezone: 'UTC' },
      scoreboard: { home: 'HOME', away: 'AWAY', score: '0-0', period: '1', possession: 'home' },
    },
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
