'use client';

import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import type { MediaRoute, ProductionPipelineModel, Scene } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';
import type { OperationsInspectorSelection } from './operations-inspector-selection';

function SelectedItemSection({ selection }: { selection: OperationsInspectorSelection }) {
  if (!selection) return null;

  if (selection.kind === 'source') {
    const { source, sceneName } = selection;
    const fileSize =
      typeof source.settings?.fileSize === 'number'
        ? `${(source.settings.fileSize / 1024 / 1024).toFixed(2)} MB`
        : 'unavailable';
    return (
      <ConsoleSection title={`Source · ${source.name}`}>
        <InspectorRow label="Scene" value={sceneName} />
        <InspectorRow label="Type" value={source.type} />
        <InspectorRow label="Visible" value={source.isVisible ? 'yes' : 'hidden'} />
        <InspectorRow label="Locked" value={source.isLocked ? 'yes' : 'no'} />
        <InspectorRow
          label="Runtime"
          value={String(source.settings?.runtimeStatus ?? 'metadata only')}
        />
        {source.settings?.mediaUrl ? (
          <InspectorRow label="Media URL" value={String(source.settings.mediaUrl)} />
        ) : null}
        {source.settings?.resolution ? (
          <InspectorRow label="Resolution" value={String(source.settings.resolution)} />
        ) : null}
        {source.settings?.fps ? (
          <InspectorRow label="FPS" value={String(source.settings.fps)} />
        ) : null}
        {source.settings?.fileSize ? <InspectorRow label="File size" value={fileSize} /> : null}
      </ConsoleSection>
    );
  }

  if (selection.kind === 'route') {
    const { route } = selection;
    return (
      <ConsoleSection title={`Route · ${route.displayName}`}>
        <InspectorRow label="ID" value={route.id} />
        <InspectorRow label="On program" value={route.isOnProgram ? 'yes' : 'no'} />
        <InspectorRow label="Active" value={route.isActive ? 'yes' : 'no'} />
        <InspectorRow label="Muted" value={route.isMuted ? 'yes' : 'no'} />
        <InspectorRow label="Pinned" value={route.isPinned ? 'yes' : 'no'} />
        <InspectorRow label="Guest" value={route.guestId ?? '—'} />
      </ConsoleSection>
    );
  }

  if (selection.kind === 'graphics-layer') {
    return (
      <ConsoleSection title={`Graphics Layer · ${selection.layerName}`}>
        <InspectorRow label="Layer ID" value={selection.layerId} />
      </ConsoleSection>
    );
  }

  if (selection.kind === 'media-asset') {
    return (
      <ConsoleSection title={`Media Asset · ${selection.assetName}`}>
        <InspectorRow label="Asset ID" value={selection.assetId} />
      </ConsoleSection>
    );
  }

  if (selection.kind === 'pipeline-route') {
    const { route } = selection;
    return (
      <ConsoleSection title={`Pipeline · ${route.label}`}>
        <InspectorRow label="Kind" value={route.kind} />
        <InspectorRow label="Active" value={route.active ? 'yes' : 'no'} />
        <InspectorRow label="Source" value={route.sourceId} />
        <InspectorRow label="Target" value={route.targetId} />
      </ConsoleSection>
    );
  }

  return null;
}

