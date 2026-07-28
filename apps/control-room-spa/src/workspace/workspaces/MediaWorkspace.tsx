export function MediaWorkspace({ autonomy }: { autonomy: any }) {
  return (
    <div className="workspace workspace--media">
      <div className="workspace__row">
        <div className="panel panel--media">
          <h2>MEDIA</h2>
          {/* Media library, ingest, search, organization, and asset preparation */}
        </div>
        <div className="panel panel--production-intel">
          <h2>PRODUCTION INTELLIGENCE</h2>
          {/* Asset health, missing media, ingest warnings, and readiness guidance */}
        </div>
      </div>

      <div className="workspace__row workspace__row--timeline">
        <div className="panel panel--timeline">
          <h2>INTELLIGENCE TIMELINE</h2>
          {/* Media ingest events, asset changes, and cue history */}
        </div>
      </div>
    </div>
  );
}

export default MediaWorkspace;
