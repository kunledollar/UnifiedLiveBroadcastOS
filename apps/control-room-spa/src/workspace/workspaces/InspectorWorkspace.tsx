import type { WorkspaceProps } from './types';

export function InspectorWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <div data-autonomy-level={autonomy.autonomyLevel} className="workspace workspace--inspector">
      <div className="workspace__row">
        <div className="panel panel--inspector">
          <h2>INSPECTOR</h2>
          {/* Detailed object/scene inspection */}
        </div>
        <div className="panel panel--metadata">
          <h2>METADATA</h2>
          {/* Confidence, stability, fused signals, forecasts */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Inspector-focused event history */}
        </div>
      </div>
    </div>
  );
}

export default InspectorWorkspace;