export function InspectorPanel({
  programScene,
  previewScene,
  graphRevision,
  outputViewMode,
  activeRouteCount,
  sourceCount,
  guestCount,
  warnings = [],
  programRouteName,
  verticalRouteName,
  pipeline,
  selection = null,
}: {
  programScene: Scene;
  previewScene: Scene;
  graphRevision?: number;
  outputViewMode: string;
  activeRouteCount: number;
  sourceCount: number;
  guestCount: number;
  warnings?: string[];
  programRouteName?: string | null;
  verticalRouteName?: string | null;
  pipeline?: ProductionPipelineModel;
  selection?: OperationsInspectorSelection;
}) {
  const mediaSources = [...previewScene.sources, ...programScene.sources].filter(
    (source, index, all) =>
      source.type === 'media' &&
      source.settings?.mediaUrl &&
      all.findIndex((item) => item.id === source.id) === index,
  );
  return (
    <OperationsPanel title="Inspector">
      {selection ? (
        <SelectedItemSection selection={selection} />
      ) : (
        <ConsoleSection title="Selection">
          <p className="text-ubos-metadata text-ubos-fg-muted">
            Select a source, route, or pipeline item to inspect details.
          </p>
        </ConsoleSection>
      )}

      <ConsoleSection title="Session Context" collapsed={Boolean(selection)}>
        <InspectorRow label="Program scene" value={programScene.name} />
        <InspectorRow label="Preview scene" value={previewScene.name} />
        <InspectorRow
          label="Graph revision"
          value={graphRevision !== undefined ? String(graphRevision) : 'unavailable'}
        />
        <InspectorRow label="Output view" value={outputViewMode} />
        <InspectorRow label="Active routes" value={String(activeRouteCount)} />
        <InspectorRow label="Sources (preview)" value={String(sourceCount)} />
        <InspectorRow label="Guests" value={String(guestCount)} />
        <InspectorRow label="Program route" value={programRouteName ?? 'No route on Program'} />
        <InspectorRow
          label="Vertical route"
          value={verticalRouteName ?? 'No vertical route configured'}
        />
        <InspectorRow
          label="Warnings"
          value={
            warnings.length ? (
              <StatusBadge variant="warning">{warnings.length} active</StatusBadge>
            ) : (
              <StatusBadge variant="success">None</StatusBadge>
            )
          }
        />
      </ConsoleSection>

      {pipeline ? (
        <>
          <ConsoleSection title="Unified Production Pipeline">
            <InspectorRow
              label="Health"
              value={
                <StatusBadge
                  variant={
                    pipeline.health === 'healthy'
                      ? 'success'
                      : pipeline.health === 'warning'
                        ? 'warning'
                        : 'error'
                  }
                >
                  {pipeline.health}
                </StatusBadge>
              }
            />
            <InspectorRow
              label="Active inputs"
              value={
                pipeline.state.activeSources.length
                  ? pipeline.state.activeSources.join(', ')
                  : 'None active'
              }
            />
            <InspectorRow
              label="Active outputs"
              value={
                pipeline.state.outputRouting
                  .filter((route) => route.active)
                  .map((route) => route.label)
                  .join(', ') || 'No active outputs'
              }
            />
            <InspectorRow
              label="Audio routes"
              value={
                pipeline.audioMixer
                  .map((channel) => `${channel.label}${channel.muted ? ' (muted)' : ''}`)
                  .join(', ') || 'No audio channels'
              }
            />
            <InspectorRow
              label="Video routes"
              value={
                pipeline.state.outputRouting
                  .filter((route) => route.kind === 'video')
                  .map((route) => route.label)
                  .join(', ') || 'No video routes'
              }
            />
            <InspectorRow
              label="Overlays"
              value={
                pipeline.graphicsOverlays.map((overlay) => overlay.name).join(', ') || 'No overlays'
              }
            />
            <InspectorRow
              label="Replay routes"
              value={
                pipeline.state.replayRouting.map((route) => route.label).join(', ') ||
                'Replay not routed'
              }
            />
            <InspectorRow
              label="Recording route"
              value={
                pipeline.state.outputRouting.find((route) => route.kind === 'recording')?.label ??
                'Recording not routed'
              }
            />
            <InspectorRow
              label="Streaming route"
              value={
                pipeline.state.outputRouting
                  .filter((route) => route.kind === 'streaming')
                  .map((route) => route.label)
                  .join(', ') || 'Streaming destination not set'
              }
            />
            <InspectorRow
              label="Broadcast I/O routes"
              value={
                pipeline.broadcastIoRoutes.map((route) => route.label).join(', ') ||
                'No broadcast I/O routes'
              }
            />
            <InspectorRow
              label="Monitor Wall"
              value={
                pipeline.monitorWallRoutes.map((route) => route.label).join(', ') ||
                'Monitor Wall not routed'
              }
            />
            <InspectorRow
              label="Automation events"
              value={String(pipeline.state.automationEvents.length)}
            />
            <InspectorRow
              label="Runtime handles"
              value={pipeline.containsRuntimeHandles ? 'Blocked' : 'Metadata only'}
            />
          </ConsoleSection>
          <ConsoleSection title="Pipeline Warnings" collapsed={pipeline.warnings.length === 0}>
            {pipeline.warnings.length ? (
              <ul className="space-y-1 text-ubos-caption text-ubos-fg-secondary">
                {pipeline.warnings.map((warning) => (
                  <li key={warning.id}>• {warning.message}</li>
                ))}
              </ul>
            ) : (
              <p className="text-ubos-caption text-ubos-fg-muted">
                No consistency warnings. The unified graph is ready.
              </p>
            )}
          </ConsoleSection>
          <ConsoleSection title="Pipeline Event History" collapsed>
            <ul className="space-y-1 text-ubos-caption text-ubos-fg-secondary">
              {pipeline.eventHistory.slice(-8).map((event) => (
                <li key={event.id}>
                  rev {event.graphRevision} · {event.label}
                </li>
              ))}
            </ul>
          </ConsoleSection>
        </>
      ) : null}

      {mediaSources.map((source) => {
        const fileSize =
          typeof source.settings.fileSize === 'number'
            ? `${(source.settings.fileSize / 1024 / 1024).toFixed(2)} MB`
            : 'unavailable';
        return (
          <ConsoleSection key={source.id} title={`Media Source · ${source.name}`}>
            <InspectorRow
              label="Filename"
              value={String(source.settings.filename ?? source.name)}
            />
            <InspectorRow
              label="Duration"
              value={
                source.settings.duration ? `${source.settings.duration}s` : 'image / unavailable'
              }
            />
            <InspectorRow
              label="Resolution"
              value={String(source.settings.resolution ?? 'detected at playback')}
            />
            <InspectorRow
              label="FPS"
              value={String(
                source.settings.fps ??
                  (source.settings.mediaKind === 'video' ? 'unavailable' : 'image'),
              )}
            />
            <InspectorRow label="File size" value={fileSize} />
            <InspectorRow
              label="Media type"
              value={String(source.settings.fileType ?? source.settings.mediaKind ?? 'media')}
            />
          </ConsoleSection>
        );
      })}

    </OperationsPanel>
  );
}

export function deriveInspectorRoutes(routes: MediaRoute[]) {
  const programRoute = routes.find((route) => route.isOnProgram);
  const verticalRoute = routes.find((route) => route.metadata?.onVertical === true);
  return {
    programRouteName: programRoute?.displayName ?? null,
    verticalRouteName: verticalRoute?.displayName ?? null,
  };
}
