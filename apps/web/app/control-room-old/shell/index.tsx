'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';

export function ControlRoomShellFrame({ children }: { children: ReactNode }) {
  return (
    <main
      className={cn(
        'ubos-workstation flex h-screen flex-col overflow-hidden bg-ubos-carbon text-ubos-fg-primary',
      )}
    >
      {children}
    </main>
  );
}

export { BroadcastStatusBar } from './BroadcastStatusBar';
export { LeftNavigationRail } from './LeftNavigationRail';
export { CenterProgramWorkspace } from './CenterProgramWorkspace';
export { RightOperationsConsole } from './RightOperationsConsole';
export { ProfessionalSwitcherBar } from './ProfessionalSwitcherBar';
export { BottomDock } from './BottomDock';
