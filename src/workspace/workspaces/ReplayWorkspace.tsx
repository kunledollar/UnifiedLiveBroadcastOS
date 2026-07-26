import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function ReplayWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Replay-workspace" aria-labelledby="Replay-title">
      <header>
        <p>Control Room</p>
        <h1 id="Replay-title">Replay Workspace</h1>
      </header>
      <p>Mark moments, build clips, and control replay playback.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
