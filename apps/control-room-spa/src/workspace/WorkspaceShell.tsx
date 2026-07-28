import { WorkspaceManager } from "./WorkspaceManager";
import { AutonomousShell } from "./autonomous/AutonomousShell";
import { Sidebar } from "./Sidebar";

export default function WorkspaceShell() {
  const manager = WorkspaceManager();

  return (
    <div className="ubos-shell">
      <Sidebar
        active={manager.workspace}
        onSelect={(ws) => manager.setWorkspace(ws)}
      />

      <div className="ubos-shell__canvas">
        {manager.renderWorkspace()}
      </div>

      <AutonomousShell />
    </div>
  );
}
