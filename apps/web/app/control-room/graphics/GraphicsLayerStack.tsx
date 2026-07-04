'use client';

import type { GraphicsAsset, GraphicsLayer } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { GraphicsEmptyState } from './GraphicsEmptyState';
import { GraphicsLayerRow } from './GraphicsLayerRow';
import { sortLayersDesc } from './graphics-utils';

export function GraphicsLayerStack({
  layers,
  assets,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  className,
}: {
  layers: GraphicsLayer[];
  assets: GraphicsAsset[];
  selectedLayerId?: string | null;
  onSelectLayer?: (layerId: string) => void;
  onToggleVisibility?: (layerId: string) => void;
  onToggleLock?: (layerId: string) => void;
  onMoveUp?: (layerId: string) => void;
  onMoveDown?: (layerId: string) => void;
  onDuplicate?: (layerId: string) => void;
  onRemove?: (layerId: string) => void;
  className?: string;
}) {
  const sorted = sortLayersDesc(layers);

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <header className="shrink-0 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>Layers</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Top to bottom · Program / Preview state
        </p>
      </header>
      <div className="ubos-scroll min-h-0 flex-1 space-y-1 overflow-y-auto p-ubos-2">
        {sorted.length === 0 ? (
          <GraphicsEmptyState message="No layers in this scene" />
        ) : (
          sorted.map((layer) => (
            <GraphicsLayerRow
              key={layer.id}
              layer={layer}
              layers={layers}
              assets={assets}
              selected={selectedLayerId === layer.id}
              onSelect={() => onSelectLayer?.(layer.id)}
              onToggleVisibility={() => onToggleVisibility?.(layer.id)}
              onToggleLock={() => onToggleLock?.(layer.id)}
              onMoveUp={() => onMoveUp?.(layer.id)}
              onMoveDown={() => onMoveDown?.(layer.id)}
              onDuplicate={() => onDuplicate?.(layer.id)}
              onRemove={() => onRemove?.(layer.id)}
            />
          ))
        )}
      </div>
    </BroadcastPanel>
  );
}
