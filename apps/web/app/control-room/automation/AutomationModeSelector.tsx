'use client';

import type { AutomationMode } from '@ubos/shared';
import { BroadcastButton, cn, ubosTypographyClasses } from '@ubos/ui';

const modeLabels: Record<AutomationMode, string> = {
  manual: 'Manual',
  semi_auto: 'Semi-Auto',
  automatic: 'Auto',
};

export function AutomationModeSelector({
  mode,
  onChange,
  className,
}: {
  mode: AutomationMode;
  onChange?: (mode: AutomationMode) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-ubos-2', className)}>
      <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        Automation mode · Metadata only
      </span>
      {(Object.keys(modeLabels) as AutomationMode[]).map((value) => (
        <BroadcastButton
          key={value}
          size="sm"
          variant={mode === value ? 'primary' : 'ghost'}
          onClick={() => onChange?.(value)}
        >
          {modeLabels[value]}
        </BroadcastButton>
      ))}
    </div>
  );
}
