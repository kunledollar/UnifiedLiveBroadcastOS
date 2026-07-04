'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';
import type { TransitionType } from '@ubos/shared';
import { supportedTransitions } from './switcher-config';

export function TransitionSelector({
  value,
  onChange,
  className,
}: {
  value: TransitionType;
  onChange: (value: TransitionType) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-ubos-1', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Transition</span>
      <div
        className="flex flex-wrap gap-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon p-0.5"
        role="radiogroup"
        aria-label="Transition type"
      >
        {supportedTransitions.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={option.description}
              onClick={() => onChange(option.value)}
              className={cn(
                'min-w-[2.75rem] flex-1 rounded-ubos-sm px-2 py-1.5 font-black uppercase tracking-[0.12em]',
                ubosTypographyClasses.metadata,
                'transition-colors duration-ubos-fast',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text shadow-ubos-selection-glow'
                  : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
