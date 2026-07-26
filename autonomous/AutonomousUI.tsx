import { useContext } from 'react';
import { AutonomousContext } from './AutonomousProvider';
import { AutonomousHUD } from './hud/AutonomousHUD';
import { AutonomousControlPanel } from './AutonomousControlPanel';
import { AutonomousTimeline } from './timeline/AutonomousTimeline';
import { AutonomousLogs } from './logs/AutonomousLogs';
import './theme/AutonomousTheme.css';

export function AutonomousUI() {
  const ctx = useContext(AutonomousContext);
  if (!ctx) return null;

  const { state, setState } = ctx;

  return (
    <div className="autonomous-ui">
      <div className="autonomous-hud">
        <AutonomousHUD state={state} />
      </div>
      <div className="autonomous-control-panel">
        <AutonomousControlPanel autonomyState={state} onUpdate={setState} />
      </div>
      <div className="autonomous-timeline">
        <AutonomousTimeline timeline={state.timeline} />
      </div>
      <div className="autonomous-logs">
        <AutonomousLogs logs={state.logs} />
      </div>
    </div>
  );
}
