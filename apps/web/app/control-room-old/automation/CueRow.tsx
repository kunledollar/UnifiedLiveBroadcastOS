'use client';

import type { ProductionCue } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { cueStatusVariant, formatDurationMs } from './automation-utils';

export function CueRow({
  cue,
  selected = false,
  onSelect,
  onArm,
  onExecute,
  onSkip,
  onPreview,
}: {
  cue: ProductionCue;
  selected?: boolean;
  onSelect?: () => void;
  onArm?: () => void;
  onExecute?: () => void;
  onSkip?: () => void;
  onPreview?: () => void;
}) {
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
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>{cue.name}</div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {cue.type} · {cue.targetType}/{cue.targetId} · {cue.timing}
          {cue.offsetMs > 0 ? ` · ${formatDurationMs(cue.offsetMs)}` : ''}
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={cueStatusVariant(cue.status)}>{cue.status}</StatusBadge>
        <StatusBadge variant={cue.safeForAuto ? 'success' : 'warning'}>
          {cue.safeForAuto ? 'safe' : cue.requiresConfirmation ? 'confirm' : 'unsafe'}
        </StatusBadge>
      </div>
      <CompactRowActions>
        <RowIconButton label="Arm" onClick={() => onArm?.()} />
        <RowIconButton label="Go" onClick={() => onExecute?.()} />
        <RowIconButton label="Skip" onClick={() => onSkip?.()} />
        <BroadcastButton size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); onPreview?.(); }}>
          Prv
        </BroadcastButton>
      </CompactRowActions>
    </div>
  );
}
