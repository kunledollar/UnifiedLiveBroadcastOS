'use client';

import type { AutomationMacro } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { AutomationEmptyState } from './AutomationEmptyState';
import { MacroRow } from './MacroRow';

export function MacroPanel({
  macros,
  onArmMacro,
  onDisableMacro,
  className,
}: {
  macros: AutomationMacro[];
  onArmMacro?: (macroId: string) => void;
  onDisableMacro?: (macroId: string) => void;
  className?: string;
}) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Macros</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata only · No macro execution
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-ubos-2">
        {!macros.length ? (
          <AutomationEmptyState message="No macros configured" />
        ) : (
          <div className="space-y-1">
            {macros.map((macro) => (
              <MacroRow
                key={macro.id}
                macro={macro}
                onArm={() => onArmMacro?.(macro.id)}
                onDisable={() => onDisableMacro?.(macro.id)}
              />
            ))}
          </div>
        )}
      </div>
    </BroadcastPanel>
  );
}
