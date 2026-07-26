import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function ProductionWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Production-workspace" aria-labelledby="Production-title">
      <header>
        <p>Control Room</p>
        <h1 id="Production-title">Production Workspace</h1>
      </header>
      <p>Switch sources and manage the active production flow.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
