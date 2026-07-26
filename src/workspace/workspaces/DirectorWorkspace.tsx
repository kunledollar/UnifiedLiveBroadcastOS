import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function DirectorWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Director-workspace" aria-labelledby="Director-title">
      <header>
        <p>Control Room</p>
        <h1 id="Director-title">Director Workspace</h1>
      </header>
      <p>Coordinate the live show, review guidance, and protect the program output.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
