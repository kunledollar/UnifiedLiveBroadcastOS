import type { AutonomousState } from "../../autonomous/AutonomousProvider";

type WorkspaceProps = { autonomy: AutonomousState };

export function MediaWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <section className="workspace Media-workspace" aria-labelledby="Media-title">
      <header>
        <p>Control Room</p>
        <h1 id="Media-title">Media Workspace</h1>
      </header>
      <p>Ingest, organize, and prepare media assets.</p>
      <dl className="workspace-status">
        <div><dt>Autonomy level</dt><dd>{autonomy.autonomyLevel}</dd></div>
        <div><dt>Confidence</dt><dd>{Math.round(autonomy.confidence * 100)}%</dd></div>
        <div><dt>Output</dt><dd>{autonomy.system.outputHealth}</dd></div>
      </dl>
    </section>
  );
}
