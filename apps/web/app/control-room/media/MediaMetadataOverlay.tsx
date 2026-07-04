'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export type MediaMetadataOverlayItem = {
  id: string;
  name: string;
};

export function MediaMetadataOverlay({
  items,
  mode,
  className,
}: {
  items: MediaMetadataOverlayItem[];
  mode: 'program' | 'preview';
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-20 space-y-1 bg-gradient-to-t from-black/70 to-transparent px-ubos-3 py-ubos-2',
        className,
      )}
    >
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        {mode === 'program' ? 'Program media metadata' : 'Preview media metadata'} · Playback
        runtime unavailable
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <StatusBadge key={item.id} variant={mode === 'program' ? 'live' : 'preview'}>
            {item.name}
          </StatusBadge>
        ))}
      </div>
    </div>
  );
}
