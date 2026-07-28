export function DirectorWorkspace({ autonomy }: { autonomy: any }) {
  return (
    <div className="workspace workspace--director">
      <div className="workspace__row">
        <div className="panel panel--triad">
          <h2>TRIAD</h2>
          {/* Scene / Preview / Program triad */}
        </div>
        <div className="panel panel--inspector">
          <h2>INSPECTOR</h2>
          {/* Inspector body, metadata, health */}
        </div>
      </div>

      <div className="workspace__row">
        <div className="panel panel--program">
          <h2>PROGRAM</h2>
          {/* Program health, degraded/healthy, frame composition */}
        </div>
        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Warnings, insights, guidance from autonomy */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Timeline of guidance/insight events */}
        </div>
      </div>
    </div>
  );
}
