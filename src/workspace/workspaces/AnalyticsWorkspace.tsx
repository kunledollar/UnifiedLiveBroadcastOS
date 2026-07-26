import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function AnalyticsWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Analytics-workspace" aria-labelledby="Analytics-title">
      <header>
        <p>Control Room</p>
        <h1 id="Analytics-title">Analytics Workspace</h1>
      </header>
      <p>Track audience, output, and operational performance.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
