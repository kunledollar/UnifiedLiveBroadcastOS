import type {
  BrandKit,
  CompositionManifest,
  GraphicsAsset,
  GraphicsLayer,
  SceneGraphicsComposition,
} from './types.js';
import { validateCompositionLayers } from './validation.js';

export function createCompositionManifest(input: {
  sceneId: string;
  layers: GraphicsLayer[];
  graphicsAssets: GraphicsAsset[];
  brandKit?: BrandKit;
}): CompositionManifest {
  return {
    sceneId: input.sceneId,
    layers: [...input.layers].sort((a, b) => b.order - a.order),
    graphicsAssets: input.graphicsAssets,
    ...(input.brandKit ? { brandKit: input.brandKit } : {}),
    containsRuntimeHandles: false,
  };
}

export function createEmptySceneGraphicsComposition(sceneId: string): SceneGraphicsComposition {
  return {
    sceneId,
    layers: [],
    programLayerIds: [],
    previewLayerIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getProgramLayers(composition: SceneGraphicsComposition): GraphicsLayer[] {
  return composition.layers.filter((layer) => composition.programLayerIds.includes(layer.id));
}

export function getPreviewLayers(composition: SceneGraphicsComposition): GraphicsLayer[] {
  return composition.layers.filter((layer) => composition.previewLayerIds.includes(layer.id));
}

export function summarizeCompositionIssues(
  layers: GraphicsLayer[],
  assets: GraphicsAsset[],
): string[] {
  return validateCompositionLayers(layers, assets).map((issue) => issue.message);
}

export function isCompositionReplaySafe(manifest: CompositionManifest): boolean {
  return manifest.containsRuntimeHandles === false;
}
