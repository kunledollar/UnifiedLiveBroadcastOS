import type {
  GraphicsLayer,
  SceneGraphicsComposition,
} from '@ubos/shared';
import { createGraphicsCommandIntent } from '@ubos/shared';
import {
  createGraphicsLayerFromAsset,
  ensureSceneComposition,
  sortLayersDesc,
} from './graphics-utils';
import type { GraphicsAsset } from '@ubos/shared';

export type GraphicsCompositionState = {
  compositions: Record<string, SceneGraphicsComposition>;
  commandLog: ReturnType<typeof createGraphicsCommandIntent>[];
};

export type GraphicsCompositionAction =
  | { type: 'ADD_LAYER'; sceneId: string; asset: GraphicsAsset }
  | { type: 'REMOVE_LAYER'; sceneId: string; layerId: string }
  | { type: 'SELECT_LAYER'; sceneId: string; layerId: string | null }
  | { type: 'TOGGLE_VISIBILITY'; sceneId: string; layerId: string }
  | { type: 'TOGGLE_LOCK'; sceneId: string; layerId: string }
  | { type: 'SET_OPACITY'; sceneId: string; layerId: string; opacity: number }
  | { type: 'MOVE_LAYER'; sceneId: string; layerId: string; direction: 'up' | 'down' }
  | { type: 'DUPLICATE_LAYER'; sceneId: string; layerId: string }
  | { type: 'SEND_TO_PREVIEW'; sceneId: string; layerId: string }
  | { type: 'TAKE_TO_PROGRAM'; sceneId: string; layerId: string }
  | { type: 'REMOVE_FROM_PROGRAM'; sceneId: string; layerId: string }
  | { type: 'CLEAR_PREVIEW'; sceneId: string }
  | { type: 'CLEAR_PROGRAM'; sceneId: string }
  | { type: 'UPDATE_LAYER'; sceneId: string; layer: GraphicsLayer };

export const initialGraphicsCompositionState: GraphicsCompositionState = {
  compositions: {},
  commandLog: [],
};

function updateComposition(
  state: GraphicsCompositionState,
  sceneId: string,
  updater: (composition: SceneGraphicsComposition) => SceneGraphicsComposition,
  command?: ReturnType<typeof createGraphicsCommandIntent>,
): GraphicsCompositionState {
  const current = ensureSceneComposition(state.compositions, sceneId);
  return {
    compositions: {
      ...state.compositions,
      [sceneId]: {
        ...updater(current),
        updatedAt: new Date().toISOString(),
      },
    },
    commandLog: command ? [command, ...state.commandLog].slice(0, 50) : state.commandLog,
  };
}

function mapLayers(
  composition: SceneGraphicsComposition,
  layerId: string,
  mapper: (layer: GraphicsLayer) => GraphicsLayer,
): SceneGraphicsComposition {
  return {
    ...composition,
    layers: composition.layers.map((layer) => (layer.id === layerId ? mapper(layer) : layer)),
  };
}

