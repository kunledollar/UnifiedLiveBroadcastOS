export function DirectorWorkspace({ autonomy }) {
  return (
    <div className="workspace director-workspace">
      <h1>Director Workspace</h1>

      <div className="panel-row">
        <WarningsPanel data={autonomy} />
        <PrimaryInsightPanel data={autonomy} />
      </div>

      <div className="panel-row">
        <GuidancePanel data={autonomy} />
        <ProgramPanel data={autonomy} />
      </div>

      <MetadataPanel data={autonomy} />
      <IntelligenceTimeline data={autonomy} />
    </div>
  );
}
