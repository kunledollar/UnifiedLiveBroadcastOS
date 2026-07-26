import { useContext } from "react";
import { AutonomousContext } from "./AutonomousProvider";
import { AutonomousHUD } from "./hud/AutonomousHUD";
import { AutonomousControlPanel } from "./AutonomousControlPanel";
import { AutonomousTimeline } from "./timeline/AutonomousTimeline";
import { AutonomousLogs } from "./logs/AutonomousLogs";

export function AutonomousUI() {
  const ctx = useContext(AutonomousContext);
  if (!ctx) return null;

  const { state, setState } = ctx;

  return (
    <div className="autonomous-ui">
      <AutonomousHUD state={state} />
      <AutonomousControlPanel autonomyState={state} onUpdate={setState} />
      <AutonomousTimeline timeline={state.timeline} />
      <AutonomousLogs logs={state.logs} />
    </div>
  );
}