export function graphicsCompositionReducer(
  state: GraphicsCompositionState,
  action: GraphicsCompositionAction,
): GraphicsCompositionState {
  switch (action.type) {
    case 'ADD_LAYER': {
      const composition = ensureSceneComposition(state.compositions, action.sceneId);
      const nextOrder = composition.layers.length
        ? Math.max(...composition.layers.map((layer) => layer.order)) + 1
        : 1;
      const layer = createGraphicsLayerFromAsset(action.asset, action.sceneId, nextOrder);
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({
          ...current,
          layers: [...current.layers, layer],
        }),
        createGraphicsCommandIntent('ADD_GRAPHICS_LAYER', { sceneId: action.sceneId, layer }),
      );
    }
    case 'REMOVE_LAYER':
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({
          ...current,
          layers: current.layers.filter((layer) => layer.id !== action.layerId),
          programLayerIds: current.programLayerIds.filter((id) => id !== action.layerId),
          previewLayerIds: current.previewLayerIds.filter((id) => id !== action.layerId),
        }),
        createGraphicsCommandIntent('REMOVE_GRAPHICS_LAYER', {
          sceneId: action.sceneId,
          layerId: action.layerId,
        }),
      );
    case 'TOGGLE_VISIBILITY':
      return updateComposition(state, action.sceneId, (current) =>
        mapLayers(current, action.layerId, (layer) => {
          if (layer.locked) return layer;
          return { ...layer, visible: !layer.visible };
        }),
      );
    case 'TOGGLE_LOCK':
      return updateComposition(state, action.sceneId, (current) =>
        mapLayers(current, action.layerId, (layer) => ({ ...layer, locked: !layer.locked })),
      );
    case 'SET_OPACITY':
      return updateComposition(state, action.sceneId, (current) =>
        mapLayers(current, action.layerId, (layer) => {
          if (layer.locked) return layer;
          return { ...layer, opacity: Math.min(1, Math.max(0, action.opacity)) };
        }),
      );
    case 'MOVE_LAYER': {
      const composition = ensureSceneComposition(state.compositions, action.sceneId);
      const sorted = sortLayersDesc(composition.layers);
      const index = sorted.findIndex((layer) => layer.id === action.layerId);
      if (index < 0) return state;
      const swapIndex = action.direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return state;
      const currentLayer = sorted[index]!;
      const swapLayer = sorted[swapIndex]!;
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        layers: current.layers.map((layer) => {
          if (layer.id === currentLayer.id) return { ...layer, order: swapLayer.order };
          if (layer.id === swapLayer.id) return { ...layer, order: currentLayer.order };
          return layer;
        }),
      }));
    }
    case 'DUPLICATE_LAYER': {
      const composition = ensureSceneComposition(state.compositions, action.sceneId);
      const original = composition.layers.find((layer) => layer.id === action.layerId);
      if (!original) return state;
      const duplicate: GraphicsLayer = {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        name: `${original.name} Copy`,
        order: Math.max(...composition.layers.map((layer) => layer.order)) + 1,
        programState: 'hidden',
        previewState: 'hidden',
        locked: false,
      };
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        layers: [...current.layers, duplicate],
      }));
    }
    case 'SEND_TO_PREVIEW':
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({
          ...current,
          previewLayerIds: Array.from(new Set([...current.previewLayerIds, action.layerId])),
          layers: current.layers.map((layer) =>
            layer.id === action.layerId
              ? { ...layer, previewState: 'preview' as const, visible: true }
              : layer,
          ),
        }),
        createGraphicsCommandIntent('PREVIEW_GRAPHICS_LAYER', {
          sceneId: action.sceneId,
          layerId: action.layerId,
        }),
      );
    case 'TAKE_TO_PROGRAM':
      return updateComposition(
        state,
        action.sceneId,
        (current) => ({
          ...current,
          programLayerIds: Array.from(new Set([...current.programLayerIds, action.layerId])),
          previewLayerIds: current.previewLayerIds.filter((id) => id !== action.layerId),
          layers: current.layers.map((layer) =>
            layer.id === action.layerId
              ? { ...layer, programState: 'live' as const, previewState: 'hidden' as const, visible: true }
              : layer,
          ),
        }),
        createGraphicsCommandIntent('TAKE_GRAPHICS_TO_PROGRAM', {
          sceneId: action.sceneId,
          layerId: action.layerId,
        }),
      );
    case 'REMOVE_FROM_PROGRAM':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        programLayerIds: current.programLayerIds.filter((id) => id !== action.layerId),
        layers: current.layers.map((layer) =>
          layer.id === action.layerId ? { ...layer, programState: 'hidden' as const } : layer,
        ),
      }));
    case 'CLEAR_PREVIEW':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        previewLayerIds: [],
        layers: current.layers.map((layer) => ({ ...layer, previewState: 'hidden' as const })),
      }));
    case 'CLEAR_PROGRAM':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        programLayerIds: [],
        layers: current.layers.map((layer) => ({ ...layer, programState: 'hidden' as const })),
      }));
    case 'UPDATE_LAYER':
      return updateComposition(state, action.sceneId, (current) => ({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === action.layer.id ? action.layer : layer,
        ),
      }));
    default:
      return state;
  }
}
