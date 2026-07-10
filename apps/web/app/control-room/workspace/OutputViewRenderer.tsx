'use client';

import { useCallback } from 'react';
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
  GraphicsLayer,
  MediaLayoutPreset,
  MediaRoute,
  ProductionGraph,
  Scene,
  StreamHealthMetric,
} from '@ubos/shared';
import { GraphicsMetadataOverlay } from '../graphics/GraphicsMetadataOverlay';
import { MediaMetadataOverlay } from '../media/MediaMetadataOverlay';
import { CollaborationMetadataOverlay } from '../collaboration/CollaborationMetadataOverlay';
import { AutomationMetadataOverlay } from '../automation/AutomationMetadataOverlay';
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
import { openPopOutWindow } from '../pop-out/usePopOutWindow';

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
  programGraphicsLayers?: GraphicsLayer[];
  previewGraphicsLayers?: GraphicsLayer[];
  programMediaOverlayItems?: Array<{ id: string; name: string }>;
  previewMediaOverlayItems?: Array<{ id: string; name: string }>;
  collaborationDirectorName?: string;
  collaborationLockCount?: number;
  collaborationOpenNoteCount?: number;
  collaborationPreviewChangedBy?: string;
  automationCurrentSegmentName?: string;
  automationNextSegmentName?: string;
  automationModeLabel?: string;
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
  graphicsLayers = [],
  mediaOverlayItems = [],
  collaborationDirectorName,
  collaborationLockCount,
  collaborationOpenNoteCount,
  collaborationPreviewChangedBy,
  automationCurrentSegmentName,
  automationNextSegmentName,
  automationModeLabel,
  role = 'program',
  compact = false,
  deckMode = false,
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
  graphicsLayers?: GraphicsLayer[];
  mediaOverlayItems?: Array<{ id: string; name: string }>;
  collaborationDirectorName?: string;
  collaborationLockCount?: number;
  collaborationOpenNoteCount?: number;
  collaborationPreviewChangedBy?: string;
  automationCurrentSegmentName?: string;
  automationNextSegmentName?: string;
  automationModeLabel?: string;
  role?: 'program' | 'preview';
  compact?: boolean;
  deckMode?: boolean;
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
      aspectRatio="16/9"
      {...(deckMode ? { header: <></> } : { label: scene.name })}
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
      {...(deckMode
        ? {}
        : {
            metadata: compact
              ? [{ label: 'Scene', value: scene.name }]
              : [
                  { label: 'Res', value: telemetry.resolution },
                  { label: 'FPS', value: telemetry.fps },
                  { label: 'Out', value: telemetry.outputStatus },
                ],
          })}
      {...(compact || deckMode
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
        <>
          <MonitorCompositor
            scene={scene}
            routes={routes}
            layoutPreset={layoutPreset}
            guests={guests}
            monitorRole={role}
          />
          {graphicsLayers.length ? (
            <GraphicsMetadataOverlay layers={graphicsLayers} mode={role === 'preview' ? 'preview' : 'program'} />
          ) : null}
          {mediaOverlayItems.length ? (
            <MediaMetadataOverlay items={mediaOverlayItems} mode={role === 'preview' ? 'preview' : 'program'} />
          ) : null}
          <CollaborationMetadataOverlay
            {...(collaborationDirectorName ? { directorName: collaborationDirectorName } : {})}
            {...(collaborationLockCount !== undefined ? { activeLockCount: collaborationLockCount } : {})}
            {...(collaborationOpenNoteCount !== undefined ? { openNoteCount: collaborationOpenNoteCount } : {})}
            {...(collaborationPreviewChangedBy ? { previewChangedBy: collaborationPreviewChangedBy } : {})}
          />
          <AutomationMetadataOverlay
            {...(automationCurrentSegmentName ? { currentSegmentName: automationCurrentSegmentName } : {})}
            {...(automationNextSegmentName ? { nextSegmentName: automationNextSegmentName } : {})}
            {...(automationModeLabel ? { automationMode: automationModeLabel } : {})}
          />
        </>
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
  programGraphicsLayers = [],
  previewGraphicsLayers = [],
  programMediaOverlayItems = [],
  previewMediaOverlayItems = [],
  collaborationDirectorName,
  collaborationLockCount,
  collaborationOpenNoteCount,
  collaborationPreviewChangedBy,
  automationCurrentSegmentName,
  automationNextSegmentName,
  automationModeLabel,
}: OutputViewRendererProps) {
  const graphProps = graph ? { graph } : {};

  const handleMultiviewPopOut = useCallback(() => {
    openPopOutWindow('multiview');
  }, []);

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
          graphicsLayers={programGraphicsLayers}
          mediaOverlayItems={programMediaOverlayItems}
          {...(collaborationDirectorName ? { collaborationDirectorName } : {})}
          {...(collaborationLockCount !== undefined ? { collaborationLockCount } : {})}
          {...(collaborationOpenNoteCount !== undefined ? { collaborationOpenNoteCount } : {})}
          {...(collaborationPreviewChangedBy ? { collaborationPreviewChangedBy } : {})}
          {...(automationCurrentSegmentName ? { automationCurrentSegmentName } : {})}
          {...(automationNextSegmentName ? { automationNextSegmentName } : {})}
          {...(automationModeLabel ? { automationModeLabel } : {})}
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
          graphicsLayers={programGraphicsLayers}
          mediaOverlayItems={programMediaOverlayItems}
          {...(collaborationDirectorName ? { collaborationDirectorName } : {})}
          {...(collaborationLockCount !== undefined ? { collaborationLockCount } : {})}
          {...(collaborationOpenNoteCount !== undefined ? { collaborationOpenNoteCount } : {})}
          {...(collaborationPreviewChangedBy ? { collaborationPreviewChangedBy } : {})}
          {...(automationCurrentSegmentName ? { automationCurrentSegmentName } : {})}
          {...(automationNextSegmentName ? { automationNextSegmentName } : {})}
          {...(automationModeLabel ? { automationModeLabel } : {})}
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
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {/* Multiview panel header with Pop Out button */}
          <div className="flex shrink-0 items-center gap-2 border-b border-ubos-border-subtle bg-ubos-graphite/60 px-2 py-1">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-ubos-fg-muted">
              Multiview
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={handleMultiviewPopOut}
              className="shrink-0 rounded-ubos-sm border border-ubos-border-subtle bg-transparent px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ubos-fg-muted transition-colors duration-[var(--ubos-duration-fast)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Pop out Multiview to external window"
              title="Open Multiview in external window"
            >
              ⧉ Pop Out
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
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
