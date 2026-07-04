'use client';

import { cn } from '@ubos/ui';
import { outputViewModes, type OutputViewMode } from './monitor-state';

export function OutputViewModeSelector({
  selected,
  onSelect,
  className,
}: {
  selected: OutputViewMode;
  onSelect: (mode: OutputViewMode) => void;
  showSafeAreas?: boolean;
  onToggleSafeAreas?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-ubos-2', className)}>
      <span className="shrink-0 text-ubos-metadata font-medium text-ubos-fg-muted">Output View</span>
      <div className="flex min-w-0 flex-wrap gap-1">
        {outputViewModes.map((mode) => {
          const active = selected === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              aria-pressed={active}
              title={mode.description}
              onClick={() => onSelect(mode.value)}
              className={cn(
                'rounded-ubos-sm px-2 py-1 text-ubos-metadata font-medium transition-colors duration-ubos-fast',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              )}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
