import type {
  AudioChannel,
  Guest,
  GraphicsLayer,
  MediaLayoutPreset,
  MediaRoute,
  ProductionGraph,
  ReplayBufferMetadata,
  Scene,
  StreamHealthMetric,
} from '@ubos/shared';
import type { SafeAreaToggles } from './workspace-types';

export type MediaMetadataOverlayItem = {
  id: string;
  name: string;
};

export type WorkspaceMonitorContext = {
  programScene: Scene;
  previewScene: Scene;
  routes: MediaRoute[];
  layoutPreset: MediaLayoutPreset;
  guests: Guest[];
  channels: AudioChannel[];
  healthMetrics: StreamHealthMetric[];
  graph?: ProductionGraph;
  healthFps: string;
  showSafeAreas: boolean;
  safeAreaToggles: SafeAreaToggles;
  programGraphicsLayers?: GraphicsLayer[];
  previewGraphicsLayers?: GraphicsLayer[];
  programMediaOverlayItems?: MediaMetadataOverlayItem[];
  previewMediaOverlayItems?: MediaMetadataOverlayItem[];
  replayBuffer?: ReplayBufferMetadata;
};

export function monitorSafeAreaProps(context: WorkspaceMonitorContext) {
  if (!context.showSafeAreas) return { showSafeAreas: false as const };
  return {
    showSafeAreas: true as const,
    showTitleSafe: context.safeAreaToggles.titleSafe,
    showActionSafe: context.safeAreaToggles.actionSafe,
    showCrosshair: context.safeAreaToggles.crosshair,
    showVerticalGuide: context.safeAreaToggles.verticalGuide,
    showFourThreeGuide: context.safeAreaToggles.fourThreeGuide,
    showPlatformCrop: context.safeAreaToggles.verticalGuide,
  };
}
