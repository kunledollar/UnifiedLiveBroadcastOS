'use client';

import type { GraphicsLayer } from '@ubos/shared';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export function GraphicsMetadataOverlay({
  layers,
  mode,
  className,
}: {
  layers: GraphicsLayer[];
  mode: 'program' | 'preview';
  className?: string;
}) {
  const activeLayers = layers.filter((layer) =>
    mode === 'program' ? layer.programState === 'live' : layer.previewState === 'preview',
  );

  if (!activeLayers.length) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-1 bg-gradient-to-t from-black/70 to-transparent px-ubos-3 py-ubos-2',
        className,
      )}
    >
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        {mode === 'program' ? 'Program graphics metadata' : 'Preview graphics metadata'} · Renderer
        unavailable
      </p>
      <div className="flex flex-wrap gap-1">
        {activeLayers.map((layer) => (
          <StatusBadge
            key={layer.id}
            variant={mode === 'program' ? 'live' : 'preview'}
          >
            {layer.name}
          </StatusBadge>
        ))}
      </div>
    </div>
  );
}
