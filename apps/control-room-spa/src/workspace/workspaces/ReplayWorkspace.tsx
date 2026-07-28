import type { WorkspaceProps } from './types';

export function ReplayWorkspace({ autonomy }: WorkspaceProps) {
  return (
    <div data-autonomy-level={autonomy.autonomyLevel} className="workspace workspace--replay">
      <div className="workspace__row">
        <div className="panel panel--replay">
          <h2>REPLAY</h2>
          {/* Replay controls, clip selection, playback, and marking */}
        </div>
        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Replay readiness, timing warnings, and suggested moments */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Replay events, marks, cues, and playback history */}
        </div>
      </div>
    </div>
  );
}

export default ReplayWorkspace;
