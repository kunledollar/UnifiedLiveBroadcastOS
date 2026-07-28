import type { WorkspaceProps } from './types';

export function GraphicsOperatorWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <div data-autonomy-level={autonomy.autonomyLevel} className="workspace workspace--graphics">
      <div className="workspace__row">
        <div className="panel panel--graphics">
          <h2>GRAPHICS</h2>
          {/* Scene graphics, lower thirds, overlays */}
        </div>
        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Graphics-related warnings/insights */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Graphics events, cue history */}
        </div>
      </div>
    </div>
  );
}

export default GraphicsOperatorWorkspace;
