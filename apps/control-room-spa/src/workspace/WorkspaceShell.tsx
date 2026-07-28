import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { WorkspaceManager } from "./WorkspaceManager";

export default function WorkspaceShell() {
  console.log("WorkspaceShell rendered");

  const [activeWorkspace, setActiveWorkspace] = useState("director");

  useEffect(() => {
    console.log("[WorkspaceShell] mounted");

    return () => {
      console.log("[WorkspaceShell] unmounted");
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#111",
        color: "#fff",
      }}
    >
      <Sidebar
        active={activeWorkspace}
        onSelect={setActiveWorkspace}
      />

      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        <WorkspaceManager active={activeWorkspace} />
      </div>
    </div>
  );
}