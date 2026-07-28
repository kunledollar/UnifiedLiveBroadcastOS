import type { WorkspaceProps } from './types';

export function ProductionWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <div data-autonomy-level={autonomy.autonomyLevel} className="workspace workspace--production">
      <div className="workspace__row">
        <div className="panel panel--program">
          <h2>PROGRAM</h2>
          {/* Program health, outputs, routing */}
        </div>
        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Warnings, temporal drops, missing sources */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Event stream for production ops */}
        </div>
      </div>
    </div>
  );
}

export default ProductionWorkspace;
