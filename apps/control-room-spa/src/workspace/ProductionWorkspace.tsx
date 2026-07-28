export function ProductionWorkspace({ autonomy }: { autonomy: any }) {
  return (
    <div className="workspace workspace--production">
      <div className="workspace__row">
        <div className="panel panel--production">
          <h2>PRODUCTION</h2>
          {/* Rundown, segment control, scene switching, show flow */}
        </div>

        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Segment readiness, timing cues, autonomy-driven guidance */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Segment events, transitions, cue triggers */}
        </div>
      </div>
    </div>
  );
}

export default ProductionWorkspace;
    