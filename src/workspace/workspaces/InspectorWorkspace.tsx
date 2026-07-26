import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function InspectorWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Inspector-workspace" aria-labelledby="Inspector-title">
      <header>
        <p>Control Room</p>
        <h1 id="Inspector-title">Inspector Workspace</h1>
      </header>
      <p>Inspect the selected resource and its runtime metadata.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
