import { WorkspaceManager } from "./WorkspaceManager";
import { AutonomousShell } from "../autonomous/AutonomousShell";
import { Sidebar } from "./Sidebar";

export function WorkspaceShell() {
  const manager = WorkspaceManager();

  return (
    <div className="workspace-shell">
      <Sidebar
        active={manager.workspace}
        onSelect={(ws) => manager.setWorkspace(ws)}
      />

      <div className="workspace-canvas">
        {manager.renderWorkspace()}
      </div>

      <AutonomousShell />
    </div>
  );
}
