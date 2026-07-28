import type { ReactNode } from 'react';
import { AutonomousShell } from '../../autonomous/AutonomousShell';
import { WorkspaceShell } from './workspaces/WorkspaceShell';

export default function ControlRoomLayout({ children }: { children: ReactNode }) {
  return (
    <AutonomousShell>
      <WorkspaceShell>{children}</WorkspaceShell>
    </AutonomousShell>
  );
}
