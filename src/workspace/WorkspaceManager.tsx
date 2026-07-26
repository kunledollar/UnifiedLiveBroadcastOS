import { useState } from "react";
import { useAutonomous } from "../autonomous/AutonomousProvider";
import { Sidebar, type WorkspaceId } from "./Sidebar";
import { DirectorWorkspace } from "./workspaces/DirectorWorkspace";
import { ProductionWorkspace } from "./workspaces/ProductionWorkspace";
import { GraphicsOperatorWorkspace } from "./workspaces/GraphicsOperatorWorkspace";
import { ReplayWorkspace } from "./workspaces/ReplayWorkspace";
import { DistributionWorkspace } from "./workspaces/DistributionWorkspace";
import { AutomationWorkspace } from "./workspaces/AutomationWorkspace";
import { AnalyticsWorkspace } from "./workspaces/AnalyticsWorkspace";
import { MediaWorkspace } from "./workspaces/MediaWorkspace";
import { InspectorWorkspace } from "./workspaces/InspectorWorkspace";

export function WorkspaceManager() {
  const [workspace, setWorkspace] = useState<WorkspaceId>("director");
  const { state } = useAutonomous();

  const renderWorkspace = () => {
    const props = { autonomy: state };
    switch (workspace) {
      case "production": return <ProductionWorkspace {...props} />;
      case "graphics": return <GraphicsOperatorWorkspace {...props} />;
      case "replay": return <ReplayWorkspace {...props} />;
      case "distribution": return <DistributionWorkspace {...props} />;
      case "automation": return <AutomationWorkspace {...props} />;
      case "analytics": return <AnalyticsWorkspace {...props} />;
      case "media": return <MediaWorkspace {...props} />;
      case "inspector": return <InspectorWorkspace {...props} />;
      default: return <DirectorWorkspace {...props} />;
    }
  };

  return (
    <div className="workspace-manager">
      <Sidebar active={workspace} onSelect={setWorkspace} />
      <main className="workspace-canvas">{renderWorkspace()}</main>
    </div>
  );
}
