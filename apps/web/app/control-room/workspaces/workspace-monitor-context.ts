import type {
  AudioChannel,
  Guest,
  GraphicsLayer,
  MediaLayoutPreset,
  MediaRoute,
  ProductionGraph,
  Scene,
  StreamHealthMetric,
} from '@ubos/shared';
import type { SafeAreaToggles } from './workspace-types';

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
