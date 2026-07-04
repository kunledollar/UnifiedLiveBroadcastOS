'use client';

import {
  MonitorFooter,
  MonitorFrame,
  ProgramCompositor,
  ProductionMultiview,
  StatusBadge,
  VerticalCompositor,
} from '@ubos/ui';
import type {
  AudioChannel,
  Guest,
  MediaLayoutPreset,
  MediaRoute,
  ProductionGraph,
  Scene,
  StreamHealthMetric,
} from '@ubos/shared';
import {
  deriveEmptyStateMessage,
  deriveMonitorTelemetry,
  deriveSceneWarning,
  getAuxRoutes,
  getConfidenceRoute,
  getSceneWithoutGraphics,
  getVerticalRoutes,
  type OutputViewMode,
} from './monitor-state';

type OutputViewRendererProps = {
  mode: OutputViewMode;
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
};

function MonitorCompositor({
  scene,
  routes,
  layoutPreset,
  guests,
  monitorRole,
}: {
  scene: Scene;
  routes: MediaRoute[];
  layoutPreset: MediaLayoutPreset;
  guests: Guest[];
  monitorRole: 'program' | 'preview';
}) {
  return (
    <div className="absolute inset-0">
      <ProgramCompositor
        scene={scene}
        routes={routes}
        layoutPreset={layoutPreset}
        guests={guests}
        monitorRole={monitorRole}
      />
    </div>
  );
}

export function ProgramMonitor({
  scene,
  routes,
  layoutPreset,
  guests,
  graph,
  healthFps,
  showSafeAreas,
  showTitleSafe,
  showActionSafe,
  showCrosshair,
  showVerticalGuide,
  showFourThreeGuide,
  showPlatformCrop,
  role = 'program',
  compact = false,
}: {
  scene: Scene;
  routes: MediaRoute[];
  layoutPreset: MediaLayoutPreset;
  guests: Guest[];
  graph?: ProductionGraph;
  healthFps: string;
  showSafeAreas: boolean;
  showTitleSafe?: boolean;
  showActionSafe?: boolean;
  showCrosshair?: boolean;
  showVerticalGuide?: boolean;
  showFourThreeGuide?: boolean;
  showPlatformCrop?: boolean;
  role?: 'program' | 'preview';
  compact?: boolean;
}) {
  const telemetry = deriveMonitorTelemetry({
    routes,
    healthFps,
    ...(graph ? { graph } : {}),
  });
  const warning = deriveSceneWarning({ scene, routes, guests, role });
  const emptyMessage = deriveEmptyStateMessage({
    mode: role === 'preview' ? 'preview' : 'program',
    scene,
    routes,
    guests,
  });
  const hasSignal = !emptyMessage;

  return (
    <MonitorFrame
      fill={!compact}
      compact={compact}
      tally={role === 'preview' ? 'preview' : 'program'}
      label={scene.name}
      aspectRatio="16/9"
      {...(role === 'program' && telemetry.isLive ? { liveIndicator: true } : {})}
      {...(warning ? { warning } : {})}
      {...(emptyMessage ? { emptyMessage } : {})}
      showSafeAreas={showSafeAreas && hasSignal}
      safeAreaVariant="horizontal"
      {...(showTitleSafe !== undefined ? { showTitleSafe } : {})}
      {...(showActionSafe !== undefined ? { showActionSafe } : {})}
      {...(showCrosshair !== undefined ? { showCrosshair } : {})}
      {...(showVerticalGuide !== undefined ? { showVerticalGuide } : {})}
      {...(showFourThreeGuide !== undefined ? { showFourThreeGuide } : {})}
      {...(showPlatformCrop !== undefined ? { showPlatformCrop } : {})}
      metadata={
        compact
          ? [{ label: 'Scene', value: scene.name }]
          : [
              { label: 'Res', value: telemetry.resolution },
              { label: 'FPS', value: telemetry.fps },
              { label: 'Out', value: telemetry.outputStatus },
            ]
      }
      {...(compact
        ? {}
        : {
            footer: (
              <MonitorFooter>
                <StatusBadge variant={telemetry.recordingStatus === 'recording' ? 'rec' : 'neutral'}>
                  {telemetry.recordingStatus === 'recording' ? 'REC' : 'REC idle'}
                </StatusBadge>
                <span className="ubos-truncate text-ubos-fg-muted">
                  {role === 'program' ? 'PROGRAM' : 'PREVIEW'} · {scene.name}
                </span>
              </MonitorFooter>
            ),
          })}
    >
      {hasSignal ? (
        <MonitorCompositor
          scene={scene}
          routes={routes}
          layoutPreset={layoutPreset}
          guests={guests}
          monitorRole={role}
        />
      ) : null}
    </MonitorFrame>
  );
}

export function PreviewMonitorCompact(
  props: Omit<Parameters<typeof ProgramMonitor>[0], 'role' | 'compact'>,
) {
  return <ProgramMonitor {...props} role="preview" compact />;
}

