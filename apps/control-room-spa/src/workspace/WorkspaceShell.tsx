<<<<<<< HEAD
import { useEffect } from "react";
import { WorkspaceManager } from "./WorkspaceManager";
import { AutonomousShell } from "./autonomous/AutonomousShell";
import { AutonomousProvider } from "./autonomous/AutonomousProvider";
import { Sidebar } from "./Sidebar";

function WorkspaceContent() {
  const manager = WorkspaceManager();
=======
import { useState } from "react";
import { Sidebar } from "./Sidebar";   // IMPORTANT: named import, not default
import { WorkspaceManager } from "./WorkspaceManager";

export default function WorkspaceShell() {
  console.log("WorkspaceShell rendered");

  const [activeWorkspace, setActiveWorkspace] = useState("director");
>>>>>>> 94aacf1 (Apply Control Room routing + autonomous context fixes)

  useEffect(() => {
    console.log("[WorkspaceShell] mounted");
    return () => console.log("[WorkspaceShell] unmounted");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#111",     // makes UI visible
        color: "#fff"
      }}
    >
      <Sidebar active={activeWorkspace} onSelect={setActiveWorkspace} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <WorkspaceManager active={activeWorkspace} />
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default function WorkspaceShell() {
  return (
    <AutonomousProvider>
      <WorkspaceContent />
    </AutonomousProvider>
  );
}
=======
>>>>>>> 94aacf1 (Apply Control Room routing + autonomous context fixes)
