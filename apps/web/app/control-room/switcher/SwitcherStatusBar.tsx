'use client';

import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export function SwitcherStatusBar({
  switcherReady,
  transitionReady,
  programLocked,
  automationMode,
  className,
}: {
  switcherReady: boolean;
  transitionReady: boolean;
  programLocked: boolean;
  automationMode: 'manual' | 'automation';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <StatusBadge variant={switcherReady ? 'success' : 'warning'}>
        {switcherReady ? 'Switcher Ready' : 'Switcher Busy'}
      </StatusBadge>
      <StatusBadge variant={transitionReady ? 'success' : 'warning'}>
        {transitionReady ? 'Transition Ready' : 'Transition Active'}
      </StatusBadge>
      <StatusBadge variant={programLocked ? 'warning' : 'neutral'}>
        {programLocked ? 'Program Locked' : 'Program Unlocked'}
      </StatusBadge>
      <StatusBadge variant="neutral">
        {automationMode === 'manual' ? 'Manual' : 'Automation'}
      </StatusBadge>
    </div>
  );
}
