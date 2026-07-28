import type { WorkspaceProps } from './types';

export function DistributionWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <div data-autonomy-level={autonomy.autonomyLevel} className="workspace workspace--distribution">
      <div className="workspace__row">
        <div className="panel panel--distribution">
          <h2>DISTRIBUTION</h2>
          {/* Distribution outputs, destinations, routing, and delivery health */}
        </div>
        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Output failures, destination health, and routing guidance */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Distribution events, route changes, and delivery history */}
        </div>
      </div>
    </div>
  );
}

export default DistributionWorkspace;
