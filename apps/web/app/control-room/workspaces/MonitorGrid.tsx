'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { MultiviewLayoutMode } from './workspace-types';

const gridLayouts: Record<
  MultiviewLayoutMode,
  { columns: number; rows: number; areas?: string }
> = {
  'program-focus': { columns: 1, rows: 1 },
  'dual-view': { columns: 2, rows: 1 },
  'quad-view': { columns: 2, rows: 2 },
  'six-view': { columns: 3, rows: 2 },
  'eight-view': { columns: 4, rows: 2 },
  'sixteen-view': { columns: 4, rows: 4 },
  'vertical-split': { columns: 2, rows: 1 },
  'podcast-grid': { columns: 2, rows: 2 },
  'producer-dashboard': { columns: 3, rows: 2 },
  'audio-focus': { columns: 1, rows: 1 },
  'replay-focus': { columns: 2, rows: 2 },
  'graphics-focus': { columns: 1, rows: 1 },
  'media-focus': { columns: 1, rows: 1 },
  'collaboration-focus': { columns: 1, rows: 1 },
};

export function MonitorGrid({
  mode,
  children,
  programDominant = false,
  className,
}: {
  mode: MultiviewLayoutMode;
  children: ReactNode[];
  programDominant?: boolean;
  className?: string;
}) {
  const layout = gridLayouts[mode];

  if (
    mode === 'program-focus' ||
    mode === 'audio-focus' ||
    mode === 'graphics-focus' ||
    mode === 'media-focus' ||
    mode === 'collaboration-focus'
  ) {
    return <div className={cn('h-full min-h-0 overflow-hidden', className)}>{children[0]}</div>;
  }

  if (programDominant && children.length > 1) {
    return (
      <div className={cn('grid h-full min-h-0 gap-ubos-2 overflow-hidden', className)} style={{
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)',
      }}>
        <div className="row-span-2 min-h-0 overflow-hidden">{children[0]}</div>
        {children.slice(1).map((child, index) => (
          <div key={index} className="min-h-0 overflow-hidden">
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('grid h-full min-h-0 gap-ubos-2 overflow-hidden', className)}
      style={{
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
        ...(layout.areas ? { gridTemplateAreas: layout.areas } : {}),
      }}
    >
      {children.map((child, index) => (
        <div key={index} className="min-h-0 overflow-hidden">
          {child}
        </div>
      ))}
    </div>
  );
}
