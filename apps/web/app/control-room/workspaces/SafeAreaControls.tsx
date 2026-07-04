'use client';

import { BroadcastButton, cn } from '@ubos/ui';
import type { SafeAreaToggles } from './workspace-types';

const safeAreaOptions: Array<{ key: keyof SafeAreaToggles; label: string }> = [
  { key: 'actionSafe', label: 'Action' },
  { key: 'titleSafe', label: 'Title' },
  { key: 'crosshair', label: 'Cross' },
  { key: 'verticalGuide', label: '9:16' },
  { key: 'fourThreeGuide', label: '4:3' },
];

export function SafeAreaControls({
  enabled,
  toggles,
  onToggleEnabled,
  onToggleGuide,
  className,
}: {
  enabled: boolean;
  toggles: SafeAreaToggles;
  onToggleEnabled: () => void;
  onToggleGuide: (key: keyof SafeAreaToggles) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <BroadcastButton type="button" size="sm" variant="ghost" active={enabled} onClick={onToggleEnabled}>
        Safe Areas
      </BroadcastButton>
      {enabled
        ? safeAreaOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={toggles[option.key]}
              onClick={() => onToggleGuide(option.key)}
              className={cn(
                'rounded-ubos-sm px-1.5 py-0.5 text-ubos-metadata font-medium transition-colors duration-ubos-fast',
                toggles[option.key]
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              )}
            >
              {option.label}
            </button>
          ))
        : null}
    </div>
  );
}