export function OutputViewRenderer({
  mode,
  programScene,
  previewScene,
  routes,
  layoutPreset,
  guests,
  channels,
  healthMetrics,
  graph,
  healthFps,
  showSafeAreas,
}: OutputViewRendererProps) {
  const graphProps = graph ? { graph } : {};

  switch (mode) {
    case 'program':
      return (
        <ProgramMonitor
          scene={programScene}
          routes={routes}
          layoutPreset={layoutPreset}
          guests={guests}
          {...graphProps}
          healthFps={healthFps}
          showSafeAreas={showSafeAreas}
        />
      );
    case 'horizontal':
      return (
        <ProgramMonitor
          scene={programScene}
          routes={routes}
          layoutPreset={layoutPreset}
          guests={guests}
          {...graphProps}
          healthFps={healthFps}
          showSafeAreas={showSafeAreas}
        />
      );
    case 'multiview': {
      const emptyMessage = deriveEmptyStateMessage({
        mode: 'multiview',
        scene: programScene,
        routes,
        guests,
      });
      if (emptyMessage) {
        return (
          <MonitorFrame
            fill
            tally="idle"
            label="Multiview"
            aspectRatio="16/9"
            emptyMessage={emptyMessage}
          />
        );
      }
      return (
        <div className="h-full min-h-0 overflow-hidden">
          <ProductionMultiview
            programScene={programScene}
            previewScene={previewScene}
            routes={routes}
            layoutPreset={layoutPreset}
            channels={channels}
            healthMetrics={healthMetrics}
            guests={guests}
            preset="broadcast"
          />
        </div>
      );
    }
    case 'vertical': {
      const verticalRoutes = getVerticalRoutes(routes);
      const emptyMessage = deriveEmptyStateMessage({
        mode: 'vertical',
        scene: programScene,
        routes,
        guests,
      });
      const warning = deriveSceneWarning({ scene: programScene, routes, guests, role: 'program' });
      const hasSignal = !emptyMessage;

      return (
        <div className="flex h-full min-h-0 items-center justify-center">
          <div className="h-full max-h-full w-auto max-w-full">
            <MonitorFrame
              fill
              tally="idle"
              label="Vertical Output"
              aspectRatio="9/16"
              {...(warning ? { warning } : {})}
              {...(emptyMessage ? { emptyMessage } : {})}
              showSafeAreas={showSafeAreas && hasSignal}
              safeAreaVariant="vertical"
              metadata={[
                {
                  label: 'Route',
                  value: verticalRoutes.length ? 'configured' : 'unconfigured',
                },
              ]}
            >
              {hasSignal ? (
                <div className="absolute inset-0">
                  <VerticalCompositor
                    scene={programScene}
                    routes={routes}
                    layoutPreset={layoutPreset}
                    guests={guests}
                  />
                </div>
              ) : null}
            </MonitorFrame>
          </div>
        </div>
      );
    }
    case 'clean': {
      const cleanScene = getSceneWithoutGraphics(programScene);
      const emptyMessage = deriveEmptyStateMessage({
        mode: 'clean',
        scene: programScene,
        routes,
        guests,
      });
      const hasSignal = !emptyMessage;

      return (
        <MonitorFrame
          fill
          tally="program"
          label={`${programScene.name} · Clean`}
          aspectRatio="16/9"
          {...(emptyMessage ? { emptyMessage } : {})}
          showSafeAreas={showSafeAreas && hasSignal}
          metadata={[{ label: 'Feed', value: 'clean' }]}
        >
          {hasSignal ? (
            <MonitorCompositor
              scene={cleanScene}
              routes={routes}
              layoutPreset={layoutPreset}
              guests={guests}
              monitorRole="program"
            />
          ) : null}
        </MonitorFrame>
      );
    }
    case 'aux': {
      const auxRoutes = getAuxRoutes(routes);
      const auxRoute = auxRoutes[0];
      const emptyMessage = deriveEmptyStateMessage({
        mode: 'aux',
        scene: programScene,
        routes,
        guests,
      });
      const auxScene =
        auxRoute?.sceneId && previewScene.id === auxRoute.sceneId ? previewScene : programScene;

      return (
        <MonitorFrame
          fill
          tally="idle"
          label={auxRoute?.displayName ?? 'Aux Output'}
          aspectRatio="16/9"
          {...(emptyMessage ? { emptyMessage } : {})}
          metadata={[
            { label: 'Routes', value: auxRoutes.length ? String(auxRoutes.length) : '0' },
          ]}
        >
          {auxRoute ? (
            <MonitorCompositor
              scene={auxScene}
              routes={auxRoutes}
              layoutPreset={layoutPreset}
              guests={guests}
              monitorRole="preview"
            />
          ) : null}
        </MonitorFrame>
      );
    }
    case 'confidence': {
      const confidenceRoute = getConfidenceRoute(routes, guests);
      const emptyMessage = deriveEmptyStateMessage({
        mode: 'confidence',
        scene: programScene,
        routes,
        guests,
      });

      return (
        <MonitorFrame
          fill
          tally="preview"
          label={confidenceRoute?.displayName ?? 'Confidence Monitor'}
          aspectRatio="16/9"
          {...(emptyMessage ? { emptyMessage } : {})}
          metadata={[
            {
              label: 'Guest',
              value: confidenceRoute?.guest?.displayName ?? 'unavailable',
            },
          ]}
        >
          {confidenceRoute ? (
            <MonitorCompositor
              scene={previewScene}
              routes={[confidenceRoute]}
              layoutPreset={layoutPreset}
              guests={guests}
              monitorRole="preview"
            />
          ) : null}
        </MonitorFrame>
      );
    }
    default:
      return null;
  }
}
