import { useState, useContext } from "react";
import { AutonomousContext } from "./autonomous/AutonomousProvider";
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
  const [workspace, setWorkspace] = useState("director");
  const ctx = useContext(AutonomousContext);

  const workspaces: Record<string, JSX.Element> = {
    director: <DirectorWorkspace autonomy={ctx.state} />,
    production: <ProductionWorkspace autonomy={ctx.state} />,
    graphics: <GraphicsOperatorWorkspace autonomy={ctx.state} />,
    replay: <ReplayWorkspace autonomy={ctx.state} />,
    distribution: <DistributionWorkspace autonomy={ctx.state} />,
    automation: <AutomationWorkspace autonomy={ctx.state} />,
    analytics: <AnalyticsWorkspace autonomy={ctx.state} />,
    media: <MediaWorkspace autonomy={ctx.state} />,
    inspector: <InspectorWorkspace autonomy={ctx.state} />
  };

  return {
    workspace,
    setWorkspace,
    renderWorkspace: () => workspaces[workspace] || null
  };
}
