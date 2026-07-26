import { AutonomousShell } from "../autonomous/AutonomousShell";
import { WorkspaceManager } from "./WorkspaceManager";

export function WorkspaceShell() {
  return (
    <AutonomousShell>
      <div className="workspace-shell">
        <WorkspaceManager />
      </div>
    </AutonomousShell>
  );
}
