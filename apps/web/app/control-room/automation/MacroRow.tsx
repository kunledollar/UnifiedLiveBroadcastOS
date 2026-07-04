'use client';

import type { AutomationMacro } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { automationModeLabel } from './automation-utils';

export function MacroRow({
  macro,
  selected = false,
  onSelect,
  onArm,
  onDisable,
  onPreview,
}: {
  macro: AutomationMacro;
  selected?: boolean;
  onSelect?: () => void;
  onArm?: () => void;
  onDisable?: () => void;
  onPreview?: () => void;
}) {
  const hasRiskySteps = macro.steps.some((step) => !step.safeForAuto);

  return (
    <div
      className={cn(
        'flex w-full items-center gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5',
        selected ? 'border-ubos-selection-border bg-ubos-selection-muted' : 'border-transparent bg-ubos-midnight/50',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
      >
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>{macro.name}</div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {automationModeLabel(macro.mode)} · {macro.steps.length} steps · {macro.description ?? 'no description'}
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={macro.status === 'ready' ? 'success' : macro.status === 'disabled' ? 'offline' : 'neutral'}>
          {macro.status}
        </StatusBadge>
        {hasRiskySteps ? <StatusBadge variant="warning">risky</StatusBadge> : null}
      </div>
      <CompactRowActions>
        <RowIconButton label="Prv" onClick={() => onPreview?.()} />
        <RowIconButton label="Arm" onClick={() => onArm?.()} />
        <BroadcastButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onDisable?.(); }}>
          Off
        </BroadcastButton>
      </CompactRowActions>
    </div>
  );
}
