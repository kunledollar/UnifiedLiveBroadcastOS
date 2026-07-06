import type { MediaRoute, ProductionRoute, SceneSource } from '@ubos/shared';

export type OperationsInspectorSelection =
  | { kind: 'source'; source: SceneSource; sceneName: string }
  | { kind: 'route'; route: MediaRoute }
  | { kind: 'graphics-layer'; layerId: string; layerName: string }
  | { kind: 'media-asset'; assetId: string; assetName: string }
  | { kind: 'pipeline-route'; route: ProductionRoute }
  | null;
