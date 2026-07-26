export function GraphicsOperatorWorkspace({ autonomy }) {
  return (
    <div className="workspace graphics-workspace">
      <h1>Graphics Operator</h1>

      <div className="panel-row">
        <GraphicsPanel />
        <MetadataPanel data={autonomy} />
      </div>

      <WarningsPanel data={autonomy} />
      <IntelligenceTimeline data={autonomy} />
    </div>
  );
}
