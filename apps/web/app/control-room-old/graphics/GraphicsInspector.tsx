'use client';

import type { GraphicsAsset, GraphicsLayer } from '@ubos/shared';
import { validateGraphicsLayer } from '@ubos/shared';
import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import { GraphicsEmptyState } from './GraphicsEmptyState';

export function GraphicsInspector({
  layer,
  layers,
  assets,
  sceneName,
}: {
  layer: GraphicsLayer | null;
  layers: GraphicsLayer[];
  assets: GraphicsAsset[];
  sceneName: string;
}) {
  if (!layer) {
    return <GraphicsEmptyState message="Select a layer to inspect properties" />;
  }

  const asset = assets.find((item) => item.id === layer.assetId);
  const issues = validateGraphicsLayer(layer, layers, assets);

  return (
    <ConsoleSection title="Properties">
      <InspectorRow label="Name" value={layer.name} />
      <InspectorRow label="Type" value={asset?.type.replace(/_/g, ' ') ?? 'unavailable'} />
      <InspectorRow label="Scene" value={sceneName} />
      <InspectorRow
        label="Position"
        value={`${Math.round(layer.position.x * 100)}%, ${Math.round(layer.position.y * 100)}%`}
      />
      <InspectorRow
        label="Size"
        value={`${Math.round(layer.size.width * 100)}% × ${Math.round(layer.size.height * 100)}%`}
      />
      <InspectorRow label="Opacity" value={`${Math.round(layer.opacity * 100)}%`} />
      <InspectorRow label="Visible" value={layer.visible ? 'Yes' : 'No'} />
      <InspectorRow label="Locked" value={layer.locked ? 'Yes' : 'No'} />
      <InspectorRow label="Graphic ID" value={layer.id} />
      <InspectorRow label="Layer" value={`#${layer.order}`} />
      <InspectorRow label="Animation" value={`${String((layer.transition as { preset?: string }).preset ?? layer.transition.type)} · ${layer.transition.durationMs}ms`} />
      <InspectorRow label="Memory" value={String(layer.metadata?.memory ?? 'metadata-only')} />
      <InspectorRow label="Runtime State" value={String(layer.metadata?.runtimeState ?? layer.programState)} />
      <InspectorRow label="Visibility" value={layer.visible ? 'Visible' : 'Hidden'} />
      <InspectorRow label="Transition" value={`${layer.transition.type} · ${layer.transition.durationMs}ms`} />
      <InspectorRow label="Program" value={layer.programState} />
      <InspectorRow label="Preview" value={layer.previewState} />
      <div className="flex flex-wrap gap-1 pt-1">
        <StatusBadge variant={layer.programState === 'live' ? 'live' : 'neutral'}>
          Program: {layer.programState}
        </StatusBadge>
        <StatusBadge variant={layer.previewState === 'preview' ? 'preview' : 'neutral'}>
          Preview: {layer.previewState}
        </StatusBadge>
      </div>
      {issues.length ? (
        <div className="space-y-1 pt-2">
          {issues.map((issue) => (
            <StatusBadge key={`${issue.code}-${issue.field ?? 'root'}`} variant="warning">
              {issue.message}
            </StatusBadge>
          ))}
        </div>
      ) : null}
      <p className="pt-2 text-ubos-metadata text-ubos-fg-muted">
        Metadata-first: saved graphics metadata is separate from runtime DOM nodes, CSS animations, and requestAnimationFrame clocks
      </p>
    </ConsoleSection>
  );
}
