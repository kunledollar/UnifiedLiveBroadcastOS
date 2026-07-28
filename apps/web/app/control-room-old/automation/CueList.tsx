'use client';

import type { ProductionCue } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { AutomationEmptyState } from './AutomationEmptyState';
import { CueRow } from './CueRow';

export function CueList({
  cues,
  selectedCueId,
  onSelectCue,
  onArmCue,
  onExecuteCue,
  onSkipCue,
  className,
}: {
  cues: ProductionCue[];
  selectedCueId?: string | null;
  onSelectCue?: (cueId: string) => void;
  onArmCue?: (cueId: string) => void;
  onExecuteCue?: (cueId: string) => void;
  onSkipCue?: (cueId: string) => void;
  className?: string;
}) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Cue List</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {cues.length} cue{cues.length === 1 ? '' : 's'} · Metadata staging only
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-ubos-2">
        {!cues.length ? (
          <AutomationEmptyState message="No cues" className="min-h-[3rem]" />
        ) : (
          <div className="space-y-1">
            {cues.map((cue) => (
              <CueRow
                key={cue.id}
                cue={cue}
                selected={selectedCueId === cue.id}
                onSelect={() => onSelectCue?.(cue.id)}
                onArm={() => onArmCue?.(cue.id)}
                onExecute={() => onExecuteCue?.(cue.id)}
                onSkip={() => onSkipCue?.(cue.id)}
              />
            ))}
          </div>
        )}
      </div>
    </BroadcastPanel>
  );
}
