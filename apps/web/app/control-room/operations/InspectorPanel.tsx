'use client';

import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import type { MediaRoute, Scene } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';

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
}) {
  const mediaSources = [...previewScene.sources, ...programScene.sources].filter(
    (source, index, all) =>
      source.type === 'media' &&
      source.settings?.mediaUrl &&
      all.findIndex((item) => item.id === source.id) === index,
  );
  return (
    <OperationsPanel title="Inspector">
      <ConsoleSection title="Session Context">
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
        <InspectorRow
          label="Program route"
          value={programRouteName ?? 'No route on Program'}
        />
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

      {mediaSources.map((source) => {
        const fileSize = typeof source.settings.fileSize === 'number'
          ? `${(source.settings.fileSize / 1024 / 1024).toFixed(2)} MB`
          : 'unavailable';
        return (
          <ConsoleSection key={source.id} title={`Media Source · ${source.name}`}>
            <InspectorRow label="Filename" value={String(source.settings.filename ?? source.name)} />
            <InspectorRow label="Duration" value={source.settings.duration ? `${source.settings.duration}s` : 'image / unavailable'} />
            <InspectorRow label="Resolution" value={String(source.settings.resolution ?? 'detected at playback')} />
            <InspectorRow label="FPS" value={String(source.settings.fps ?? (source.settings.mediaKind === 'video' ? 'unavailable' : 'image'))} />
            <InspectorRow label="File size" value={fileSize} />
            <InspectorRow label="Media type" value={String(source.settings.fileType ?? source.settings.mediaKind ?? 'media')} />
          </ConsoleSection>
        );
      })}

      <ConsoleSection title="Context Sections" collapsed>
        <p className="text-ubos-metadata text-ubos-fg-muted">
          Scene, Source, Guest, Media, and Output detail sections will appear when explicit
          selection is available. No selection state is active.
        </p>
      </ConsoleSection>
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
