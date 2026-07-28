export function GraphicsWorkspace({ autonomy }: { autonomy: any }) {
  return (
    <div className="workspace workspace--graphics">
      <div className="workspace__row">
        <div className="panel panel--graphics">
          <h2>GRAPHICS</h2>
          {/* Graphics package selection, lower-thirds, overlays, and scene elements */}
        </div>

        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Graphics readiness, timing cues, and autonomy-driven suggestions */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Graphics events, cue triggers, and overlay history */}
        </div>
      </div>
    </div>
  );
}

export default GraphicsWorkspace;
