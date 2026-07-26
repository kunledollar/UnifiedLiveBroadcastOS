import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function GraphicsOperatorWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace GraphicsOperator-workspace" aria-labelledby="GraphicsOperator-title">
      <header>
        <p>Control Room</p>
        <h1 id="GraphicsOperator-title">Graphics Operator Workspace</h1>
      </header>
      <p>Prepare, preview, and take graphics to air.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
