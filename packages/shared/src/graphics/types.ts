export type GraphicsAssetType =
  | 'lower_third'
  | 'ticker'
  | 'logo'
  | 'watermark'
  | 'countdown'
  | 'sponsor_card'
  | 'scoreboard'
  | 'image'
  | 'html_overlay'
  | 'text'
  | 'shape';

export type GraphicsAssetStatus =
  | 'ready'
  | 'draft'
  | 'missing_asset'
  | 'disabled'
  | 'unavailable';

export type GraphicsLayerProgramState = 'live' | 'preview' | 'hidden' | 'unavailable';

export type GraphicsBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'add';

export interface GraphicsPosition {
  x: number;
  y: number;
}

export interface GraphicsSize {
  width: number;
  height: number;
}

export interface GraphicsAnchor {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'center' | 'bottom';
}

export interface GraphicsTransitionMetadata {
  type: 'cut' | 'fade' | 'slide' | 'none';
  durationMs: number;
}

export interface GraphicsTimingMetadata {
  inMs?: number;
  outMs?: number;
  holdMs?: number;
}

export interface GraphicsAsset {
  id: string;
  name: string;
  type: GraphicsAssetType;
  status: GraphicsAssetStatus;
  templateId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphicsLayer {
  id: string;
  name: string;
  assetId: string;
  sceneId: string;
  order: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  position: GraphicsPosition;
  size: GraphicsSize;
  anchor: GraphicsAnchor;
  blendMode: GraphicsBlendMode;
  transition: GraphicsTransitionMetadata;
  timing: GraphicsTimingMetadata;
  programState: GraphicsLayerProgramState;
  previewState: GraphicsLayerProgramState;
  metadata?: Record<string, unknown>;
}

export interface BrandKitColorSet {
  primary: string;
  secondary: string;
  accent: string;
}

export interface BrandKitFontMetadata {
  heading?: string;
  body?: string;
  mono?: string;
}

export interface BrandKitStyleMetadata {
  lowerThird?: Record<string, unknown>;
  ticker?: Record<string, unknown>;
}

export interface BrandKit {
  id: string;
  name: string;
  colors: BrandKitColorSet;
  fonts: BrandKitFontMetadata;
  logoAssetId?: string;
  watermarkAssetId?: string;
  lowerThirdStyle: Record<string, unknown>;
  tickerStyle: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface LowerThirdTemplate {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  role: string;
  organization: string;
  style: Record<string, unknown>;
  animation: GraphicsTransitionMetadata;
  durationMs: number;
}

export interface CompositionManifest {
  sceneId: string;
  layers: GraphicsLayer[];
  graphicsAssets: GraphicsAsset[];
  brandKit?: BrandKit;
  containsRuntimeHandles: false;
}

export interface SceneGraphicsComposition {
  sceneId: string;
  layers: GraphicsLayer[];
  programLayerIds: string[];
  previewLayerIds: string[];
  updatedAt: string;
}

export const GRAPHICS_COMMAND_STUBS = [
  'ADD_GRAPHICS_ASSET',
  'UPDATE_GRAPHICS_ASSET',
  'REMOVE_GRAPHICS_ASSET',
  'ADD_GRAPHICS_LAYER',
  'UPDATE_GRAPHICS_LAYER',
  'REMOVE_GRAPHICS_LAYER',
  'REORDER_GRAPHICS_LAYER',
  'TOGGLE_GRAPHICS_LAYER',
  'LOCK_GRAPHICS_LAYER',
  'SET_GRAPHICS_OPACITY',
  'ASSIGN_GRAPHICS_TO_SCENE',
  'PREVIEW_GRAPHICS_LAYER',
  'TAKE_GRAPHICS_TO_PROGRAM',
] as const;

export type GraphicsCommandStub = (typeof GRAPHICS_COMMAND_STUBS)[number];
