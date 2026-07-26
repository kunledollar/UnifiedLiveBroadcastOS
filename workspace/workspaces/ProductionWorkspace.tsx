export function ProductionWorkspace({ autonomy }) {
  return (
    <div className="workspace production-workspace">
      <h1>Production Workspace</h1>

      <div className="panel-row">
        <ProgramPanel data={autonomy} />
        <MetadataPanel data={autonomy} />
      </div>

      <div className="panel-row">
        <WarningsPanel data={autonomy} />
        <GuidancePanel data={autonomy} />
      </div>

      <IntelligenceTimeline data={autonomy} />
    </div>
  );
}
