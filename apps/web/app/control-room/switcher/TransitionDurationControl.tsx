'use client';

import { cn, ubosTypographyClasses } from '@ubos/ui';
import type { TransitionType } from '@ubos/shared';
import { durationPresetsMs, formatDurationLabel } from './switcher-config';

export function TransitionDurationControl({
  value,
  transitionType,
  onChange,
  variant = 'full',
  className,
}: {
  value: number;
  transitionType: TransitionType;
  onChange: (value: number) => void;
  variant?: 'full' | 'compact';
  className?: string;
}) {
  const disabled = transitionType === 'cut';
  const presetMatch = durationPresetsMs.includes(value as (typeof durationPresetsMs)[number]);

  if (variant === 'compact') {
    return (
      <div className={cn('flex min-w-0 flex-col gap-ubos-1', className)}>
        <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Duration</span>
        <div className="flex items-center gap-1">
          <select
            disabled={disabled}
            value={presetMatch ? String(value) : 'custom'}
            aria-label="Transition duration preset"
            onChange={(event) => {
              const next = event.target.value;
              if (next !== 'custom') onChange(Number(next));
            }}
            className={cn(
              'min-w-0 flex-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 font-mono text-ubos-metadata text-ubos-fg-primary outline-none focus:border-ubos-selection-border',
              disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {durationPresetsMs.map((preset) => (
              <option key={preset} value={preset}>
                {formatDurationLabel(preset)}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {!presetMatch ? (
            <input
              type="number"
              min={100}
              max={5000}
              step={50}
              disabled={disabled}
              value={value}
              aria-label="Custom transition duration in milliseconds"
              onChange={(event) => onChange(Number(event.target.value))}
              className={cn(
                'w-16 rounded-ubos-sm border border-ubos-selection-border bg-ubos-carbon px-1.5 py-1 text-right font-mono text-ubos-metadata text-ubos-fg-primary',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-ubos-1', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Duration</span>
      <div className="flex flex-wrap gap-1">
        {durationPresetsMs.map((preset) => {
          const active = value === preset;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset)}
              className={cn(
                'rounded-ubos-sm border px-2 py-1 font-mono font-bold',
                ubosTypographyClasses.metadata,
                active
                  ? 'border-ubos-selection-border bg-ubos-selection-muted text-ubos-selection-text'
                  : 'border-ubos-border-subtle bg-ubos-midnight text-ubos-fg-muted hover:text-ubos-fg-secondary',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {formatDurationLabel(preset)}
            </button>
          );
        })}
      </div>
      <label className={cn('flex items-center gap-ubos-2', ubosTypographyClasses.metadata)}>
        <span className="text-ubos-fg-muted">Custom</span>
        <input
          type="number"
          min={100}
          max={5000}
          step={50}
          disabled={disabled}
          value={value}
          aria-label="Custom transition duration in milliseconds"
          onChange={(event) => onChange(Number(event.target.value))}
          className={cn(
            'w-20 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-right font-mono text-ubos-fg-primary',
            !presetMatch && !disabled ? 'border-ubos-selection-border' : '',
            disabled && 'cursor-not-allowed opacity-40',
          )}
        />
        <span className="text-ubos-fg-muted">ms</span>
      </label>
    </div>
  );
}
