'use client';

import { cn } from '@ubos/ui';
import type { LayoutFocusMode } from './workspace-types';

const layoutFocusOptions: Array<{ id: LayoutFocusMode; label: string; description: string }> = [
  {
    id: 'full',
    label: 'Director',
    description: 'Full layout — monitors, switcher, dock, and operations',
  },
  {
    id: 'switcher',
    label: 'Switcher',
    description: 'Monitors and switcher only — hides dock and operations panel',
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'Expanded audio dock with compact switcher',
  },
];

export function LayoutFocusSelector({
  selected,
  onSelect,
  className,
}: {
  selected: LayoutFocusMode;
  onSelect: (mode: LayoutFocusMode) => void;
  className?: string;
}) {
  return (
    <details className={cn('group relative', className)}>
      <summary className="flex h-6 cursor-pointer list-none items-center gap-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight px-2 text-ubos-metadata font-medium text-ubos-fg-secondary hover:bg-ubos-slate">
        <span className="text-ubos-fg-muted">Focus</span>
        <span className="text-ubos-fg-primary">
          {layoutFocusOptions.find((option) => option.id === selected)?.label ?? 'Director'}
        </span>
        <span aria-hidden="true" className="text-ubos-fg-muted">
          ▼
        </span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 grid min-w-52 gap-0.5 rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-2 text-ubos-caption text-ubos-fg-secondary shadow-ubos-raised">
        {layoutFocusOptions.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              className={cn(
                'rounded-ubos-sm px-2 py-1.5 text-left transition-colors duration-ubos-fast',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'hover:bg-ubos-midnight',
              )}
              onClick={() => onSelect(option.id)}
            >
              {option.label}
              <span className="block text-ubos-metadata text-ubos-fg-muted">{option.description}</span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
