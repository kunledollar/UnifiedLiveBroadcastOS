import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function AutomationWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Automation-workspace" aria-labelledby="Automation-title">
      <header>
        <p>Control Room</p>
        <h1 id="Automation-title">Automation Workspace</h1>
      </header>
      <p>Configure rules, macros, and assisted show control.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
