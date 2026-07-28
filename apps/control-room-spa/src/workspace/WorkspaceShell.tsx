import { useEffect } from 'react';
import { useWorkspaceManager } from './WorkspaceManager';
import { AutonomousShell } from './autonomous/AutonomousShell';
import { AutonomousProvider } from './autonomous/AutonomousProvider';
import { Sidebar } from './Sidebar';

function WorkspaceContent() {
  const manager = useWorkspaceManager();

  useEffect(() => {
    console.log('[WorkspaceShell] mounted');
    return () => console.log('[WorkspaceShell] unmounted');
  }, []);

  return (
    <div className="ubos-shell">
      <Sidebar active={manager.workspace} onSelect={(ws) => manager.setWorkspace(ws)} />

      <div className="ubos-shell__canvas">{manager.renderWorkspace()}</div>

      <AutonomousShell />
    </div>
  );
}

export default function WorkspaceShell() {
  return (
    <AutonomousProvider>
      <WorkspaceContent />
    </AutonomousProvider>
  );
}
